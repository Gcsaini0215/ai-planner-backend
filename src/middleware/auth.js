'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { sendError }         = require('../utils/response');
const prisma                = require('../config/prisma');
const logger                = require('../utils/logger');

/**
 * Protect routes – verifies JWT, attaches req.user (plain Prisma object).
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return sendError(res, 401, 'User not found or account deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')  return sendError(res, 401, 'Token expired');
    if (error.name === 'JsonWebTokenError')  return sendError(res, 401, 'Invalid token');
    logger.error(`Auth middleware error: ${error.message}`);
    return sendError(res, 500, 'Authentication error');
  }
};

/**
 * Optional auth – attaches req.user if token present, never rejects.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    }
  } catch (_) { /* ignore */ }
  next();
};

/**
 * Role guard – must be used AFTER protect.
 * Usage: router.post('/apply', protect, requireRole(['coach','trainer']), handler)
 *
 * @param {string[]} roles  Allowed roles, e.g. ['coach', 'trainer', 'dietitian']
 */
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Not authenticated');
  if (!roles.includes(req.user.role)) {
    return sendError(
      res,
      403,
      `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
    );
  }
  next();
};

/**
 * Coach guard – shorthand for requireRole(['coach','trainer','dietitian']).
 * Any professional role is allowed.
 */
const requireCoach = requireRole(['coach', 'trainer', 'dietitian']);

/**
 * Admin guard – shorthand for requireRole(['admin']).
 */
const requireAdmin = requireRole(['admin']);

module.exports = { protect, optionalAuth, requireRole, requireCoach, requireAdmin };
