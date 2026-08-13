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
  fetchActiveSessionForDate,
  TRAINING_CYCLE,
} from '../lib/schedule'

const WORKOUT_STORAGE_KEY = 'fitness-workout-params'

function readStoredWorkoutParams() {
  try {
    const raw = sessionStorage.getItem(WORKOUT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredWorkoutParams(routine, date) {
  sessionStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify({ routine, date }))
}
import { DEFAULT_SCHEDULE } from '../data/routines'
import { getExerciseSetCount, parseTargetSets } from '../lib/workoutUtils'

export default function LogWorkout() {
  const { user, settings } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [lastSetsByKey, setLastSetsByKey] = useState({})
  const [lastSessionDate, setLastSessionDate] = useState(null)
  // Per-exercise equipment swap for today only (e.g. machine occupied) - doesn't
  // touch the routine template, just relabels this session's sets to the alternative.
  const [nameOverrides, setNameOverrides] = useState({})
  const [loading, setLoading] = useState(true)
  const [initLoading, setInitLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const sessionDateObj = parseISO(sessionDate)
  const calendarSuggestion = calendarRoutine ?? getWorkoutDayForDate(sessionDateObj, startDate, schedule)
  const weekNum = getWeekNumber(sessionDateObj, startDate)
  // Calendar only marks 'Gym'/'Rest' now (the specific routine auto-cycles), so the
  // only meaningful mismatch to flag is logging a real workout on a calendar rest day.
  const routineMismatch = selectedRoutine && calendarSuggestion === 'Rest'

  const persistWorkoutParams = (routine, date) => {
    writeStoredWorkoutParams(routine, date)
    setSearchParams({ routine, date }, { replace: true })
  }

  const handleDateChange = (date) => {
    setSessionDate(date)
    if (selectedRoutine) persistWorkoutParams(selectedRoutine, date)
  }

  const handleRoutineChange = (routine) => {
    setSelectedRoutine(routine)
    persistWorkoutParams(routine, sessionDate)
  }

  useEffect(() => {
    if (!user) {
      setInitLoading(false)
      return
    }
    const init = async () => {
      setInitLoading(true)
      const stored = readStoredWorkoutParams()
      const date = urlDate || stored?.date || todayISO
      const cal = getWorkoutDayForDate(date, startDate, schedule)
      setCalendarRoutine(cal)
      setSessionDate(date)

      let routine = urlRoutine || stored?.routine
      if (!routine) {
        const active = await fetchActiveSessionForDate(supabase, user.id, date)
        if (active?.routine_name) {
          routine = active.routine_name
        } else {
          const last = await fetchLastWorkoutSession(supabase, user.id)
          routine = suggestRoutine(cal, last?.routine_name)
        }
      }

      setSelectedRoutine(routine)
      if (routine && date && (routine !== urlRoutine || date !== urlDate)) {
        persistWorkoutParams(routine, date)
      } else if (routine && date) {
        writeStoredWorkoutParams(routine, date)
      }
      setInitLoading(false)
    }
    init()
  }, [user, startDate, schedule, urlRoutine, urlDate])

  useEffect(() => {
    if (!user || !selectedRoutine || initLoading) return
    loadWorkout()
  }, [user, selectedRoutine, sessionDate, initLoading])

  const loadWorkout = async () => {
    setLoading(true)
    setNameOverrides({})
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

    // Pull the most recent previous session of this same routine (any date before
    // this one) so we can show/prefill "what you lifted last time" per exercise -
    // that's the number you actually want in front of you at the gym.
    const { data: priorSessions } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .eq('routine_name', selectedRoutine)
      .lt('session_date', sessionDate)
      .order('session_date', { ascending: false })
      .limit(5)

    const priorWithSets = (priorSessions ?? []).find((s) => (s.workout_sets?.length ?? 0) > 0)
    const lastByKey = {}
    priorWithSets?.workout_sets?.forEach((s) => {
      lastByKey[`${s.exercise_name}-${s.set_number}`] = { weight_kg: s.weight_kg, reps: s.reps, rir: s.rir }
    })
    setLastSetsByKey(lastByKey)
    setLastSessionDate(priorWithSets?.session_date ?? null)

    const initial = {}
    const counts = {}
    const restoredOverrides = {}
    routineData?.routine_exercises?.forEach((ex) => {
      const existing = (sessionData?.workout_sets ?? []).filter((s) => s.exercise_id === ex.id || s.exercise_name === ex.name)
      // If an earlier save today used an alternative name (equipment swap), keep using it.
      const savedAltName = existing.find((s) => s.exercise_name && s.exercise_name !== ex.name)?.exercise_name
      const activeName = savedAltName || ex.name
      if (savedAltName) restoredOverrides[ex.id] = savedAltName
      const setCount = getExerciseSetCount(ex.target_sets, existing)
      counts[ex.id] = setCount
      for (let i = 1; i <= setCount; i++) {
        const key = `${ex.id}-${i}`
        const found = existing.find((s) => s.set_number === i)
        const last = lastByKey[`${ex.name}-${i}`]
        initial[key] = {
          exercise_id: ex.id,
          exercise_name: activeName,
          set_number: i,
          weight_kg: found?.weight_kg ?? last?.weight_kg ?? '',
          reps: found?.reps ?? last?.reps ?? '',
          rir: found?.rir ?? '',
          id: found?.id,
        }
      }
    })
    setSets(initial)
    setExerciseSetCounts(counts)
    setNameOverrides(restoredOverrides)
    setLoading(false)
  }

  const updateSet = (key, field, value) => {
    setSets((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const getActiveName = (ex) => nameOverrides[ex.id] || ex.name

  const setAlternative = (ex, chosenName) => {
    const newName = chosenName === ex.name ? ex.name : chosenName
    setNameOverrides((prev) => {
      const next = { ...prev }
      if (newName === ex.name) delete next[ex.id]
      else next[ex.id] = newName
      return next
    })
    setSets((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((key) => {
        if (next[key].exercise_id === ex.id) {
          next[key] = { ...next[key], exercise_name: newName }
        }
      })
      return next
    })
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
        exercise_name: getActiveName(ex),
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
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Routine</span>
            <select
              value={selectedRoutine}
              onChange={(e) => handleRoutineChange(e.target.value)}
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
    <div className="space-y-6 pb-28 md:pb-24">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Date</span>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">Routine</span>
            <select
              value={selectedRoutine}
              onChange={(e) => handleRoutineChange(e.target.value)}
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
            This is a calendar rest day - logging here is an optional make-up session.
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
            const lastSetsForEx = Array.from({ length: visibleCount }, (_, i) => lastSetsByKey[`${ex.name}-${i + 1}`]).filter(Boolean)

            return (
              <section key={ex.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="mb-3">
                  <h2 className="font-semibold">
                    {getActiveName(ex)}
                    {nameOverrides[ex.id] && <span className="ml-2 text-xs font-normal text-amber-400/80">(alt. de {ex.name})</span>}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {ex.target_sets} sets · {ex.rep_range} · {ex.primary_muscle}
                  </p>
                  {ex.notes && <p className="mt-1 text-xs text-zinc-600">{ex.notes}</p>}
                  {ex.alternatives?.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-600">¿Máquina ocupada?</span>
                      <select
                        value={getActiveName(ex)}
                        onChange={(e) => setAlternative(ex, e.target.value)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                      >
                        <option value={ex.name}>{ex.name} (por defecto)</option>
                        {ex.alternatives.map((alt) => (
                          <option key={alt} value={alt}>{alt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {lastSetsForEx.length > 0 && lastSessionDate && (
                    <p className="mt-1.5 text-xs text-zinc-600">
                      Comparado con la sesión del {format(parseISO(lastSessionDate), 'MMM d')} (columna &quot;Última vez&quot;)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-1.5 text-[11px] text-zinc-600 sm:gap-2">
                    <span></span>
                    <span>Kg</span>
                    <span>Reps</span>
                    <span>RIR</span>
                    <span>Última vez</span>
                  </div>
                  {Array.from({ length: visibleCount }, (_, i) => i + 1).map((setNum) => {
                    const key = `${ex.id}-${setNum}`
                    const s = sets[key] ?? {}
                    const last = lastSetsByKey[`${ex.name}-${setNum}`]
                    return (
                      <div key={key} className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={last ? `${last.weight_kg ?? '—'}×${last.reps ?? '—'}${last.rir != null ? ` @${last.rir}` : ''}` : '—'}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-500 outline-none"
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
        </>
      )}

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          {message && <p className="w-full text-sm text-emerald-400">{message}</p>}
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => saveWorkout(false)}
            className="flex-1 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 sm:flex-none"
          >
            Save progress
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={() => saveWorkout(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 sm:flex-none"
          >
            <Check size={16} />
            Complete workout
          </button>
        </div>
      </div>
    </div>
  )
}
