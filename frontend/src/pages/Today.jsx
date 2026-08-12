import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Dumbbell, Activity, Moon, Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getWorkoutDayForDate,
  getWeekNumber,
  formatDateISO,
  suggestRoutine,
  getNextRoutineInCycle,
  fetchLastWorkoutSession,
  TRAINING_CYCLE,
} from '../lib/schedule'
import { DEFAULT_SCHEDULE } from '../data/routines'

export default function Today() {
  const { user, settings } = useAuth()
  const today = new Date()
  const todayISO = formatDateISO(today)
  const schedule = settings?.schedule ?? DEFAULT_SCHEDULE
  const startDate = settings?.start_date ?? '2026-06-01'
  const calendarWorkout = getWorkoutDayForDate(today, startDate, schedule)
  const weekNum = getWeekNumber(today, startDate)

  const [checkin, setCheckin] = useState(null)
  const [swimming, setSwimming] = useState(null)
  const [session, setSession] = useState(null)
  const [lastWorkout, setLastWorkout] = useState(null)
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [loading, setLoading] = useState(true)

  const upNext = getNextRoutineInCycle(lastWorkout?.routine_name)
  const workoutLink = `/workout?routine=${encodeURIComponent(selectedRoutine ?? '')}&date=${todayISO}`

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const last = await fetchLastWorkoutSession(supabase, user.id)
      setLastWorkout(last)
      const suggested = suggestRoutine(calendarWorkout, last?.routine_name)
      setSelectedRoutine((prev) => prev ?? suggested)

      // On true rest days, cardio is keyed to "Rest" (optional). On gym days it's
      // keyed to the actual cycling routine, not the generic "Gym" calendar marker.
      const cardioKey = calendarWorkout === 'Rest' ? 'Rest' : suggested
      const [checkinRes, swimRes] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', todayISO).maybeSingle(),
        supabase.from('swimming_plans').select('*').eq('user_id', user.id).eq('workout_day', cardioKey).maybeSingle(),
      ])
      setCheckin(checkinRes.data)
      setSwimming(swimRes.data)
      setLoading(false)
    }
    load()
  }, [user, todayISO, calendarWorkout])

  useEffect(() => {
    if (!user || !selectedRoutine) return
    const loadSession = async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*)')
        .eq('user_id', user.id)
        .eq('session_date', todayISO)
        .eq('routine_name', selectedRoutine)
        .maybeSingle()
      setSession(data)
    }
    loadSession()
  }, [user, todayISO, selectedRoutine])

  const calorieTarget = settings?.calorie_target ?? 1750

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Week {weekNum} · {calendarWorkout === 'Rest' ? 'Rest' : (selectedRoutine ?? 'Gym day')}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Calorie target" value={`${calorieTarget} kcal`} accent />
        <StatCard label="Weight" value={checkin?.weight_kg ? `${checkin.weight_kg} kg` : '—'} />
        <StatCard label="Body fat" value={checkin?.body_fat_pct ? `${checkin.body_fat_pct}%` : '—'} />
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="text-emerald-400" size={20} />
            <h2 className="font-semibold">Workout</h2>
          </div>
          {selectedRoutine && (
            <Link to={workoutLink} className="flex items-center gap-1 text-sm text-emerald-400 hover:underline">
              {session ? 'Continue' : 'Start'} <ChevronRight size={16} />
            </Link>
          )}
        </div>

        <div className="mb-4 grid gap-2 text-sm">
          <Row
            label="Last completed"
            value={
              lastWorkout
                ? `${lastWorkout.routine_name} · ${format(parseISO(lastWorkout.session_date), 'MMM d')}`
                : '—'
            }
          />
          <Row label="Up next in cycle" value={upNext} />
          <Row label="Calendar" value={calendarWorkout === 'Rest' ? 'Rest day' : 'Gym day'} />
        </div>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Routine to log today</span>
          <select
            value={selectedRoutine ?? ''}
            onChange={(e) => setSelectedRoutine(e.target.value)}
            disabled={loading}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {TRAINING_CYCLE.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {selectedRoutine && (
          <>
            <p className="text-lg font-medium text-emerald-300">{selectedRoutine}</p>
            {session && (
              <p className="mt-1 text-sm text-zinc-500">
                {session.workout_sets?.length ?? 0} sets logged
                {session.completed_at && ' · Completed'}
              </p>
            )}
            {calendarWorkout === 'Rest' && (
              <p className="mt-2 text-xs text-amber-400/80">
                Hoy es día de descanso en el calendario - esto es una sesión de reposición opcional.
              </p>
            )}
          </>
        )}
      </section>

      {swimming && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="text-sky-400" size={20} />
            <h2 className="font-semibold">Cardio (A/C gym)</h2>
          </div>
          <div className="grid gap-2 text-sm">
            <Row label="Duration" value={`${swimming.minutes} min`} />
            <Row label="Intensity" value={swimming.intensity} />
            <Row label="Structure" value={swimming.structure} />
          </div>
          {checkin?.swimming_completed && (
            <span className="mt-3 inline-block rounded-full bg-emerald-600/20 px-3 py-1 text-xs text-emerald-400">
              Cardio done today
            </span>
          )}
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Daily check-in</h2>
          <Link to="/checkin" className="text-sm text-emerald-400 hover:underline">
            {checkin ? 'Edit' : 'Log now'}
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : checkin ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat icon={Moon} label="Sleep" value={checkin.sleep} />
            <MiniStat icon={Zap} label="Energy" value={checkin.energy} />
            <MiniStat label="Hunger" value={checkin.hunger} />
            <MiniStat label="Steps" value={checkin.steps?.toLocaleString() ?? '—'} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No check-in logged for today yet.</p>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-900/50'}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? 'text-emerald-400' : ''}`}>{value}</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-zinc-500">{label}:</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-zinc-800/50 p-3">
      <div className="flex items-center gap-1 text-xs text-zinc-500">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <p className="mt-1 font-mono text-lg">{value ?? '—'}</p>
    </div>
  )
}
