import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDateISO } from '../lib/schedule'
import { ScaleStepper } from '../components/NumberStepper'
import { navyBodyFatPct } from '../lib/bodyComp'

const emptyCheckin = {
  weight_kg: '',
  body_fat_pct: '',
  sleep: 3,
  energy: 3,
  hunger: 3,
  stress: 3,
  muscle_fatigue: 3,
  steps: '',
  calories_consumed: '',
  protein_g: '',
  nutrition_adherence: 3,
  workout_completed: false,
  swimming_completed: false,
  notes: '',
}

const emptyMeasurement = {
  waist_cm: '',
  chest_cm: '',
  hips_cm: '',
  left_arm_cm: '',
  right_arm_cm: '',
  left_thigh_cm: '',
  right_thigh_cm: '',
  neck_cm: '',
  notes: '',
}

export default function CheckIn() {
  const { user, settings } = useAuth()
  const todayISO = formatDateISO(new Date())
  const [checkin, setCheckin] = useState(emptyCheckin)
  const [measurement, setMeasurement] = useState(emptyMeasurement)
  const [tab, setTab] = useState('daily')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', todayISO).maybeSingle(),
      supabase.from('body_measurements').select('*').eq('user_id', user.id).eq('measured_date', todayISO).maybeSingle(),
    ]).then(([cRes, mRes]) => {
      if (cRes.data) {
        setCheckin({
          ...emptyCheckin,
          ...cRes.data,
          weight_kg: cRes.data.weight_kg ?? '',
          body_fat_pct: cRes.data.body_fat_pct ?? '',
          steps: cRes.data.steps ?? '',
          calories_consumed: cRes.data.calories_consumed ?? '',
          protein_g: cRes.data.protein_g ?? '',
        })
      }
      if (mRes.data) {
        setMeasurement({
          ...emptyMeasurement,
          ...mRes.data,
          waist_cm: mRes.data.waist_cm ?? '',
          chest_cm: mRes.data.chest_cm ?? '',
          hips_cm: mRes.data.hips_cm ?? '',
          left_arm_cm: mRes.data.left_arm_cm ?? '',
          right_arm_cm: mRes.data.right_arm_cm ?? '',
          left_thigh_cm: mRes.data.left_thigh_cm ?? '',
          right_thigh_cm: mRes.data.right_thigh_cm ?? '',
          neck_cm: mRes.data.neck_cm ?? '',
        })
      }
    })
  }, [user, todayISO])

  const saveCheckin = async () => {
    setSaving(true)
    setMessage('')
    try {
      const row = {
        user_id: user.id,
        checkin_date: todayISO,
        sleep: checkin.sleep,
        energy: checkin.energy,
        hunger: checkin.hunger,
        stress: checkin.stress,
        muscle_fatigue: checkin.muscle_fatigue,
        nutrition_adherence: checkin.nutrition_adherence,
        workout_completed: checkin.workout_completed,
        swimming_completed: checkin.swimming_completed,
        notes: checkin.notes || null,
        weight_kg: checkin.weight_kg !== '' ? Number(checkin.weight_kg) : null,
        body_fat_pct: checkin.body_fat_pct !== '' ? Number(checkin.body_fat_pct) : null,
        steps: checkin.steps !== '' ? Number(checkin.steps) : null,
        calories_consumed: checkin.calories_consumed !== '' ? Number(checkin.calories_consumed) : null,
        protein_g: checkin.protein_g !== '' ? Number(checkin.protein_g) : null,
      }
      const { error } = await supabase.from('daily_checkins').upsert(row, { onConflict: 'user_id,checkin_date' })
      if (error) throw error
      setMessage('Check-in saved.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveMeasurement = async () => {
    setSaving(true)
    setMessage('')
    try {
      const num = (v) => (v !== '' && v != null ? Number(v) : null)
      const row = {
        user_id: user.id,
        measured_date: todayISO,
        waist_cm: num(measurement.waist_cm),
        chest_cm: num(measurement.chest_cm),
        hips_cm: num(measurement.hips_cm),
        left_arm_cm: num(measurement.left_arm_cm),
        right_arm_cm: num(measurement.right_arm_cm),
        left_thigh_cm: num(measurement.left_thigh_cm),
        right_thigh_cm: num(measurement.right_thigh_cm),
        neck_cm: num(measurement.neck_cm),
        notes: measurement.notes || null,
      }
      const { error } = await supabase.from('body_measurements').upsert(row, { onConflict: 'user_id,measured_date' })
      if (error) throw error
      setMessage('Measurements saved.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const calorieTarget = settings?.calorie_target ?? 1900
  const navyEstimate = navyBodyFatPct({
    gender: 'male',
    heightCm: settings?.height_cm ? Number(settings.height_cm) : null,
    waistCm: measurement.waist_cm !== '' ? Number(measurement.waist_cm) : null,
    neckCm: measurement.neck_cm !== '' ? Number(measurement.neck_cm) : null,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Check-in</h1>
        <p className="text-sm text-zinc-500">{format(new Date(), 'EEEE, MMMM d')} · Target {calorieTarget} kcal</p>
      </div>

      <div className="flex gap-2 rounded-lg bg-zinc-900 p-1">
        {['daily', 'measurements'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2 text-sm font-medium capitalize ${
              tab === t ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t === 'daily' ? 'Daily' : 'Body measurements'}
          </button>
        ))}
      </div>

      {tab === 'daily' ? (
        <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Weight (kg)" value={checkin.weight_kg} onChange={(v) => setCheckin({ ...checkin, weight_kg: v })} type="number" step="0.1" />
            <Field label="Body fat %" value={checkin.body_fat_pct} onChange={(v) => setCheckin({ ...checkin, body_fat_pct: v })} type="number" step="0.1" />
            <Field label="Steps" value={checkin.steps} onChange={(v) => setCheckin({ ...checkin, steps: v })} type="number" />
            <Field label="Calories consumed" value={checkin.calories_consumed} onChange={(v) => setCheckin({ ...checkin, calories_consumed: v })} type="number" />
            <Field label="Protein (g)" value={checkin.protein_g} onChange={(v) => setCheckin({ ...checkin, protein_g: v })} type="number" />
          </div>

          <ScaleStepper label="Sleep" value={checkin.sleep} onChange={(v) => setCheckin({ ...checkin, sleep: v })} lowLabel="Terrible" highLabel="Excellent" />
          <ScaleStepper label="Energy" value={checkin.energy} onChange={(v) => setCheckin({ ...checkin, energy: v })} lowLabel="Dragging" highLabel="Very high" />
          <ScaleStepper label="Hunger" value={checkin.hunger} onChange={(v) => setCheckin({ ...checkin, hunger: v })} lowLabel="None" highLabel="Brutal" />
          <ScaleStepper label="Stress" value={checkin.stress} onChange={(v) => setCheckin({ ...checkin, stress: v })} lowLabel="Relaxed" highLabel="Very high" />
          <ScaleStepper label="Muscle fatigue" value={checkin.muscle_fatigue} onChange={(v) => setCheckin({ ...checkin, muscle_fatigue: v })} lowLabel="Fresh" highLabel="Destroyed" />
          <ScaleStepper label="Nutrition adherence" value={checkin.nutrition_adherence} onChange={(v) => setCheckin({ ...checkin, nutrition_adherence: v })} lowLabel="Off plan" highLabel="Perfect" />

          <div className="flex flex-wrap gap-4">
            <Toggle label="Workout done" checked={checkin.workout_completed} onChange={(v) => setCheckin({ ...checkin, workout_completed: v })} />
            <Toggle label="Cardio done" checked={checkin.swimming_completed} onChange={(v) => setCheckin({ ...checkin, swimming_completed: v })} />
          </div>

          <Field label="Notes" value={checkin.notes} onChange={(v) => setCheckin({ ...checkin, notes: v })} multiline />

          <button type="button" disabled={saving} onClick={saveCheckin} className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
            Save check-in
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400">
            <summary className="cursor-pointer font-medium text-amber-500/80">How to measure waist &amp; neck (Navy method)</summary>
            <ul className="mt-2 space-y-1.5 list-disc pl-4">
              <li><strong>Waist:</strong> standing relaxed, tape at the navel (belly button) level, parallel to the floor. Measure before eating, not right after a workout (bloating/pump distorts it).</li>
              <li><strong>Neck:</strong> tape just below the larynx (Adam&apos;s apple), pointing slightly downward toward the front, same tension every time — not too tight.</li>
              <li>Same time of day every time (recommended: morning, fasted, right after waking) for consistent, comparable numbers.</li>
            </ul>
          </details>

          <Field label="Waist (cm)" value={measurement.waist_cm} onChange={(v) => setMeasurement({ ...measurement, waist_cm: v })} type="number" step="0.1" />
          <Field label="Chest (cm)" value={measurement.chest_cm} onChange={(v) => setMeasurement({ ...measurement, chest_cm: v })} type="number" step="0.1" />
          <Field label="Hips (cm)" value={measurement.hips_cm} onChange={(v) => setMeasurement({ ...measurement, hips_cm: v })} type="number" step="0.1" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Left arm (cm)" value={measurement.left_arm_cm} onChange={(v) => setMeasurement({ ...measurement, left_arm_cm: v })} type="number" step="0.1" />
            <Field label="Right arm (cm)" value={measurement.right_arm_cm} onChange={(v) => setMeasurement({ ...measurement, right_arm_cm: v })} type="number" step="0.1" />
            <Field label="Left thigh (cm)" value={measurement.left_thigh_cm} onChange={(v) => setMeasurement({ ...measurement, left_thigh_cm: v })} type="number" step="0.1" />
            <Field label="Right thigh (cm)" value={measurement.right_thigh_cm} onChange={(v) => setMeasurement({ ...measurement, right_thigh_cm: v })} type="number" step="0.1" />
          </div>
          <Field label="Neck (cm)" value={measurement.neck_cm} onChange={(v) => setMeasurement({ ...measurement, neck_cm: v })} type="number" step="0.1" />

          {navyEstimate != null && (
            <p className="rounded-lg bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              Estimated body fat (Navy method): <strong>{navyEstimate}%</strong>
            </p>
          )}
          {navyEstimate == null && settings && !settings.height_cm && (
            <p className="text-xs text-zinc-500">Add your height in Settings to get a live body-fat % estimate here.</p>
          )}

          <Field label="Notes" value={measurement.notes} onChange={(v) => setMeasurement({ ...measurement, notes: v })} multiline />

          <button type="button" disabled={saving} onClick={saveMeasurement} className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
            Save measurements
          </button>
        </div>
      )}

      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step, multiline }) {
  const cls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-emerald-500'
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-500" />
      {label}
    </label>
  )
}
