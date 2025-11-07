-- AlterTable: Remove unique constraint and add attemptNumber
ALTER TABLE "homework_submissions" DROP CONSTRAINT "homework_submissions_homework_id_user_id_key";

-- AlterTable: Add attemptNumber field
ALTER TABLE "homework_submissions" ADD COLUMN "attempt_number" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex: Add index for querying submissions by homework and user
CREATE INDEX "homework_submissions_homework_id_user_id_idx" ON "homework_submissions"("homework_id", "user_id");

-- CreateIndex: Add unique constraint for homework_id, user_id, and attempt_number
CREATE UNIQUE INDEX "homework_submissions_homework_id_user_id_attempt_number_key" ON "homework_submissions"("homework_id", "user_id", "attempt_number");
