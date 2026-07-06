import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Check, Loader2, Minus, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getWorkoutDayForDate,
  getWeekNumber,
  formatDateISO,
  suggestRoutine,
  fetchLastWorkoutSession,
  TRAINING_CYCLE,
} from '../lib/schedule'
import { DEFAULT_SCHEDULE } from '../data/routines'
import { getExerciseSetCount, parseTargetSets } from '../lib/workoutUtils'

export default function LogWorkout() {
  const { user, settings } = useAuth()
  const [searchParams] = useSearchParams()
  const schedule = settings?.schedule ?? DEFAULT_SCHEDULE
  const startDate = settings?.start_date ?? '2026-06-01'

  const todayISO = formatDateISO(new Date())
  const urlRoutine = searchParams.get('routine')
  const urlDate = searchParams.get('date')

  const [selectedRoutine, setSelectedRoutine] = useState(urlRoutine || null)
  const [sessionDate, setSessionDate] = useState(urlDate || todayISO)
  const [calendarRoutine, setCalendarRoutine] = useState(null)
  const [routine, setRoutine] = useState(null)
  const [session, setSession] = useState(null)
  const [sets, setSets] = useState({})
  const [exerciseSetCounts, setExerciseSetCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [initLoading, setInitLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const sessionDateObj = parseISO(sessionDate)
  const calendarSuggestion = calendarRoutine ?? getWorkoutDayForDate(sessionDateObj, startDate, schedule)
  const weekNum = getWeekNumber(sessionDateObj, startDate)
  const routineMismatch = selectedRoutine && selectedRoutine !== calendarSuggestion

  useEffect(() => {
    if (!user) {
      setInitLoading(false)
      return
    }
    const init = async () => {
      setInitLoading(true)
      const cal = getWorkoutDayForDate(sessionDate, startDate, schedule)
      setCalendarRoutine(cal)
      if (!urlRoutine) {
        const last = await fetchLastWorkoutSession(supabase, user.id)
        setSelectedRoutine(suggestRoutine(cal, last?.routine_name))
      } else {
        setSelectedRoutine(urlRoutine)
      }
      setInitLoading(false)
    }
    init()
  }, [user, startDate, schedule, urlRoutine, sessionDate])

  useEffect(() => {
    if (!user || !selectedRoutine || initLoading) return
    loadWorkout()
  }, [user, selectedRoutine, sessionDate, initLoading])

  const loadWorkout = async () => {
    setLoading(true)
    const { data: routineData } = await supabase
      .from('routine_templates')
      .select('*, routine_exercises(*)')
      .eq('user_id', user.id)
      .eq('name', selectedRoutine)
      .maybeSingle()

    setRoutine(routineData)

    const { data: sessionData } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .eq('session_date', sessionDate)
      .eq('routine_name', selectedRoutine)
      .maybeSingle()

    setSession(sessionData)

    const initial = {}
    const counts = {}
    routineData?.routine_exercises?.forEach((ex) => {
      const existing = (sessionData?.workout_sets ?? []).filter((s) => s.exercise_id === ex.id || s.exercise_name === ex.name)
      const setCount = getExerciseSetCount(ex.target_sets, existing)
      counts[ex.id] = setCount
      for (let i = 1; i <= setCount; i++) {
        const key = `${ex.id}-${i}`
        const found = existing.find((s) => s.set_number === i)
        initial[key] = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          set_number: i,
          weight_kg: found?.weight_kg ?? '',
          reps: found?.reps ?? '',
          rir: found?.rir ?? '',
          id: found?.id,
        }
      }
    })
    setSets(initial)
    setExerciseSetCounts(counts)
    setLoading(false)
  }

  const updateSet = (key, field, value) => {
    setSets((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const addSet = (ex) => {
    const current = exerciseSetCounts[ex.id] ?? parseTargetSets(ex.target_sets)
    const nextNum = current + 1
    const key = `${ex.id}-${nextNum}`
    setExerciseSetCounts((prev) => ({ ...prev, [ex.id]: nextNum }))
    setSets((prev) => ({
      ...prev,
      [key]: {
        exercise_id: ex.id,
        exercise_name: ex.name,
        set_number: nextNum,
        weight_kg: '',
        reps: '',
        rir: '',
      },
    }))
  }

  const removeLastSet = async (ex) => {
    const templateMin = parseTargetSets(ex.target_sets)
    const current = exerciseSetCounts[ex.id] ?? templateMin
    if (current <= 1) return

    const lastKey = `${ex.id}-${current}`
    const lastSet = sets[lastKey]
    const lastIsEmpty = !lastSet?.weight_kg && !lastSet?.reps
    const canRemove = current > templateMin || lastIsEmpty
    if (!canRemove) return

    if (lastSet?.id) {
      const { error } = await supabase.from('workout_sets').delete().eq('id', lastSet.id)
      if (error) {
        setMessage(error.message ?? 'Failed to remove set')
        return
      }
    }

    setSets((prev) => {
      const next = { ...prev }
      delete next[lastKey]
      return next
    })
    setExerciseSetCounts((prev) => ({ ...prev, [ex.id]: current - 1 }))
  }

  const saveWorkout = async (markComplete = false) => {
    if (!user || !routine || !selectedRoutine) return
    setSaving(true)
    setMessage('')

    try {
      let sessionId = session?.id
      if (!sessionId) {
        const { data: newSession, error } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: user.id,
            routine_id: routine.id,
            routine_name: selectedRoutine,
            session_date: sessionDate,
            week_number: weekNum,
            completed_at: markComplete ? new Date().toISOString() : null,
          })
          .select('id')
          .single()
        if (error) throw error
        sessionId = newSession.id
      } else if (markComplete) {
        await supabase
          .from('workout_sessions')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', sessionId)
      }

      const toUpsert = Object.values(sets).filter((s) => s.weight_kg || s.reps)
      for (const s of toUpsert) {
        const row = {
          session_id: sessionId,
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name,
          set_number: s.set_number,
          weight_kg: s.weight_kg ? Number(s.weight_kg) : null,
          reps: s.reps ? Number(s.reps) : null,
          rir: s.rir !== '' && s.rir != null ? Number(s.rir) : null,
        }
        if (s.id) {
          await supabase.from('workout_sets').update(row).eq('id', s.id)
        } else {
          await supabase.from('workout_sets').insert(row)
        }
      }

      await supabase.from('daily_checkins').upsert(
        { user_id: user.id, checkin_date: sessionDate, workout_completed: markComplete },
        { onConflict: 'user_id,checkin_date' }
      )

      setMessage(markComplete ? 'Workout completed!' : 'Progress saved.')
      await loadWorkout()
    } catch (err) {
      setMessage(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (initLoading || (loading && !routine)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  if (!selectedRoutine) {
    return (
      <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
        Select a routine to log your workout.
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Date</span>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Routine</span>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              {TRAINING_CYCLE.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
          Routine &quot;{selectedRoutine}&quot; not found. Check Settings or re-login to seed routines.
        </div>
      </div>
    )
  }

  const exercises = [...(routine.routine_exercises ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Date</span>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Routine</span>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              {TRAINING_CYCLE.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-sm text-zinc-500">
          {format(sessionDateObj, 'EEEE, MMM d')} · Week {weekNum}
        </p>
        <h1 className="text-2xl font-bold">{selectedRoutine}</h1>
        {routineMismatch && (
          <p className="text-sm text-amber-400/90">
            Calendar suggests {calendarSuggestion} for this date — you can log any routine.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : (
        <>
          {exercises.map((ex) => {
            const templateMin = parseTargetSets(ex.target_sets)
            const visibleCount = exerciseSetCounts[ex.id] ?? templateMin
            const lastKey = `${ex.id}-${visibleCount}`
            const lastSet = sets[lastKey] ?? {}
            const lastIsEmpty = !lastSet.weight_kg && !lastSet.reps
            const canRemoveLast = visibleCount > 1 && (visibleCount > templateMin || lastIsEmpty)

            return (
              <section key={ex.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="mb-3">
                  <h2 className="font-semibold">{ex.name}</h2>
                  <p className="text-xs text-zinc-500">
                    {ex.target_sets} sets · {ex.rep_range} · {ex.primary_muscle}
                  </p>
                  {ex.notes && <p className="mt-1 text-xs text-zinc-600">{ex.notes}</p>}
                </div>
                <div className="space-y-2">
                  {Array.from({ length: visibleCount }, (_, i) => i + 1).map((setNum) => {
                    const key = `${ex.id}-${setNum}`
                    const s = sets[key] ?? {}
                    return (
                      <div key={key} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        <span className="flex items-center text-xs text-zinc-500">Set {setNum}</span>
                        <input
                          type="number"
                          placeholder="kg"
                          value={s.weight_kg ?? ''}
                          onChange={(e) => updateSet(key, 'weight_kg', e.target.value)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="reps"
                          value={s.reps ?? ''}
                          onChange={(e) => updateSet(key, 'reps', e.target.value)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          step="0.5"
                          placeholder="RIR"
                          value={s.rir ?? ''}
                          onChange={(e) => updateSet(key, 'rir', e.target.value)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addSet(ex)}
                    className="flex items-center gap-1 rounded-lg border border-emerald-600/50 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/10"
                  >
                    <Plus size={14} />
                    Add set
                  </button>
                  {canRemoveLast && (
                    <button
                      type="button"
                      onClick={() => removeLastSet(ex)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                    >
                      <Minus size={14} />
                      Remove last set
                    </button>
                  )}
                </div>
              </section>
            )
          })}

          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <div className="flex flex-wrap gap-3 pb-8">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveWorkout(false)}
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              Save progress
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveWorkout(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              <Check size={16} />
              Complete workout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
