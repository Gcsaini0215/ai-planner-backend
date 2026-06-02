-- =============================================================================
-- AI Planner — Full Initial Schema Migration
-- PostgreSQL + Prisma
-- Run this once on a fresh database, OR use: npx prisma migrate deploy
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE "UserRole" AS ENUM ('user', 'coach', 'trainer', 'dietitian', 'admin');


-- =============================================================================
-- TABLE: User
-- =============================================================================

CREATE TABLE "User" (
  "id"                TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "firebaseUid"       TEXT          NOT NULL,
  "phone"             TEXT          NOT NULL,
  "name"              TEXT          NOT NULL DEFAULT '',
  "email"             TEXT          NOT NULL DEFAULT '',
  "age"               INTEGER,
  "gender"            TEXT,
  "height"            DOUBLE PRECISION,
  "weight"            DOUBLE PRECISION,
  "targetWeight"      DOUBLE PRECISION,
  "goal"              TEXT,
  "activityLevel"     TEXT,
  "caloriesGoal"      INTEGER       NOT NULL DEFAULT 2000,
  "waterGoal"         INTEGER       NOT NULL DEFAULT 2500,
  "profileImage"      TEXT          NOT NULL DEFAULT '',
  "role"              "UserRole"    NOT NULL DEFAULT 'user',
  "isVerifiedCoach"   BOOLEAN       NOT NULL DEFAULT false,
  "isProfileComplete" BOOLEAN       NOT NULL DEFAULT false,
  "isActive"          BOOLEAN       NOT NULL DEFAULT true,
  "lastLoginAt"       TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "User_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "User_firebaseUid_key" UNIQUE ("firebaseUid"),
  CONSTRAINT "User_phone_key"     UNIQUE ("phone")
);


-- =============================================================================
-- TABLE: Meal
-- =============================================================================

CREATE TABLE "Meal" (
  "id"              TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"          TEXT            NOT NULL,
  "mealType"        TEXT            NOT NULL,
  "name"            TEXT            NOT NULL DEFAULT '',
  "foods"           JSONB           NOT NULL DEFAULT '[]',
  "totalCalories"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalProtein"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCarbs"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalFat"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalFiber"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "mealTime"        TEXT            NOT NULL DEFAULT '08:00',
  "date"            TEXT            NOT NULL,
  "notes"           TEXT            NOT NULL DEFAULT '',
  "reminderEnabled" BOOLEAN         NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "Meal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");


-- =============================================================================
-- TABLE: WaterLog
-- =============================================================================

CREATE TABLE "WaterLog" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT        NOT NULL,
  "amount"    INTEGER     NOT NULL,
  "date"      TEXT        NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "note"      TEXT        NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "WaterLog_userId_date_idx" ON "WaterLog"("userId", "date");


-- =============================================================================
-- TABLE: WeightLog
-- =============================================================================

