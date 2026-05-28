/** Display and filter amounts in Kazakhstani tenge (hourly). DB may still store CurrencyCode. */

/** Fixed grouping so SSR and client render the same string (avoids hydration mismatch). */
export function formatTenge(amount: number): string {
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `₸${grouped}`
}

/** Registration stores hourly amount × 100 in budget*Cents. */
export function budgetCentsToHourlyTenge(cents: number): number {
  return Math.round(cents / 100)
}

/** Tutor profiles store defaultHourlyRateCents the same way as student budgets. */
export function tutorHourlyRateTenge(cents: number): number {
  return budgetCentsToHourlyTenge(cents)
}

const USD_TO_KZT = 450

/** Legacy profiles saved in USD — convert to tenge for display only. */
export function budgetCentsToTengeRange(
  minCents: number,
  maxCents: number,
  currency?: string | null,
): { min: number; max: number } {
  const minRaw = budgetCentsToHourlyTenge(minCents)
  const maxRaw = budgetCentsToHourlyTenge(maxCents)
  if (currency === "USD") {
    return {
      min: Math.round(minRaw * USD_TO_KZT),
      max: Math.round(maxRaw * USD_TO_KZT),
    }
  }
  return { min: minRaw, max: maxRaw }
}
