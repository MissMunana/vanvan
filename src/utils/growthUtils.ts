import type { GrowthMetric } from '../types'
import { WHO_GROWTH_DATA, type WHOPercentileRow } from '../data/whoGrowthData'

type Gender = 'male' | 'female'

export function getAgeInMonths(birthday: string, measureDate: string): number {
  const birth = new Date(birthday)
  const measure = new Date(measureDate)
  const months =
    (measure.getFullYear() - birth.getFullYear()) * 12 +
    (measure.getMonth() - birth.getMonth())
  if (measure.getDate() < birth.getDate()) return Math.max(0, months - 1)
  return Math.max(0, months)
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function getWHOData(
  gender: Gender,
  metric: GrowthMetric
): WHOPercentileRow[] {
  return WHO_GROWTH_DATA[gender]?.[metric] ?? []
}

export function getWHORow(
  gender: Gender,
  metric: GrowthMetric,
  ageMonths: number
): WHOPercentileRow | null {
  const data = getWHOData(gender, metric)
  if (data.length === 0) return null
  return data.reduce((prev, curr) =>
    Math.abs(curr.ageMonths - ageMonths) < Math.abs(prev.ageMonths - ageMonths)
      ? curr
      : prev
  )
}

export function estimatePercentile(
  gender: Gender,
  metric: GrowthMetric,
  ageMonths: number,
  value: number
): number | null {
  const row = getWHORow(gender, metric, ageMonths)
  if (!row) return null

  const bands = [
    { p: 3, v: row.p3 },
    { p: 10, v: row.p10 },
    { p: 25, v: row.p25 },
    { p: 50, v: row.p50 },
    { p: 75, v: row.p75 },
    { p: 90, v: row.p90 },
    { p: 97, v: row.p97 },
  ]

  if (value <= bands[0].v) return 1
  if (value >= bands[bands.length - 1].v) return 99

  for (let i = 0; i < bands.length - 1; i++) {
    if (value >= bands[i].v && value <= bands[i + 1].v) {
      const ratio = (value - bands[i].v) / (bands[i + 1].v - bands[i].v)
      return Math.round(bands[i].p + ratio * (bands[i + 1].p - bands[i].p))
    }
  }
  return 50
}

export function checkGrowthAlert(
  gender: Gender,
  metric: GrowthMetric,
  ageMonths: number,
  value: number
): 'low' | 'high' | null {
  const row = getWHORow(gender, metric, ageMonths)
  if (!row) return null
  if (value < row.p3) return 'low'
  if (value > row.p97) return 'high'
  return null
}

export function getFeverLevel(temperature: number): 'normal' | 'low' | 'moderate' | 'high' {
  if (temperature < 37.3) return 'normal'
  if (temperature < 38.5) return 'low'
  if (temperature < 40.0) return 'moderate'
  return 'high'
}

export function calculateGrowthVelocity(
  records: { date: string; value: number }[]
): { period: string; velocity: number }[] {
  if (records.length < 2) return []
  const velocities: { period: string; velocity: number }[] = []
  for (let i = 1; i < records.length; i++) {
    const days =
      (new Date(records[i].date).getTime() -
        new Date(records[i - 1].date).getTime()) /
      86400000
    if (days <= 0) continue
    const monthsDiff = days / 30.44
    const velocity =
      Math.round(
        ((records[i].value - records[i - 1].value) / monthsDiff) * 10
      ) / 10
    velocities.push({
      period: `${records[i - 1].date.slice(5)} - ${records[i].date.slice(5)}`,
      velocity,
    })
  }
  return velocities
}
