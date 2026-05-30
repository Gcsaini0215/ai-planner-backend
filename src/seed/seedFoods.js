'use strict';

const mongoose = require('mongoose');
const Food     = require('../models/Food');
const foods    = require('./foodsList');

async function seedFoods(mongoUri) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    const existing = await Food.countDocuments({ isVerified: true });
    if (existing >= foods.length) {
      console.log(`Food DB already has ${existing} verified foods — skipping.`);
      return;
    }

    let inserted = 0, updated = 0;
    for (const food of foods) {
      const result = await Food.updateOne(
        { name: food.name },
        { $set: { ...food, isVerified: true } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else updated++;
    }
    console.log(`✅ Food seed done — ${inserted} inserted, ${updated} updated.`);
  } catch (err) {
    console.error('Food seed error:', err.message);
  }
}

// Run directly: node seedFoods.js [mongoUri]
if (require.main === module) {
  const uri = process.argv[2] || process.env.MONGO_URI || 'mongodb://localhost:27017/nutritrack';
  seedFoods(uri).then(() => process.exit(0));
}

module.exports = seedFoods;
