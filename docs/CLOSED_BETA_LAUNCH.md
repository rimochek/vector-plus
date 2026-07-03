# Tutora closed beta launch guide

This document covers deploying and operating the Tutora closed beta (discovery + booking coordination; payments happen directly between users).

## Required environment variables

Copy `.env.example` to `.env` at the project root and configure:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection for Prisma |
| `JWT_SECRET` | Access token signing |
| `FRONTEND_URL` | Trusted frontend origin (CORS + cookies) |
| `NEXT_PUBLIC_API_URL` | Public API URL embedded in frontend build |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In |
| `R2_*` | Cloudflare R2 buckets for avatars and verification docs |
| `ADMIN_EMAILS` | Comma-separated emails promoted to ADMIN on auth |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support contact on Terms/Privacy pages |

Production also requires `NODE_ENV=production`.

## Create or promote an admin

1. Set `ADMIN_EMAILS=you@example.com` in `.env`.
2. Register or sign in with that email (password or Google).
3. On login/register/`GET /auth/me`, the backend syncs the ADMIN role automatically.

Alternative: update the database manually:

```sql
INSERT INTO "UserRoleMap" ("userId", "role")
SELECT id, 'ADMIN' FROM "User" WHERE email = 'you@example.com'
ON CONFLICT DO NOTHING;
```

## Run Prisma migrations

```bash
docker compose run --rm backend npx prisma migrate deploy
```

For local development:

```bash
cd backend && npx prisma migrate deploy
```

## Start production Docker services

```bash
docker compose up -d --build
```

Verify health:

```bash
curl -f https://api.your-domain/health
```

## Verify Google Sign-In

1. Configure OAuth Web client with authorized JavaScript origins matching `FRONTEND_URL`.
2. Set the same client ID in `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
3. Sign in from `/login` and confirm `/auth/me` returns your user with roles.

## Verify R2 uploads

1. Upload tutor avatar via profile editor.
2. Upload verification document during tutor onboarding.
3. As admin, open `/admin/tutors`, review a tutor, and use **View** on a document (presigned URL).

Ensure R2 CORS allows `PUT` from your frontend origin for presigned uploads.

## Approve the first tutor

1. Complete tutor onboarding and submit application.
2. Sign in as admin and open `/admin/tutors`.
3. Review profile and documents; approve documents individually if needed.
4. Approve the application.
5. Confirm tutor appears on `/tutors` and teaching format filters work.

## Test student booking

1. Register as student and complete onboarding.
2. Open an approved tutor profile and request a lesson.
3. As tutor, approve the request in `/tutor-dashboard`.
4. Exchange chat messages and cancel a test booking.

## Inspect backend logs

```bash
docker compose logs -f backend
```

## Back up PostgreSQL

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

## Rollback procedure

1. Stop traffic to the new deployment.
2. Restore database from backup if schema/data migration caused issues.
3. Deploy previous Docker image tags.
4. Run `prisma migrate resolve` only if a failed migration was partially applied (consult logs first).

## Smoke-test checklist

See `docs/CLOSED_BETA_SMOKE_TESTS.md`.

## Manual QA paths

### Tutor
- Register → onboard → avatar → verification docs → submit
- Not visible before approval
- Admin reviews docs + approves
- Visible in search; receives booking
- Rejection reason shown; edit and resubmit works

### Student
- Register → search/filter → favorite → book → chat → cancel → notifications

### Guest
- `/tutors` navigation → profile → book/message → `/signup/student` with return redirect

### Production
- Session refresh, Google Sign-In, uploads, mobile layout, HTTPS API, Terms/Privacy links, no payment checkout UI
