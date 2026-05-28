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
        <div className="flex items-stretch gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/80">
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {minLabel}
            </span>
            <p className="truncate text-sm font-black tabular-nums text-[#8B5CF6]">
              {formatValue(valueMin)}
            </p>
          </div>
          <div className="flex w-4 shrink-0 items-center justify-center text-slate-300 dark:text-zinc-600">
            —
          </div>
          <div className="min-w-0 flex-1 text-right">
            <span className="mb-0.5 block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {maxLabel}
            </span>
            <p className="truncate text-sm font-black tabular-nums text-[#8B5CF6]">
              {formatValue(valueMax)}
            </p>
          </div>
        </div>

        <div className="budget-range-slider relative flex h-9 items-center px-0.5">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200/80 dark:bg-zinc-800" />
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]"
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

        <div className="flex justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          <span className="truncate">{formatValue(min)}</span>
          <span className="truncate">{formatValue(max)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/60 p-5 dark:border-violet-900/40 dark:from-violet-950/20 dark:via-zinc-900 dark:to-indigo-950/10 sm:p-6">
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-4">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            {minLabel}
          </span>
          <span className="block truncate text-lg font-black tabular-nums text-[#8B5CF6] sm:text-xl">
            {formatValue(valueMin)}
          </span>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90 sm:p-4 sm:text-right">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
            {maxLabel}
          </span>
          <span className="block truncate text-lg font-black tabular-nums text-[#8B5CF6] sm:text-xl">
            {formatValue(valueMax)}
          </span>
        </div>
      </div>

      <div className="budget-range-slider relative flex h-11 items-center px-1 sm:h-12">
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-slate-200/80 dark:bg-zinc-800 sm:h-3" />
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] sm:h-3"
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

      <div className="mt-3 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
        <span className="truncate">{formatValue(min)}</span>
        <span className="truncate">{formatValue(max)}</span>
      </div>
    </div>
  )
}
