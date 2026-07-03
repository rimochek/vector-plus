export const VERIFICATION_DOCUMENT_CATEGORIES = [
  'EXAM_RESULT',
  'EDUCATION',
  'TEACHING_CERTIFICATE',
  'ACADEMIC_QUALIFICATION',
  'OTHER',
] as const;

export type VerificationDocumentCategory =
  (typeof VERIFICATION_DOCUMENT_CATEGORIES)[number];

export type VerificationDocumentMetadata = {
  documentCategory: VerificationDocumentCategory;
  examType?: string;
  relatedSubjectIds?: string[];
};

export const EXAM_SUBJECT_IDS = [
  'sat_act',
  'ielts',
  'nuet',
  'unt',
  'nis',
  'nspm',
  'bil',
  'ap',
  'ib',
] as const;

export type ExamProofOption = {
  value: string;
  label: string;
  relatedSubjectIds: string[];
};

/** Maps teaching tag ids to allowed exam proof options (dedupe by value). */
export const SUBJECT_EXAM_PROOF_MAP: Record<string, ExamProofOption[]> = {
  ielts: [
    {
      value: 'IELTS',
      label: 'IELTS result',
      relatedSubjectIds: ['ielts'],
    },
  ],
  sat_act: [
    {
      value: 'SAT_ACT',
      label: 'SAT / ACT result',
      relatedSubjectIds: ['sat_act'],
    },
  ],
  nuet: [
    {
      value: 'NUET',
      label: 'NUET result',
      relatedSubjectIds: ['nuet'],
    },
  ],
  unt: [
    {
      value: 'UNT',
      label: 'UNT result',
      relatedSubjectIds: ['unt'],
    },
  ],
  nis: [
    {
      value: 'NIS',
      label: 'NIS enrollment or result',
      relatedSubjectIds: ['nis'],
    },
  ],
  nspm: [
    {
      value: 'NSPHM',
      label: 'NSPhM result',
      relatedSubjectIds: ['nspm'],
    },
  ],
  bil: [
    {
      value: 'BIL',
      label: 'BIL result',
      relatedSubjectIds: ['bil'],
    },
  ],
  ap: [
    {
      value: 'AP',
      label: 'AP exam result',
      relatedSubjectIds: ['ap'],
    },
  ],
  ib: [
    {
      value: 'IB',
      label: 'IB exam result',
      relatedSubjectIds: ['ib'],
    },
  ],
  school_prep: [
    {
      value: 'NIS',
      label: 'NIS enrollment or result',
      relatedSubjectIds: ['nis'],
    },
    {
      value: 'NSPHM',
      label: 'NSPhM result',
      relatedSubjectIds: ['nspm'],
    },
    {
      value: 'BIL',
      label: 'BIL result',
      relatedSubjectIds: ['bil'],
    },
  ],
  ap_ib: [
    {
      value: 'AP',
      label: 'AP exam result',
      relatedSubjectIds: ['ap'],
    },
    {
      value: 'IB',
      label: 'IB exam result',
      relatedSubjectIds: ['ib'],
    },
  ],
};

export function parseTeachingTags(searchDocument: string | null): string[] {
  if (!searchDocument) return [];
  try {
    const parsed = JSON.parse(searchDocument) as { tags?: unknown };
    if (!Array.isArray(parsed.tags)) return [];
    return [
      ...new Set(
        parsed.tags.filter((tag): tag is string => typeof tag === 'string'),
      ),
    ];
  } catch {
    return [];
  }
}

export function buildExamProofOptions(teachingTags: string[]): ExamProofOption[] {
  const byValue = new Map<string, ExamProofOption>();

  for (const tag of teachingTags) {
    const options = SUBJECT_EXAM_PROOF_MAP[tag];
    if (!options) continue;
    for (const option of options) {
      if (!byValue.has(option.value)) {
        byValue.set(option.value, option);
      }
    }
  }

  return [...byValue.values()];
}

export function isVerificationDocumentCategory(
  value: string,
): value is VerificationDocumentCategory {
  return VERIFICATION_DOCUMENT_CATEGORIES.includes(
    value as VerificationDocumentCategory,
  );
}

export function normalizeLegacyDocumentType(
  documentType: string,
): VerificationDocumentCategory {
  const normalized = documentType.trim().toUpperCase();
  if (isVerificationDocumentCategory(normalized)) {
    return normalized;
  }
  if (documentType.trim().toLowerCase() === 'school') {
    return 'EDUCATION';
  }
  return 'EXAM_RESULT';
}

export function parseDocumentMetadata(
  documentType: string,
  metadata: unknown,
): VerificationDocumentMetadata {
  if (metadata && typeof metadata === 'object' && metadata !== null) {
    const record = metadata as Record<string, unknown>;
    const categoryRaw = record.documentCategory;
    const documentCategory = isVerificationDocumentCategory(String(categoryRaw))
      ? (categoryRaw as VerificationDocumentCategory)
      : normalizeLegacyDocumentType(documentType);

    return {
      documentCategory,
      examType:
        typeof record.examType === 'string' ? record.examType : undefined,
      relatedSubjectIds: Array.isArray(record.relatedSubjectIds)
        ? record.relatedSubjectIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : undefined,
    };
  }

  return {
    documentCategory: normalizeLegacyDocumentType(documentType),
  };
}

export function validateVerificationUploadInput(params: {
  teachingTags: string[];
  documentCategory: VerificationDocumentCategory;
  examType?: string;
  relatedSubjectIds?: string[];
}): VerificationDocumentMetadata {
  const { teachingTags, documentCategory, examType, relatedSubjectIds } =
    params;

  if (documentCategory === 'EXAM_RESULT') {
    if (!examType?.trim()) {
      throw new Error('Exam type is required for exam results');
    }

    const allowedOptions = buildExamProofOptions(teachingTags);
    const matched = allowedOptions.find((option) => option.value === examType);
    if (!matched) {
      throw new Error(
        'Selected exam type is not allowed for your teaching subjects',
      );
    }

    const normalizedSubjectIds =
      relatedSubjectIds?.filter((id) => teachingTags.includes(id)) ??
      matched.relatedSubjectIds.filter((id) => teachingTags.includes(id));

    return {
      documentCategory,
      examType: matched.value,
      relatedSubjectIds:
        normalizedSubjectIds.length > 0
          ? normalizedSubjectIds
          : matched.relatedSubjectIds,
    };
  }

  return { documentCategory };
}

export function serializeVerificationDocument(doc: {
  id: string;
  displayFileName: string;
  documentType: string;
  metadata: unknown;
  status: string;
  uploadedAt: Date;
  sizeBytes: number;
  mimeType: string;
  rejectionReason?: string | null;
}) {
  const parsedMetadata = parseDocumentMetadata(doc.documentType, doc.metadata);

  return {
    id: doc.id,
    fileName: doc.displayFileName,
    documentType: parsedMetadata.documentCategory,
    metadata: parsedMetadata,
    status: doc.status,
    uploadedAt: doc.uploadedAt.toISOString(),
    sizeBytes: doc.sizeBytes,
    mimeType: doc.mimeType,
    rejectionReason: doc.rejectionReason ?? null,
  };
}
