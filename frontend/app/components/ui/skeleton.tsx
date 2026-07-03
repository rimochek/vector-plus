export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-white/10 ${className}`.trim()}
    />
  )
}

export function TutorCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="w-full space-y-3 sm:w-40">
          <Skeleton className="h-8 w-28 sm:ml-auto" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

