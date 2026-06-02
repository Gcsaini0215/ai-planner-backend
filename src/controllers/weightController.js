'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

/** POST /api/weight */
const logWeight = async (req, res, next) => {
  try {
    const { weight, note } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const log = await prisma.weightLog.create({
      data: { userId: req.user.id, weight, date, note: note || '' },
    });

    // Keep User.weight current
    await prisma.user.update({ where: { id: req.user.id }, data: { weight } });

    return sendSuccess(res, 201, 'Weight logged', {
      id: log.id, weight: log.weight, date: log.date, note: log.note,
    });
  } catch (error) { next(error); }
};

/** GET /api/weight/history */
const getWeightHistory = async (req, res, next) => {
  try {
    const days  = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const logs = await prisma.weightLog.findMany({
      where:   { userId: req.user.id, date: { gte: sinceStr } },
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, 200, 'Weight history fetched',
      logs.map((l) => ({ id: l.id, weight: l.weight, date: l.date, note: l.note })));
  } catch (error) { next(error); }
};

/** DELETE /api/weight/:id */
const deleteWeightLog = async (req, res, next) => {
  try {
    const log = await prisma.weightLog.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) return sendError(res, 404, 'Weight log not found');
    await prisma.weightLog.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Weight log deleted');
  } catch (error) { next(error); }
};

module.exports = { logWeight, getWeightHistory, deleteWeightLog };
