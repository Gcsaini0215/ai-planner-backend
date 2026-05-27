'use strict';

const Joi = require('joi');

const createReminderSchema = Joi.object({
  type:          Joi.string().valid('meal', 'water', 'workout', 'weigh_in', 'custom').required(),
  title:         Joi.string().trim().max(100).required(),
  emoji:         Joi.string().max(10).default('🔔'),
  time:          Joi.string().pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/).default('08:00'),
  beforeMinutes: Joi.number().integer().min(0).max(120).default(0),
  repeat:        Joi.string().valid('daily', 'weekdays', 'weekends', 'once', 'custom').default('daily'),
  repeatDays:    Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  sound:         Joi.string().max(50).default('default'),
  isEnabled:     Joi.boolean().default(true),
});

const updateReminderSchema = createReminderSchema.fork(
  ['type', 'title'],
  (s) => s.optional()
);

module.exports = { createReminderSchema, updateReminderSchema };
