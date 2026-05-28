'use strict';

const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    weight: {
      type:     Number,
      required: true,
      min:      10,
      max:      500,
    },

    // ISO date string YYYY-MM-DD
    date: {
      type:     String,
      required: true,
      index:    true,
      match:    /^\d{4}-\d{2}-\d{2}$/,
    },

    note: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

weightLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);
