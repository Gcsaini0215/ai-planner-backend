'use strict';

const prisma = require('../config/prisma');
const foods  = require('./foodsList');

async function seedFoods() {
  try {
    const existing = await prisma.food.count({ where: { isVerified: true } });
    if (existing >= foods.length) {
      console.log(`Food DB already has ${existing} verified foods — skipping.`);
      return;
    }

    let inserted = 0, updated = 0;
    for (const food of foods) {
      const found = await prisma.food.findFirst({ where: { name: food.name } });
      if (found) {
        await prisma.food.update({ where: { id: found.id }, data: { ...food, isVerified: true } });
        updated++;
      } else {
        await prisma.food.create({ data: { ...food, isVerified: true } });
        inserted++;
      }
    }
    console.log(`✅ Food seed done — ${inserted} inserted, ${updated} updated.`);
  } catch (err) {
    console.error('Food seed error:', err.message);
  }
}

if (require.main === module) {
  seedFoods().then(() => prisma.$disconnect()).then(() => process.exit(0));
}

module.exports = seedFoods;
