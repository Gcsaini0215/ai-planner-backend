'use strict';

const router = require('express').Router();
const { getFoods, searchFoods, getFood, createFood } = require('../controllers/foodController');
const { protect, optionalAuth } = require('../middleware/auth');

// Search is public but can optionally identify the caller
router.get('/search', optionalAuth, searchFoods);

router.route('/')
  .get(optionalAuth, getFoods)          // public food database
  .post(protect, createFood);           // custom foods require auth

router.get('/:id', optionalAuth, getFood);

module.exports = router;
