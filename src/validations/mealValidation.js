'use strict';

const Joi = require('joi');

const mealFoodSchema = Joi.object({
  foodId:      Joi.string().optional(),
  name:        Joi.string().required(),
  calories:    Joi.number().min(0).required(),
  protein:     Joi.number().min(0).default(0),
  carbs:       Joi.number().min(0).default(0),
  fat:         Joi.number().min(0).default(0),
  fiber:       Joi.number().min(0).default(0),
  servingSize: Joi.string().default('100g'),
  quantity:    Joi.number().min(0.1).default(1),
});

const createMealSchema = Joi.object({
  name:     Joi.string().trim().max(80).optional().allow(''),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack', 'night').required(),
  foods:    Joi.array().items(mealFoodSchema).min(1).required(),
  mealTime: Joi.string().pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/).default('08:00'),
  date:     Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  notes:    Joi.string().max(500).optional().allow(''),
  reminderEnabled: Joi.boolean().default(false),
});

const updateMealSchema = createMealSchema.fork(
  ['mealType', 'foods', 'date'],
  (s) => s.optional()
);

module.exports = { createMealSchema, updateMealSchema };
