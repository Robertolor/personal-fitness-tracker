import { useMemo, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Utensils, ChevronLeft, ChevronRight, Pill, ShoppingCart, Plane } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { WEEK_TEMPLATE, PEOPLE, buildMealsForDay, SUPPLEMENTS, SHOPPING_LIST_WEEKLY, TRIP_GUIDE } from '../data/mealPlan'
import { computeTotals, round, sumMeals, FOODS } from '../lib/nutrition'

function dayNumberFromStart(startDateISO) {
  const start = parseISO(startDateISO)
  const today = new Date()
  const diff = differenceInCalendarDays(today, start)
  return Math.max(1, diff + 1)
}

export default function MealPlan() {
  const { settings } = useAuth()
  const startDate = settings?.start_date ?? '2026-06-01'
  const [dayOffset, setDayOffset] = useState(0)
  const [person, setPerson] = useState('roberto')
  const [variant, setVariant] = useState('maintain')
  const [showExtras, setShowExtras] = useState(null)

  const dayNumber = dayNumberFromStart(startDate) + dayOffset
  const clampedDay = Math.min(30, Math.max(1, dayNumber))
  const weekIndex = (clampedDay - 1) % 7
  const dayTemplate = WEEK_TEMPLATE[weekIndex]

  const effectiveVariant = person === 'esposa' ? 'fixed' : variant
  const meals = useMemo(() => buildMealsForDay(person, effectiveVariant, dayTemplate), [person, effectiveVariant, dayTemplate])
  const totals = useMemo(() => sumMeals(meals), [meals])
  const target = PEOPLE[person].targets[effectiveVariant]

  const daysUntilTripCheck = clampedDay >= 25

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menú</h1>
        <p className="text-sm text-zinc-500">Día {clampedDay} de 30 · {dayTemplate.label}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setDayOffset((d) => d - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-2 rounded-lg bg-zinc-900 p-1">
          {Object.entries(PEOPLE).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPerson(key)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                person === key ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDayOffset((d) => d + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {person === 'roberto' && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 p-1">
          {[
            { key: 'maintain', label: 'Mantener (1900)' },
            { key: 'reduced', label: 'Reducido -150 (semana 3-4 si aplica)' },
          ].map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVariant(v.key)}
              className={`flex-1 rounded-md py-2 text-xs font-medium ${
                variant === v.key ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="text-emerald-400" size={20} />
            <h2 className="font-semibold">Total del día vs. objetivo</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalStat label="Kcal" actual={totals.kcal} target={target.kcal} />
          <TotalStat label="Proteína" actual={totals.protein} target={target.protein} unit="g" />
          <TotalStat label="Grasa" actual={totals.fat} target={target.fat} unit="g" />
          <TotalStat label="Carbos" actual={totals.carbs} target={target.carbs} unit="g" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Los totales exactos varían un poco día a día según los vegetales/porciones reales - lo importante es el promedio semanal cerca del objetivo, no el número exacto cada día.
        </p>
      </section>

      <div className="space-y-3">
        {meals.map((meal) => {
          const mealTotals = round(computeTotals(meal.items))
          return (
            <div key={meal.type} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-emerald-300">{meal.type}</h3>
                <span className="text-xs text-zinc-500">{mealTotals.kcal} kcal</span>
              </div>
              <p className="mb-2 text-sm text-zinc-400">{meal.note}</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                {meal.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{FOODS[item.food]?.label ?? item.food}</span>
                    <span className="text-zinc-500">{item.grams} g</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-3 text-[11px] text-zinc-500">
                <span>P {mealTotals.protein}g</span>
                <span>G {mealTotals.fat}g</span>
                <span>C {mealTotals.carbs}g</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ExtrasCard
          icon={Pill}
          title="Suplementos"
          open={showExtras === 'supps'}
          onToggle={() => setShowExtras(showExtras === 'supps' ? null : 'supps')}
        >
          <ul className="space-y-2 text-sm">
            {SUPPLEMENTS.map((s) => (
              <li key={s.name}>
                <p className="font-medium text-zinc-200">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.dose} · {s.timing}</p>
              </li>
            ))}
          </ul>
        </ExtrasCard>

        <ExtrasCard
          icon={ShoppingCart}
          title="Lista de compra (Consum)"
          open={showExtras === 'shopping'}
          onToggle={() => setShowExtras(showExtras === 'shopping' ? null : 'shopping')}
        >
          <ul className="space-y-1.5 text-sm">
            {SHOPPING_LIST_WEEKLY.map((s) => (
              <li key={s.item} className="flex justify-between gap-2">
                <span className="text-zinc-300">{s.item}</span>
                <span className="shrink-0 text-xs text-zinc-500">{s.amount}</span>
              </li>
            ))}
          </ul>
        </ExtrasCard>

        <ExtrasCard
          icon={Plane}
          title="Guía para el viaje"
          open={showExtras === 'trip' || daysUntilTripCheck}
          onToggle={() => setShowExtras(showExtras === 'trip' ? null : 'trip')}
        >
          <ul className="space-y-1.5 text-sm list-disc pl-4">
            {TRIP_GUIDE.points.map((p, i) => (
              <li key={i} className="text-zinc-300">{p}</li>
            ))}
          </ul>
        </ExtrasCard>
      </div>
    </div>
  )
}

function TotalStat({ label, actual, target, unit = '' }) {
  const diff = actual - target
  const withinRange = Math.abs(diff) <= Math.max(target * 0.1, unit === '' ? 100 : 8)
  return (
    <div className="rounded-lg bg-zinc-800/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-lg ${withinRange ? 'text-emerald-400' : 'text-amber-400'}`}>
        {actual}{unit}
      </p>
      <p className="text-[11px] text-zinc-600">objetivo {target}{unit}</p>
    </div>
  )
}

function ExtrasCard({ icon: Icon, title, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Icon size={16} className="text-emerald-400" />
          {title}
        </span>
        <span className="text-xs text-zinc-500">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}
