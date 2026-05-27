'use strict';

const { verifyFirebaseToken } = require('../config/firebase');
const { buildTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const { sendSuccess, sendError }  = require('../utils/response');
const User   = require('../models/User');
const logger = require('../utils/logger');

/**
 * POST /api/auth/firebase-login
 * 1. Verify Firebase ID token
 * 2. Upsert user in MongoDB
 * 3. Return JWT access + refresh tokens
 */
const firebaseLogin = async (req, res, next) => {
  try {
    const { firebaseToken } = req.body;

    // ── Verify with Firebase Admin SDK ────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseToken);
    } catch (err) {
      return sendError(res, 401, `Firebase token invalid: ${err.message}`);
    }

    const { uid, phone_number: phone } = decoded;

    if (!phone) {
      return sendError(res, 400, 'Phone number not present in Firebase token');
    }

    // ── Upsert user ───────────────────────────────────────────────────────
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        phone,
        lastLoginAt: new Date(),
      });
      logger.info(`New user registered: ${phone}`);
    } else {
      user.lastLoginAt = new Date();
      // Sync phone in case it changed
      if (user.phone !== phone) user.phone = phone;
      await user.save();
    }

    const tokens = buildTokenResponse(user);

    return sendSuccess(res, 200, 'Login successful', {
      user:   user.toSafeJSON(),
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'User fetched', req.user.toSafeJSON());
};

/**
 * POST /api/auth/refresh
 * Exchange a refresh token for a new access token.
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

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 401, 'User not found');
    }

    const accessToken = generateAccessToken({ id: user._id, phone: user.phone });

    return sendSuccess(res, 200, 'Token refreshed', {
      accessToken,
      tokenType: 'Bearer',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/dev-login   ← DEVELOPMENT ONLY
 * Accepts a phone number and returns a JWT without OTP verification.
 * Automatically blocked in production.
 */
const devLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 403, 'Dev login is not available in production');
    }

    const { phone } = req.body;
    if (!phone) return sendError(res, 400, 'phone is required');

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        firebaseUid: `dev_${phone.replace(/\D/g, '')}`,
        phone,
        lastLoginAt: new Date(),
      });
      logger.info(`[DEV] New user created: ${phone}`);
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    const tokens = buildTokenResponse(user);

    return sendSuccess(res, 200, '[DEV] Login successful', {
      user:   user.toSafeJSON(),
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { firebaseLogin, getMe, refreshToken, devLogin };
