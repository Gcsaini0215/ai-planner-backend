'use strict';
const mongoose = require('mongoose');

const coachFollowerSchema = new mongoose.Schema({
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
}, { timestamps: true, versionKey: false });

coachFollowerSchema.index({ coachId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CoachFollower', coachFollowerSchema);
