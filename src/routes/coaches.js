'use strict';
const router = require('express').Router();
const c      = require('../controllers/coachController');
const { protect, requireCoach, optionalAuth } = require('../middleware/auth');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',                                      c.listCoaches);
router.get('/:id',          optionalAuth,            c.getCoach);          // optionalAuth for isFollowing
router.get('/:id/plans',                             c.getCoachPlans);
router.get('/:id/reviews',                           c.getCoachReviews);
router.get('/:id/transformations',                   c.getTransformations);

// ── Authenticated users ───────────────────────────────────────────────────────
router.post('/apply',       protect,                 c.applyAsCoach);      // any user can apply
router.post('/:id/follow',  protect,                 c.toggleFollow);
router.post('/:id/reviews', protect,                 c.addReview);

// ── Coach / Trainer / Dietitian only ─────────────────────────────────────────
router.get('/my/profile',   protect, requireCoach,   c.getMyProfile);
router.put('/profile',      protect, requireCoach,   c.updateProfile);

module.exports = router;
