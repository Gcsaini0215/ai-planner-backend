'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const Exercise = require('../models/Exercise');

/**
 * GET /api/exercises?category=cardio&difficulty=beginner&q=run
 */
const getExercises = async (req, res, next) => {
  try {
    const { category, difficulty, q, page = 1, limit = 20 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { isActive: true };

    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;
    if (q)          filter.$text      = { $search: q };

    const [exercises, total] = await Promise.all([
      Exercise.find(filter)
        .sort(q ? { score: { $meta: 'textScore' } } : { title: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Exercise.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Exercises fetched', exercises,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/exercises/:id
 */
const getExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise || !exercise.isActive) return sendError(res, 404, 'Exercise not found');
    return sendSuccess(res, 200, 'Exercise fetched', exercise);
  } catch (error) {
    next(error);
  }
};

module.exports = { getExercises, getExercise };
