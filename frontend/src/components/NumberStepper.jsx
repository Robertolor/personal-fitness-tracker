import { Minus, Plus } from 'lucide-react'

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  suffix = '',
}) {
  const num = Number(value) || 0

  const adjust = (delta) => {
    const next = Math.min(max, Math.max(min, num + delta))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-zinc-500">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          <Minus size={16} />
        </button>
        <div className="min-w-[4rem] text-center font-mono text-lg tabular-nums">
          {num}{suffix}
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

/** 1-5 scale stepper for wellness metrics */
export function ScaleStepper({ value, onChange, label, lowLabel, highLabel }) {
  const levels = [1, 2, 3, 4, 5]
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex gap-1">
        {levels.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
              value === n
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
