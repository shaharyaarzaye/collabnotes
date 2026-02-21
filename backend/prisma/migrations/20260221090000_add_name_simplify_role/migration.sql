-- Step 1: Add 'name' column with backfill from email
ALTER TABLE "User" ADD COLUMN "name" TEXT;
UPDATE "User" SET "name" = SPLIT_PART("email", '@', 1) WHERE "name" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- Step 2: Migrate Role enum from (ADMIN, EDITOR, VIEWER) to (USER, ADMIN)
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT;
UPDATE "User" SET "role" = 'USER' WHERE "role" IN ('EDITOR', 'VIEWER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING "role"::"Role_new";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
