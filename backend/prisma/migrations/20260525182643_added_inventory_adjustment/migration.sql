-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('spill', 'expired', 'waste', 'theft', 'correction');

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "cost_lost" DECIMAL(10,2) NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryAdjustment_ingredient_id_idx" ON "InventoryAdjustment"("ingredient_id");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_batch_id_idx" ON "InventoryAdjustment"("batch_id");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_created_at_idx" ON "InventoryAdjustment"("created_at");

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "Ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "IngredientBatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
