import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "At least one letter")
  .regex(/\d/, "At least one number")

export type PasswordRequirement = {
  id: string
  label: string
  test: (value: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "letter",
    label: "At least one letter",
    test: (value) => /[A-Za-z]/.test(value),
  },
  {
    id: "number",
    label: "At least one number",
    test: (value) => /\d/.test(value),
  },
]
