-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('TELEGRAM', 'PHONE', 'BOTH');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'VIEWED', 'CONTACTED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "LeadContactType" AS ENUM ('TELEGRAM', 'PHONE');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('TUTOR_PROFILE', 'TUTOR_CARD', 'DIRECT_TELEGRAM_CLICK');

-- CreateEnum
CREATE TYPE "ContactEventType" AS ENUM ('TELEGRAM_CLICK', 'PHONE_CLICK', 'LEAD_SUBMITTED');

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "preferredContactMethod" "ContactMethod",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "telegramUsername" TEXT,
ADD COLUMN     "showTelegramPublicly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhonePublicly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsDirectRequests" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TelegramConnection" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "telegramUsername" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramConnectToken" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramConnectToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorLead" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentUserId" TEXT,
    "studentName" TEXT NOT NULL,
    "contactType" "LeadContactType" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "subject" TEXT,
    "goal" TEXT,
    "message" TEXT,
    "preferredTime" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'TUTOR_PROFILE',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "telegramNotifiedAt" TIMESTAMP(3),
    "telegramNotifyError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "TutorLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorContactEvent" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "type" "ContactEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,

    CONSTRAINT "TutorContactEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConnection_tutorId_key" ON "TelegramConnection"("tutorId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConnection_telegramUserId_key" ON "TelegramConnection"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConnectToken_tokenHash_key" ON "TelegramConnectToken"("tokenHash");

-- CreateIndex
CREATE INDEX "TelegramConnectToken_tutorId_idx" ON "TelegramConnectToken"("tutorId");

-- CreateIndex
CREATE INDEX "TelegramConnectToken_expiresAt_idx" ON "TelegramConnectToken"("expiresAt");

-- CreateIndex
CREATE INDEX "TutorLead_tutorId_createdAt_idx" ON "TutorLead"("tutorId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorLead_status_idx" ON "TutorLead"("status");

-- CreateIndex
CREATE INDEX "TutorContactEvent_tutorId_createdAt_idx" ON "TutorContactEvent"("tutorId", "createdAt");

-- AddForeignKey
ALTER TABLE "TelegramConnection" ADD CONSTRAINT "TelegramConnection_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramConnectToken" ADD CONSTRAINT "TelegramConnectToken_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorLead" ADD CONSTRAINT "TutorLead_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorContactEvent" ADD CONSTRAINT "TutorContactEvent_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
