'use strict';
const router = require('express').Router();
const c      = require('../controllers/coachController');
const { protect } = require('../middleware/auth');

router.get('/',                          c.listCoaches);          // public
router.get('/my/profile',   protect,     c.getMyProfile);
router.post('/apply',       protect,     c.applyAsCoach);
router.put('/profile',      protect,     c.updateProfile);
router.get('/:id',                       c.getCoach);
router.post('/:id/follow',  protect,     c.toggleFollow);
router.get('/:id/plans',                 c.getCoachPlans);
router.get('/:id/reviews',               c.getCoachReviews);
router.post('/:id/reviews', protect,     c.addReview);
router.get('/:id/transformations',       c.getTransformations);
module.exports = router;
