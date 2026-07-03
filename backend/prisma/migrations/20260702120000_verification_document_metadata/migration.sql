-- Add structured metadata for verification documents (category, exam type, subjects)
ALTER TABLE "VerificationDocument" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
