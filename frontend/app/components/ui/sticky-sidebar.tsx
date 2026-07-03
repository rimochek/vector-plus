import type { ReactNode, CSSProperties } from "react"

const DEFAULT_INSET = 16

type StickySidebarProps = {
  children: ReactNode
  /** Width utility classes, e.g. w-80 */
  className?: string
  /** Classes on the sticky inner panel */
  panelClassName?: string
  /** Pixels from viewport top when stuck (72 = below site header) */
  top?: number
  /**
   * classic — sidebar sticks while scrolling long page content (filters).
   * column — inner sticky panel inside a stretched column (dashboards).
   */
  mode?: "classic" | "column"
  /** Stretch column to sibling height so inner sticky can work (column mode) */
  stretchColumn?: boolean
  /** Padding from viewport top and bottom when sticking (px) */
  inset?: number
}

export function StickySidebar({
  children,
  className = "w-80",
  panelClassName = "",
  top = 72,
  mode = "column",
  stretchColumn = false,
  inset = DEFAULT_INSET,
}: StickySidebarProps) {
  const insetPx = inset
  const stickyTop = top + insetPx
  const panelHeight = `calc(100dvh - ${stickyTop + insetPx}px)`

  const stickyStyle: CSSProperties = {
    top: `${stickyTop}px`,
    maxHeight: panelHeight,
  }

  if (mode === "classic") {
    return (
      <aside
        style={stickyStyle}
        className={`sticky hidden shrink-0 self-start overflow-y-auto overscroll-contain lg:block ${className} ${panelClassName}`.trim()}
      >
        {children}
      </aside>
    )
  }

  const stretch = stretchColumn
  const columnStickyStyle: CSSProperties = {
    position: "sticky",
    top: `${stickyTop}px`,
    maxHeight: panelHeight,
    ...(stretchColumn ? { minHeight: panelHeight } : {}),
  }

  return (
    <aside
      className={`hidden shrink-0 lg:block ${stretch ? "self-stretch" : "self-start"} ${className}`.trim()}
    >
      <div
        style={columnStickyStyle}
        className={`overflow-y-auto overscroll-contain ${panelClassName}`.trim()}
      >
        {children}
      </div>
    </aside>
  )
}
