'use strict';

const { verifyFirebaseToken } = require('../config/firebase');
const { buildTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { toSafeUser } = require('../utils/userHelpers');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * POST /api/auth/firebase-login
 */
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

    // Optional role sent by the client on first signup
    const VALID_ROLES = ['user', 'coach', 'trainer', 'dietitian'];
    const requestedRole = VALID_ROLES.includes(req.body.role) ? req.body.role : 'user';

    let user = await prisma.user.findUnique({ where: { firebaseUid: uid } });

    if (!user) {
      // Check phone fallback (devLogin migration)
      user = await prisma.user.findUnique({ where: { phone } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { firebaseUid: uid, lastLoginAt: new Date() },
        });
        logger.info(`Migrated devLogin user to Firebase auth: ${phone}`);
      } else {
        user = await prisma.user.create({
          data: { firebaseUid: uid, phone, role: requestedRole, lastLoginAt: new Date() },
        });
        logger.info(`New user registered via Firebase: ${phone} (role: ${requestedRole})`);
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  {
          lastLoginAt: new Date(),
          ...(user.phone !== phone ? { phone } : {}),
        },
      });
    }

    const tokens = buildTokenResponse(user);
    return sendSuccess(res, 200, 'Login successful', { user: toSafeUser(user), tokens });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  const user = req.user;
  const data = toSafeUser(user);

  if (!data.isProfileComplete) {
    const core = ['name', 'age', 'gender', 'height', 'weight', 'goal', 'activityLevel'];
    const allPresent = core.every((f) => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (allPresent) {
      data.isProfileComplete = true;
      prisma.user.update({ where: { id: user.id }, data: { isProfileComplete: true } })
        .catch(() => {});
    }
  }

  return sendSuccess(res, 200, 'User fetched', data);
};

/**
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 400, 'Refresh token required');

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return sendError(res, 401, 'Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) return sendError(res, 401, 'User not found');

    const accessToken = generateAccessToken({
      id:              user.id,
      phone:           user.phone,
      role:            user.role            || 'user',
      isVerifiedCoach: user.isVerifiedCoach || false,
    });
    return sendSuccess(res, 200, 'Token refreshed', { accessToken, tokenType: 'Bearer' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/dev-login  ← DEVELOPMENT ONLY
 */
const devLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 403, 'Dev login is not available in production');
    }

    const { phone } = req.body;
    if (!phone) return sendError(res, 400, 'phone is required');

    const VALID_ROLES = ['user', 'coach', 'trainer', 'dietitian'];
    const requestedRole = VALID_ROLES.includes(req.body.role) ? req.body.role : 'user';

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: `dev_${phone.replace(/\D/g, '')}`,
          phone,
          role: requestedRole,
          lastLoginAt: new Date(),
        },
      });
      logger.info(`[DEV] New user created: ${phone}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { lastLoginAt: new Date() },
      });
    }

    const tokens = buildTokenResponse(user);
    return sendSuccess(res, 200, '[DEV] Login successful', { user: toSafeUser(user), tokens });
  } catch (error) {
    next(error);
  }
};

module.exports = { firebaseLogin, getMe, refreshToken, devLogin };
