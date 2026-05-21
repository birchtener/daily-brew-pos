-- AlterTable
ALTER TABLE "Ingredients" ADD COLUMN     "low_stock_threshold" DECIMAL(10,3) NOT NULL DEFAULT 5.000;
