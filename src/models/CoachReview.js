'use strict';
const mongoose = require('mongoose');

const coachReviewSchema = new mongoose.Schema({
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
  },
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Purchase',
  },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000, default: '' },
  isVerified: { type: Boolean, default: false }, // verified purchase
  transformationPhotoUrl: { type: String, default: '' },
  isModerated: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

coachReviewSchema.index({ coachId: 1, createdAt: -1 });
coachReviewSchema.index({ coachId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CoachReview', coachReviewSchema);
