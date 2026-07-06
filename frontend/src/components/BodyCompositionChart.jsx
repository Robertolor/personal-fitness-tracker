import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

const OVERLAYS = [
  { key: 'weight', label: 'Weight (kg)', color: '#34d399', dataKey: 'weight_kg' },
  { key: 'bf', label: 'Body Fat %', color: '#60a5fa', dataKey: 'body_fat_pct' },
  { key: 'waist', label: 'Waist (cm)', color: '#f472b6', dataKey: 'waist_cm' },
]

export default function BodyCompositionChart({ checkins = [], measurements = [] }) {
  const [visible, setVisible] = useState({ weight: true, bf: true, waist: true })

  const merged = {}
  checkins.forEach((c) => {
    const d = c.checkin_date
    merged[d] = { ...merged[d], date: d, weight_kg: c.weight_kg, body_fat_pct: c.body_fat_pct }
  })
  measurements.forEach((m) => {
    const d = m.measured_date
    merged[d] = { ...merged[d], date: d, waist_cm: m.waist_cm }
  })

  const data = Object.values(merged)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      ...row,
      label: format(parseISO(row.date), 'MMM d'),
    }))

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }))

  if (!data.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
        No body composition data yet. Log check-ins and measurements to see trends.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {OVERLAYS.map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              visible[key]
                ? 'ring-2 ring-offset-1 ring-offset-zinc-900'
                : 'opacity-40'
            }`}
            style={{ backgroundColor: `${color}22`, color, ringColor: color }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" stroke="#71717a" tick={{ fontSize: 11 }} />
          <YAxis stroke="#71717a" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Legend />
          {visible.weight && (
            <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#34d399" dot={false} strokeWidth={2} connectNulls />
          )}
          {visible.bf && (
            <Line type="monotone" dataKey="body_fat_pct" name="Body Fat %" stroke="#60a5fa" dot={false} strokeWidth={2} connectNulls />
          )}
          {visible.waist && (
            <Line type="monotone" dataKey="waist_cm" name="Waist (cm)" stroke="#f472b6" dot={false} strokeWidth={2} connectNulls />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
