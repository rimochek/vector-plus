# Cloudflare R2 storage setup for Tutora

Tutora stores **public avatars** and **private verification documents** in separate Cloudflare R2 buckets using presigned browser uploads.

## Architecture

```text
Browser
  → POST /uploads/*/presign (NestJS)
  → PUT presigned URL (R2 directly)
  → POST /uploads/*/complete (NestJS verifies object)
  → PostgreSQL stores metadata + object key
```

Private documents are never served from a public URL. Authorized users receive short-lived signed download URLs.

## 1. Create buckets

Create two buckets in Cloudflare R2:

| Bucket | Purpose |
|--------|---------|
| `tutora-public` | Avatars and public profile media |
| `tutora-private` | Certificates and verification files |

Keep the **private bucket non-public**.

## 2. Public custom domain (avatars only)

1. Open the public bucket in Cloudflare R2
2. Connect a custom domain, e.g. `media.vectorplus.app`
3. Use this as `R2_PUBLIC_BASE_URL`

Do **not** attach a public domain to the private bucket.

## 3. Create an API token

1. Cloudflare dashboard → **R2 → Manage R2 API tokens**
2. Create a token with least privilege:
   - Read/write on `tutora-public`
   - Read/write on `tutora-private`
3. Save:
   - Access Key ID
   - Secret Access Key
   - Account ID

## 4. Environment variables

Add these to the **project root** `.env` (see `.env.example` for the full list):

```env
R2_ACCOUNT_ID=
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BUCKET=tutora-public
R2_PRIVATE_BUCKET=tutora-private
R2_PUBLIC_BASE_URL=https://media.vectorplus.app

R2_UPLOAD_URL_TTL_SECONDS=600
R2_DOWNLOAD_URL_TTL_SECONDS=600
MAX_AVATAR_SIZE_BYTES=5242880
MAX_VERIFICATION_FILE_SIZE_BYTES=15728640
```

Never expose R2 credentials to the frontend. The backend loads them from the root `.env` (Docker `env_file` or local dev via `ConfigModule`).

## 5. Configure CORS

Configure CORS on **both buckets** (rules may differ slightly).

Example allowed origins:

```text
http://localhost:3000
https://vectorplus.app
https://www.vectorplus.app
```

Allowed methods:

```text
PUT
GET
HEAD
```

Allowed headers (required for browser presigned PUT uploads):

```text
Content-Type
Content-Length
```

Example CORS policy JSON for the Cloudflare R2 bucket settings:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://vectorplus.app"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Do not allow public listing on the private bucket.

## 6. Migrate existing local uploads

After configuring R2 in the root `.env` and running the database migration:

```bash
cd backend
npm run migrate:uploads:r2 -- --dry-run
npm run migrate:uploads:r2
```

The script reads environment variables from `../.env` (project root).

The script:

- Reads legacy local files under `backend/uploads/`
- Uploads avatars to the public bucket
- Uploads verification files to the private bucket
- Updates database metadata
- Is idempotent where possible
- Does **not** delete local files automatically

## 7. Verify

### Avatar

1. Log in as a tutor
2. Upload a profile photo during onboarding
3. Confirm the avatar URL uses `R2_PUBLIC_BASE_URL`

### Private certificate

1. Upload a certificate from tutor dashboard profile editor
2. Confirm there is **no permanent public URL**
3. Request download URL via `GET /uploads/verification/:id/download-url`
4. Confirm the signed URL expires

## 8. Production hardening checklist

- [ ] Separate public/private buckets
- [ ] Private bucket has no public domain
- [ ] CORS restricted to real frontend origins
- [ ] R2 token scoped to required buckets only
- [ ] Backup/retention policy documented
- [ ] Malware scanning planned (not included in current codebase)

## Rollback note

If migration fails, local files remain on disk until manually removed. New uploads require R2 once the new upload endpoints are deployed.
