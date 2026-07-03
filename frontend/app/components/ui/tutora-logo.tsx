"use client"

import Link from "next/link"

type TutoraLogoProps = {
  href?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const LOGO_VIEWBOX = { x: 70, y: 120, w: 490, h: 170 }

const sizes = {
  sm: 42,
  md: 54,
  lg: 64,
} as const

function TutoraLogoMark({
  height,
  className = "",
}: {
  height: number
  className?: string
}) {
  const width = Math.round((height * LOGO_VIEWBOX.w) / LOGO_VIEWBOX.h)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`${LOGO_VIEWBOX.x} ${LOGO_VIEWBOX.y} ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`}
      width={width}
      height={height}
      role="img"
      aria-label="Tutora"
      className={`block shrink-0 ${className}`.trim()}
    >
      <title>Tutora</title>
      <image
        href="/tutora-logo.png"
        xlinkHref="/tutora-logo.png"
        width={612}
        height={408}
        preserveAspectRatio="xMidYMid meet"
        className="dark:hidden"
      />
      <image
        href="/tutora-logo-dark.png"
        xlinkHref="/tutora-logo-dark.png"
        width={612}
        height={408}
        preserveAspectRatio="xMidYMid meet"
        className="hidden dark:block"
      />
    </svg>
  )
}

export function TutoraLogo({
  href = "/",
  className = "",
  size = "md",
}: TutoraLogoProps) {
  const height = sizes[size]
  const content = <TutoraLogoMark height={height} className={className} />

  if (!href) return content

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  )
}
