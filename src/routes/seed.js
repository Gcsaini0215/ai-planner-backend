'use strict';

/**
 * /api/seed  — dev-only seeding endpoint.
 * Blocked automatically in production (NODE_ENV === 'production').
 */

const router      = require('express').Router();
const seedCoaches = require('../seed/seedCoaches');

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

module.exports = router;
