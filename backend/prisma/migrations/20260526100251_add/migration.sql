-- CreateEnum
CREATE TYPE "AdjustmentDirection" AS ENUM ('decrease', 'increase');

-- AlterTable
ALTER TABLE "InventoryAdjustment" ADD COLUMN     "direction" "AdjustmentDirection" NOT NULL DEFAULT 'decrease';
