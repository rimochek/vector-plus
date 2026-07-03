"use client"

import { useMemo } from "react"
import {
  BookOpen,
  Calculator,
  Code2,
  Globe,
  GraduationCap,
  Languages,
  Sparkles,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { SAMPLE_TUTORS, HERO_SUBJECT_BADGES, type SampleTutor } from "@/app/components/landing/data"

export function useLandingContent() {
  const { t } = useTranslations()

  return useMemo(() => {
    const nav = [
      { href: "/tutors", label: t("nav.findTutors") },
      { href: "/#how-it-works", label: t("landing.howItWorks") },
      { href: "/#for-tutors", label: t("lp.nav.forTutors") },
      { href: "/#subjects", label: t("lp.nav.subjects") },
    ] as const

    const trustPoints = [
      t("lp.hero.trust.verified"),
      t("lp.hero.trust.flexible"),
      t("lp.hero.trust.pricing"),
    ] as const

    const metrics = [
      { value: "50+", label: t("lp.metrics.tutors") },
      { value: "20+", label: t("lp.metrics.subjects") },
      { value: t("lp.metrics.flexibleValue"), label: t("lp.metrics.flexible") },
      { value: t("lp.metrics.onePlaceValue"), label: t("lp.metrics.dashboard") },
    ] as const

    const categories = [
      {
        id: "math",
        name: t("lp.categories.math.name"),
        description: t("lp.categories.math.desc"),
        href: "/tutors?q=Mathematics",
        icon: Calculator,
        tint: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
      },
      {
        id: "english",
        name: t("lp.categories.english.name"),
        description: t("lp.categories.english.desc"),
        href: "/tutors?q=English",
        icon: Languages,
        tint: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      },
      {
        id: "ielts",
        name: t("lp.categories.ielts.name"),
        description: t("lp.categories.ielts.desc"),
        href: "/tutors?q=IELTS",
        icon: Globe,
        tint: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
      },
      {
        id: "sat",
        name: t("lp.categories.sat.name"),
        description: t("lp.categories.sat.desc"),
        href: "/tutors?q=SAT",
        icon: GraduationCap,
        tint: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      },
      {
        id: "programming",
        name: t("lp.categories.programming.name"),
        description: t("lp.categories.programming.desc"),
        href: "/tutors?q=Programming",
        icon: Code2,
        tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      },
      {
        id: "school",
        name: t("lp.categories.school.name"),
        description: t("lp.categories.school.desc"),
        href: "/tutors",
        icon: BookOpen,
        tint: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      },
    ]

    const howItWorks = [
      {
        step: "01",
        title: t("lp.how.step1.title"),
        description: t("lp.how.step1.description"),
        preview: t("lp.how.step1.preview"),
      },
      {
        step: "02",
        title: t("lp.how.step2.title"),
        description: t("lp.how.step2.description"),
        preview: t("lp.how.step2.preview"),
      },
      {
        step: "03",
        title: t("lp.how.step3.title"),
        description: t("lp.how.step3.description"),
        preview: t("lp.how.step3.preview"),
      },
    ] as const

    const productScrollStory = [
      {
        id: "find" as const,
        label: t("lp.product.find.label"),
        title: t("lp.product.find.title"),
        description: t("lp.product.find.description"),
      },
      {
        id: "compare" as const,
        label: t("lp.product.compare.label"),
        title: t("lp.product.compare.title"),
        description: t("lp.product.compare.description"),
      },
      {
        id: "book" as const,
        label: t("lp.product.book.label"),
        title: t("lp.product.book.title"),
        description: t("lp.product.book.description"),
      },
      {
        id: "learn" as const,
        label: t("lp.product.learn.label"),
        title: t("lp.product.learn.title"),
        description: t("lp.product.learn.description"),
      },
    ]

    const benefits = [
      {
        title: t("lp.benefits.profiles.title"),
        description: t("lp.benefits.profiles.desc"),
        icon: Sparkles,
      },
      {
        title: t("lp.benefits.search.title"),
        description: t("lp.benefits.search.desc"),
        icon: GraduationCap,
      },
      {
        title: t("lp.benefits.pricing.title"),
        description: t("lp.benefits.pricing.desc"),
        icon: Calculator,
      },
      {
        title: t("lp.benefits.format.title"),
        description: t("lp.benefits.format.desc"),
        icon: Globe,
      },
      {
        title: t("lp.benefits.favorites.title"),
        description: t("lp.benefits.favorites.desc"),
        icon: BookOpen,
      },
      {
        title: t("lp.benefits.dashboard.title"),
        description: t("lp.benefits.dashboard.desc"),
        icon: Languages,
      },
    ] as const

    const testimonials = [
      {
        id: "1",
        name: "Dana M.",
        goal: "IELTS Band 7",
        subject: "IELTS",
        quote: t("lp.testimonials.1.quote"),
        initials: "DM",
      },
      {
        id: "2",
        name: "Arman T.",
        goal: "SAT Math",
        subject: t("lp.categories.math.name"),
        quote: t("lp.testimonials.2.quote"),
        initials: "AT",
      },
      {
        id: "3",
        name: "Sofia L.",
        goal: t("lp.categories.english.name"),
        subject: t("lp.categories.english.name"),
        quote: t("lp.testimonials.3.quote"),
        initials: "SL",
      },
      {
        id: "4",
        name: "Timur K.",
        goal: "NUET prep",
        subject: t("lp.categories.school.name"),
        quote: t("lp.testimonials.4.quote"),
        initials: "TK",
      },
      {
        id: "5",
        name: "Maria P.",
        goal: t("lp.categories.programming.name"),
        subject: t("lp.categories.programming.name"),
        quote: t("lp.testimonials.5.quote"),
        initials: "MP",
      },
    ] as const

    const faqItems = [
      { id: "choose", question: t("lp.faq.choose.q"), answer: t("lp.faq.choose.a") },
      { id: "format", question: t("lp.faq.format.q"), answer: t("lp.faq.format.a") },
      {
        id: "verification",
        question: t("lp.faq.verification.q"),
        answer: t("lp.faq.verification.a"),
      },
      { id: "favorites", question: t("lp.faq.favorites.q"), answer: t("lp.faq.favorites.a") },
      {
        id: "tutor-profile",
        question: t("lp.faq.tutorProfile.q"),
        answer: t("lp.faq.tutorProfile.a"),
      },
      { id: "payments", question: t("lp.faq.payments.q"), answer: t("lp.faq.payments.a") },
    ] as const

    const footerLinks = {
      product: [
        { href: "/tutors", label: t("nav.findTutors") },
        { href: "/#subjects", label: t("lp.nav.subjects") },
        { href: "/#how-it-works", label: t("landing.howItWorks") },
        { href: "/favorites", label: t("nav.favorites") },
      ],
      tutors: [
        { href: "/signup/tutor", label: t("nav.becomeTutor") },
        { href: "/tutor-dashboard", label: t("nav.dashboard") },
        { href: "/signup/tutor", label: t("lp.footer.tutorResources") },
      ],
      company: [
        { href: "#", label: t("lp.footer.about") },
        { href: "#", label: t("lp.footer.contact") },
        { href: "#", label: t("lp.footer.privacy") },
        { href: "#", label: t("lp.footer.terms") },
      ],
    } as const

    return {
      nav,
      trustPoints,
      metrics,
      categories,
      howItWorks,
      productScrollStory,
      benefits,
      testimonials,
      faqItems,
      footerLinks,
      sampleTutors: SAMPLE_TUTORS as SampleTutor[],
      heroSubjectBadges: HERO_SUBJECT_BADGES,
      hero: {
        eyebrow: t("lp.hero.eyebrow"),
        title: t("lp.hero.title"),
        titleHighlight: t("lp.hero.titleHighlight"),
        description: t("lp.hero.description"),
        findTutor: t("lp.hero.findTutor"),
        becomeTutor: t("nav.becomeTutor"),
        previewCaption: t("lp.hero.previewCaption"),
        searchPlaceholder: t("lp.hero.searchPlaceholder"),
        lessonConfirmed: t("lp.hero.lessonConfirmed"),
        lessonTime: t("lp.hero.lessonTime"),
        frameTitle: t("lp.hero.frameTitle"),
      },
      categoriesSection: {
        eyebrow: t("lp.categories.eyebrow"),
        title: t("lp.categories.title"),
        description: t("lp.categories.description"),
        explore: t("lp.categories.explore"),
      },
      howSection: {
        title: t("lp.how.title"),
      },
      featured: {
        title: t("lp.featured.title"),
        description: t("lp.featured.description"),
        exploreAll: t("lp.featured.exploreAll"),
        sampleNote: t("lp.featured.sampleNote"),
      },
      product: {
        title: t("lp.product.title"),
        description: t("lp.product.description"),
      },
      paths: {
        studentTitle: t("lp.paths.student.title"),
        studentDescription: t("lp.paths.student.description"),
        studentCta: t("lp.paths.student.cta"),
        tutorTitle: t("lp.paths.tutor.title"),
        tutorDescription: t("lp.paths.tutor.description"),
        tutorCta: t("nav.becomeTutor"),
      },
      benefitsSection: {
        title: t("lp.benefits.title"),
        description: t("lp.benefits.description"),
      },
      testimonialsSection: {
        title: t("lp.testimonials.title"),
        description: t("lp.testimonials.description"),
      },
      faqSection: {
        title: t("lp.faq.title"),
      },
      cta: {
        title: t("lp.cta.title"),
        description: t("lp.cta.description"),
        findTutor: t("lp.cta.findTutor"),
        becomeTutor: t("nav.becomeTutor"),
      },
      footer: {
        description: t("lp.footer.description"),
        product: t("lp.footer.product"),
        tutors: t("lp.footer.tutors"),
        company: t("lp.footer.company"),
        copyright: (year: number) => t("lp.footer.copyright", { year }),
        tagline: t("lp.footer.tagline"),
      },
      tutorCard: {
        verified: t("lp.tutor.verified"),
        save: t("lp.tutor.save"),
        viewProfile: t("find.viewProfile"),
      },
      navAuth: {
        login: t("nav.login"),
        findTutor: t("nav.findTutors"),
        becomeTutor: t("nav.becomeTutor"),
      },
    }
  }, [t])
}

export type LandingContent = ReturnType<typeof useLandingContent>
