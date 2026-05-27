'use strict';

const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name:          Joi.string().trim().max(100).optional(),
  email:         Joi.string().email().lowercase().optional().allow(''),
  age:           Joi.number().integer().min(1).max(120).optional(),
  gender:        Joi.string().valid('male', 'female', 'other').optional(),
  height:        Joi.number().min(50).max(300).optional(),
  weight:        Joi.number().min(10).max(500).optional(),
  targetWeight:  Joi.number().min(10).max(500).optional(),
  goal:          Joi.string().valid('lose_weight', 'maintain', 'gain_muscle', 'improve_health').optional(),
  activityLevel: Joi.string().valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active').optional(),
  caloriesGoal:  Joi.number().integer().min(500).max(10000).optional(),
  waterGoal:     Joi.number().integer().min(500).max(10000).optional(),
  profileImage:  Joi.string().uri().optional().allow(''),
});

module.exports = { updateProfileSchema };
