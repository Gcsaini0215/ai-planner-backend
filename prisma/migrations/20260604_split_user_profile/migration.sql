-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Split User table → User (identity) + UserProfile (health data)
--            + add roleId FK from User to Role
-- Run order: apply this AFTER the Role table is seeded.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Add roleId column to User (nullable during migration) ─────────────
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "roleId" text;

-- ── Step 2: Populate roleId from existing role enum value ─────────────────────
UPDATE public."User" u
SET    "roleId" = r.id
FROM   public."Role" r
WHERE  r.slug = u.role::text;

-- For any users where the role slug didn't match (shouldn't happen), fall back to 'user'
UPDATE public."User" u
SET    "roleId" = (SELECT id FROM public."Role" WHERE slug = 'user' LIMIT 1)
WHERE  "roleId" IS NULL;

-- ── Step 3: Add FK constraint ─────────────────────────────────────────────────
ALTER TABLE public."User"
  ADD CONSTRAINT "User_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES public."Role"(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Step 4: Create UserProfile table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."UserProfile" (
  id                  text        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            text        NOT NULL,
  age                 integer     NULL,
  gender              text        NULL,
  height              double precision NULL,
  weight              double precision NULL,
  "targetWeight"      double precision NULL,
  goal                text        NULL,
  "activityLevel"     text        NULL,
  "caloriesGoal"      integer     NOT NULL DEFAULT 2000,
  "waterGoal"         integer     NOT NULL DEFAULT 2500,
  "profileImage"      text        NOT NULL DEFAULT '',
  "isProfileComplete" boolean     NOT NULL DEFAULT false,
  "createdAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserProfile_pkey"    PRIMARY KEY (id),
  CONSTRAINT "UserProfile_userId_key" UNIQUE ("userId"),
  CONSTRAINT "UserProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES public."User"(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Step 5: Migrate existing profile data from User → UserProfile ─────────────
-- Only create a UserProfile row for users who have started filling in data.
INSERT INTO public."UserProfile" (
  id, "userId", age, gender, height, weight,
  "targetWeight", goal, "activityLevel",
  "caloriesGoal", "waterGoal", "profileImage",
  "isProfileComplete", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  u.id,
  u.age,
  u.gender,
  u.height,
  u.weight,
  u."targetWeight",
  u.goal,
  u."activityLevel",
  u."caloriesGoal",
  u."waterGoal",
  u."profileImage",
  u."isProfileComplete",
  u."updatedAt"
FROM public."User" u
WHERE
  u.age IS NOT NULL
  OR u.gender IS NOT NULL
  OR u.height IS NOT NULL
  OR u.weight IS NOT NULL
  OR u."isProfileComplete" = true
ON CONFLICT ("userId") DO NOTHING;

-- ── Step 6: Index for fast lookups ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "UserProfile_userId_idx" ON public."UserProfile"("userId");
CREATE INDEX IF NOT EXISTS "User_roleId_idx"        ON public."User"("roleId");

-- ── Step 7: Drop migrated columns from User (run AFTER verifying data) ────────
-- Uncomment when you are confident the migration is clean:
--
-- ALTER TABLE public."User"
--   DROP COLUMN IF EXISTS age,
--   DROP COLUMN IF EXISTS gender,
--   DROP COLUMN IF EXISTS height,
--   DROP COLUMN IF EXISTS weight,
--   DROP COLUMN IF EXISTS "targetWeight",
--   DROP COLUMN IF EXISTS goal,
--   DROP COLUMN IF EXISTS "activityLevel",
--   DROP COLUMN IF EXISTS "caloriesGoal",
--   DROP COLUMN IF EXISTS "waterGoal",
--   DROP COLUMN IF EXISTS "profileImage",
--   DROP COLUMN IF EXISTS "isProfileComplete";
