import { useEffect, useState, useMemo } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BodyCompositionChart from '../components/BodyCompositionChart'
import ExerciseProgressChart from '../components/ExerciseProgressChart'
import { rollingAverage, rateOfChange, projectToDate, paceStatus, weeklyAdherenceCorrelation } from '../lib/bodyComp'

export default function Progress() {
  const { user, settings } = useAuth()
  const [checkins, setCheckins] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [sessions, setSessions] = useState([])
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const [cRes, mRes, sRes] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('checkin_date'),
        supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_date'),
        supabase.from('workout_sessions').select('*, workout_sets(*)').eq('user_id', user.id).order('session_date'),
      ])
      setCheckins(cRes.data ?? [])
      setMeasurements(mRes.data ?? [])
      setSessions(sRes.data ?? [])

      const names = new Set()
      ;(sRes.data ?? []).forEach((s) => s.workout_sets?.forEach((set) => names.add(set.exercise_name)))
      const sorted = [...names].sort()
      setExercises(sorted)
      if (sorted.length && !selectedExercise) setSelectedExercise(sorted[0])
      setLoading(false)
    }
    load()
  }, [user])

  const weightAvgPoints = useMemo(
    () => rollingAverage(checkins.filter((c) => c.weight_kg != null).map((c) => ({ date: c.checkin_date, value: c.weight_kg }))),
    [checkins]
  )
  const waistAvgPoints = useMemo(
    () => rollingAverage(measurements.filter((m) => m.waist_cm != null).map((m) => ({ date: m.measured_date, value: m.waist_cm }))),
    [measurements]
  )
  const weightTrend = useMemo(() => rateOfChange(weightAvgPoints), [weightAvgPoints])
  const waistTrend = useMemo(() => rateOfChange(waistAvgPoints), [waistAvgPoints])
  const pace = paceStatus(weightTrend?.kgPerWeek)
  const tripDate = settings?.trip_date
  const daysToTrip = tripDate ? differenceInCalendarDays(parseISO(tripDate), new Date()) : null
  const projectedWeightAtTrip = tripDate ? projectToDate(weightAvgPoints, tripDate) : null
  const projectedWaistAtTrip = tripDate ? projectToDate(waistAvgPoints, tripDate) : null
  const adherenceCorrelation = useMemo(() => weeklyAdherenceCorrelation(checkins), [checkins])

  const paceCopy = {
    on_track: { text: 'En ritmo', color: 'text-emerald-400' },
    too_slow: { text: 'Ritmo lento - considera bajar calorías en el próximo checkpoint', color: 'text-amber-400' },
    too_fast: { text: 'Ritmo muy rápido - riesgo de perder músculo, considera subir un poco', color: 'text-amber-400' },
    unknown: { text: 'Datos insuficientes aún', color: 'text-zinc-500' },
  }[pace]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-zinc-500">Body composition trends and exercise progression</p>
      </div>

      {!loading && (weightTrend || tripDate) && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500">Ritmo (peso, promedio 7d)</p>
            <p className="mt-1 text-xl font-mono">
              {weightTrend ? `${weightTrend.kgPerWeek > 0 ? '+' : ''}${weightTrend.kgPerWeek} kg/sem` : '—'}
            </p>
            {paceCopy && <p className={`mt-1 text-xs ${paceCopy.color}`}>{paceCopy.text}</p>}
            {waistTrend && <p className="mt-2 text-xs text-zinc-500">Cintura: {waistTrend.kgPerWeek > 0 ? '+' : ''}{waistTrend.kgPerWeek} cm/sem</p>}
          </div>

          {tripDate && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Días para el viaje</p>
              <p className="mt-1 text-xl font-mono">{daysToTrip != null ? Math.max(0, daysToTrip) : '—'}</p>
              <p className="mt-1 text-xs text-zinc-500">{tripDate}</p>
            </div>
          )}

          {tripDate && (projectedWeightAtTrip != null || projectedWaistAtTrip != null) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Proyección al día del viaje</p>
              {projectedWeightAtTrip != null && <p className="mt-1 text-sm">Peso ≈ <span className="font-mono">{projectedWeightAtTrip} kg</span></p>}
              {projectedWaistAtTrip != null && <p className="mt-1 text-sm">Cintura ≈ <span className="font-mono">{projectedWaistAtTrip} cm</span></p>}
              <p className="mt-1 text-[11px] text-zinc-600">Basado en tu ritmo actual, no garantizado.</p>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Body composition</h2>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <BodyCompositionChart checkins={checkins} measurements={measurements} heightCm={settings?.height_cm ? Number(settings.height_cm) : null} />
        )}
      </section>

      {adherenceCorrelation.length > 1 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Adherencia vs. progreso semanal</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Semana</th>
                  <th className="px-4 py-2">Adherencia prom (1-5)</th>
                  <th className="px-4 py-2">Peso prom</th>
                  <th className="px-4 py-2">Cambio vs. semana anterior</th>
                </tr>
              </thead>
              <tbody>
                {adherenceCorrelation.map((w) => (
                  <tr key={w.week} className="border-t border-zinc-800">
                    <td className="px-4 py-2">Semana {w.week}</td>
                    <td className="px-4 py-2">{w.avgAdherence ?? '—'}</td>
                    <td className="px-4 py-2">{w.avgWeight ?? '—'} kg</td>
                    <td className="px-4 py-2">
                      {w.weightChange != null ? (
                        <span className={w.weightChange < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {w.weightChange > 0 ? '+' : ''}{w.weightChange} kg
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Si ves semanas de baja adherencia junto a estancamientos, ahí está la palanca más fácil de mover - antes que tocar calorías de nuevo.</p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Exercise progression</h2>
        {exercises.length > 0 && (
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="mb-4 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500 sm:w-auto"
          >
            {exercises.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
        <ExerciseProgressChart sessions={sessions} exerciseName={selectedExercise} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent measurements</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Waist</th>
                <th className="px-4 py-2">Chest</th>
                <th className="px-4 py-2">Arms</th>
                <th className="px-4 py-2">Thighs</th>
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().slice(0, 10).map((m) => (
                <tr key={m.id} className="border-t border-zinc-800">
                  <td className="px-4 py-2">{m.measured_date}</td>
                  <td className="px-4 py-2">{m.waist_cm ?? '—'} cm</td>
                  <td className="px-4 py-2">{m.chest_cm ?? '—'} cm</td>
                  <td className="px-4 py-2">
                    {m.left_arm_cm ?? '—'} / {m.right_arm_cm ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    {m.left_thigh_cm ?? '—'} / {m.right_thigh_cm ?? '—'}
                  </td>
                </tr>
              ))}
              {!measurements.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No measurements logged yet. Add them in Check-in.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
