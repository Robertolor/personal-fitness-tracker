import { useMemo, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Utensils, Pill, ShoppingCart, Plane, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PEOPLE, BREAKFAST_OPTIONS, LUNCH_OPTIONS, DINNER_OPTIONS, buildAdaptiveDay, SUPPLEMENTS, SHOPPING_LIST_WEEKLY, TRIP_GUIDE } from '../data/mealPlan'
import { computeTotals, round, sumMeals, scaleTemplateToBudget, FOODS } from '../lib/nutrition'

function dayNumberFromStart(startDateISO) {
  const start = parseISO(startDateISO)
  const today = new Date()
  const diff = differenceInCalendarDays(today, start)
  return Math.min(30, Math.max(1, diff + 1))
}

const HELPERS = { computeTotals, scaleTemplateToBudget }

export default function MealPlan() {
  const { settings } = useAuth()
  const startDate = settings?.start_date ?? '2026-06-01'
  const [person, setPerson] = useState('roberto')
  const [variant, setVariant] = useState('maintain')
  const [showExtras, setShowExtras] = useState(null)
  // Which option is currently picked for each meal slot, plus which topping
  // (for options with `toppingOptions`, e.g. oats: plátano / maní / almendras).
  // Changing any of these reflows the budget for whatever comes after it in the day.
  const [selection, setSelection] = useState({
    breakfastIdx: 0,
    lunchIdx: 0,
    dinnerIdx: 0,
    breakfastTopping: 'banana',
    lunchTopping: 'banana',
    dinnerTopping: 'banana',
  })

  const clampedDay = dayNumberFromStart(startDate)
  const effectiveVariant = person === 'esposa' ? 'fixed' : variant
  const target = PEOPLE[person].targets[effectiveVariant]

  const meals = useMemo(
    () => buildAdaptiveDay(person, effectiveVariant, selection, HELPERS) ?? [],
    [person, effectiveVariant, selection]
  )
  const totals = useMemo(() => sumMeals(meals), [meals])

  // For each slot, preview what all 3 options would look like *given the current
  // choices in the other slots* - this is the actual "adaptive" behavior: switch
  // breakfast and watch every lunch/dinner card resize live.
  const breakfastPreviews = useMemo(
    () => BREAKFAST_OPTIONS.map((_, i) => previewSlot(person, effectiveVariant, { ...selection, breakfastIdx: i }, 0)),
    [person, effectiveVariant, selection]
  )
  const lunchPreviews = useMemo(
    () => LUNCH_OPTIONS.map((_, i) => previewSlot(person, effectiveVariant, { ...selection, lunchIdx: i }, 1)),
    [person, effectiveVariant, selection]
  )
  const dinnerPreviews = useMemo(
    () => DINNER_OPTIONS.map((_, i) => previewSlot(person, effectiveVariant, { ...selection, dinnerIdx: i }, 3)),
    [person, effectiveVariant, selection]
  )

  const daysUntilTripCheck = clampedDay >= 25

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menú</h1>
        <p className="text-sm text-zinc-500">Día {clampedDay} de 30 · elige desayuno, almuerzo y cena - el resto se ajusta solo</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-zinc-900 p-1">
        {Object.entries(PEOPLE).map(([key, p]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPerson(key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
              person === key ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
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
        <div className="mb-3 flex items-center gap-2">
          <Utensils className="text-emerald-400" size={20} />
          <h2 className="font-semibold">Total del día vs. objetivo</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalStat label="Kcal" actual={totals.kcal} target={target.kcal} />
          <TotalStat label="Proteína" actual={totals.protein} target={target.protein} unit="g" />
          <TotalStat label="Grasa" actual={totals.fat} target={target.fat} unit="g" />
          <TotalStat label="Carbos" actual={totals.carbs} target={target.carbs} unit="g" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          La cena siempre absorbe lo que quede para que el total del día cuadre con el objetivo, sin importar qué combinación elijas.
        </p>
      </section>

      <MealSlot
        title="Desayuno"
        options={BREAKFAST_OPTIONS}
        previews={breakfastPreviews}
        selectedIdx={selection.breakfastIdx}
        onSelect={(i) => setSelection((s) => ({ ...s, breakfastIdx: i }))}
        topping={selection.breakfastTopping}
        onSelectTopping={(key) => setSelection((s) => ({ ...s, breakfastTopping: key }))}
      />
      <MealSlot
        title="Almuerzo"
        options={LUNCH_OPTIONS}
        previews={lunchPreviews}
        selectedIdx={selection.lunchIdx}
        onSelect={(i) => setSelection((s) => ({ ...s, lunchIdx: i }))}
        topping={selection.lunchTopping}
        onSelectTopping={(key) => setSelection((s) => ({ ...s, lunchTopping: key }))}
      />

      <MealCard meal={meals[2]} />

      <MealSlot
        title="Cena"
        options={DINNER_OPTIONS}
        previews={dinnerPreviews}
        selectedIdx={selection.dinnerIdx}
        onSelect={(i) => setSelection((s) => ({ ...s, dinnerIdx: i }))}
        topping={selection.dinnerTopping}
        onSelectTopping={(key) => setSelection((s) => ({ ...s, dinnerTopping: key }))}
        footnote="La cena se ajusta automáticamente a lo que quede del día - por eso no siempre pesa igual."
      />

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

/** Recomputes the whole adaptive day for a hypothetical selection and returns
 * just the requested meal index's totals - used to preview what each of the 3
 * cards in a slot would look like without actually changing the current pick. */
function previewSlot(person, variant, hypotheticalSelection, mealIndex) {
  const meals = buildAdaptiveDay(person, variant, hypotheticalSelection, HELPERS)
  if (!meals) return { items: [], totals: { kcal: 0, protein: 0, fat: 0, carbs: 0 } }
  const meal = meals[mealIndex]
  return { items: meal.items, totals: round(computeTotals(meal.items)) }
}

function MealSlot({ title, options, previews, selectedIdx, onSelect, topping, onSelectTopping, footnote }) {
  const gridCols = options.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-emerald-300">{title}</h2>
      <div className={`grid gap-3 ${gridCols}`}>
        {options.map((opt, i) => {
          const preview = previews[i]
          const active = selectedIdx === i
          return (
            <div
              key={opt.label}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                active
                  ? 'border-emerald-500 bg-emerald-600/10 ring-1 ring-emerald-500/50'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
              }`}
            >
              <button type="button" onClick={() => onSelect(i)} className="flex w-full flex-col items-start text-left">
                <div className="mb-1 flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-100">{opt.label}</span>
                  {active && <Check size={16} className="shrink-0 text-emerald-400" />}
                </div>
                <p className="mb-2 text-xs text-zinc-500">{opt.note}</p>
                <ul className="mb-2 space-y-0.5 text-xs text-zinc-400">
                  {preview.items.map((item, j) => (
                    <li key={j} className="flex justify-between gap-2">
                      <span>{FOODS[item.food]?.label ?? item.food}</span>
                      <span className="text-zinc-500">{item.grams} g</span>
                    </li>
                  ))}
                </ul>
                <div className="flex w-full flex-wrap gap-2 text-[11px] text-zinc-500">
                  <span className="font-mono text-emerald-400">{preview.totals.kcal} kcal</span>
                  <span>P {preview.totals.protein}g</span>
                  <span>G {preview.totals.fat}g</span>
                  <span>C {preview.totals.carbs}g</span>
                </div>
              </button>

              {active && opt.toppingOptions && (
                <div className="mt-3 w-full border-t border-zinc-800 pt-2">
                  <p className="mb-1 text-[11px] text-zinc-600">Acompañamiento:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.toppingOptions.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => onSelectTopping(t.key)}
                        className={`rounded-full border px-2 py-0.5 text-xs transition ${
                          topping === t.key
                            ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {footnote && <p className="text-xs text-zinc-600">{footnote}</p>}
    </section>
  )
}

function MealCard({ meal }) {
  if (!meal) return null
  const mealTotals = round(computeTotals(meal.items))
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
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
