-- CreateEnum
CREATE TYPE "LessonCancellationReason" AS ENUM ('FAMILY', 'CANT_AT_TIME', 'FOUND_ANOTHER', 'OTHER');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "cancellationReason" "LessonCancellationReason",
ADD COLUMN "cancellationReasonOther" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByUserId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "data" JSONB,
ADD COLUMN "readAt" TIMESTAMP(3);
