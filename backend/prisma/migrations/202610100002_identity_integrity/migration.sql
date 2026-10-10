-- Existing accounts retain their IDs and data. Duplicate legacy names must be resolved by the owner before this migration.
ALTER TABLE "User" ADD COLUMN "usernameKey" TEXT;
UPDATE "User" SET "usernameKey" = lower("name");
ALTER TABLE "User" ALTER COLUMN "usernameKey" SET NOT NULL;
CREATE UNIQUE INDEX "User_usernameKey_key" ON "User"("usernameKey");
