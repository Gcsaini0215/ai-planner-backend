'use strict';
const mongoose = require('mongoose');

const planItemSchema = new mongoose.Schema({
  day:         { type: Number, required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  items:       { type: [String], default: [] }, // meals or exercises
}, { _id: false });

const marketplacePlanSchema = new mongoose.Schema({
  coachId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CoachProfile',
    required: true,
    index:    true,
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },

  type: {
    type:    String,
    enum:    ['diet', 'workout', 'combo', 'consultation_package'],
    required: true,
  },

  title:       { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000, default: '' },
  thumbnailUrl:{ type: String, default: '' },
  previewUrl:  { type: String, default: '' },  // sample PDF/image

  difficulty: {
    type:    String,
    enum:    ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  goal: {
    type:    String,
    enum:    ['weight_loss', 'muscle_gain', 'maintenance', 'yoga', 'endurance', 'general'],
    default: 'general',
  },
  durationDays: { type: Number, required: true, min: 1 },

  price:    { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  isFree:   { type: Boolean, default: false },

  isPublished: { type: Boolean, default: false },
  purchaseCount:{ type: Number, default: 0 },
  avgRating:   { type: Number, default: 0 },

  tags:     { type: [String], default: [] },
  schedule: { type: [planItemSchema], default: [] },

  // For consultation packages
  sessionsIncluded: { type: Number, default: 0 },
  sessionDurationMins: { type: Number, default: 60 },
}, { timestamps: true, versionKey: false });

marketplacePlanSchema.index({ type: 1, isPublished: 1 });
marketplacePlanSchema.index({ goal: 1 });
marketplacePlanSchema.index({ price: 1 });
marketplacePlanSchema.index({ purchaseCount: -1 });
marketplacePlanSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('MarketplacePlan', marketplacePlanSchema);
