/**
 * Migrate legacy local uploads in backend/uploads/ to Cloudflare R2.
 *
 * Usage (from backend/; loads env from project root ../.env):
 *   npm run migrate:uploads:r2 -- --dry-run
 *   npm run migrate:uploads:r2
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const rootEnv = resolve(__dirname, '../../.env');
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  const client = new S3Client({
    region: 'auto',
    endpoint: requireEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: true,
  });

  const publicBucket = requireEnv('R2_PUBLIC_BUCKET');
  const privateBucket = requireEnv('R2_PRIVATE_BUCKET');
  const publicBase = requireEnv('R2_PUBLIC_BASE_URL').replace(/\/$/, '');

  const tutors = await prisma.tutorProfile.findMany({
    select: {
      id: true,
      userId: true,
      avatarUrl: true,
      avatarObjectKey: true,
      searchDocument: true,
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const tutor of tutors) {
    if (tutor.avatarUrl?.includes('/uploads/avatars/') && !tutor.avatarObjectKey) {
      const localName = `${tutor.userId}${extname(tutor.avatarUrl)}`;
      const localPath = join(process.cwd(), 'uploads', 'avatars', localName);
      try {
        await stat(localPath);
        const body = await readFile(localPath);
        const objectKey = `avatars/tutors/${tutor.id}/migrated-${localName}`;

        if (!dryRun) {
          const exists = await client
            .send(new HeadObjectCommand({ Bucket: publicBucket, Key: objectKey }))
            .then(() => true)
            .catch(() => false);

          if (!exists) {
            await client.send(
              new PutObjectCommand({
                Bucket: publicBucket,
                Key: objectKey,
                Body: body,
                ContentType: 'image/jpeg',
              }),
            );
          }

          await prisma.tutorProfile.update({
            where: { id: tutor.id },
            data: {
              avatarObjectKey: objectKey,
              avatarUrl: `${publicBase}/${objectKey}`,
              avatarSource: 'UPLOAD',
            },
          });
        }

        console.log(`[avatar] ${dryRun ? 'would migrate' : 'migrated'} ${localPath}`);
        migrated += 1;
      } catch {
        skipped += 1;
      }
    }
  }

  console.log(`Done. migrated=${migrated} skipped=${skipped} dryRun=${dryRun}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
