"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion"
import { Reveal } from "@/app/components/landing/animations/reveal"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function LandingFaq() {
  const { faqItems, faqSection } = useLandingContent()

  return (
    <LandingSection>
      <SectionHeading title={faqSection.title} align="left" className="mx-0" />

      <Reveal variant="left" className="mt-10 max-w-3xl">
        <Accordion type="single" collapsible>
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </LandingSection>
  )
}
