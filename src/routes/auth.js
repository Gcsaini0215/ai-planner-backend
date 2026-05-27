'use strict';

const router = require('express').Router();
const { firebaseLogin, getMe, refreshToken, devLogin } = require('../controllers/authController');
const { protect }       = require('../middleware/auth');
const { authLimiter }   = require('../middleware/rateLimiter');
const validate          = require('../middleware/validate');
const { firebaseLoginSchema, refreshTokenSchema } = require('../validations/authValidation');

// POST /api/auth/firebase-login
router.post('/firebase-login', authLimiter, validate(firebaseLoginSchema), firebaseLogin);

// POST /api/auth/refresh
router.post('/refresh', authLimiter, validate(refreshTokenSchema), refreshToken);

// GET /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/dev-login  (development only — blocked in production)
router.post('/dev-login', authLimiter, devLogin);

module.exports = router;
