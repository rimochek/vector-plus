import type { Response } from 'express';

export const REFRESH_COOKIE = 'refresh_token';

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth',
});

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieBase(),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, cookieBase());
}
