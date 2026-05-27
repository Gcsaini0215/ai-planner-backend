'use strict';

const mongoose = require('mongoose');

// ── Embedded food item within a meal ─────────────────────────────────────────
const mealFoodSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Food',
    },
    // Denormalised snapshot so old logs stay accurate after food edits
    name:        { type: String, required: true },
    calories:    { type: Number, required: true, min: 0 },
    protein:     { type: Number, default: 0 },
    carbs:       { type: Number, default: 0 },
    fat:         { type: Number, default: 0 },
    fiber:       { type: Number, default: 0 },
    servingSize: { type: String, default: '100g' },
    quantity:    { type: Number, default: 1, min: 0.1 },  // multiplier
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    mealType: {
      type:     String,
      required: true,
      enum:     ['breakfast', 'lunch', 'dinner', 'snack', 'night'],
    },

    name: {
      type:    String,
      trim:    true,
      default: '',
    },

    foods: [mealFoodSchema],

    // Cached totals – recomputed on save
    totalCalories: { type: Number, default: 0 },
    totalProtein:  { type: Number, default: 0 },
    totalCarbs:    { type: Number, default: 0 },
    totalFat:      { type: Number, default: 0 },
    totalFiber:    { type: Number, default: 0 },

    // HH:mm 24-hour string matching Flutter format
    mealTime: { type: String, default: '08:00' },

    // ISO date string YYYY-MM-DD for easy day-level querying
    date: {
      type:     String,
      required: true,
      index:    true,
      match:    /^\d{4}-\d{2}-\d{2}$/,
    },

    notes: { type: String, default: '' },

    reminderEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Pre-save: recompute totals ────────────────────────────────────────────────
mealSchema.pre('save', function (next) {
  if (!this.name) {
    const labels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      night: 'Night Snack',
    };
    this.name = labels[this.mealType] || this.mealType;
  }

  this.totalCalories = 0;
  this.totalProtein  = 0;
  this.totalCarbs    = 0;
  this.totalFat      = 0;
  this.totalFiber    = 0;

  for (const f of this.foods) {
    const q = f.quantity || 1;
    this.totalCalories += f.calories * q;
    this.totalProtein  += f.protein  * q;
    this.totalCarbs    += f.carbs    * q;
    this.totalFat      += f.fat      * q;
    this.totalFiber    += (f.fiber   || 0) * q;
  }

  // Round to 1 decimal
  this.totalCalories = Math.round(this.totalCalories * 10) / 10;
  this.totalProtein  = Math.round(this.totalProtein  * 10) / 10;
  this.totalCarbs    = Math.round(this.totalCarbs    * 10) / 10;
  this.totalFat      = Math.round(this.totalFat      * 10) / 10;
  this.totalFiber    = Math.round(this.totalFiber    * 10) / 10;

  next();
});

// ── Compound index: user + date queries ───────────────────────────────────────
mealSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Meal', mealSchema);
