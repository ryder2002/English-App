-- AlterTable
ALTER TABLE "tests" ADD COLUMN IF NOT EXISTS "status" "QuizStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "tests" ADD COLUMN IF NOT EXISTS "ended_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "test_results" ADD COLUMN IF NOT EXISTS "status" "QuizResultStatus" NOT NULL DEFAULT 'in_progress';

-- CreateEnum (if not exists)
DO $$ BEGIN
 CREATE TYPE "QuizStatus" AS ENUM('active', 'ended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "QuizResultStatus" AS ENUM('in_progress', 'completed', 'submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

