import { supabase } from './supabase'
import { DEFAULT_ROUTINES, DEFAULT_SCHEDULE, DEFAULT_SWIMMING, DEFAULT_START_DATE } from '../data/routines'

export async function seedUserData(userId) {
  const { count, error: countError } = await supabase
    .from('routine_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw countError
  if (count && count > 0) return { seeded: false }

  for (const routine of DEFAULT_ROUTINES) {
    const { data: tpl, error: tplError } = await supabase
      .from('routine_templates')
      .insert({
        user_id: userId,
        name: routine.name,
        sort_order: routine.sortOrder,
      })
      .select('id')
      .single()

    if (tplError) throw tplError

    const exercises = routine.exercises.map((ex, i) => ({
      routine_id: tpl.id,
      name: ex.name,
      target_sets: ex.targetSets,
      rep_range: ex.repRange,
      primary_muscle: ex.primaryMuscle,
      notes: ex.notes,
      sort_order: i,
    }))

    const { error: exError } = await supabase.from('routine_exercises').insert(exercises)
    if (exError) throw exError
  }

  const swimmingRows = DEFAULT_SWIMMING.map((s) => ({
    user_id: userId,
    workout_day: s.workoutDay,
    goal: s.goal,
    minutes: s.minutes,
    style_mix: s.styleMix,
    intensity: s.intensity,
    structure: s.structure,
    recovery_concern: s.recoveryConcern,
  }))

  const { error: swimError } = await supabase.from('swimming_plans').insert(swimmingRows)
  if (swimError) throw swimError

  const { error: settingsError } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      start_date: DEFAULT_START_DATE,
      schedule: DEFAULT_SCHEDULE,
      // Calibration starting point (not a formula-based guess) - see docs/personal-trainer rule.
      // Protein/fat are floors that don't get cut; calories/carbs are the levers adjusted
      // every 10 days based on real 7-day rolling average weight trend.
      calorie_target: 1900,
      protein_target_g: 185,
      fat_target_g: 60,
      carb_target_g: 155,
    })
  if (settingsError) throw settingsError

  return { seeded: true }
}
