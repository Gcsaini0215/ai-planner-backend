-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Create DeletedUser archive table
-- Purpose  : Preserve basic user data before hard-deleting a User row.
--            Phone number is stored here for audit but released on User table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."DeletedUser" (
  id                text        NOT NULL DEFAULT gen_random_uuid()::text,
  "originalUserId"  text        NOT NULL,
  name              text        NOT NULL DEFAULT '',
  email             text        NOT NULL DEFAULT '',
  phone             text        NOT NULL,
  role              text        NOT NULL DEFAULT 'user',
  "registeredAt"    timestamp(3) NULL,
  "lastLoginAt"     timestamp(3) NULL,
  "deletedAt"       timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletionReason"  text        NOT NULL DEFAULT '',
  "deletedBy"       text        NOT NULL DEFAULT 'self',
  metadata          jsonb       NOT NULL DEFAULT '{}',

  CONSTRAINT "DeletedUser_pkey" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "DeletedUser_phone_idx"          ON public."DeletedUser"(phone);
CREATE INDEX IF NOT EXISTS "DeletedUser_originalUserId_idx" ON public."DeletedUser"("originalUserId");
CREATE INDEX IF NOT EXISTS "DeletedUser_deletedAt_idx"      ON public."DeletedUser"("deletedAt");
