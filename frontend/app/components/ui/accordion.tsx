"use client"

import type { ComponentProps } from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export const Accordion = AccordionPrimitive.Root

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-[var(--border)]", className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-5 text-left text-base font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="accordion-content overflow-hidden text-sm" {...props}>
      <div className={cn("pb-5 leading-relaxed text-[var(--text-muted)]", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}
