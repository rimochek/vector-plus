import { z } from "zod"
import { passwordSchema } from "./password"

export const tutorAccountSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: passwordSchema,
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept the terms",
  }),
})

export type TutorAccountValues = z.infer<typeof tutorAccountSchema>

export const tutorNameSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name"),
})

export type TutorNameValues = z.infer<typeof tutorNameSchema>

export const tutorLocationSchema = z.object({
  city: z.string().min(1, "Choose your city"),
})

export type TutorLocationValues = z.infer<typeof tutorLocationSchema>

export const tutorBasicsSchema = tutorNameSchema.merge(tutorLocationSchema)

export type TutorBasicsValues = z.infer<typeof tutorBasicsSchema>

export const tutorTeachingSchema = z.object({
  tags: z.array(z.string()).min(1, "Choose at least one subject"),
  subjectDetail: z.string().optional(),
})

export type TutorTeachingValues = z.infer<typeof tutorTeachingSchema>

export const tutorExperienceSchema = z.object({
  experienceOptionId: z.string().min(1, "Choose an option"),
  experienceYears: z.number().min(0).max(50),
})

export type TutorExperienceValues = z.infer<typeof tutorExperienceSchema>

export const tutorEducationSchema = z.object({
  education: z.string().trim().min(2, "Add a short answer or skip for now").optional().or(z.literal("")),
})

export type TutorEducationValues = z.infer<typeof tutorEducationSchema>

export const tutorHeadlineSchema = z.object({
  headline: z.string().trim().min(10, "Write at least one short sentence").max(120),
})

export type TutorHeadlineValues = z.infer<typeof tutorHeadlineSchema>

export const tutorAboutSchema = z.object({
  bio: z.string().trim().min(50, "A few more words will help students understand your style"),
})

export type TutorAboutValues = z.infer<typeof tutorAboutSchema>

export const tutorDescriptionSchema = tutorHeadlineSchema.merge(tutorAboutSchema)

export type TutorDescriptionValues = z.infer<typeof tutorDescriptionSchema>

export const tutorPriceSchema = z.object({
  hourlyRateAmount: z.number().min(1000, "Enter a valid hourly rate"),
})

export type TutorPriceValues = z.infer<typeof tutorPriceSchema>

export const tutorFormatSchema = z.object({
  lessonFormats: z.array(z.enum(["online", "offline"])).min(1, "Choose at least one option"),
})

export type TutorFormatValues = z.infer<typeof tutorFormatSchema>

export const tutorAvailabilitySchema = z.object({
  availability: z.array(z.string()).min(1, "Choose at least one option"),
})

export type TutorAvailabilityValues = z.infer<typeof tutorAvailabilitySchema>

export const tutorPricingSchema = tutorPriceSchema
  .merge(tutorFormatSchema)
  .merge(tutorAvailabilitySchema)

export const tutorReviewSchema = z.object({
  confirmAccurate: z.boolean().refine((value) => value, {
    message: "Please confirm your information is accurate",
  }),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "Please accept the terms",
  }),
  understandVerification: z.boolean().refine((value) => value, {
    message: "Please confirm you understand verification",
  }),
})

export type TutorReviewValues = z.infer<typeof tutorReviewSchema>
