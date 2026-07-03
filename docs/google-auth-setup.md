# Google authentication setup for Tutora

Tutora uses **Google Identity Services** on the frontend and verifies Google ID tokens in NestJS. Google is only the identity provider — Tutora still owns sessions, roles, JWT access tokens, and HttpOnly refresh cookies.

## 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project for Tutora

## 2. Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** (unless you use Google Workspace internally only)
3. Fill in app name: **Tutora**
4. Add support email and developer contact
5. Scopes: keep default OpenID scopes only (`openid`, `email`, `profile`)
6. Add test users while the app is in testing mode

## 3. Create a Web OAuth client

1. Go to **APIs & Services → Credentials**
2. **Create credentials → OAuth client ID**
3. Application type: **Web application**
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://vectorplus.app` (or your production frontend domain)
   - `https://www.vectorplus.app` if used
5. No redirect URI is required for the One Tap / button ID-token flow used by Tutora

## 4. Add environment variables

All variables go in the **project root** `.env` (copy from `.env.example`):

```env
# Google OAuth — same Web client ID in both vars
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=optional-for-id-token-flow
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Already used by the app
NEXT_PUBLIC_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

Docker Compose, NestJS, and Next.js all read from this single file. Do not use `backend/.env` or `frontend/.env.local`.

## 5. Restart services

```bash
docker compose up -d --build
# or locally
cd backend && npm run start:dev
cd frontend && npm run dev
```

## 6. Test flows

### New student with Google

1. Open `/signup` → choose **I want to learn**
2. Click **Continue with Google**
3. Complete onboarding

### New tutor with Google

1. Open `/signup` → choose **I want to teach**
2. Click **Continue with Google**
3. Complete tutor onboarding

### Existing email/password user (Gmail)

1. Create account with email/password
2. Log out
3. Sign in with Google using the same Gmail address
4. Accounts should link automatically

### Existing email/password user (non-Gmail)

1. Create account with `user@company.com`
2. Sign in with Google using the same email
3. Tutora returns a friendly conflict message
4. Sign in with email/password first
5. Link Google from account settings using `POST /auth/google/link` (UI can be added later)

## Security notes

- Google ID tokens are verified only on the backend
- Google `sub` is stored as the permanent provider account ID
- Refresh tokens remain HttpOnly cookies
- Public signup cannot assign `ADMIN` roles
- Google tokens are never stored in the browser after login completes

## Troubleshooting

| Issue | Fix |
|------|-----|
| Google button never appears | Check `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and browser console |
| `Invalid origin` | Add your frontend origin to OAuth client settings |
| `Invalid Google credential` | Client ID mismatch between frontend and backend |
| Popup blocked | Allow popups for localhost / production domain |
