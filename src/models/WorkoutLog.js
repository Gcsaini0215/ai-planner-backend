'use strict';

const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    exerciseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Exercise',
      required: true,
    },

    // Denormalised snapshot
    exerciseTitle:    { type: String },
    exerciseCategory: { type: String },

    // minutes actually performed
    duration: { type: Number, required: true, min: 1 },

    caloriesBurned: { type: Number, default: 0 },

    sets:  { type: Number },
    reps:  { type: Number },
    weight: { type: Number }, // kg, for strength exercises

    notes: { type: String, default: '' },

    date: {
      type:  String,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    completedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
