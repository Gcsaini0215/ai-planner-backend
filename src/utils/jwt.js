'use strict';

const jwt = require('jsonwebtoken');

/**
 * Generate an access token (short-lived).
 */
const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generate a refresh token (long-lived).
 */
const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

/**
 * Verify an access token.  Returns decoded payload or throws.
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify a refresh token.  Returns decoded payload or throws.
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Build the full token response object returned to the client.
 * Embeds role and isVerifiedCoach so Flutter can redirect to the correct
 * dashboard without an extra /me round-trip.
 */
const buildTokenResponse = (user) => {
  // Prefer the FK relation slug (authoritative) over the enum field.
  // roleRef is included when the caller fetches with USER_INCLUDE.
  const roleSlug = user.roleRef?.slug ?? user.role ?? 'user';

  const payload = {
    id:              user.id,
    phone:           user.phone,
    role:            roleSlug,
    roleId:          user.roleId         || null,
    isVerifiedCoach: user.isVerifiedCoach || false,
  };

  return {
    accessToken:  generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    tokenType:    'Bearer',
    expiresIn:    process.env.JWT_EXPIRES_IN || '7d',
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildTokenResponse,
};
