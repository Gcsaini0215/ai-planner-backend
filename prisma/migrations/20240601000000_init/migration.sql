-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'coach', 'trainer', 'dietitian', 'admin');

-- CreateTable: User
CREATE TABLE "User" (
    "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "firebaseUid"       TEXT NOT NULL,
    "phone"             TEXT NOT NULL,
    "name"              TEXT NOT NULL DEFAULT '',
    "email"             TEXT NOT NULL DEFAULT '',
    "age"               INTEGER,
    "gender"            TEXT,
    "height"            DOUBLE PRECISION,
    "weight"            DOUBLE PRECISION,
    "targetWeight"      DOUBLE PRECISION,
    "goal"              TEXT,
    "activityLevel"     TEXT,
    "caloriesGoal"      INTEGER NOT NULL DEFAULT 2000,
    "waterGoal"         INTEGER NOT NULL DEFAULT 2500,
    "profileImage"      TEXT NOT NULL DEFAULT '',
    "role"              "UserRole" NOT NULL DEFAULT 'user',
    "isVerifiedCoach"   BOOLEAN NOT NULL DEFAULT false,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt"       TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Meal
CREATE TABLE "Meal" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"          TEXT NOT NULL,
    "mealType"        TEXT NOT NULL,
    "name"            TEXT NOT NULL DEFAULT '',
    "foods"           JSONB NOT NULL DEFAULT '[]',
    "totalCalories"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFiber"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealTime"        TEXT NOT NULL DEFAULT '08:00',
    "date"            TEXT NOT NULL,
    "notes"           TEXT NOT NULL DEFAULT '',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WaterLog
CREATE TABLE "WaterLog" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"    TEXT NOT NULL,
    "amount"    INTEGER NOT NULL,
    "date"      TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"      TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WeightLog
CREATE TABLE "WeightLog" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"    TEXT NOT NULL,
    "weight"    DOUBLE PRECISION NOT NULL,
    "date"      TEXT NOT NULL,
    "note"      TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Exercise
CREATE TABLE "Exercise" (
    "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title"             TEXT NOT NULL,
    "description"       TEXT NOT NULL DEFAULT '',
    "videoUrl"          TEXT NOT NULL DEFAULT '',
    "thumbnail"         TEXT NOT NULL DEFAULT '',
    "duration"          INTEGER,
    "caloriesPerMinute" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "caloriesBurned"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty"        TEXT NOT NULL DEFAULT 'beginner',
    "category"          TEXT NOT NULL DEFAULT 'other',
    "muscleGroups"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment"         TEXT NOT NULL DEFAULT 'none',
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkoutLog
CREATE TABLE "WorkoutLog" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"           TEXT NOT NULL,
    "exerciseId"       TEXT NOT NULL,
    "exerciseTitle"    TEXT,
    "exerciseCategory" TEXT,
    "duration"         INTEGER NOT NULL,
    "caloriesBurned"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sets"             INTEGER,
    "reps"             INTEGER,
    "weight"           DOUBLE PRECISION,
    "notes"            TEXT NOT NULL DEFAULT '',
    "date"             TEXT,
    "completedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DietPlan
CREATE TABLE "DietPlan" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"        TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "description"   TEXT NOT NULL DEFAULT '',
    "goal"          TEXT NOT NULL DEFAULT 'custom',
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meals"         JSONB NOT NULL DEFAULT '[]',
    "startDate"     TEXT,
    "endDate"       TEXT,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "color"         TEXT NOT NULL DEFAULT '#6366F1',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Food
CREATE TABLE "Food" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name"         TEXT NOT NULL,
    "calories"     DOUBLE PRECISION NOT NULL,
    "protein"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber"        DOUBLE PRECISION NOT NULL DEFAULT 0,
    "servingSize"  TEXT NOT NULL DEFAULT '100g',
    "servingGrams" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "category"     TEXT NOT NULL DEFAULT 'other',
    "image"        TEXT NOT NULL DEFAULT '',
    "barcode"      TEXT NOT NULL DEFAULT '',
    "isCustom"     BOOLEAN NOT NULL DEFAULT false,
    "createdById"  TEXT,
    "isVerified"   BOOLEAN NOT NULL DEFAULT false,
    "goals"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reminder
CREATE TABLE "Reminder" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"        TEXT NOT NULL,
    "type"          TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "emoji"         TEXT NOT NULL DEFAULT '🔔',
    "time"          TEXT NOT NULL DEFAULT '08:00',
    "beforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "repeat"        TEXT NOT NULL DEFAULT 'daily',
    "repeatDays"    INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "sound"         TEXT NOT NULL DEFAULT 'default',
    "isEnabled"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CoachProfile
CREATE TABLE "CoachProfile" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"          TEXT NOT NULL,
    "role"            TEXT NOT NULL DEFAULT 'coach',
    "displayName"     TEXT NOT NULL,
    "bio"             TEXT NOT NULL DEFAULT '',
    "tagline"         TEXT NOT NULL DEFAULT '',
    "profilePhoto"    TEXT NOT NULL DEFAULT '',
    "coverBanner"     TEXT NOT NULL DEFAULT '',
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages"       TEXT[] DEFAULT ARRAY['English']::TEXT[],
    "experience"      INTEGER NOT NULL DEFAULT 0,
    "clientsServed"   INTEGER NOT NULL DEFAULT 0,
    "certifications"  JSONB NOT NULL DEFAULT '[]',
    "isVerified"      BOOLEAN NOT NULL DEFAULT false,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "avgRating"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount"     INTEGER NOT NULL DEFAULT 0,
    "followerCount"   INTEGER NOT NULL DEFAULT 0,
    "plansSold"       INTEGER NOT NULL DEFAULT 0,
    "pricing"         JSONB NOT NULL DEFAULT '{}',
    "availability"    JSONB NOT NULL DEFAULT '[]',
    "socialLinks"     JSONB NOT NULL DEFAULT '{}',
    "goals"           TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalEarnings"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CoachFollower
CREATE TABLE "CoachFollower" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "coachId"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CoachReview
CREATE TABLE "CoachReview" (
    "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "coachId"                TEXT NOT NULL,
    "userId"                 TEXT NOT NULL,
    "purchaseId"             TEXT,
    "rating"                 INTEGER NOT NULL,
    "comment"                TEXT NOT NULL DEFAULT '',
    "isVerified"             BOOLEAN NOT NULL DEFAULT false,
    "transformationPhotoUrl" TEXT NOT NULL DEFAULT '',
    "isModerated"            BOOLEAN NOT NULL DEFAULT true,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Booking
CREATE TABLE "Booking" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"       TEXT NOT NULL,
    "coachId"      TEXT NOT NULL,
    "type"         TEXT NOT NULL DEFAULT 'video',
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt"  TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "amount"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency"     TEXT NOT NULL DEFAULT 'USD',
    "isPaid"       BOOLEAN NOT NULL DEFAULT false,
    "notes"        TEXT NOT NULL DEFAULT '',
    "meetingLink"  TEXT NOT NULL DEFAULT '',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT NOT NULL DEFAULT '',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MarketplacePlan
CREATE TABLE "MarketplacePlan" (
    "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "coachId"             TEXT NOT NULL,
    "userId"              TEXT NOT NULL,
    "type"                TEXT NOT NULL,
    "title"               TEXT NOT NULL,
    "description"         TEXT NOT NULL DEFAULT '',
    "thumbnailUrl"        TEXT NOT NULL DEFAULT '',
    "previewUrl"          TEXT NOT NULL DEFAULT '',
    "difficulty"          TEXT NOT NULL DEFAULT 'beginner',
    "goal"                TEXT NOT NULL DEFAULT 'general',
    "durationDays"        INTEGER NOT NULL,
    "price"               DOUBLE PRECISION NOT NULL,
    "currency"            TEXT NOT NULL DEFAULT 'USD',
    "isFree"              BOOLEAN NOT NULL DEFAULT false,
    "isPublished"         BOOLEAN NOT NULL DEFAULT false,
    "purchaseCount"       INTEGER NOT NULL DEFAULT 0,
    "avgRating"           DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags"                TEXT[] DEFAULT ARRAY[]::TEXT[],
    "schedule"            JSONB NOT NULL DEFAULT '[]',
    "sessionsIncluded"    INTEGER NOT NULL DEFAULT 0,
    "sessionDurationMins" INTEGER NOT NULL DEFAULT 60,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Purchase
CREATE TABLE "Purchase" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"        TEXT NOT NULL,
    "planId"        TEXT NOT NULL,
    "coachId"       TEXT NOT NULL,
    "amount"        DOUBLE PRECISION NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'USD',
    "status"        TEXT NOT NULL DEFAULT 'completed',
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "transactionId" TEXT NOT NULL DEFAULT '',
    "expiresAt"     TIMESTAMP(3),
    "accessGranted" BOOLEAN NOT NULL DEFAULT true,
    "hasReviewed"   BOOLEAN NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Chat
CREATE TABLE "Chat" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastMessage"  JSONB,
    "unreadCount"  JSONB NOT NULL DEFAULT '{}',
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Message
CREATE TABLE "Message" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "chatId"    TEXT NOT NULL,
    "senderId"  TEXT NOT NULL,
    "type"      TEXT NOT NULL DEFAULT 'text',
    "text"      TEXT NOT NULL DEFAULT '',
    "mediaUrl"  TEXT NOT NULL DEFAULT '',
    "fileName"  TEXT NOT NULL DEFAULT '',
    "planId"    TEXT,
    "readBy"    JSONB NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TransformationStory
CREATE TABLE "TransformationStory" (
    "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "coachId"        TEXT NOT NULL,
    "userId"         TEXT,
    "beforePhotoUrl" TEXT NOT NULL DEFAULT '',
    "afterPhotoUrl"  TEXT NOT NULL,
    "caption"        TEXT NOT NULL DEFAULT '',
    "weightLostKg"   DOUBLE PRECISION,
    "durationWeeks"  INTEGER,
    "isPublished"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransformationStory_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Unique Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
CREATE UNIQUE INDEX "User_phone_key"       ON "User"("phone");
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE UNIQUE INDEX "CoachFollower_coachId_userId_key" ON "CoachFollower"("coachId", "userId");
CREATE UNIQUE INDEX "CoachReview_coachId_userId_key"   ON "CoachReview"("coachId", "userId");
CREATE UNIQUE INDEX "Purchase_userId_planId_key"        ON "Purchase"("userId", "planId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Regular Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX "Meal_userId_date_idx"         ON "Meal"("userId", "date");
CREATE INDEX "WaterLog_userId_date_idx"     ON "WaterLog"("userId", "date");
CREATE INDEX "WeightLog_userId_date_idx"    ON "WeightLog"("userId", "date");
CREATE INDEX "Exercise_category_difficulty_idx" ON "Exercise"("category", "difficulty");
CREATE INDEX "WorkoutLog_userId_date_idx"   ON "WorkoutLog"("userId", "date");
CREATE INDEX "DietPlan_userId_isActive_idx" ON "DietPlan"("userId", "isActive");
CREATE INDEX "Food_name_idx"                ON "Food"("name");
CREATE INDEX "Food_barcode_idx"             ON "Food"("barcode");
CREATE INDEX "Food_category_idx"            ON "Food"("category");
CREATE INDEX "Reminder_userId_type_idx"     ON "Reminder"("userId", "type");
CREATE INDEX "CoachProfile_status_isActive_idx" ON "CoachProfile"("status", "isActive");
CREATE INDEX "CoachProfile_avgRating_idx"   ON "CoachProfile"("avgRating");
CREATE INDEX "CoachReview_coachId_createdAt_idx" ON "CoachReview"("coachId", "createdAt");
CREATE INDEX "Booking_userId_status_idx"    ON "Booking"("userId", "status");
CREATE INDEX "Booking_coachId_status_idx"   ON "Booking"("coachId", "status");
CREATE INDEX "Booking_scheduledAt_idx"      ON "Booking"("scheduledAt");
CREATE INDEX "MarketplacePlan_type_isPublished_idx" ON "MarketplacePlan"("type", "isPublished");
CREATE INDEX "MarketplacePlan_goal_idx"     ON "MarketplacePlan"("goal");
CREATE INDEX "MarketplacePlan_purchaseCount_idx" ON "MarketplacePlan"("purchaseCount");
CREATE INDEX "Purchase_coachId_idx"         ON "Purchase"("coachId");
CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");
CREATE INDEX "TransformationStory_coachId_idx" ON "TransformationStory"("coachId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Foreign Keys
-- ─────────────────────────────────────────────────────────────────────────────

-- Meal
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WaterLog
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WeightLog
ALTER TABLE "WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WorkoutLog
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_exerciseId_fkey"
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DietPlan
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Food
ALTER TABLE "Food" ADD CONSTRAINT "Food_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reminder
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CoachProfile
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CoachFollower
ALTER TABLE "CoachFollower" ADD CONSTRAINT "CoachFollower_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachFollower" ADD CONSTRAINT "CoachFollower_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CoachReview
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MarketplacePlan
ALTER TABLE "MarketplacePlan" ADD CONSTRAINT "MarketplacePlan_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Purchase
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "MarketplacePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Message
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey"
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TransformationStory
ALTER TABLE "TransformationStory" ADD CONSTRAINT "TransformationStory_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransformationStory" ADD CONSTRAINT "TransformationStory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
