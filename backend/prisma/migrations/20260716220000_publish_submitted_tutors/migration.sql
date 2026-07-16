-- Publishing and verification are separate decisions. Completed applications
-- created under the former review-first workflow should become discoverable,
-- while their verificationStatus remains unchanged (normally UNVERIFIED).
UPDATE "TutorProfile"
SET
  "applicationStatus" = 'APPROVED',
  "isAcceptingStudents" = true
WHERE "applicationStatus" IN ('SUBMITTED', 'UNDER_REVIEW');
