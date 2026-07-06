import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BodyCompositionChart from '../components/BodyCompositionChart'
import ExerciseProgressChart from '../components/ExerciseProgressChart'

export default function Progress() {
  const { user } = useAuth()
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-zinc-500">Body composition trends and exercise progression</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Body composition</h2>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <BodyCompositionChart checkins={checkins} measurements={measurements} />
        )}
      </section>

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
