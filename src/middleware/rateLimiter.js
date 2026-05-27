'use strict';

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs,
  max:     parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

/** Stricter limiter for auth endpoints */
const authLimiter = rateLimit({
  windowMs,
  max:     parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { apiLimiter, authLimiter };
