'use strict';

const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // Macros per 100 g unless servingSize overrides
    calories: { type: Number, required: true, min: 0 },
    protein:  { type: Number, default: 0, min: 0 },
    carbs:    { type: Number, default: 0, min: 0 },
    fat:      { type: Number, default: 0, min: 0 },
    fiber:    { type: Number, default: 0, min: 0 },

    // e.g. "100g", "1 cup (240 ml)", "1 medium"
    servingSize: { type: String, default: '100g' },
    servingGrams: { type: Number, default: 100 },

    category: {
      type: String,
      enum: [
        'fruits', 'vegetables', 'grains', 'protein',
        'dairy', 'fats', 'beverages', 'snacks', 'other',
      ],
      default: 'other',
    },

    image:   { type: String, default: '' },
    barcode: { type: String, default: '', index: true },

    // User-created foods vs global database
    isCustom:  { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Full-text search index
foodSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Food', foodSchema);
