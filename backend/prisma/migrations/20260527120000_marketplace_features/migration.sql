-- AlterTable: make subject optional on lessons
ALTER TABLE "Lesson" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AlterTable: add booking fields to lessons
ALTER TABLE "Lesson" ADD COLUMN "availabilitySlotId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "studentMessage" TEXT;

-- AlterTable: extend conversations
ALTER TABLE "Conversation" ADD COLUMN "tutorProfileId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "studentProfileId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: availability slots
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "ruleId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: student favorites
CREATE TABLE "StudentFavorite" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable: conversation participants
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateIndex
CREATE INDEX "AvailabilitySlot_tutorProfileId_startsAt_idx" ON "AvailabilitySlot"("tutorProfileId", "startsAt");
CREATE INDEX "AvailabilitySlot_startsAt_endsAt_idx" ON "AvailabilitySlot"("startsAt", "endsAt");
CREATE UNIQUE INDEX "StudentFavorite_studentProfileId_tutorProfileId_key" ON "StudentFavorite"("studentProfileId", "tutorProfileId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");
CREATE UNIQUE INDEX "Lesson_availabilitySlotId_key" ON "Lesson"("availabilitySlotId");
CREATE UNIQUE INDEX "Conversation_tutorProfileId_studentProfileId_key" ON "Conversation"("tutorProfileId", "studentProfileId");
CREATE INDEX "Lesson_tutorProfileId_scheduledStartAt_idx" ON "Lesson"("tutorProfileId", "scheduledStartAt");
CREATE INDEX "Lesson_studentProfileId_scheduledStartAt_idx" ON "Lesson"("studentProfileId", "scheduledStartAt");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TutorAvailabilityRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentFavorite" ADD CONSTRAINT "StudentFavorite_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentFavorite" ADD CONSTRAINT "StudentFavorite_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update Message FK to cascade delete
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_conversationId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
