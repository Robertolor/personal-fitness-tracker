import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DEFAULT_SCHEDULE } from '../data/routines'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WORKOUT_OPTIONS = ['Rest', 'Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B']

export default function Settings() {
  const { user, settings, refreshSettings } = useAuth()
  const [form, setForm] = useState({
    start_date: '2026-06-01',
    calorie_target: 1750,
    protein_target_g: 180,
    fat_target_g: 65,
    carb_target_g: 225,
    body_weight_start_kg: 80,
    goal_body_fat_pct: 0.15,
    schedule: [...DEFAULT_SCHEDULE],
  })
  const [swimming, setSwimming] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setForm({
        start_date: settings.start_date ?? '2026-06-01',
        calorie_target: settings.calorie_target ?? 1750,
        protein_target_g: settings.protein_target_g ?? 180,
        fat_target_g: settings.fat_target_g ?? 65,
        carb_target_g: settings.carb_target_g ?? 225,
        body_weight_start_kg: settings.body_weight_start_kg ?? 80,
        goal_body_fat_pct: settings.goal_body_fat_pct ?? 0.15,
        schedule: settings.schedule ?? [...DEFAULT_SCHEDULE],
      })
    }
  }, [settings])

  useEffect(() => {
    if (!user) return
    supabase.from('swimming_plans').select('*').eq('user_id', user.id).then(({ data }) => {
      setSwimming(data ?? [])
    })
  }, [user])

  const updateSchedule = (dayIndex, value) => {
    const next = [...form.schedule]
    next[dayIndex] = value
    setForm({ ...form, schedule: next })
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        ...form,
        goal_body_fat_pct: Number(form.goal_body_fat_pct),
        body_weight_start_kg: Number(form.body_weight_start_kg),
      })
      if (error) throw error
      await refreshSettings()
      setMessage('Settings saved.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveSwimming = async (plan) => {
    const { error } = await supabase.from('swimming_plans').update({
      goal: plan.goal,
      minutes: plan.minutes,
      style_mix: plan.style_mix,
      intensity: plan.intensity,
      structure: plan.structure,
      recovery_concern: plan.recovery_concern,
    }).eq('id', plan.id)
    if (!error) setMessage(`Swimming plan for ${plan.workout_day} updated.`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500">All targets and schedule are editable</p>
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="font-semibold">Nutrition & goals</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Start date" type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
          <Input label="Calorie target" type="number" value={form.calorie_target} onChange={(v) => setForm({ ...form, calorie_target: Number(v) })} />
          <Input label="Protein (g)" type="number" value={form.protein_target_g} onChange={(v) => setForm({ ...form, protein_target_g: Number(v) })} />
          <Input label="Fat (g)" type="number" value={form.fat_target_g} onChange={(v) => setForm({ ...form, fat_target_g: Number(v) })} />
          <Input label="Carbs (g)" type="number" value={form.carb_target_g} onChange={(v) => setForm({ ...form, carb_target_g: Number(v) })} />
          <Input label="Starting weight (kg)" type="number" step="0.1" value={form.body_weight_start_kg} onChange={(v) => setForm({ ...form, body_weight_start_kg: v })} />
          <Input label="Goal body fat (decimal)" type="number" step="0.01" value={form.goal_body_fat_pct} onChange={(v) => setForm({ ...form, goal_body_fat_pct: v })} />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="font-semibold">Weekly schedule</h2>
        <p className="text-xs text-zinc-500">Sunday = Rest by default. Program starts 2026-06-01 (Monday = Push A).</p>
        {DAYS.map((day, i) => (
          <div key={day} className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-400">{day}</span>
            <select
              value={form.schedule[i] ?? 'Rest'}
              onChange={(e) => updateSchedule(i, e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm"
            >
              {WORKOUT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="font-semibold">Swimming plans</h2>
        {swimming.map((plan) => (
          <details key={plan.id} className="rounded-lg border border-zinc-800 p-3">
            <summary className="cursor-pointer font-medium text-emerald-400">{plan.workout_day}</summary>
            <div className="mt-3 space-y-2">
              {['goal', 'minutes', 'style_mix', 'intensity', 'structure', 'recovery_concern'].map((field) => (
                <div key={field}>
                  <label className="text-xs capitalize text-zinc-500">{field.replace(/_/g, ' ')}</label>
                  <input
                    value={plan[field] ?? ''}
                    onChange={(e) => {
                      const next = swimming.map((p) => p.id === plan.id ? { ...p, [field]: e.target.value } : p)
                      setSwimming(next)
                    }}
                    className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm"
                  />
                </div>
              ))}
              <button type="button" onClick={() => saveSwimming(swimming.find((p) => p.id === plan.id))} className="text-xs text-emerald-400 hover:underline">
                Save {plan.workout_day}
              </button>
            </div>
          </details>
        ))}
      </section>

      <button type="button" disabled={saving} onClick={saveSettings} className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold hover:bg-emerald-500 disabled:opacity-50">
        Save settings
      </button>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  )
}

function Input({ label, type, value, onChange, step }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  )
}
