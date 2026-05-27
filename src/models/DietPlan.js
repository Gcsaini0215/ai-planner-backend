'use strict';

const mongoose = require('mongoose');

const dietPlanMealSchema = new mongoose.Schema(
  {
    mealType:      { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'night'] },
    title:         { type: String },
    description:   { type: String },
    targetCalories: { type: Number },
    mealTime:      { type: String },   // HH:mm
    foods:         [{ type: String }], // food name suggestions
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // e.g. 'weight_loss', 'muscle_gain', 'maintenance'
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'maintenance', 'custom'],
      default: 'custom',
    },

    totalCalories:  { type: Number, default: 0 },
    totalProtein:   { type: Number, default: 0 },
    totalCarbs:     { type: Number, default: 0 },
    totalFat:       { type: Number, default: 0 },

    meals: [dietPlanMealSchema],

    // YYYY-MM-DD range this plan applies to
    startDate: { type: String },
    endDate:   { type: String },

    isActive: { type: Boolean, default: true },
    color:    { type: String, default: '#6366F1' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

dietPlanSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
