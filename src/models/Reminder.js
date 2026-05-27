'use strict';

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:     String,
      required: true,
      enum:     ['meal', 'water', 'workout', 'weigh_in', 'custom'],
    },

    title: { type: String, required: true, trim: true },
    emoji: { type: String, default: '🔔' },

    // HH:mm 24-hour
    time: {
      type:    String,
      default: '08:00',
      match:   /^([0-1]\d|2[0-3]):[0-5]\d$/,
    },

    // How many minutes before the event to fire
    beforeMinutes: { type: Number, default: 0, min: 0 },

    repeat: {
      type:    String,
      enum:    ['daily', 'weekdays', 'weekends', 'once', 'custom'],
      default: 'daily',
    },

    // For 'custom' repeat – array of day numbers 0 (Sun) – 6 (Sat)
    repeatDays: [{ type: Number, min: 0, max: 6 }],

    sound:     { type: String, default: 'default' },
    isEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reminderSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
