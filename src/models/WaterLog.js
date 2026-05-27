'use strict';

const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ml
    amount: {
      type:     Number,
      required: true,
      min:      1,
      max:      5000,
    },

    // ISO date string YYYY-MM-DD for day-level queries
    date: {
      type:     String,
      required: true,
      index:    true,
      match:    /^\d{4}-\d{2}-\d{2}$/,
    },

    // Full timestamp for ordering within the day
    timestamp: {
      type:    Date,
      default: Date.now,
    },

    note: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

waterLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WaterLog', waterLogSchema);
