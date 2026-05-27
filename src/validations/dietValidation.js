'use strict';

const Joi = require('joi');

const dietMealSchema = Joi.object({
  mealType:       Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack', 'night'),
  title:          Joi.string().max(100),
  description:    Joi.string().max(500),
  targetCalories: Joi.number().min(0),
  mealTime:       Joi.string().pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/),
  foods:          Joi.array().items(Joi.string()),
});

const createDietSchema = Joi.object({
  title:         Joi.string().trim().max(150).required(),
  description:   Joi.string().max(500).optional().allow(''),
  goal:          Joi.string().valid('weight_loss', 'muscle_gain', 'maintenance', 'custom').default('custom'),
  totalCalories: Joi.number().min(0).optional(),
  totalProtein:  Joi.number().min(0).optional(),
  totalCarbs:    Joi.number().min(0).optional(),
  totalFat:      Joi.number().min(0).optional(),
  meals:         Joi.array().items(dietMealSchema).optional(),
  startDate:     Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:       Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive:      Joi.boolean().default(true),
  color:         Joi.string().optional(),
});

const updateDietSchema = createDietSchema.fork(['title'], (s) => s.optional());

module.exports = { createDietSchema, updateDietSchema };
