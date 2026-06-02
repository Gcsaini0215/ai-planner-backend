'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const prisma = require('../config/prisma');

/** GET /api/exercises */
const getExercises = async (req, res, next) => {
  try {
    const { category, difficulty, q, page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = { isActive: true };

    if (category)   where.category   = category;
    if (difficulty) where.difficulty = difficulty;
    if (q) {
      where.OR = [
        { title:       { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({ where, orderBy: { title: 'asc' }, skip, take: Number(limit) }),
      prisma.exercise.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Exercises fetched', exercises,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

/** GET /api/exercises/:id */
const getExercise = async (req, res, next) => {
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!exercise || !exercise.isActive) return sendError(res, 404, 'Exercise not found');
    return sendSuccess(res, 200, 'Exercise fetched', exercise);
  } catch (error) { next(error); }
};

module.exports = { getExercises, getExercise };
