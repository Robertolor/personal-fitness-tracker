/** Body composition math for the weight-loss dashboard: Navy method BF%,
 * 7-day rolling averages, rate-of-change, and simple linear projections. */

/**
 * US Navy body-fat % method. Height/waist/neck/hip in cm.
 * gender: 'male' | 'female'
 */
export function navyBodyFatPct({ gender, heightCm, waistCm, neckCm, hipCm }) {
  if (!heightCm || !waistCm || !neckCm) return null
  const log10 = (x) => Math.log(x) / Math.LN10

  if (gender === 'female') {
    if (!hipCm) return null
    const denom = 1.29579 - 0.35004 * log10(waistCm + hipCm - neckCm) + 0.221 * log10(heightCm)
    if (!denom) return null
    return round1(495 / denom - 450)
  }

  const denom = 1.0324 - 0.19077 * log10(waistCm - neckCm) + 0.15456 * log10(heightCm)
  if (!denom) return null
  return round1(495 / denom - 450)
}

function round1(n) {
  return Math.round(n * 10) / 10
}

/**
 * Rolling average (default 7-day) over a date-sorted array of { date, value } points.
 * Returns an array of the same length with `avg` added (null where not enough data yet).
 */
export function rollingAverage(points, windowSize = 7) {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((point, i) => {
    const windowStart = Math.max(0, i - windowSize + 1)
    const windowPoints = sorted.slice(windowStart, i + 1).filter((p) => p.value != null)
    const avg = windowPoints.length
      ? windowPoints.reduce((sum, p) => sum + p.value, 0) / windowPoints.length
      : null
    return { ...point, avg: avg != null ? round1(avg) : null }
  })
}

/**
 * Rate of change per week between the first and last valid rolling-average points.
 * Returns { kgPerWeek, days } or null if not enough data.
 */
export function rateOfChange(avgPoints) {
  const valid = avgPoints.filter((p) => p.avg != null)
  if (valid.length < 2) return null
  const first = valid[0]
  const last = valid[valid.length - 1]
  const days = daysBetween(first.date, last.date)
  if (days <= 0) return null
  const totalChange = last.avg - first.avg
  const kgPerWeek = round1((totalChange / days) * 7)
  return { kgPerWeek, days, totalChange: round1(totalChange) }
}

/** Simple linear projection of the rolling average forward to a target date. */
export function projectToDate(avgPoints, targetDateISO) {
  const trend = rateOfChange(avgPoints)
  const valid = avgPoints.filter((p) => p.avg != null)
  if (!trend || !valid.length) return null
  const last = valid[valid.length - 1]
  const daysAhead = daysBetween(last.date, targetDateISO)
  if (daysAhead < 0) return null
  const projected = last.avg + (trend.kgPerWeek / 7) * daysAhead
  return round1(projected)
}

export function daysBetween(dateAISO, dateBISO) {
  const a = new Date(dateAISO)
  const b = new Date(dateBISO)
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * Pace status vs. a target kg/week loss rate. Returns 'on_track' | 'too_slow' | 'too_fast' | 'unknown'.
 * targetKgPerWeek should be positive; actual kgPerWeek is expected negative when losing weight.
 */
/**
 * Groups check-ins into ISO-ish weeks (7-day buckets from the first check-in date)
 * and pairs each week's average nutrition adherence with that week's weight change
 * vs. the previous week - a simple adherence-vs-progress correlation view.
 */
export function weeklyAdherenceCorrelation(checkins) {
  const withWeight = checkins.filter((c) => c.weight_kg != null).sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
  if (!withWeight.length) return []

  const firstDate = withWeight[0].checkin_date
  const buckets = new Map()
  checkins.forEach((c) => {
    const weekIndex = Math.floor(daysBetween(firstDate, c.checkin_date) / 7)
    if (!buckets.has(weekIndex)) buckets.set(weekIndex, { adherence: [], weight: [] })
    const bucket = buckets.get(weekIndex)
    if (c.nutrition_adherence != null) bucket.adherence.push(c.nutrition_adherence)
    if (c.weight_kg != null) bucket.weight.push(c.weight_kg)
  })

  const weekIndices = [...buckets.keys()].sort((a, b) => a - b)
  let prevAvgWeight = null
  return weekIndices.map((idx) => {
    const bucket = buckets.get(idx)
    const avgAdherence = bucket.adherence.length ? round1(bucket.adherence.reduce((s, v) => s + v, 0) / bucket.adherence.length) : null
    const avgWeight = bucket.weight.length ? round1(bucket.weight.reduce((s, v) => s + v, 0) / bucket.weight.length) : null
    const weightChange = avgWeight != null && prevAvgWeight != null ? round1(avgWeight - prevAvgWeight) : null
    if (avgWeight != null) prevAvgWeight = avgWeight
    return { week: idx + 1, avgAdherence, avgWeight, weightChange }
  })
}

export function paceStatus(actualKgPerWeek, targetKgPerWeek = 0.45, tolerance = 0.15) {
  if (actualKgPerWeek == null) return 'unknown'
  const actualLossRate = -actualKgPerWeek
  if (actualLossRate < targetKgPerWeek - tolerance) return 'too_slow'
  if (actualLossRate > targetKgPerWeek + tolerance + 0.3) return 'too_fast'
  return 'on_track'
}
