import {
  buildExamProofOptions,
  validateVerificationUploadInput,
} from './verification-document.constants';

describe('verification-document.constants', () => {
  it('deduplicates SAT options from multiple SAT-related tags', () => {
    const options = buildExamProofOptions(['sat_act']);
    expect(options).toHaveLength(1);
    expect(options[0]?.value).toBe('SAT_ACT');
  });

  it('does not expose IELTS for programming tutors', () => {
    const options = buildExamProofOptions(['programming']);
    expect(options).toHaveLength(0);
  });

  it('rejects exam types outside teaching subjects', () => {
    expect(() =>
      validateVerificationUploadInput({
        teachingTags: ['nuet'],
        documentCategory: 'EXAM_RESULT',
        examType: 'IELTS',
      }),
    ).toThrow('not allowed');
  });

  it('accepts exam types that match teaching subjects', () => {
    const metadata = validateVerificationUploadInput({
      teachingTags: ['ielts', 'nuet'],
      documentCategory: 'EXAM_RESULT',
      examType: 'IELTS',
    });
    expect(metadata.examType).toBe('IELTS');
    expect(metadata.relatedSubjectIds).toContain('ielts');
  });
});
