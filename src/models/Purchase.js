'use strict';
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  planId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'MarketplacePlan',
    required: true,
  },
  coachId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CoachProfile',
    required: true,
  },
  amount:   { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type:    String,
    enum:    ['pending', 'completed', 'refunded', 'failed'],
    default: 'completed',
  },
  paymentMethod:  { type: String, default: 'card' },
  transactionId:  { type: String, default: '' },
  expiresAt:      { type: Date },
  accessGranted:  { type: Boolean, default: true },
  hasReviewed:    { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

purchaseSchema.index({ userId: 1, planId: 1 }, { unique: true });
purchaseSchema.index({ coachId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
