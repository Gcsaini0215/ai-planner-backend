'use strict';
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  coachId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CoachProfile',
    required: true,
    index:    true,
  },
  type: {
    type:    String,
    enum:    ['video', 'audio', 'chat'],
    default: 'video',
  },
  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
    default: 'pending',
    index:   true,
  },
  scheduledAt:   { type: Date, required: true },
  durationMins:  { type: Number, default: 60 },
  amount:        { type: Number, required: true, default: 0 },
  currency:      { type: String, default: 'USD' },
  isPaid:        { type: Boolean, default: false },
  notes:         { type: String, default: '' },
  meetingLink:   { type: String, default: '' },
  reminderSent:  { type: Boolean, default: false },
  cancelReason:  { type: String, default: '' },
}, { timestamps: true, versionKey: false });

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ coachId: 1, status: 1 });
bookingSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
