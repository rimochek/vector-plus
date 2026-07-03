-- Tutor application review fields for closed beta admin workflow
ALTER TABLE "TutorProfile"
  ADD COLUMN IF NOT EXISTS "applicationRejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "applicationSubmittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "applicationReviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "applicationReviewedByUserId" TEXT;

-- Existing marketplace-visible tutors remain discoverable after approval gate is added
UPDATE "TutorProfile"
SET "applicationStatus" = 'APPROVED'
WHERE "isAcceptingStudents" = true
  AND "applicationStatus" IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW');
