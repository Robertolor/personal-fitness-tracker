import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { DEFAULT_SCHEDULE, TRAINING_CYCLE } from '../data/routines'

export { TRAINING_CYCLE }

/**
 * Returns workout name for a date (e.g. "Push A", "Rest").
 * schedule: array indexed by JS day-of-week (0=Sun … 6=Sat).
 */
export function getWorkoutDayForDate(date, startDate, schedule = DEFAULT_SCHEDULE) {
  const d = startOfDay(typeof date === 'string' ? parseISO(date) : date)
  const dayIndex = d.getDay()
  return schedule[dayIndex] ?? 'Rest'
}

/**
 * 1-indexed training week number from program start date.
 */
export function getWeekNumber(date, startDate) {
  const d = startOfDay(typeof date === 'string' ? parseISO(date) : date)
  const start = startOfDay(typeof startDate === 'string' ? parseISO(startDate) : startDate)
  const days = differenceInCalendarDays(d, start)
  if (days < 0) return 1
  return Math.floor(days / 7) + 1
}

export function formatDateISO(date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isRestDay(workoutName) {
  return workoutName === 'Rest'
}

export function getNextRoutineInCycle(lastRoutineName) {
  if (!lastRoutineName) return TRAINING_CYCLE[0]
  const idx = TRAINING_CYCLE.indexOf(lastRoutineName)
  if (idx === -1) return TRAINING_CYCLE[0]
  return TRAINING_CYCLE[(idx + 1) % TRAINING_CYCLE.length]
}

/**
 * Suggest a routine: calendar training day when available, otherwise next in cycle.
 */
export function suggestRoutine(calendarRoutine, lastRoutineName) {
  if (calendarRoutine && calendarRoutine !== 'Rest' && TRAINING_CYCLE.includes(calendarRoutine)) {
    return calendarRoutine
  }
  return getNextRoutineInCycle(lastRoutineName)
}

/**
 * Most recent session that has logged sets or was marked complete.
 */
export async function fetchLastWorkoutSession(supabase, userId) {
  const { data } = await supabase
    .from('workout_sessions')
    .select('*, workout_sets(*)')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(30)

  if (!data?.length) return null
  return data.find((s) => s.completed_at || (s.workout_sets?.length ?? 0) > 0) ?? null
}
