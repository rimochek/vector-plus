-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'PASSWORD');

-- CreateEnum
CREATE TYPE "AvatarSource" AS ENUM ('GOOGLE', 'UPLOAD', 'DEFAULT');

-- CreateEnum
CREATE TYPE "StorageUploadKind" AS ENUM ('AVATAR', 'VERIFICATION');

-- CreateEnum
CREATE TYPE "StorageUploadStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- AlterTable: nullable password for Google-only accounts
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: student avatar metadata
ALTER TABLE "StudentProfile"
  ADD COLUMN "avatarObjectKey" TEXT,
  ADD COLUMN "avatarSource" "AvatarSource" NOT NULL DEFAULT 'DEFAULT',
  ADD COLUMN "avatarMimeType" TEXT,
  ADD COLUMN "avatarSizeBytes" INTEGER;

-- AlterTable: tutor avatar metadata
ALTER TABLE "TutorProfile"
  ADD COLUMN "avatarObjectKey" TEXT,
  ADD COLUMN "avatarSource" "AvatarSource" NOT NULL DEFAULT 'DEFAULT',
  ADD COLUMN "avatarMimeType" TEXT,
  ADD COLUMN "avatarSizeBytes" INTEGER;

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "StorageUploadKind" NOT NULL,
    "status" "StorageUploadStatus" NOT NULL DEFAULT 'PENDING',
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "maxSizeBytes" INTEGER NOT NULL,
    "originalFileName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "displayFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerUserId" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerAccountId_key" ON "AuthIdentity"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE INDEX "StorageUpload_userId_status_idx" ON "StorageUpload"("userId", "status");

-- CreateIndex
CREATE INDEX "StorageUpload_expiresAt_idx" ON "StorageUpload"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationDocument_tutorProfileId_idx" ON "VerificationDocument"("tutorProfileId");

-- CreateIndex
CREATE INDEX "VerificationDocument_status_idx" ON "VerificationDocument"("status");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUpload" ADD CONSTRAINT "StorageUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill password identities for existing users
INSERT INTO "AuthIdentity" ("id", "provider", "providerAccountId", "providerEmail", "userId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'PASSWORD'::"AuthProvider",
  u."id",
  u."email",
  u."id",
  NOW(),
  NOW()
FROM "User" u
WHERE u."passwordHash" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "AuthIdentity" ai
    WHERE ai."userId" = u."id" AND ai."provider" = 'PASSWORD'
  );
