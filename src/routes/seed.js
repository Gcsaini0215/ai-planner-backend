'use strict';

const router      = require('express').Router();
const seedCoaches = require('../seed/seedCoaches');
const prisma      = require('../config/prisma');
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
    res.json({ success: true, message: `Seeded ${results.length} coaches successfully`, data: results });
  } catch (err) { next(err); }
});

// GET /api/seed/coaches
router.get('/coaches', async (req, res, next) => {
  try {
    const results = await seedCoaches();
    res.json({ success: true, message: `Seeded ${results.length} coaches successfully`, data: results });
  } catch (err) { next(err); }
});

// GET /api/seed/foods
router.get('/foods', async (req, res, next) => {
  try {
    let inserted = 0, updated = 0;
    for (const food of foods) {
      const existing = await prisma.food.findFirst({ where: { name: food.name } });
      if (existing) {
        await prisma.food.update({ where: { id: existing.id }, data: { ...food, isVerified: true } });
        updated++;
      } else {
        await prisma.food.create({ data: { ...food, isVerified: true } });
        inserted++;
      }
    }
    const total = await prisma.food.count({ where: { isVerified: true } });
    res.json({
      success: true,
      message: `Food seed complete — ${inserted} inserted, ${updated} updated. Total verified: ${total}`,
      inserted, updated, total,
    });
  } catch (err) { next(err); }
});

// DELETE /api/seed/foods
router.delete('/foods', async (req, res, next) => {
  try {
    await prisma.food.deleteMany({ where: { isVerified: true } });
    await prisma.food.createMany({
      data: foods.map((f) => ({ ...f, isVerified: true })),
      skipDuplicates: true,
    });
    res.json({ success: true, message: `Wiped and re-seeded ${foods.length} foods` });
  } catch (err) { next(err); }
});

module.exports = router;
