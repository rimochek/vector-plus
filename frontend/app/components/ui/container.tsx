import type { ReactNode } from "react"

type ContainerSize = "marketing" | "search" | "dashboard" | "content"

const sizeClass: Record<ContainerSize, string> = {
  marketing: "max-w-[1440px]",
  search: "max-w-[1600px]",
  dashboard: "max-w-[1500px]",
  content: "max-w-7xl",
}

export function Container({
  children,
  className = "",
  size = "marketing",
}: {
  children: ReactNode
  className?: string
  size?: ContainerSize
}) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 ${sizeClass[size]} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export const AppContainer = Container
