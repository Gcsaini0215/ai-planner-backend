-- CreateTable: Role
-- Drop old table if it was created under the previous name
DROP TABLE IF EXISTS "RoleMetadata";

CREATE TABLE "Role" (
  "id"          TEXT    NOT NULL,
  "slug"        TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "description" TEXT    NOT NULL DEFAULT '',
  "icon"        TEXT    NOT NULL DEFAULT '👤',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");
