"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Trash2, UserRound } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { deleteAvatar, uploadAvatar } from "@/lib/uploads/upload-avatar"
import { Button } from "@/app/components/ui/button"
import { FormField } from "@/app/components/ui/form-field"

export function ProfileAvatarField({
  avatarUrl,
  onAvatarChange,
  onUploadSuccess,
  onUploadError,
  onRemoveSuccess,
}: {
  avatarUrl: string
  onAvatarChange: (nextUrl: string) => void
  onUploadSuccess?: () => void
  onUploadError?: (message: string) => void
  onRemoveSuccess?: () => void
}) {
  const { t } = useTranslations()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [removing, setRemoving] = useState(false)

  const handleFileChange = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await uploadAvatar(file, setUploadProgress)
      onAvatarChange(result.avatarUrl)
      onUploadSuccess?.()
    } catch (err) {
      onUploadError?.(
        err instanceof Error ? err.message : "Could not upload profile photo",
      )
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await deleteAvatar()
      onAvatarChange("")
      onRemoveSuccess?.()
    } catch (err) {
      onUploadError?.(
        err instanceof Error ? err.message : "Could not remove profile photo",
      )
    } finally {
      setRemoving(false)
    }
  }

  const busy = uploading || removing

  return (
    <FormField label={t("tutorDash.profileEdit.avatarPhoto")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-secondary)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- R2 avatar URL is external.
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
              <UserRound className="h-10 w-10" />
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white">
              {uploadProgress != null ? `${uploadProgress}%` : "…"}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[var(--text-muted)]">
            {t("tutorDash.profileEdit.avatarHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              className="gap-2"
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {uploading
                ? t("tutorDash.profileEdit.avatarUploading")
                : t("tutorDash.profileEdit.avatarChange")}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                className="gap-2 text-[var(--danger)] hover:text-[var(--danger)]"
                onClick={() => void handleRemove()}
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("tutorDash.profileEdit.avatarRemove")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFileChange(file)
          event.target.value = ""
        }}
      />
    </FormField>
  )
}
