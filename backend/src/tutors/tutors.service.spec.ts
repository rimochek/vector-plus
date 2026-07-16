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
    verificationDocuments: [
      {
        id: 'verified-doc',
        documentType: 'TEACHING_CERTIFICATE',
        displayFileName: 'Teaching certificate.pdf',
        objectKey: 'private/verified-doc.pdf',
        status: 'VERIFIED',
        uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
        sizeBytes: 1024,
        mimeType: 'application/pdf',
        metadata: { documentCategory: 'TEACHING_CERTIFICATE' },
      },
      {
        id: 'pending-doc',
        documentType: 'OTHER',
        displayFileName: 'Pending document.pdf',
        objectKey: 'private/pending-doc.pdf',
        status: 'PENDING',
        uploadedAt: new Date('2026-01-02T00:00:00.000Z'),
        sizeBytes: 1024,
        mimeType: 'application/pdf',
        metadata: { documentCategory: 'OTHER' },
      },
    ],
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

  it('exposes only safe metadata for verified documents publicly', () => {
    const result = (service as unknown as {
      serializeTutor(value: typeof tutor, visibility: 'public'): Record<string, unknown>;
    }).serializeTutor(tutor, 'public');
    const documents = result.verificationDocuments as Array<Record<string, unknown>>;

    expect(documents).toEqual([
      expect.objectContaining({
        id: 'verified-doc',
        fileName: 'Teaching certificate.pdf',
        status: 'VERIFIED',
      }),
    ]);
    expect(documents[0].storageKey).toBeUndefined();
  });
});
