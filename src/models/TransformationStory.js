'use strict';
const mongoose = require('mongoose');

const transformationStorySchema = new mongoose.Schema({
  coachId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CoachProfile',
    required: true,
    index:    true,
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
  },
  beforePhotoUrl: { type: String, default: '' },
  afterPhotoUrl:  { type: String, required: true },
  caption:        { type: String, maxlength: 500, default: '' },
  weightLostKg:   { type: Number },
  durationWeeks:  { type: Number },
  isPublished:    { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('TransformationStory', transformationStorySchema);
