-- CreateEnum
CREATE TYPE "TutorApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredLessonFormat" TEXT,
ADD COLUMN     "preferredTimes" TEXT,
ADD COLUMN     "learningLevel" TEXT;

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "applicationStatus" "TutorApplicationStatus" NOT NULL DEFAULT 'DRAFT';

-- Existing tutor profiles with complete bios are treated as submitted
UPDATE "TutorProfile"
SET "applicationStatus" = 'SUBMITTED'
WHERE LENGTH(TRIM("bio")) >= 50
  AND "bio" NOT IN ('Profile in progress.', 'Draft profile');
