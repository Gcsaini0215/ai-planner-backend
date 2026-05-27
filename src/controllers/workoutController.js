'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const WorkoutLog = require('../models/WorkoutLog');
const Exercise   = require('../models/Exercise');

/**
 * POST /api/workouts
 */
const logWorkout = async (req, res, next) => {
  try {
    const { exerciseId, duration, sets, reps, weight, notes } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // Fetch exercise to denormalise + compute calories
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) return sendError(res, 404, 'Exercise not found');

    const caloriesBurned = exercise.caloriesPerMinute
      ? Math.round(exercise.caloriesPerMinute * duration)
      : exercise.caloriesBurned || 0;

    const log = await WorkoutLog.create({
      userId:           req.user._id,
      exerciseId,
      exerciseTitle:    exercise.title,
      exerciseCategory: exercise.category,
      duration,
      caloriesBurned,
      sets,
      reps,
      weight,
      notes,
      date,
      completedAt: new Date(),
    });

    return sendSuccess(res, 201, 'Workout logged', log);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workouts/history?page=1&limit=20&date=YYYY-MM-DD
 */
const getWorkoutHistory = async (req, res, next) => {
  try {
    const { date, page = 1, limit = 20 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { userId: req.user._id };
    if (date) filter.date = date;

    const [logs, total] = await Promise.all([
      WorkoutLog.find(filter)
        .populate('exerciseId', 'title category thumbnail')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkoutLog.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Workout history fetched', logs,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workouts/stats?days=7
 */
const getWorkoutStats = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);

    const stats = await WorkoutLog.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id:           '$date',
          totalDuration: { $sum: '$duration' },
          totalCalories: { $sum: '$caloriesBurned' },
          sessions:      { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: days },
      {
        $project: {
          _id: 0, date: '$_id',
          totalDuration: 1, totalCalories: 1, sessions: 1,
        },
      },
    ]);

    return sendSuccess(res, 200, 'Workout stats', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workouts/:id
 */
const deleteWorkout = async (req, res, next) => {
  try {
    const log = await WorkoutLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return sendError(res, 404, 'Workout log not found');
    return sendSuccess(res, 200, 'Workout log deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { logWorkout, getWorkoutHistory, getWorkoutStats, deleteWorkout };
