"use client"

type StepHeaderProps = {
  title: string
  description?: string
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-[1.75rem]">
        {title}
      </h1>
      {description ? (
        <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  )
}
