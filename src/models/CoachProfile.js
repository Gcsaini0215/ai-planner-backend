'use strict';
const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  issuer:    { type: String, required: true },
  year:      { type: Number },
  imageUrl:  { type: String, default: '' },
}, { _id: false });

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
  startTime: { type: String },                  // "09:00"
  endTime:   { type: String },                  // "10:00"
  isBooked:  { type: Boolean, default: false },
}, { _id: true });

const pricingSchema = new mongoose.Schema({
  consultationPerHour: { type: Number, default: 0 },
  dietPlanMonthly:     { type: Number, default: 0 },
  workoutMonthly:      { type: Number, default: 0 },
  premiumMonthly:      { type: Number, default: 0 },
  currency:            { type: String, default: 'USD' },
}, { _id: false });

const coachProfileSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
    index:    true,
  },
  role: {
    type:    String,
    enum:    ['coach', 'dietitian', 'trainer'],
    default: 'coach',
  },

  // Public profile
  displayName:    { type: String, required: true, trim: true },
  bio:            { type: String, maxlength: 1000, default: '' },
  tagline:        { type: String, maxlength: 200, default: '' },
  profilePhoto:   { type: String, default: '' },
  coverBanner:    { type: String, default: '' },
  specializations:{ type: [String], default: [] },
  languages:      { type: [String], default: ['English'] },
  experience:     { type: Number, default: 0 },   // years
  clientsServed:  { type: Number, default: 0 },

  // Credentials
  certifications: { type: [certificationSchema], default: [] },
  isVerified:     { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },

  // Status tracking
  status: {
    type:    String,
    enum:    ['pending', 'approved', 'suspended'],
    default: 'pending',
  },

  // Stats (denormalised for performance)
  avgRating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:    { type: Number, default: 0 },
  followerCount:  { type: Number, default: 0 },
  plansSold:      { type: Number, default: 0 },

  pricing:     { type: pricingSchema, default: () => ({}) },
  availability:{ type: [availabilitySlotSchema], default: [] },

  socialLinks: {
    instagram: { type: String, default: '' },
    youtube:   { type: String, default: '' },
    twitter:   { type: String, default: '' },
    website:   { type: String, default: '' },
  },

  goals: { type: [String], default: [] }, // 'weight_loss','muscle_gain','yoga',…

  totalEarnings:  { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });

coachProfileSchema.index({ status: 1, isActive: 1 });
coachProfileSchema.index({ specializations: 1 });
coachProfileSchema.index({ avgRating: -1 });
coachProfileSchema.index({ goals: 1 });
coachProfileSchema.index({ displayName: 'text', bio: 'text', tagline: 'text' });

module.exports = mongoose.model('CoachProfile', coachProfileSchema);
