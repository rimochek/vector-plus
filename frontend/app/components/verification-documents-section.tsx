"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { FileText, Loader2, Trash2, Upload } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import {
  deleteVerificationDocument,
  getVerificationDownloadUrl,
  getVerificationOptions,
  uploadVerificationDocument,
  type VerificationDocumentSummary,
  type VerificationOptionsResponse,
} from "@/lib/uploads/upload-verification"
import {
  VERIFICATION_DOCUMENT_CATEGORIES,
  categoryLabelId,
  examTypeLabelId,
  statusLabelId,
  type VerificationDocumentCategory,
} from "@/lib/uploads/verification-types"
import { Button } from "@/app/components/ui/button"
import { FormField, Select } from "@/app/components/ui/form-field"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

const fadeMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

function formatUploadedDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function DeleteDocumentDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslations()
  const reduceMotion = useReducedMotion()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <motion.div
        {...(reduceMotion ? {} : fadeMotion)}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-doc-title"
      >
        <h3
          id="delete-doc-title"
          className="text-lg font-bold text-[var(--text-primary)]"
        >
          {t("tutorDash.verification.deleteTitle")}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("tutorDash.verification.deleteBody")}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>
            {t("tutorDash.verification.deleteCancel")}
          </Button>
          <Button
            type="button"
            disabled={loading}
            className="gap-2 bg-[var(--danger)] hover:bg-[var(--danger)]"
            onClick={onConfirm}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("tutorDash.verification.deleteConfirm")}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function VerificationDocumentCard({
  doc,
  locale,
  onReplace,
  onDelete,
}: {
  doc: VerificationDocumentSummary
  locale: string
  onReplace: (doc: VerificationDocumentSummary) => void
  onDelete: (doc: VerificationDocumentSummary) => void
}) {
  const { t } = useTranslations()
  const reduceMotion = useReducedMotion()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const isImage = doc.mimeType?.startsWith("image/") ?? false
  const category = (doc.metadata?.documentCategory ??
    doc.documentType) as VerificationDocumentCategory
  const label =
    category === "EXAM_RESULT" && doc.metadata?.examType
      ? t(examTypeLabelId(doc.metadata.examType) as MessageId)
      : t(categoryLabelId(category) as MessageId)

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    setLoadingPreview(true)

    void getVerificationDownloadUrl(doc.id)
      .then((response) => {
        if (!cancelled) setPreviewUrl(response.downloadUrl)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false)
      })

    return () => {
      cancelled = true
    }
  }, [doc.id, isImage])

  return (
    <motion.li
      layout={!reduceMotion}
      {...(reduceMotion ? {} : fadeMotion)}
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {label}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t(statusLabelId(doc.status) as MessageId)}
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[220px] sm:max-w-[280px]">
          <div className="flex h-[140px] max-h-[170px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] sm:h-[180px] sm:max-h-[200px]">
            {isImage ? (
              loadingPreview ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- Signed private preview URL.
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="px-3 text-center text-xs text-[var(--text-muted)]">
                  {t("tutorDash.verification.previewUnavailable")}
                </span>
              )
            ) : (
              <div className="flex flex-col items-center gap-2 px-3 text-center text-[var(--text-muted)]">
                <FileText className="h-8 w-8" />
                <span className="line-clamp-2 text-xs font-medium">
                  {doc.fileName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium text-[var(--text-primary)]">
            {doc.fileName}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {t("tutorDash.verification.uploadedOn", {
              date: formatUploadedDate(doc.uploadedAt, locale),
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-9 px-4 py-2"
            onClick={() => onReplace(doc)}
          >
            {t("tutorDash.verification.replace")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 gap-1.5 px-4 py-2 text-[var(--danger)] hover:text-[var(--danger)]"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("tutorDash.verification.delete")}
          </Button>
        </div>
      </div>
    </motion.li>
  )
}

export function VerificationDocumentsSection({
  documents,
  onDocumentsChange,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  onEditSubjects,
  teachingTagsKey = "",
}: {
  documents: VerificationDocumentSummary[]
  onDocumentsChange: (next: VerificationDocumentSummary[]) => void
  onUploadSuccess: () => void
  onUploadError: (message: string) => void
  onDeleteSuccess: () => void
  onEditSubjects: () => void
  teachingTagsKey?: string
}) {
  const { t, locale } = useTranslations()
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [options, setOptions] = useState<VerificationOptionsResponse | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [documentCategory, setDocumentCategory] = useState<
    VerificationDocumentCategory | ""
  >("")
  const [examType, setExamType] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replaceTarget, setReplaceTarget] =
    useState<VerificationDocumentSummary | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<VerificationDocumentSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoadingOptions(true)
    void getVerificationOptions()
      .then(setOptions)
      .catch(() => onUploadError(t("tutorDash.verification.optionsError")))
      .finally(() => setLoadingOptions(false))
  }, [onUploadError, t, teachingTagsKey])

  const examOptions = options?.examOptions ?? []
  const requiresExamType = documentCategory === "EXAM_RESULT"
  const showExamEmptyState =
    requiresExamType && !loadingOptions && examOptions.length === 0

  const categoryOptions = useMemo(
    () =>
      VERIFICATION_DOCUMENT_CATEGORIES.map((value) => ({
        value,
        label: t(categoryLabelId(value) as MessageId),
      })),
    [t],
  )

  const canChooseFile =
    Boolean(documentCategory) &&
    (!requiresExamType || Boolean(examType)) &&
    !showExamEmptyState

  const canUpload = canChooseFile && Boolean(selectedFile) && !uploading

  const resetUploadForm = () => {
    setSelectedFile(null)
    setReplaceTarget(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentCategory || uploading) return
    if (requiresExamType && !examType) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploaded = await uploadVerificationDocument(
        selectedFile,
        {
          documentCategory,
          examType: requiresExamType ? examType : undefined,
          relatedSubjectIds: requiresExamType
            ? examOptions.find((option) => option.value === examType)
                ?.relatedSubjectIds
            : undefined,
          replaceDocumentId: replaceTarget?.id,
        },
        setUploadProgress,
      )

      if (replaceTarget) {
        onDocumentsChange(
          documents.map((doc) => (doc.id === replaceTarget.id ? uploaded : doc)),
        )
      } else {
        onDocumentsChange([uploaded, ...documents])
      }

      resetUploadForm()
      onUploadSuccess()
    } catch (err) {
      onUploadError(
        err instanceof Error
          ? err.message
          : t("tutorDash.verification.uploadError"),
      )
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await deleteVerificationDocument(deleteTarget.id)
      onDocumentsChange(documents.filter((doc) => doc.id !== deleteTarget.id))
      setDeleteTarget(null)
      onDeleteSuccess()
    } catch (err) {
      onUploadError(
        err instanceof Error
          ? err.message
          : t("tutorDash.verification.deleteError"),
      )
    } finally {
      setDeleting(false)
    }
  }

  const startReplace = (doc: VerificationDocumentSummary) => {
    setReplaceTarget(doc)
    const category = (doc.metadata?.documentCategory ??
      doc.documentType) as VerificationDocumentCategory
    setDocumentCategory(category)
    setExamType(doc.metadata?.examType ?? "")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
      <h3 className="text-base font-bold text-[var(--text-primary)]">
        {t("tutorDash.verification.title")}
      </h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {t("tutorDash.verification.description")}
      </p>

      <AnimatePresence mode="popLayout" initial={false}>
        {documents.length > 0 ? (
          <motion.ul
            key="documents-list"
            className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            {...(reduceMotion ? {} : fadeMotion)}
          >
            {documents.map((doc) => (
              <VerificationDocumentCard
                key={doc.id}
                doc={doc}
                locale={locale}
                onReplace={startReplace}
                onDelete={setDeleteTarget}
              />
            ))}
          </motion.ul>
        ) : (
          <motion.p
            key="documents-empty"
            className="mt-4 text-sm text-[var(--text-muted)]"
            {...(reduceMotion ? {} : fadeMotion)}
          >
            {t("tutorDash.verification.empty")}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-4 border-t border-[var(--border)] pt-5">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {replaceTarget
              ? t("tutorDash.verification.replaceTitle")
              : t("tutorDash.verification.addTitle")}
          </p>
          {replaceTarget ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {t("tutorDash.verification.replaceHint")}
            </p>
          ) : null}
        </div>

        <FormField label={t("tutorDash.verification.categoryLabel")}>
          <Select
            value={documentCategory}
            onChange={(event) => {
              const next = event.target.value as VerificationDocumentCategory | ""
              setDocumentCategory(next)
              setExamType("")
              setSelectedFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ""
            }}
          >
            <option value="">{t("tutorDash.verification.categoryPlaceholder")}</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <AnimatePresence initial={false}>
          {requiresExamType ? (
            <motion.div
              key="exam-type-field"
              {...(reduceMotion ? {} : fadeMotion)}
            >
              {showExamEmptyState ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-sm text-[var(--text-muted)]">
                    {t("tutorDash.verification.examSubjectsEmpty")}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    onClick={onEditSubjects}
                  >
                    {t("tutorDash.verification.editSubjects")}
                  </Button>
                </div>
              ) : (
                <FormField label={t("tutorDash.verification.examLabel")}>
                  <Select
                    value={examType}
                    disabled={!documentCategory || loadingOptions}
                    onChange={(event) => {
                      setExamType(event.target.value)
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <option value="">
                      {t("tutorDash.verification.examPlaceholder")}
                    </option>
                    {examOptions.map((option) => {
                      const labelId = examTypeLabelId(option.value)
                      return (
                        <option key={option.value} value={option.value}>
                          {t(labelId as MessageId)}
                        </option>
                      )
                    })}
                  </Select>
                </FormField>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <FormField label={t("tutorDash.verification.fileLabel")}>
          <div className="space-y-3">
            <label
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-[var(--border)] px-4 py-3 text-sm font-semibold sm:w-auto ${
                canChooseFile
                  ? "cursor-pointer text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <Upload className="h-4 w-4" />
              {selectedFile
                ? selectedFile.name
                : t("tutorDash.verification.filePlaceholder")}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="sr-only"
                disabled={!canChooseFile || uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setSelectedFile(file)
                }}
              />
            </label>

            <Button
              type="button"
              disabled={!canUpload}
              className="gap-2"
              onClick={() => void handleUpload()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadProgress != null
                    ? `${t("tutorDash.verification.uploading")} ${uploadProgress}%`
                    : t("tutorDash.verification.uploading")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {replaceTarget
                    ? t("tutorDash.verification.replaceAction")
                    : t("tutorDash.verification.uploadAction")}
                </>
              )}
            </Button>

            {replaceTarget ? (
              <Button
                type="button"
                variant="ghost"
                onClick={resetUploadForm}
                disabled={uploading}
              >
                {t("tutorDash.verification.cancelReplace")}
              </Button>
            ) : null}
          </div>
        </FormField>
      </div>

      <DeleteDocumentDialog
        open={Boolean(deleteTarget)}
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
