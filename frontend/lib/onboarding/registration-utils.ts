export function splitFullName(fullName: string): {
  firstName: string
  lastName: string
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: "Student", lastName: "User" }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

export function budgetFromPreset(presetId: string): {
  min: number | null
  max: number | null
} {
  const presets: Record<string, { min: number | null; max: number | null }> = {
    up_to_4k: { min: 1000, max: 4000 },
    "4k_7k": { min: 4000, max: 7000 },
    "7k_10k": { min: 7000, max: 10000 },
    "10k_plus": { min: 10000, max: 15000 },
    unsure: { min: null, max: null },
  }
  return presets[presetId] ?? { min: null, max: null }
}
