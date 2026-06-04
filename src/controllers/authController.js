'use strict';

const { verifyFirebaseToken } = require('../config/firebase');
const { buildTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { toSafeUser } = require('../utils/userHelpers');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a Role row from either a UUID (roleId) or a slug string.
 *
 * IMPORTANT: This function NEVER silently falls back to 'user' without logging.
 * If neither roleId nor roleSlug resolves to a real row the function still
 * returns the 'user' role as a last-resort, but it logs a warning so the
 * issue is visible in server logs.
 */
async function resolveRole({ roleId, roleSlug, allowDefaultUser = true }) {
  logger.info(`[resolveRole] input → roleId: ${roleId || 'NONE'}, roleSlug: ${roleSlug || 'NONE'}`);

  let role = null;
  const normalizedRoleId = typeof roleId === 'string' ? roleId.trim() : '';
  const normalizedRoleSlug = typeof roleSlug === 'string' ? roleSlug.trim() : '';

  // 1. Try by UUID (most specific)
  if (normalizedRoleId !== '') {
    role = await prisma.role.findUnique({ where: { id: normalizedRoleId } });
    logger.info(`[resolveRole] findByID("${roleId}") → ${role ? `found: ${role.slug}` : 'NOT FOUND'}`);
  }

  // 2. Try by slug
  if (!role && normalizedRoleSlug !== '') {
    role = await prisma.role.findUnique({ where: { slug: normalizedRoleSlug } });
    logger.info(`[resolveRole] findBySlug("${roleSlug}") → ${role ? `found: ${role.slug}` : 'NOT FOUND'}`);
  }

  // 3. Last-resort fallback — log a warning so this is always visible
  if (!role && !allowDefaultUser) {
    logger.warn(`[resolveRole] Requested role did not resolve. Refusing to fall back to 'user'. Input was: roleId=${roleId}, roleSlug=${roleSlug}`);
    return null;
  }

  if (!role) {
    logger.warn(`[resolveRole] ⚠ Neither roleId nor roleSlug resolved — falling back to 'user'. Input was: roleId=${roleId}, roleSlug=${roleSlug}`);
    role = await prisma.role.findUnique({ where: { slug: 'user' } });
  }

  logger.info(`[resolveRole] resolved → slug: ${role?.slug}, id: ${role?.id}`);
  return role;
}

const USER_INCLUDE = { userProfile: true, roleRef: true };

// ── POST /api/auth/firebase-login ─────────────────────────────────────────────
const firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseToken } = req.body;
    const requestedRoleId = typeof req.body.roleId === 'string' ? req.body.roleId.trim() : '';
    const requestedRoleSlug = typeof req.body.role === 'string' ? req.body.role.trim() : '';
    const roleRequested = requestedRoleId !== '' || requestedRoleSlug !== '';

    logger.info(`[firebaseLogin] incoming body keys: ${Object.keys(req.body).join(', ')}`);
    logger.info(`[firebaseLogin] roleId="${req.body.roleId || ''}" role="${req.body.role || ''}"`);

    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseToken);
    } catch (err) {
      return sendError(res, 401, `Firebase token invalid: ${err.message}`);
    }

    const { uid, phone_number: phone } = decoded;
    if (!phone) return sendError(res, 400, 'Phone number not present in Firebase token');

    logger.info(`[firebaseLogin] Firebase UID: ${uid}, phone: ${phone}`);

    // Resolve the requested role
    const role = await resolveRole({
      roleId: req.body.roleId,
      roleSlug: req.body.role,
      allowDefaultUser: !roleRequested,
    });
    if (!role) {
      return sendError(res, 400, 'Selected role could not be resolved. Please reload roles and try again.');
    }
    logger.info(`[firebaseLogin] Using role → slug: ${role.slug}, id: ${role.id}`);

    let user = await prisma.user.findUnique({ where: { firebaseUid: uid }, include: USER_INCLUDE });
    let isNewUser = false;

    if (!user) {
      // Phone fallback for devLogin-migrated accounts
      user = await prisma.user.findUnique({ where: { phone }, include: USER_INCLUDE });

      if (user) {
        logger.info(`[firebaseLogin] Existing user found by phone (devLogin migration). userId: ${user.id}, current role: ${user.role}`);

        // For an existing user, update role if a new roleId is explicitly supplied
        const roleUpdate = (roleRequested && role.id !== user.roleId)
          ? { roleId: role.id, role: role.slug }
          : {};

        if (Object.keys(roleUpdate).length > 0) {
          logger.info(`[firebaseLogin] Updating existing user role to: ${role.slug}`);
        }

        user = await prisma.user.update({
          where:   { id: user.id },
          data:    { firebaseUid: uid, lastLoginAt: new Date(), ...roleUpdate },
          include: USER_INCLUDE,
        });
        logger.info(`[firebaseLogin] Migrated devLogin user to Firebase: ${phone}`);

      } else {
        // ── Brand-new account ─────────────────────────────────────────────────
        isNewUser = true;
        logger.info(`[firebaseLogin] Creating NEW user: phone=${phone}, role=${role.slug}, roleId=${role.id}`);

        user = await prisma.user.create({
          data: {
            firebaseUid:  uid,
            phone,
            role:         role.slug,
            roleId:       role.id,
            lastLoginAt:  new Date(),
            userProfile:  { create: { isProfileComplete: false } },
          },
          include: USER_INCLUDE,
        });

        logger.info(`[firebaseLogin] ✅ User created: id=${user.id}, role=${user.role}, roleId=${user.roleId}`);
      }
    } else {
      // Existing user found by Firebase UID — update lastLoginAt only
      // (role is preserved unless a different roleId is explicitly sent)
      const roleUpdate = (roleRequested && role.id !== user.roleId)
        ? { roleId: role.id, role: role.slug }
        : {};

      logger.info(`[firebaseLogin] Existing user by UID: id=${user.id}, stored role=${user.role}, applying roleUpdate=${JSON.stringify(roleUpdate)}`);

      user = await prisma.user.update({
        where:   { id: user.id },
        data:    {
          lastLoginAt: new Date(),
          ...(user.phone !== phone ? { phone } : {}),
          ...roleUpdate,
        },
        include: USER_INCLUDE,
      });
    }

    logger.info(`[firebaseLogin] Final user: id=${user.id}, role=${user.role}, roleId=${user.roleId}, roleRef.slug=${user.roleRef?.slug}`);
    logger.info(`[firebaseLogin] Saved in database: userId=${user.id}, savedRole=${user.role}, savedRoleId=${user.roleId}, savedRoleRef=${user.roleRef?.slug}`);

    const tokens = buildTokenResponse(user);
    const safeUser = toSafeUser(user);
    logger.info(`[firebaseLogin] Response user.role=${safeUser.role}, isNewUser=${isNewUser}`);

    return sendSuccess(res, 200, 'Login successful', {
      user:      safeUser,
      tokens,
      isNewUser,
    });
  } catch (error) {
    logger.error(`[firebaseLogin] ERROR: ${error.message}`);
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'User fetched', toSafeUser(req.user));
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 400, 'Refresh token required');

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { return sendError(res, 401, 'Invalid or expired refresh token'); }

    const user = await prisma.user.findUnique({ where: { id: decoded.id }, include: { roleRef: true } });
    if (!user || !user.isActive) return sendError(res, 401, 'User not found');

    const roleSlug = user.roleRef?.slug ?? user.role ?? 'user';
    const accessToken = generateAccessToken({
      id:              user.id,
      phone:           user.phone,
      role:            roleSlug,
      roleId:          user.roleId || null,
      isVerifiedCoach: user.isVerifiedCoach ?? false,
    });
    return sendSuccess(res, 200, 'Token refreshed', { accessToken, tokenType: 'Bearer' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/dev-login  (development only) ──────────────────────────────
const devLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 403, 'Dev login not available in production');
    }
    const { phone } = req.body;
    if (!phone) return sendError(res, 400, 'phone is required');

    const requestedRoleId = typeof req.body.roleId === 'string' ? req.body.roleId.trim() : '';
    const requestedRoleSlug = typeof req.body.role === 'string' ? req.body.role.trim() : '';
    const roleRequested = requestedRoleId !== '' || requestedRoleSlug !== '';
    const role = await resolveRole({
      roleId: req.body.roleId,
      roleSlug: req.body.role,
      allowDefaultUser: !roleRequested,
    });
    if (!role) {
      return sendError(res, 400, 'Selected role could not be resolved. Please reload roles and try again.');
    }

    let isNewUser = false;
    let user = await prisma.user.findUnique({ where: { phone }, include: USER_INCLUDE });
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          firebaseUid:  `dev_${phone.replace(/\D/g, '')}`,
          phone,
          role:         role.slug,
          roleId:       role.id,
          lastLoginAt:  new Date(),
          userProfile:  { create: { isProfileComplete: false } },
        },
        include: USER_INCLUDE,
      });
      logger.info(`[DEV] New user: ${phone} (${role.slug})`);
    } else {
      user = await prisma.user.update({
        where:   { id: user.id },
        data:    { lastLoginAt: new Date() },
        include: USER_INCLUDE,
      });
    }

    const tokens = buildTokenResponse(user);
    return sendSuccess(res, 200, '[DEV] Login successful', {
      user: toSafeUser(user),
      tokens,
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/check-phone?phone=+91XXXXXXXXXX ─────────────────────────────
const checkPhone = async (req, res, next) => {
  try {
    const phone = (req.query.phone ?? '').trim();
    if (!phone) return sendError(res, 400, 'phone query param is required');

    const user = await prisma.user.findUnique({
      where:   { phone },
      include: { roleRef: true },
    });

    if (!user) {
      return sendSuccess(res, 200, 'Phone available', { exists: false });
    }

    const role = user.roleRef?.slug ?? user.role ?? 'user';
    return sendSuccess(res, 200, 'Phone already registered', { exists: true, role });
  } catch (error) {
    next(error);
  }
};

module.exports = { firebaseLogin, getMe, refreshToken, devLogin, checkPhone };
