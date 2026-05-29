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
    // Look up by Firebase UID first, then fall back to phone number.
    // The phone fallback handles users created via devLogin (which used a
    // fake UID like "dev_+91...") — we migrate them to real Firebase auth
    // instead of creating a duplicate account.
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if a user with this phone already exists (devLogin migration)
      user = await User.findOne({ phone });
      if (user) {
        // Migrate: update firebaseUid to the real one from Firebase Auth
        user.firebaseUid = uid;
        user.lastLoginAt = new Date();
        await user.save();
        logger.info(`Migrated devLogin user to Firebase auth: ${phone}`);
      } else {
        // Truly new user
        user = await User.create({
          firebaseUid: uid,
          phone,
          lastLoginAt: new Date(),
        });
        logger.info(`New user registered via Firebase: ${phone}`);
      }
    } else {
      user.lastLoginAt = new Date();
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
 * Returns the authenticated user with isProfileComplete.
 * Self-heals the flag for existing users where it was never set properly
 * (e.g. saved before the enum mapping fix).
 */
const getMe = async (req, res) => {
  const user = req.user;
  const data = user.toSafeJSON();

  // Auto-heal: if all core fields are present but flag is false, fix it now.
  if (!data.isProfileComplete) {
    const core = ['name', 'age', 'gender', 'height', 'weight', 'goal', 'activityLevel'];
    const allPresent = core.every((f) => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (allPresent) {
      data.isProfileComplete = true;
      // Persist the fix in the background (non-blocking)
      User.findByIdAndUpdate(user._id, { isProfileComplete: true }).exec().catch(() => {});
    }
  }

  return sendSuccess(res, 200, 'User fetched', data);
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
