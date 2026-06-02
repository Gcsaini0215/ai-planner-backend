'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const prisma = require('../config/prisma');

/** POST /api/workouts */
const logWorkout = async (req, res, next) => {
  try {
    const { exerciseId, duration, sets, reps, weight, notes } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) return sendError(res, 404, 'Exercise not found');

    const caloriesBurned = exercise.caloriesPerMinute
      ? Math.round(exercise.caloriesPerMinute * duration)
      : exercise.caloriesBurned || 0;

    const log = await prisma.workoutLog.create({
      data: {
        userId: req.user.id, exerciseId,
        exerciseTitle:    exercise.title,
        exerciseCategory: exercise.category,
        duration, caloriesBurned,
        sets:  sets  ?? null,
        reps:  reps  ?? null,
        weight: weight ?? null,
        notes: notes || '',
        date,
        completedAt: new Date(),
      },
    });

    return sendSuccess(res, 201, 'Workout logged', log);
  } catch (error) { next(error); }
};

/** GET /api/workouts/history */
const getWorkoutHistory = async (req, res, next) => {
  try {
    const { date, page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = { userId: req.user.id };
    if (date) where.date = date;

    const [logs, total] = await Promise.all([
      prisma.workoutLog.findMany({
        where,
        include: { exercise: { select: { title: true, category: true, thumbnail: true } } },
        orderBy: { completedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.workoutLog.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Workout history fetched', logs,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

/** GET /api/workouts/stats */
const getWorkoutStats = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);

    const logs = await prisma.workoutLog.findMany({
      where:   { userId: req.user.id, date: { not: null } },
      orderBy: { date: 'desc' },
    });

    const byDate = {};
    for (const l of logs) {
      if (!byDate[l.date]) byDate[l.date] = { date: l.date, totalDuration: 0, totalCalories: 0, sessions: 0 };
      byDate[l.date].totalDuration += l.duration;
      byDate[l.date].totalCalories += l.caloriesBurned;
      byDate[l.date].sessions      += 1;
    }

    const stats = Object.values(byDate)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);

    return sendSuccess(res, 200, 'Workout stats', stats);
  } catch (error) { next(error); }
};

/** DELETE /api/workouts/:id */
const deleteWorkout = async (req, res, next) => {
  try {
    const log = await prisma.workoutLog.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) return sendError(res, 404, 'Workout log not found');
    await prisma.workoutLog.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Workout log deleted');
  } catch (error) { next(error); }
};

module.exports = { logWorkout, getWorkoutHistory, getWorkoutStats, deleteWorkout };
