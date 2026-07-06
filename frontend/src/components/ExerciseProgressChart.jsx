import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { epley1RM } from '../lib/workoutUtils'

export default function ExerciseProgressChart({ sessions = [], exerciseName }) {
  const data = sessions
    .map((session) => {
      const sets = session.workout_sets?.filter((s) => s.exercise_name === exerciseName) ?? []
      if (!sets.length) return null
      let bestRm = 0
      let bestWeight = 0
      let bestReps = 0
      for (const s of sets) {
        const rm = epley1RM(Number(s.weight_kg), Number(s.reps))
        if (rm != null && rm > bestRm) {
          bestRm = rm
          bestWeight = Number(s.weight_kg)
          bestReps = Number(s.reps)
        }
      }
      if (!bestRm) return null
      return {
        date: session.session_date,
        label: format(parseISO(session.session_date), 'MMM d'),
        e1rm: bestRm,
        topSet: `${bestWeight}×${bestReps}`,
        volume: sets.reduce((sum, s) => sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0), 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!data.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-sm text-zinc-500">
        No logged sets for {exerciseName || 'this exercise'} yet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-300">
        {exerciseName} — Est. 1RM progression
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
          <YAxis stroke="#71717a" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            formatter={(value, name) => [name === 'e1rm' ? `${value} kg` : value, name === 'e1rm' ? 'Est. 1RM' : name]}
          />
          <Line type="monotone" dataKey="e1rm" stroke="#34d399" dot={{ r: 3, fill: '#34d399' }} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
