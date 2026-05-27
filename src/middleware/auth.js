'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { sendError }          = require('../utils/response');
const User                   = require('../models/User');
const logger                 = require('../utils/logger');

/**
 * Protect routes – verifies JWT, attaches req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user (ensures deactivated accounts are blocked immediately)
    const user = await User.findById(decoded.id).select('-firebaseUid');
    if (!user || !user.isActive) {
      return sendError(res, 401, 'User not found or account deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token');
    }
    logger.error(`Auth middleware error: ${error.message}`);
    return sendError(res, 500, 'Authentication error');
  }
};

/**
 * Optional auth – attaches req.user if token present, but never rejects.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id).select('-firebaseUid');
    }
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { protect, optionalAuth };
