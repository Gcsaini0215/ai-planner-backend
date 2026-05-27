'use strict';

const router = require('express').Router();
const { logWorkout, getWorkoutHistory, getWorkoutStats, deleteWorkout } = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');
const Joi      = require('joi');
const validate = require('../middleware/validate');

const workoutSchema = Joi.object({
  exerciseId: Joi.string().required(),
  duration:   Joi.number().integer().min(1).required(),
  sets:       Joi.number().integer().min(1).optional(),
  reps:       Joi.number().integer().min(1).optional(),
  weight:     Joi.number().min(0).optional(),
  notes:      Joi.string().max(500).optional().allow(''),
  date:       Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.use(protect);

router.post('/',        validate(workoutSchema), logWorkout);
router.get('/history',  getWorkoutHistory);
router.get('/stats',    getWorkoutStats);
router.delete('/:id',   deleteWorkout);

module.exports = router;
