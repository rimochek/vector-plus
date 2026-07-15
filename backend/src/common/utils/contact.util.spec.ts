import {
  normalizePhoneNumber,
  normalizeTelegramUsername,
} from './contact.util';

describe('contact.util', () => {
  it('normalizes telegram usernames', () => {
    expect(normalizeTelegramUsername('@MyUser_123')).toBe('myuser_123');
  });

  it('normalizes phone numbers', () => {
    expect(normalizePhoneNumber('8 707 000 0000')).toBe('+87070000000');
  });
});
