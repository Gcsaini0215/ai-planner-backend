'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Firebase UID – primary link between Firebase auth and our DB
    firebaseUid: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    phone: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    name: {
      type:    String,
      trim:    true,
      default: '',
    },

    email: {
      type:      String,
      trim:      true,
      lowercase: true,
      default:   '',
    },

    age: {
      type: Number,
      min:  1,
      max:  120,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
    },

    // cm
    height: { type: Number, min: 50, max: 300 },
    // kg
    weight:       { type: Number, min: 10, max: 500 },
    targetWeight: { type: Number, min: 10, max: 500 },

    goal: {
      type: String,
      // Accept both Flutter short-form ('lose','gain','muscle') and full-form ('lose_weight', etc.)
      enum: ['lose_weight', 'maintain', 'gain_muscle', 'improve_health',
             'lose', 'gain', 'muscle', ''],
    },

    activityLevel: {
      type: String,
      // Accept both Flutter short-form ('light','moderate','active') and full-form
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active',
             'light', 'moderate', 'active', ''],
    },

    // Auto-calculated or manually set daily goals
    caloriesGoal: { type: Number, default: 2000 },
    waterGoal:    { type: Number, default: 2500 },  // ml

    profileImage: { type: String, default: '' },

    // Soft-delete / onboarding flag
    isProfileComplete: { type: Boolean, default: false },
    isActive:          { type: Boolean, default: true },

    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,   // createdAt, updatedAt
    versionKey: false,
  }
);

// ── Virtual: BMI ─────────────────────────────────────────────────────────────
userSchema.virtual('bmi').get(function () {
  if (!this.height || !this.weight) return null;
  const heightM = this.height / 100;
  return parseFloat((this.weight / (heightM * heightM)).toFixed(1));
});

// ── Method: toJSON – strip sensitive fields ──────────────────────────────────
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.firebaseUid;
  return obj;
};

// ── Static: Calculate daily calorie goal ─────────────────────────────────────
userSchema.statics.calcCalorieGoal = function ({
  weight, height, age, gender, activityLevel, goal,
}) {
  if (!weight || !height || !age || !gender) return 2000;

  // Mifflin-St Jeor BMR
  let bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary:        1.2,
    lightly_active:   1.375,
    moderately_active: 1.55,
    very_active:      1.725,
    extra_active:     1.9,
  };

  let tdee = bmr * (multipliers[activityLevel] || 1.55);

  if (goal === 'lose_weight')  tdee -= 500;
  if (goal === 'gain_muscle')  tdee += 300;

  return Math.round(tdee);
};

module.exports = mongoose.model('User', userSchema);
