-- Database optimization queries
-- Run these in your PostgreSQL database to improve performance

-- Index for homework submissions by user and homework
CREATE INDEX IF NOT EXISTS idx_homework_submissions_user_homework 
ON "HomeworkSubmission" ("userId", "homeworkId", "attemptNumber" DESC);

-- Index for homework submissions by homework and status
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework_status 
ON "HomeworkSubmission" ("homeworkId", "status", "submittedAt" DESC);

-- Index for class members lookup
CREATE INDEX IF NOT EXISTS idx_class_members_user_class 
ON "ClassMember" ("userId", "clazzId");

-- Index for homework by class and status
CREATE INDEX IF NOT EXISTS idx_homework_class_status 
ON "Homework" ("clazzId", "status", "createdAt" DESC);

-- Index for quizzes by class
CREATE INDEX IF NOT EXISTS idx_quizzes_class 
ON "Quiz" ("clazzId", "status", "createdAt" DESC);

-- Add audioUrl column for R2 integration
ALTER TABLE "HomeworkSubmission" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;

-- Index for audioUrl lookups
CREATE INDEX IF NOT EXISTS idx_homework_submissions_audio_url 
ON "HomeworkSubmission" ("audioUrl") 
WHERE "audioUrl" IS NOT NULL;

-- Analyze tables for query optimization
ANALYZE "HomeworkSubmission";
ANALYZE "ClassMember";
ANALYZE "Homework";
ANALYZE "Clazz";
ANALYZE "Quiz";
