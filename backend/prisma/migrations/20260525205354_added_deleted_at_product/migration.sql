-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "Product_deleted_at_idx" ON "Product"("deleted_at");
