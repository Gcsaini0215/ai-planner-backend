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
 * Always falls back to the 'user' role if nothing matches.
 */
async function resolveRole({ roleId, roleSlug }) {
  let role = null;
  if (roleId)   role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role && roleSlug) role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role)    role = await prisma.role.findUnique({ where: { slug: 'user' } });
  return role;
}

const USER_INCLUDE = { userProfile: true, roleRef: true };

// ── POST /api/auth/firebase-login ─────────────────────────────────────────────
const firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseToken } = req.body;

    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseToken);
    } catch (err) {
      return sendError(res, 401, `Firebase token invalid: ${err.message}`);
    }

    const { uid, phone_number: phone } = decoded;
    if (!phone) return sendError(res, 400, 'Phone number not present in Firebase token');

    // Resolve role — client sends roleId (UUID) for pro accounts, role slug for users
    const role = await resolveRole({ roleId: req.body.roleId, roleSlug: req.body.role });

    let user = await prisma.user.findUnique({ where: { firebaseUid: uid }, include: USER_INCLUDE });

    if (!user) {
      // Phone fallback for devLogin-migrated accounts
      user = await prisma.user.findUnique({ where: { phone }, include: USER_INCLUDE });

      if (user) {
        user = await prisma.user.update({
          where:   { id: user.id },
          data:    { firebaseUid: uid, lastLoginAt: new Date() },
          include: USER_INCLUDE,
        });
        logger.info(`Migrated devLogin user to Firebase: ${phone}`);
      } else {
        // ── Brand-new account ─────────────────────────────────────────────────
        user = await prisma.user.create({
          data: {
            firebaseUid:  uid,
            phone,
            role:         role.slug,   // enum kept in sync
            roleId:       role.id,     // FK → Role table (UUID)
            lastLoginAt:  new Date(),
            userProfile:  { create: { isProfileComplete: false } },
          },
          include: USER_INCLUDE,
        });
        logger.info(`New user: ${phone} | role: ${role.slug} | roleId: ${role.id}`);
      }
    } else {
      // Existing user — update lastLoginAt; honour a new roleId if client sends one
      const roleUpdate = (req.body.roleId && req.body.roleId !== user.roleId)
        ? { roleId: role.id, role: role.slug }
        : {};

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

    const tokens = buildTokenResponse(user);
    return sendSuccess(res, 200, 'Login successful', { user: toSafeUser(user), tokens });
  } catch (error) {
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

    const accessToken = generateAccessToken({
      id:              user.id,
      phone:           user.phone,
      role:            user.roleRef?.slug ?? user.role ?? 'user',
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

    const role = await resolveRole({ roleId: req.body.roleId, roleSlug: req.body.role });

    let user = await prisma.user.findUnique({ where: { phone }, include: USER_INCLUDE });
    if (!user) {
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
    return sendSuccess(res, 200, '[DEV] Login successful', { user: toSafeUser(user), tokens });
  } catch (error) {
    next(error);
  }
};

module.exports = { firebaseLogin, getMe, refreshToken, devLogin };
