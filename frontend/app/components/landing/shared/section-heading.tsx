import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Reveal } from "@/app/components/landing/animations/reveal"

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  )
}

export const LandingSection = forwardRef<
  HTMLElement,
  {
    id?: string
    children: ReactNode
    className?: string
    containerClassName?: string
  }
>(function LandingSection({ id, children, className, containerClassName }, ref) {
  return (
    <section ref={ref} id={id} className={cn("py-16 sm:py-20 lg:py-24", className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  )
})