CREATE TABLE "WeightLog" (
  "id"        TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT             NOT NULL,
  "weight"    DOUBLE PRECISION NOT NULL,
  "date"      TEXT             NOT NULL,
  "note"      TEXT             NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "WeightLog_userId_date_idx" ON "WeightLog"("userId", "date");


-- =============================================================================
-- TABLE: Exercise
-- =============================================================================

CREATE TABLE "Exercise" (
  "id"                TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "title"             TEXT             NOT NULL,
  "description"       TEXT             NOT NULL DEFAULT '',
  "videoUrl"          TEXT             NOT NULL DEFAULT '',
  "thumbnail"         TEXT             NOT NULL DEFAULT '',
  "duration"          INTEGER,
  "caloriesPerMinute" DOUBLE PRECISION NOT NULL DEFAULT 5,
  "caloriesBurned"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "difficulty"        TEXT             NOT NULL DEFAULT 'beginner',
  "category"          TEXT             NOT NULL DEFAULT 'other',
  "muscleGroups"      TEXT[]           NOT NULL DEFAULT '{}',
  "equipment"         TEXT             NOT NULL DEFAULT 'none',
  "isActive"          BOOLEAN          NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Exercise_category_difficulty_idx" ON "Exercise"("category", "difficulty");


-- =============================================================================
-- TABLE: WorkoutLog
-- =============================================================================

CREATE TABLE "WorkoutLog" (
  "id"               TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"           TEXT             NOT NULL,
  "exerciseId"       TEXT             NOT NULL,
  "exerciseTitle"    TEXT,
  "exerciseCategory" TEXT,
  "duration"         INTEGER          NOT NULL,
  "caloriesBurned"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sets"             INTEGER,
  "reps"             INTEGER,
  "weight"           DOUBLE PRECISION,
  "notes"            TEXT             NOT NULL DEFAULT '',
  "date"             TEXT,
  "completedAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "createdAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkoutLog_userId_fkey"     FOREIGN KEY ("userId")
    REFERENCES "User"("id")     ON DELETE CASCADE,
  CONSTRAINT "WorkoutLog_exerciseId_fkey" FOREIGN KEY ("exerciseId")
    REFERENCES "Exercise"("id")
);

CREATE INDEX "WorkoutLog_userId_date_idx" ON "WorkoutLog"("userId", "date");


-- =============================================================================
-- TABLE: DietPlan
-- =============================================================================

CREATE TABLE "DietPlan" (
  "id"            TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"        TEXT             NOT NULL,
  "title"         TEXT             NOT NULL,
  "description"   TEXT             NOT NULL DEFAULT '',
  "goal"          TEXT             NOT NULL DEFAULT 'custom',
  "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalProtein"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCarbs"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalFat"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "meals"         JSONB            NOT NULL DEFAULT '[]',
  "startDate"     TEXT,
  "endDate"       TEXT,
  "isActive"      BOOLEAN          NOT NULL DEFAULT true,
  "color"         TEXT             NOT NULL DEFAULT '#6366F1',
  "createdAt"     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DietPlan_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "DietPlan_userId_isActive_idx" ON "DietPlan"("userId", "isActive");


-- =============================================================================
-- TABLE: Food
-- =============================================================================

CREATE TABLE "Food" (
  "id"           TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"         TEXT             NOT NULL,
  "calories"     DOUBLE PRECISION NOT NULL,
  "protein"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "carbs"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fat"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fiber"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "servingSize"  TEXT             NOT NULL DEFAULT '100g',
  "servingGrams" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "category"     TEXT             NOT NULL DEFAULT 'other',
  "image"        TEXT             NOT NULL DEFAULT '',
  "barcode"      TEXT             NOT NULL DEFAULT '',
  "isCustom"     BOOLEAN          NOT NULL DEFAULT false,
  "createdById"  TEXT,
  "isVerified"   BOOLEAN          NOT NULL DEFAULT false,
  "goals"        TEXT[]           NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Food_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Food_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "Food_name_idx"     ON "Food"("name");
CREATE INDEX "Food_barcode_idx"  ON "Food"("barcode");
CREATE INDEX "Food_category_idx" ON "Food"("category");


-- =============================================================================
-- TABLE: Reminder
-- =============================================================================

CREATE TABLE "Reminder" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"        TEXT        NOT NULL,
  "type"          TEXT        NOT NULL,
  "title"         TEXT        NOT NULL,
  "emoji"         TEXT        NOT NULL DEFAULT '🔔',
  "time"          TEXT        NOT NULL DEFAULT '08:00',
  "beforeMinutes" INTEGER     NOT NULL DEFAULT 0,
  "repeat"        TEXT        NOT NULL DEFAULT 'daily',
  "repeatDays"    INTEGER[]   NOT NULL DEFAULT '{}',
  "sound"         TEXT        NOT NULL DEFAULT 'default',
  "isEnabled"     BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Reminder_userId_type_idx" ON "Reminder"("userId", "type");


-- =============================================================================
-- TABLE: CoachProfile
-- =============================================================================

CREATE TABLE "CoachProfile" (
  "id"              TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"          TEXT             NOT NULL,
  "role"            TEXT             NOT NULL DEFAULT 'coach',
  "displayName"     TEXT             NOT NULL,
  "bio"             TEXT             NOT NULL DEFAULT '',
  "tagline"         TEXT             NOT NULL DEFAULT '',
  "profilePhoto"    TEXT             NOT NULL DEFAULT '',
  "coverBanner"     TEXT             NOT NULL DEFAULT '',
  "specializations" TEXT[]           NOT NULL DEFAULT '{}',
  "languages"       TEXT[]           NOT NULL DEFAULT '{"English"}',
  "experience"      INTEGER          NOT NULL DEFAULT 0,
  "clientsServed"   INTEGER          NOT NULL DEFAULT 0,
  "certifications"  JSONB            NOT NULL DEFAULT '[]',
  "isVerified"      BOOLEAN          NOT NULL DEFAULT false,
  "isActive"        BOOLEAN          NOT NULL DEFAULT true,
  "status"          TEXT             NOT NULL DEFAULT 'pending',
  "avgRating"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount"     INTEGER          NOT NULL DEFAULT 0,
  "followerCount"   INTEGER          NOT NULL DEFAULT 0,
  "plansSold"       INTEGER          NOT NULL DEFAULT 0,
  "pricing"         JSONB            NOT NULL DEFAULT '{}',
  "availability"    JSONB            NOT NULL DEFAULT '[]',
  "socialLinks"     JSONB            NOT NULL DEFAULT '{}',
  "goals"           TEXT[]           NOT NULL DEFAULT '{}',
  "totalEarnings"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "CoachProfile_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "CoachProfile_userId_key"  UNIQUE ("userId"),
  CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "CoachProfile_status_isActive_idx" ON "CoachProfile"("status", "isActive");
CREATE INDEX "CoachProfile_avgRating_idx"        ON "CoachProfile"("avgRating");


-- =============================================================================
-- TABLE: CoachFollower
-- =============================================================================

CREATE TABLE "CoachFollower" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "coachId"   TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "CoachFollower_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "CoachFollower_coachId_userId_key" UNIQUE ("coachId", "userId"),
  CONSTRAINT "CoachFollower_coachId_fkey"    FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "CoachFollower_userId_fkey"     FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);


-- =============================================================================
-- TABLE: CoachReview
-- =============================================================================

CREATE TABLE "CoachReview" (
  "id"                     TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "coachId"                TEXT        NOT NULL,
  "userId"                 TEXT        NOT NULL,
  "purchaseId"             TEXT,
  "rating"                 INTEGER     NOT NULL,
  "comment"                TEXT        NOT NULL DEFAULT '',
  "isVerified"             BOOLEAN     NOT NULL DEFAULT false,
  "transformationPhotoUrl" TEXT        NOT NULL DEFAULT '',
  "isModerated"            BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "CoachReview_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "CoachReview_coachId_userId_key" UNIQUE ("coachId", "userId"),
  CONSTRAINT "CoachReview_coachId_fkey"      FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "CoachReview_userId_fkey"       FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "CoachReview_coachId_createdAt_idx" ON "CoachReview"("coachId", "createdAt");


-- =============================================================================
-- TABLE: Booking
-- =============================================================================

CREATE TABLE "Booking" (
  "id"           TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"       TEXT             NOT NULL,
  "coachId"      TEXT             NOT NULL,
  "type"         TEXT             NOT NULL DEFAULT 'video',
  "status"       TEXT             NOT NULL DEFAULT 'pending',
  "scheduledAt"  TIMESTAMPTZ      NOT NULL,
  "durationMins" INTEGER          NOT NULL DEFAULT 60,
  "amount"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"     TEXT             NOT NULL DEFAULT 'USD',
  "isPaid"       BOOLEAN          NOT NULL DEFAULT false,
  "notes"        TEXT             NOT NULL DEFAULT '',
  "meetingLink"  TEXT             NOT NULL DEFAULT '',
  "reminderSent" BOOLEAN          NOT NULL DEFAULT false,
  "cancelReason" TEXT             NOT NULL DEFAULT '',
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Booking_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "Booking_userId_fkey"  FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Booking_coachId_fkey" FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "Booking_userId_status_idx"  ON "Booking"("userId", "status");
CREATE INDEX "Booking_coachId_status_idx" ON "Booking"("coachId", "status");
CREATE INDEX "Booking_scheduledAt_idx"    ON "Booking"("scheduledAt");


-- =============================================================================
-- TABLE: MarketplacePlan
-- =============================================================================

CREATE TABLE "MarketplacePlan" (
  "id"                  TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "coachId"             TEXT             NOT NULL,
  "userId"              TEXT             NOT NULL,
  "type"                TEXT             NOT NULL,
  "title"               TEXT             NOT NULL,
  "description"         TEXT             NOT NULL DEFAULT '',
  "thumbnailUrl"        TEXT             NOT NULL DEFAULT '',
  "previewUrl"          TEXT             NOT NULL DEFAULT '',
  "difficulty"          TEXT             NOT NULL DEFAULT 'beginner',
  "goal"                TEXT             NOT NULL DEFAULT 'general',
  "durationDays"        INTEGER          NOT NULL,
  "price"               DOUBLE PRECISION NOT NULL,
  "currency"            TEXT             NOT NULL DEFAULT 'USD',
  "isFree"              BOOLEAN          NOT NULL DEFAULT false,
  "isPublished"         BOOLEAN          NOT NULL DEFAULT false,
  "purchaseCount"       INTEGER          NOT NULL DEFAULT 0,
  "avgRating"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tags"                TEXT[]           NOT NULL DEFAULT '{}',
  "schedule"            JSONB            NOT NULL DEFAULT '[]',
  "sessionsIncluded"    INTEGER          NOT NULL DEFAULT 0,
  "sessionDurationMins" INTEGER          NOT NULL DEFAULT 60,
  "createdAt"           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "MarketplacePlan_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "MarketplacePlan_coachId_fkey" FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "MarketplacePlan_type_isPublished_idx" ON "MarketplacePlan"("type", "isPublished");
CREATE INDEX "MarketplacePlan_goal_idx"              ON "MarketplacePlan"("goal");
CREATE INDEX "MarketplacePlan_purchaseCount_idx"     ON "MarketplacePlan"("purchaseCount");


-- =============================================================================
-- TABLE: Purchase
-- =============================================================================

CREATE TABLE "Purchase" (
  "id"            TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"        TEXT             NOT NULL,
  "planId"        TEXT             NOT NULL,
  "coachId"       TEXT             NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "currency"      TEXT             NOT NULL DEFAULT 'USD',
  "status"        TEXT             NOT NULL DEFAULT 'completed',
  "paymentMethod" TEXT             NOT NULL DEFAULT 'card',
  "transactionId" TEXT             NOT NULL DEFAULT '',
  "expiresAt"     TIMESTAMPTZ,
  "accessGranted" BOOLEAN          NOT NULL DEFAULT true,
  "hasReviewed"   BOOLEAN          NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Purchase_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "Purchase_userId_planId_key" UNIQUE ("userId", "planId"),
  CONSTRAINT "Purchase_userId_fkey"      FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Purchase_planId_fkey"      FOREIGN KEY ("planId")
    REFERENCES "MarketplacePlan"("id") ON DELETE CASCADE,
  CONSTRAINT "Purchase_coachId_fkey"     FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "Purchase_coachId_idx" ON "Purchase"("coachId");


-- =============================================================================
-- TABLE: Chat
-- =============================================================================

CREATE TABLE "Chat" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "participants" TEXT[]      NOT NULL DEFAULT '{}',
  "lastMessage"  JSONB,
  "unreadCount"  JSONB       NOT NULL DEFAULT '{}',
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);


-- =============================================================================
-- TABLE: Message
-- =============================================================================

CREATE TABLE "Message" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "chatId"    TEXT        NOT NULL,
  "senderId"  TEXT        NOT NULL,
  "type"      TEXT        NOT NULL DEFAULT 'text',
  "text"      TEXT        NOT NULL DEFAULT '',
  "mediaUrl"  TEXT        NOT NULL DEFAULT '',
  "fileName"  TEXT        NOT NULL DEFAULT '',
  "planId"    TEXT,
  "readBy"    JSONB       NOT NULL DEFAULT '[]',
  "isDeleted" BOOLEAN     NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Message_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId")
    REFERENCES "Chat"("id") ON DELETE CASCADE
);

CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");


-- =============================================================================
-- TABLE: TransformationStory
-- =============================================================================

CREATE TABLE "TransformationStory" (
  "id"             TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "coachId"        TEXT             NOT NULL,
  "userId"         TEXT,
  "beforePhotoUrl" TEXT             NOT NULL DEFAULT '',
  "afterPhotoUrl"  TEXT             NOT NULL,
  "caption"        TEXT             NOT NULL DEFAULT '',
  "weightLostKg"   DOUBLE PRECISION,
  "durationWeeks"  INTEGER,
  "isPublished"    BOOLEAN          NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "TransformationStory_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "TransformationStory_coachId_fkey" FOREIGN KEY ("coachId")
    REFERENCES "CoachProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "TransformationStory_userId_fkey"  FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "TransformationStory_coachId_idx" ON "TransformationStory"("coachId");


-- =============================================================================
-- AUTO-UPDATE updatedAt trigger
-- Keeps updatedAt in sync on every row update (replaces Prisma @updatedAt)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every table that has updatedAt
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'User','Meal','WaterLog','WeightLog','Exercise','WorkoutLog',
    'DietPlan','Food','Reminder','CoachProfile','CoachFollower',
    'CoachReview','Booking','MarketplacePlan','Purchase',
    'Chat','Message','TransformationStory'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON "%s"
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      lower(tbl), tbl
    );
  END LOOP;
END;
$$;


-- =============================================================================
-- DONE
-- All 18 tables created with indexes, foreign keys, and auto-updatedAt trigger.
-- =============================================================================
