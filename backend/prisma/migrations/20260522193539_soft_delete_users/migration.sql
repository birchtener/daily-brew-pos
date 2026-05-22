-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
