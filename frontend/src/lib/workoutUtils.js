/** Epley formula for estimated 1RM */
export function epley1RM(weightKg, reps) {
  if (!weightKg || !reps || reps <= 0) return null
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

/** Best set by estimated 1RM */
export function bestSet(sets) {
  if (!sets?.length) return null
  let best = null
  let bestRm = 0
  for (const s of sets) {
    const rm = epley1RM(Number(s.weight_kg), Number(s.reps))
    if (rm != null && rm > bestRm) {
      bestRm = rm
      best = s
    }
  }
  return best
}

/** Total volume (weight × reps) for a session */
export function sessionVolume(sets) {
  if (!sets?.length) return 0
  return sets.reduce((sum, s) => {
    const w = Number(s.weight_kg) || 0
    const r = Number(s.reps) || 0
    return sum + w * r
  }, 0)
}

/** Group sets by exercise name */
export function groupSetsByExercise(sets) {
  return sets.reduce((acc, set) => {
    const key = set.exercise_name
    if (!acc[key]) acc[key] = []
    acc[key].push(set)
    return acc
  }, {})
}

/** Parse target sets string to max set count */
export function parseTargetSets(targetSets) {
  if (!targetSets) return 4
  const match = String(targetSets).match(/\d+/)
  return match ? parseInt(match[0], 10) : 4
}
