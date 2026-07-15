import { BadRequestException } from '@nestjs/common';

const TELEGRAM_USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
const PHONE_E164_RE = /^\+[1-9]\d{6,14}$/;

export function normalizeTelegramUsername(input: string): string {
  const cleaned = input.trim().replace(/^@+/, '').toLowerCase();
  if (!TELEGRAM_USERNAME_RE.test(cleaned)) {
    throw new BadRequestException('Invalid Telegram username');
  }
  return cleaned;
}

export function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  let normalized = digits;
  if (!normalized.startsWith('+')) {
    normalized = `+${normalized.replace(/^\+/, '')}`;
  }
  if (!PHONE_E164_RE.test(normalized)) {
    throw new BadRequestException('Invalid phone number');
  }
  return normalized;
}

export function sanitizeLeadText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}
