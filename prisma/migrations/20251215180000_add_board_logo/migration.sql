-- Add per-board logo column
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "logo" TEXT;