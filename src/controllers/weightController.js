'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const WeightLog = require('../models/WeightLog');
const User      = require('../models/User');

/**
 * POST /api/weight  — log a weight entry
 */
const logWeight = async (req, res, next) => {
  try {
    const { weight, note } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const log = await WeightLog.create({
      userId: req.user._id,
      weight,
      date,
      note: note || '',
    });

    // Also keep the User.weight field up-to-date with the latest reading
    await User.findByIdAndUpdate(req.user._id, { weight });

    return sendSuccess(res, 201, 'Weight logged', {
      _id:    log._id,
      weight: log.weight,
      date:   log.date,
      note:   log.note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/weight/history?days=30
 */
const getWeightHistory = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const logs = await WeightLog.find({
      userId: req.user._id,
      date:   { $gte: sinceStr },
    })
      .sort({ date: 1 })
      .lean();

    const mapped = logs.map((l) => ({
      id:     l._id,
      weight: l.weight,
      date:   l.date,
      note:   l.note,
    }));

    return sendSuccess(res, 200, 'Weight history fetched', mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/weight/:id
 */
const deleteWeightLog = async (req, res, next) => {
  try {
    const log = await WeightLog.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });
    if (!log) return sendError(res, 404, 'Weight log not found');
    return sendSuccess(res, 200, 'Weight log deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { logWeight, getWeightHistory, deleteWeightLog };
