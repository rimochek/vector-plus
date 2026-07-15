import { TutorsService } from './tutors.service';

describe('TutorsService public serialization', () => {
  const tutor = {
    id: 'tutor-1',
    userId: 'user-1',
    displayName: 'Tutor Name',
    headline: 'Teacher',
    bio: 'Bio',
    avatarUrl: null,
    defaultHourlyRateCents: 5000,
    defaultCurrency: 'KZT',
    ratingAvg: 5,
    ratingCount: 1,
    lessonsCompleted: 1,
    experienceYears: 2,
    education: 'University',
    country: 'Kazakhstan',
    city: 'Almaty',
    verificationStatus: 'VERIFIED',
    searchDocument: null,
    user: { id: 'user-1', timezone: 'Asia/Almaty' },
    subjects: [],
    acceptsDirectRequests: true,
    showTelegramPublicly: false,
    showPhonePublicly: false,
    telegramUsername: 'private_handle',
    phone: '+77000000000',
  };

  const service = new TutorsService({} as never);

  it('does not expose private contact fields in a public response', () => {
    const result = (service as unknown as {
      serializeTutor(value: typeof tutor, visibility: 'public'): Record<string, unknown>;
    }).serializeTutor(tutor, 'public');

    expect(result.phone).toBeUndefined();
    expect(result.telegramUsername).toBeUndefined();
    expect(result.publicPhone).toBeUndefined();
    expect(result.publicTelegramUsername).toBeUndefined();
  });

  it('keeps private contact fields available to the owner', () => {
    const result = (service as unknown as {
      serializeTutor(value: typeof tutor, visibility: 'owner'): Record<string, unknown>;
    }).serializeTutor(tutor, 'owner');

    expect(result.phone).toBe('+77000000000');
    expect(result.telegramUsername).toBe('private_handle');
  });
});
