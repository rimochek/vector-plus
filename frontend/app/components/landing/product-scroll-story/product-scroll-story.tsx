"use client"

import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { usePrefersReducedMotion } from "@/app/components/landing/animations/use-reduced-motion"
import { Reveal } from "@/app/components/landing/animations/reveal"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { ProductPreviewSingle, ProductPreviewStage } from "@/app/components/landing/product-scroll-story/product-preview"
import { StoryStep } from "@/app/components/landing/product-scroll-story/story-step"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

gsap.registerPlugin(ScrollTrigger)

const NAV_OFFSET = 80

function setActiveStep(steps: HTMLElement[], index: number) {
  steps.forEach((step, i) => {
    step.classList.toggle("is-active", i === index)
  })
}

export function ProductScrollStory() {
  const { productScrollStory, product } = useLandingContent()
  const stepCount = productScrollStory.length
  const sectionRef = useRef<HTMLElement>(null)
  const pinTargetRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !pinTargetRef.current || !previewRef.current) {
      return
    }

    const pinTarget = pinTargetRef.current
    const previewRoot = previewRef.current

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add("(min-width: 1024px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-story-panel]", previewRoot)
        const steps = gsap.utils.toArray<HTMLElement>("[data-story-step]", pinTarget)

        panels.forEach((panel, index) => {
          gsap.set(panel, { autoAlpha: index === 0 ? 1 : 0 })
        })
        setActiveStep(steps, 0)

        let activeStepIndex = 0

        const scrollLength = () => Math.round(window.innerHeight * 2)

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinTarget,
            start: `top ${NAV_OFFSET}px`,
            end: () => `+=${scrollLength()}`,
            scrub: 0.5,
            pin: true,
            pinSpacing: true,
            anticipatePin: 0,
            onEnter: () => pinTarget.classList.add("is-pinned"),
            onEnterBack: () => {
              pinTarget.classList.add("is-pinned")
              gsap.set(panels, { autoAlpha: 0 })
              gsap.set(panels[0], { autoAlpha: 1 })
              activeStepIndex = 0
              setActiveStep(steps, 0)
            },
            onLeave: () => pinTarget.classList.remove("is-pinned"),
            onLeaveBack: () => pinTarget.classList.remove("is-pinned"),
            onUpdate: (self) => {
              const step = Math.min(
                stepCount - 1,
                Math.max(0, Math.round(self.progress * (stepCount - 1))),
              )
              if (step !== activeStepIndex) {
                activeStepIndex = step
                setActiveStep(steps, step)
              }
            },
          },
        })

        const segment = 1 / stepCount

        for (let i = 0; i < stepCount - 1; i++) {
          const at = segment * (i + 1)
          tl.to(panels[i], { autoAlpha: 0, duration: 0.25, ease: "power1.inOut" }, at - 0.12)
          tl.to(panels[i + 1], { autoAlpha: 1, duration: 0.25, ease: "power1.inOut" }, at - 0.12)
        }

        return () => {
          tl.scrollTrigger?.kill()
          tl.kill()
        }
      })
    }, pinTarget)

    return () => ctx.revert()
  }, [reduced, stepCount])

  if (reduced) {
    return (
      <LandingSection className="bg-[var(--surface-secondary)]/40">
        <SectionHeading title={product.title} description={product.description} />
        <div className="mt-12 grid gap-10">
          {productScrollStory.map((step, index) => (
            <div key={step.id} className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <StoryStep
                index={index}
                label={step.label}
                title={step.title}
                description={step.description}
                active
              />
              <ProductPreviewSingle step={step.id} />
            </div>
          ))}
        </div>
      </LandingSection>
    )
  }

  return (
    <LandingSection ref={sectionRef} className="bg-[var(--surface-secondary)]/40">
      <SectionHeading title={product.title} description={product.description} />

      <div
        ref={pinTargetRef}
        className="story-pin-target mt-12 hidden lg:block lg:w-full [&.is-pinned]:flex [&.is-pinned]:min-h-[calc(100dvh-5rem)] [&.is-pinned]:items-center"
      >
        <div className="grid w-full grid-cols-[0.95fr_1.05fr] items-center gap-12">
          <div className="flex flex-col gap-2">
            {productScrollStory.map((step, index) => (
              <StoryStep
                key={step.id}
                index={index}
                label={step.label}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>

          <div ref={previewRef} className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <ProductPreviewStage />
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-12 lg:hidden">
        {productScrollStory.map((step, index) => (
          <Reveal key={step.id} variant={index % 2 === 0 ? "up" : "scale"} delay={index * 0.04}>
            <div className="grid gap-6">
              <StoryStep
                index={index}
                label={step.label}
                title={step.title}
                description={step.description}
                active
              />
              <ProductPreviewSingle step={step.id} />
            </div>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  )
}
