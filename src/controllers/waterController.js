'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const WaterLog = require('../models/WaterLog');

/**
 * POST /api/water
 */
const logWater = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const log = await WaterLog.create({
      userId: req.user._id,
      amount,
      date,
      note,
      timestamp: new Date(),
    });

    return sendSuccess(res, 201, 'Water logged', log);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/water/today  (or ?date=YYYY-MM-DD)
 */
const getWaterToday = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [logs, agg] = await Promise.all([
      WaterLog.find({ userId: req.user._id, date }).sort({ timestamp: 1 }),
      WaterLog.aggregate([
        { $match: { userId: req.user._id, date } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const total = agg[0]?.total ?? 0;

    return sendSuccess(res, 200, 'Water data fetched', {
      date,
      logs,
      total,
      goal:      req.user.waterGoal,
      remaining: Math.max(0, req.user.waterGoal - total),
      progress:  Math.min(100, Math.round((total / req.user.waterGoal) * 100)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/water/history?days=7
 */
const getWaterHistory = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 7, 90);

    const history = await WaterLog.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$date', total: { $sum: '$amount' } } },
      { $sort: { _id: -1 } },
      { $limit: days },
      { $project: { _id: 0, date: '$_id', total: 1 } },
    ]);

    return sendSuccess(res, 200, 'Water history fetched', history);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/water/:id
 */
const deleteWaterLog = async (req, res, next) => {
  try {
    const log = await WaterLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return sendError(res, 404, 'Water log not found');
    return sendSuccess(res, 200, 'Water log deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { logWater, getWaterToday, getWaterHistory, deleteWaterLog };
