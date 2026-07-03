"use client"

type BudgetRangeSliderProps = {
  min: number
  max: number
  step: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  formatValue: (value: number) => string
  minLabel: string
  maxLabel: string
  compact?: boolean
}

export function BudgetRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  formatValue,
  minLabel,
  maxLabel,
  compact = false,
}: BudgetRangeSliderProps) {
  const pctMin = ((valueMin - min) / (max - min)) * 100
  const pctMax = ((valueMax - min) / (max - min)) * 100

  const handleMinChange = (next: number) => {
    const clamped = Math.min(next, valueMax - step)
    onChange(Math.max(min, clamped), valueMax)
  }

  const handleMaxChange = (next: number) => {
    const clamped = Math.max(next, valueMin + step)
    onChange(valueMin, Math.min(max, clamped))
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-stretch gap-2 rounded-[var(--radius-input)] border border-[var(--border-strong)] bg-[var(--chip)] p-3">
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {minLabel}
            </span>
            <p className="truncate text-sm font-bold tabular-nums text-[var(--primary-to)]">
              {formatValue(valueMin)}
            </p>
          </div>
          <div className="flex w-4 shrink-0 items-center justify-center text-[var(--text-muted)]">
            —
          </div>
          <div className="min-w-0 flex-1 text-right">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {maxLabel}
            </span>
            <p className="truncate text-sm font-bold tabular-nums text-[var(--primary-to)]">
              {formatValue(valueMax)}
            </p>
          </div>
        </div>

        <div className="budget-range-slider relative flex h-9 items-center px-0.5">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[var(--chip)]" />
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full tutora-gradient"
            style={{
              left: `${pctMin}%`,
              width: `${Math.max(pctMax - pctMin, 0)}%`,
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={valueMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            aria-label={minLabel}
            className="budget-range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
            style={{ zIndex: valueMin > max - step * 2 ? 5 : 3 }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={valueMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            aria-label={maxLabel}
            className="budget-range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
            style={{ zIndex: 4 }}
          />
        </div>

        <div className="flex justify-between gap-2 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span className="truncate">{formatValue(min)}</span>
          <span className="truncate">{formatValue(max)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="tutora-card p-5 sm:p-6">
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-[var(--radius-button)] border border-[var(--border-strong)] bg-[var(--chip)] p-3 sm:p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {minLabel}
          </span>
          <span className="block truncate text-lg font-bold tabular-nums text-[var(--primary-to)] sm:text-xl">
            {formatValue(valueMin)}
          </span>
        </div>
        <div className="min-w-0 rounded-[var(--radius-button)] border border-[var(--border-strong)] bg-[var(--chip)] p-3 sm:p-4 sm:text-right">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {maxLabel}
          </span>
          <span className="block truncate text-lg font-bold tabular-nums text-[var(--primary-to)] sm:text-xl">
            {formatValue(valueMax)}
          </span>
        </div>
      </div>

      <div className="budget-range-slider relative flex h-11 items-center px-1 sm:h-12">
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-[var(--chip)] sm:h-3" />
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full tutora-gradient sm:h-3"
          style={{
            left: `${pctMin}%`,
            width: `${Math.max(pctMax - pctMin, 0)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          aria-label={minLabel}
          className="budget-range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: valueMin > max - step * 2 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          aria-label={maxLabel}
          className="budget-range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-3 flex justify-between gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        <span className="truncate">{formatValue(min)}</span>
        <span className="truncate">{formatValue(max)}</span>
      </div>
    </div>
  )
}
