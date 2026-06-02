'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

const createReminder = async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.create({ data: { ...req.body, userId: req.user.id } });
    return sendSuccess(res, 201, 'Reminder created', reminder);
  } catch (error) { next(error); }
};

const getReminders = async (req, res, next) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.type) where.type = req.query.type;
    const reminders = await prisma.reminder.findMany({ where, orderBy: { time: 'asc' } });
    return sendSuccess(res, 200, 'Reminders fetched', reminders);
  } catch (error) { next(error); }
};

const getReminder = async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!reminder) return sendError(res, 404, 'Reminder not found');
    return sendSuccess(res, 200, 'Reminder fetched', reminder);
  } catch (error) { next(error); }
};

const updateReminder = async (req, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Reminder not found');
    const reminder = await prisma.reminder.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, 200, 'Reminder updated', reminder);
  } catch (error) { next(error); }
};

const deleteReminder = async (req, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Reminder not found');
    await prisma.reminder.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Reminder deleted');
  } catch (error) { next(error); }
};

const toggleReminder = async (req, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Reminder not found');
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data:  { isEnabled: !existing.isEnabled },
    });
    return sendSuccess(res, 200, `Reminder ${reminder.isEnabled ? 'enabled' : 'disabled'}`, reminder);
  } catch (error) { next(error); }
};

module.exports = { createReminder, getReminders, getReminder, updateReminder, deleteReminder, toggleReminder };
