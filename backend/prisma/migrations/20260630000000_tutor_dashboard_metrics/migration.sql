-- CreateTable
CREATE TABLE "TutorProfileView" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TutorProfileView_tutorProfileId_createdAt_idx" ON "TutorProfileView"("tutorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorProfileView_viewerUserId_createdAt_idx" ON "TutorProfileView"("viewerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TutorProfileView_ipHash_createdAt_idx" ON "TutorProfileView"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "TutorProfileView" ADD CONSTRAINT "TutorProfileView_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
