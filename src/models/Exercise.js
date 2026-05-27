'use strict';

const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },

    videoUrl:   { type: String, default: '' },
    thumbnail:  { type: String, default: '' },

    // minutes
    duration: { type: Number, min: 1 },

    // kcal per minute (average) – multiply by actual duration on log
    caloriesPerMinute: { type: Number, default: 5 },
    caloriesBurned:    { type: Number, default: 0 }, // for fixed-duration exercises

    difficulty: {
      type:    String,
      enum:    ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    category: {
      type: String,
      enum: [
        'cardio', 'strength', 'flexibility', 'hiit',
        'yoga', 'pilates', 'sports', 'other',
      ],
      default: 'other',
    },

    muscleGroups: [{ type: String }],

    equipment: {
      type:    String,
      enum:    ['none', 'dumbbells', 'barbell', 'machine', 'resistance_band', 'other'],
      default: 'none',
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

exerciseSchema.index({ title: 'text', description: 'text' });
exerciseSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
