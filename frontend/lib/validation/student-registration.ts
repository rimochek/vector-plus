import { z } from "zod"
import { passwordSchema } from "./password"

export const studentAccountSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  password: passwordSchema,
  acceptTerms: z.boolean().refine((value) => value, {
    message: "Please accept the terms to continue",
  }),
})

export type StudentAccountValues = z.infer<typeof studentAccountSchema>

export const studentSubjectSchema = z.object({
  topicId: z.string().min(1, "Choose a subject"),
})

export type StudentSubjectValues = z.infer<typeof studentSubjectSchema>

export const studentGoalOnlySchema = z.object({
  lookingFor: z.string().min(1, "Choose a goal"),
})

export type StudentGoalOnlyValues = z.infer<typeof studentGoalOnlySchema>

export const studentFormatSchema = z.object({
  lessonFormat: z.enum(["online", "offline", "either", "unsure"]),
})

export type StudentFormatValues = z.infer<typeof studentFormatSchema>

export const studentBudgetSchema = z.object({
  budgetPresetId: z.string().min(1, "Choose a budget"),
})

export type StudentBudgetValues = z.infer<typeof studentBudgetSchema>

export const studentCitySchema = z.object({
  city: z.string().trim().min(1, "Enter your city"),
})
