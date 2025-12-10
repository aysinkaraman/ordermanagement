-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "labels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Card_dueDate_idx" ON "Card"("dueDate");
