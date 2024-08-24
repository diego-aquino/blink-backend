-- AlterTable
BEGIN;

ALTER TABLE "UserSession"
ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "UserSession"
SET
  "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second'
WHERE
  "expiresAt" IS NULL;

ALTER TABLE "UserSession"
ALTER COLUMN "expiresAt"
SET NOT NULL;

COMMIT;
