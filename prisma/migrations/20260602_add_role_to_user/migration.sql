-- Migration: add role system to User table
-- Run: npx prisma migrate dev  OR  apply this SQL manually in your Postgres client

-- Step 1: Create the enum type
CREATE TYPE "UserRole" AS ENUM ('user', 'coach', 'trainer', 'dietitian', 'admin');

-- Step 2: Add role column with default 'user' for all existing rows
ALTER TABLE "User"
  ADD COLUMN "role"            "UserRole" NOT NULL DEFAULT 'user',
  ADD COLUMN "isVerifiedCoach" BOOLEAN    NOT NULL DEFAULT false;

-- Step 3: Add TransformationStory relation on User (foreign key already exists on TransformationStory table)
-- No column change needed on User — the relation is owned by TransformationStory.userId
