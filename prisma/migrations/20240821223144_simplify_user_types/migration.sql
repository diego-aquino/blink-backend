/*
Warnings:

- The values [WORKSPACE_OWNER,WORKSPACE_ADMINISTRATOR,NORMAL] on the enum `WorkspaceMemberType` will be removed. If these variants are still used in the database, this will fail.
- You are about to drop the column `type` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;

CREATE TYPE "WorkspaceMemberType_new" AS ENUM('ADMINISTRATOR', 'DEFAULT');

ALTER TABLE "WorkspaceMember"
ALTER COLUMN "type"
DROP DEFAULT;

ALTER TABLE "WorkspaceMember"
ALTER COLUMN "type" TYPE TEXT;

UPDATE "WorkspaceMember"
SET
  "type" = 'ADMINISTRATOR'
WHERE
  "type" = 'WORKSPACE_ADMINISTRATOR';

UPDATE "WorkspaceMember"
SET
  "type" = 'ADMINISTRATOR'
WHERE
  "type" = 'WORKSPACE_OWNER';

UPDATE "WorkspaceMember"
SET
  "type" = 'DEFAULT'
WHERE
  "type" = 'NORMAL';

ALTER TABLE "WorkspaceMember"
ALTER COLUMN "type" TYPE "WorkspaceMemberType_new" USING ("type"::TEXT::"WorkspaceMemberType_new");

ALTER TYPE "WorkspaceMemberType"
RENAME TO "WorkspaceMemberType_old";

ALTER TYPE "WorkspaceMemberType_new"
RENAME TO "WorkspaceMemberType";

DROP TYPE "WorkspaceMemberType_old";

ALTER TABLE "WorkspaceMember"
ALTER COLUMN "type"
SET DEFAULT 'DEFAULT';

COMMIT;

-- DropForeignKey
ALTER TABLE "Blink"
DROP CONSTRAINT "Blink_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession"
DROP CONSTRAINT "UserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember"
DROP CONSTRAINT "WorkspaceMember_userId_fkey";

-- AlterTable
ALTER TABLE "Blink"
ALTER COLUMN "creatorId"
DROP NOT NULL;

-- AlterTable
ALTER TABLE "User"
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "WorkspaceMember"
ALTER COLUMN "type"
SET DEFAULT 'DEFAULT';

-- DropEnum
DROP TYPE "UserType";

-- AddForeignKey
ALTER TABLE "UserSession"
ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember"
ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blink"
ADD CONSTRAINT "Blink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
