'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const Reminder = require('../models/Reminder');

/**
 * POST /api/reminders
 */
const createReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.create({ ...req.body, userId: req.user._id });
    return sendSuccess(res, 201, 'Reminder created', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reminders?type=meal
 */
const getReminders = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.type) filter.type = req.query.type;

    const reminders = await Reminder.find(filter).sort({ time: 1 });
    return sendSuccess(res, 200, 'Reminders fetched', reminders);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reminders/:id
 */
const getReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return sendError(res, 404, 'Reminder not found');
    return sendSuccess(res, 200, 'Reminder fetched', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reminders/:id
 */
const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!reminder) return sendError(res, 404, 'Reminder not found');
    return sendSuccess(res, 200, 'Reminder updated', reminder);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reminders/:id
 */
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return sendError(res, 404, 'Reminder not found');
    return sendSuccess(res, 200, 'Reminder deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/reminders/:id/toggle
 */
const toggleReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) return sendError(res, 404, 'Reminder not found');
    reminder.isEnabled = !reminder.isEnabled;
    await reminder.save();
    return sendSuccess(res, 200, `Reminder ${reminder.isEnabled ? 'enabled' : 'disabled'}`, reminder);
  } catch (error) {
    next(error);
  }
};

module.exports = { createReminder, getReminders, getReminder, updateReminder, deleteReminder, toggleReminder };
