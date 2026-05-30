'use strict';

/**
 * /api/seed  — dev-only seeding endpoint.
 * Blocked automatically in production (NODE_ENV === 'production').
 */

const router      = require('express').Router();
const seedCoaches = require('../seed/seedCoaches');
const Food        = require('../models/Food');
const foods       = require('../seed/foodsList');

// Guard: never allow in production
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Seed endpoint disabled in production' });
  }
  next();
});

// POST /api/seed/coaches
router.post('/coaches', async (req, res, next) => {
  try {
    const results = await seedCoaches();
    res.json({
      success: true,
      message: `Seeded ${results.length} coaches successfully`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/seed/coaches  — same thing, easier to call from browser
router.get('/coaches', async (req, res, next) => {
  try {
    const results = await seedCoaches();
    res.json({
      success: true,
      message: `Seeded ${results.length} coaches successfully`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/seed/foods  — seed the full food database
router.get('/foods', async (req, res, next) => {
  try {
    let inserted = 0, updated = 0;
    for (const food of foods) {
      const result = await Food.updateOne(
        { name: food.name },
        { $set: food },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else updated++;
    }
    const total = await Food.countDocuments({ isVerified: true });
    res.json({
      success: true,
      message: `Food seed complete — ${inserted} inserted, ${updated} updated. Total verified: ${total}`,
      inserted, updated, total,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/seed/foods  — wipe and re-seed
router.delete('/foods', async (req, res, next) => {
  try {
    await Food.deleteMany({ isVerified: true });
    await Food.insertMany(foods.map(f => ({ ...f, isVerified: true })));
    res.json({ success: true, message: `Wiped and re-seeded ${foods.length} foods` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
