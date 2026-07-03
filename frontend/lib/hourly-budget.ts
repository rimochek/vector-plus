/** Registration stores hourly amount × 100 in budget*Cents. */
export function hourlyAmountToBudgetCents(
  hourly: unknown,
): number | undefined {
  const amount = Number(hourly)
  if (!Number.isFinite(amount) || amount < 0) return undefined
  return Math.round(amount * 100)
}
