export type TutorLessonFormat = 'online' | 'offline';

export type TeachingFormatFilter = 'online' | 'inPerson' | 'hybrid';

export function normalizeLessonFormats(
  formats: unknown,
): TutorLessonFormat[] {
  if (!Array.isArray(formats)) return ['online'];
  const normalized = formats.filter(
    (format): format is TutorLessonFormat =>
      format === 'online' || format === 'offline',
  );
  return normalized.length > 0 ? [...new Set(normalized)] : ['online'];
}

export function tutorMatchesTeachingFormatFilters(
  tutorFormats: TutorLessonFormat[],
  selectedFilters: TeachingFormatFilter[],
): boolean {
  if (selectedFilters.length === 0) return true;

  const normalized = normalizeLessonFormats(tutorFormats);
  const hasOnline = normalized.includes('online');
  const hasOffline = normalized.includes('offline');
  const offersBoth = hasOnline && hasOffline;

  return selectedFilters.some((filter) => {
    if (filter === 'hybrid') return offersBoth;
    if (filter === 'online') return hasOnline;
    if (filter === 'inPerson') return hasOffline;
    return false;
  });
}

export function parseTeachingFormatQuery(
  raw: string | string[] | undefined,
): TeachingFormatFilter[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw.join(',') : raw;
  const allowed = new Set<TeachingFormatFilter>([
    'online',
    'inPerson',
    'hybrid',
  ]);
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is TeachingFormatFilter =>
      allowed.has(part as TeachingFormatFilter),
    );
}
