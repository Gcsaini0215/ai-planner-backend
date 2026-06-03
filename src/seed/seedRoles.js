'use strict';

const prisma = require('../config/prisma');

const ROLES = [
  {
    slug:        'user',
    name:        'User',
    description: 'Track your nutrition, water intake, workouts and daily progress.',
    icon:        '🙋',
    sortOrder:   1,
  },
  {
    slug:        'coach',
    name:        'Fitness Coach',
    description: 'Create personalised fitness & nutrition plans and guide your clients.',
    icon:        '🏋️',
    sortOrder:   2,
  },
  {
    slug:        'dietitian',
    name:        'Dietitian',
    description: 'Build evidence-based diet plans and provide nutritional counselling.',
    icon:        '🥗',
    sortOrder:   3,
  },
  {
    slug:        'trainer',
    name:        'Trainer',
    description: 'Design training programmes and track client performance over time.',
    icon:        '💪',
    sortOrder:   4,
  },
];

async function seedRoles() {
  // First ensure the Role table exists (idempotent)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Role" (
      "id"          TEXT    NOT NULL,
      "slug"        TEXT    NOT NULL,
      "name"        TEXT    NOT NULL,
      "description" TEXT    NOT NULL DEFAULT '',
      "icon"        TEXT    NOT NULL DEFAULT '👤',
      "isActive"    BOOLEAN NOT NULL DEFAULT true,
      "sortOrder"   INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Role_slug_key" ON "Role"("slug");
  `);

  const results = [];

  for (const role of ROLES) {
    // Use raw upsert so this works even before `prisma generate` is re-run
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Role" ("id","slug","name","description","icon","isActive","sortOrder")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5)
       ON CONFLICT ("slug") DO UPDATE
         SET "name"        = EXCLUDED."name",
             "description" = EXCLUDED."description",
             "icon"        = EXCLUDED."icon",
             "sortOrder"   = EXCLUDED."sortOrder",
             "isActive"    = true`,
      role.slug,
      role.name,
      role.description,
      role.icon,
      role.sortOrder,
    );

    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Role" WHERE "slug" = $1`,
      role.slug,
    );
    results.push(rows[0]);
  }

  return results;
}

module.exports = seedRoles;
