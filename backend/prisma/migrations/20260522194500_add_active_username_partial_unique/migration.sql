-- CreateIndex
CREATE UNIQUE INDEX "User_username_active_key" ON "User"("username") WHERE "deleted_at" IS NULL;
