'use strict';

const router = require('express').Router();
const { getExercises, getExercise } = require('../controllers/exerciseController');
const { optionalAuth } = require('../middleware/auth');

// Exercises are publicly readable
router.get('/',    optionalAuth, getExercises);
router.get('/:id', optionalAuth, getExercise);

module.exports = router;
