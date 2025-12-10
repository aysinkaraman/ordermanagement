-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Card_isArchived_idx" ON "Card"("isArchived");

-- CreateIndex
CREATE INDEX "Column_isArchived_idx" ON "Column"("isArchived");
