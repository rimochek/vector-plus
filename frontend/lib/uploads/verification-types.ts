export const VERIFICATION_DOCUMENT_CATEGORIES = [
  "EXAM_RESULT",
  "EDUCATION",
  "TEACHING_CERTIFICATE",
  "ACADEMIC_QUALIFICATION",
  "OTHER",
] as const

export type VerificationDocumentCategory =
  (typeof VERIFICATION_DOCUMENT_CATEGORIES)[number]

export type VerificationDocumentMetadata = {
  documentCategory: VerificationDocumentCategory
  examType?: string
  relatedSubjectIds?: string[]
}

export type VerificationDocumentSummary = {
  id: string
  fileName: string
  documentType: VerificationDocumentCategory | string
  metadata?: VerificationDocumentMetadata
  status: string
  uploadedAt: string
  sizeBytes?: number
  mimeType?: string
}

export type VerificationOptionsResponse = {
  teachingSubjectIds: string[]
  categories: Array<{
    value: VerificationDocumentCategory
    requiresExamType: boolean
  }>
  examOptions: Array<{
    value: string
    label: string
    relatedSubjectIds: string[]
  }>
}

export type VerificationUploadPayload = {
  documentCategory: VerificationDocumentCategory
  examType?: string
  relatedSubjectIds?: string[]
  replaceDocumentId?: string
}

export function categoryLabelId(
  category: VerificationDocumentCategory,
):
  | "tutorDash.verification.category.exam"
  | "tutorDash.verification.category.education"
  | "tutorDash.verification.category.teaching"
  | "tutorDash.verification.category.academic"
  | "tutorDash.verification.category.other" {
  switch (category) {
    case "EXAM_RESULT":
      return "tutorDash.verification.category.exam"
    case "EDUCATION":
      return "tutorDash.verification.category.education"
    case "TEACHING_CERTIFICATE":
      return "tutorDash.verification.category.teaching"
    case "ACADEMIC_QUALIFICATION":
      return "tutorDash.verification.category.academic"
    default:
      return "tutorDash.verification.category.other"
  }
}

export function examTypeLabelId(
  examType: string,
): `tutorDash.verification.exam.${string}` {
  return `tutorDash.verification.exam.${examType}` as `tutorDash.verification.exam.${string}`
}

export function documentDisplayLabel(
  doc: VerificationDocumentSummary,
  examOptions: VerificationOptionsResponse["examOptions"],
): string {
  const category = doc.metadata?.documentCategory ?? doc.documentType
  if (category === "EXAM_RESULT" && doc.metadata?.examType) {
    const match = examOptions.find(
      (option) => option.value === doc.metadata?.examType,
    )
    return match?.label ?? doc.metadata.examType
  }

  const labels: Record<string, string> = {
    EXAM_RESULT: "Exam result",
    EDUCATION: "University or school enrollment",
    TEACHING_CERTIFICATE: "Teaching certificate",
    ACADEMIC_QUALIFICATION: "Academic qualification",
    OTHER: "Other document",
  }

  return labels[String(category)] ?? "Verification document"
}

export function parseLegacyDocumentCategory(
  value: string,
): VerificationDocumentCategory {
  const normalized = value.trim().toUpperCase()
  if (
    VERIFICATION_DOCUMENT_CATEGORIES.includes(
      normalized as VerificationDocumentCategory,
    )
  ) {
    return normalized as VerificationDocumentCategory
  }
  if (value.trim().toLowerCase() === "school") return "EDUCATION"
  if (value.trim().toLowerCase() === "exam") return "EXAM_RESULT"
  return "OTHER"
}

export function statusLabelId(
  status: string,
):
  | "tutorDash.verification.status.pending"
  | "tutorDash.verification.status.verified"
  | "tutorDash.verification.status.rejected"
  | "tutorDash.verification.status.unverified" {
  switch (status) {
    case "VERIFIED":
      return "tutorDash.verification.status.verified"
    case "REJECTED":
      return "tutorDash.verification.status.rejected"
    case "UNVERIFIED":
      return "tutorDash.verification.status.unverified"
    default:
      return "tutorDash.verification.status.pending"
  }
}
