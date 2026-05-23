-- CreateIndex
CREATE INDEX "Log_category_created_at_idx" ON "Log"("category", "created_at");

-- CreateIndex
CREATE INDEX "Log_log_type_created_at_idx" ON "Log"("log_type", "created_at");

-- CreateIndex
CREATE INDEX "Log_created_at_idx" ON "Log"("created_at");
