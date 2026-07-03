import {
  normalizeLessonFormats,
  parseTeachingFormatQuery,
  tutorMatchesTeachingFormatFilters,
} from './tutor-lesson-formats.util';

describe('tutor lesson format matching', () => {
  it('normalizes empty values to online default', () => {
    expect(normalizeLessonFormats(undefined)).toEqual(['online']);
    expect(normalizeLessonFormats([])).toEqual(['online']);
  });

  it('matches online filter for online-only tutors', () => {
    expect(
      tutorMatchesTeachingFormatFilters(['online'], ['online']),
    ).toBe(true);
    expect(
      tutorMatchesTeachingFormatFilters(['online'], ['inPerson']),
    ).toBe(false);
  });

  it('matches in-person filter for offline-only tutors', () => {
    expect(
      tutorMatchesTeachingFormatFilters(['offline'], ['inPerson']),
    ).toBe(true);
  });

  it('matches both online and in-person when tutor offers both', () => {
    const both: ('online' | 'offline')[] = ['online', 'offline'];
    expect(tutorMatchesTeachingFormatFilters(both, ['online'])).toBe(true);
    expect(tutorMatchesTeachingFormatFilters(both, ['inPerson'])).toBe(true);
    expect(tutorMatchesTeachingFormatFilters(both, ['hybrid'])).toBe(true);
  });

  it('uses OR semantics for multiple selected filters', () => {
    expect(
      tutorMatchesTeachingFormatFilters(['online'], ['online', 'inPerson']),
    ).toBe(true);
    expect(
      tutorMatchesTeachingFormatFilters(['offline'], ['online', 'inPerson']),
    ).toBe(true);
  });

  it('parses teaching format query values', () => {
    expect(parseTeachingFormatQuery('online,inPerson')).toEqual([
      'online',
      'inPerson',
    ]);
    expect(parseTeachingFormatQuery('invalid,online')).toEqual(['online']);
  });
});
