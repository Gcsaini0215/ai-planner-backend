'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

/** POST /api/water */
const logWater = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const log = await prisma.waterLog.create({
      data: { userId: req.user.id, amount, date, note: note || '', timestamp: new Date() },
    });
    return sendSuccess(res, 201, 'Water logged', log);
  } catch (error) { next(error); }
};

/** GET /api/water/today */
const getWaterToday = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const logs = await prisma.waterLog.findMany({
      where: { userId: req.user.id, date },
      orderBy: { timestamp: 'asc' },
    });

    const total = logs.reduce((s, l) => s + l.amount, 0);

    return sendSuccess(res, 200, 'Water data fetched', {
      date, logs, total,
      goal:      req.user.waterGoal,
      remaining: Math.max(0, req.user.waterGoal - total),
      progress:  Math.min(100, Math.round((total / req.user.waterGoal) * 100)),
    });
  } catch (error) { next(error); }
};

/** GET /api/water/history */
const getWaterHistory = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);

    const logs = await prisma.waterLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { date: 'desc' },
    });

    // Group by date in JS
    const byDate = {};
    for (const l of logs) {
      byDate[l.date] = (byDate[l.date] || 0) + l.amount;
    }

    const history = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, days)
      .map(([date, total]) => ({ date, total }));

    return sendSuccess(res, 200, 'Water history fetched', history);
  } catch (error) { next(error); }
};

/** DELETE /api/water/:id */
const deleteWaterLog = async (req, res, next) => {
  try {
    const log = await prisma.waterLog.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) return sendError(res, 404, 'Water log not found');
    await prisma.waterLog.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Water log deleted');
  } catch (error) { next(error); }
};

module.exports = { logWater, getWaterToday, getWaterHistory, deleteWaterLog };
