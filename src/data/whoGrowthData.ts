/**
 * WHO Child Growth Standards - Percentile Data
 *
 * Data sources:
 * - WHO Child Growth Standards (0-60 months): https://www.who.int/tools/child-growth-standards
 * - WHO Growth Reference (61-228 months): https://www.who.int/tools/growth-reference-data-for-5to19-years
 *
 * Percentiles included: P3, P10, P25, P50, P75, P90, P97
 * Intervals: every 3 months for 0-60mo, every 6 months for 61-144mo
 */

import type { GrowthMetric } from '../types'

// ============ Type Definitions ============

export type Gender = 'male' | 'female'

export interface WHOPercentileRow {
  ageMonths: number
  p3: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  p97: number
}

// ============ Helper: Interpolation ============

/**
 * Given P3, P50, P97, compute intermediate percentiles:
 * P10 ≈ P3 + (P50 - P3) * 0.32
 * P25 ≈ P3 + (P50 - P3) * 0.65
 * P75 ≈ P50 + (P97 - P50) * 0.35
 * P90 ≈ P50 + (P97 - P50) * 0.68
 */
function row(ageMonths: number, p3: number, p50: number, p97: number): WHOPercentileRow {
  const lower = p50 - p3
  const upper = p97 - p50
  return {
    ageMonths,
    p3: round(p3),
    p10: round(p3 + lower * 0.32),
    p25: round(p3 + lower * 0.65),
    p50: round(p50),
    p75: round(p50 + upper * 0.35),
    p90: round(p50 + upper * 0.68),
    p97: round(p97),
  }
}

function round(v: number): number {
  return Math.round(v * 10) / 10
}

// ============ Boys: Height/Length for Age (cm) ============

const boysHeight: WHOPercentileRow[] = [
  // 0-60 months: WHO Child Growth Standards (every 3 months)
  row(0, 46.3, 49.9, 53.4),
  row(3, 57.6, 61.4, 65.2),
  row(6, 63.6, 67.6, 71.6),
  row(9, 67.7, 72.0, 76.2),
  row(12, 71.0, 75.7, 80.5),
  row(15, 73.9, 79.1, 84.2),
  row(18, 76.6, 82.3, 87.9),
  row(21, 79.1, 85.1, 91.2),
  row(24, 81.3, 87.8, 94.4),
  row(27, 83.5, 90.4, 97.3),
  row(30, 85.5, 92.8, 100.0),
  row(33, 87.2, 94.6, 101.9),
  row(36, 88.7, 96.1, 103.5),
  row(39, 90.3, 97.7, 105.1),
  row(42, 91.9, 99.4, 106.9),
  row(45, 93.4, 101.4, 109.3),
  row(48, 94.9, 103.3, 111.7),
  row(51, 96.3, 105.0, 113.7),
  row(54, 97.7, 106.7, 115.8),
  row(57, 99.2, 108.4, 117.5),
  row(60, 100.7, 110.0, 119.2),
  // 61-144 months: WHO Growth Reference (every 6 months)
  row(66, 103.4, 113.0, 122.6),
  row(72, 106.1, 116.0, 125.9),
  row(78, 108.7, 118.8, 128.9),
  row(84, 111.2, 121.7, 132.2),
  row(90, 113.6, 124.4, 135.2),
  row(96, 116.0, 127.1, 138.2),
  row(102, 118.3, 129.7, 141.1),
  row(108, 120.6, 132.3, 144.1),
  row(114, 122.9, 135.0, 147.1),
  row(120, 125.3, 137.8, 150.2),
  row(126, 127.8, 140.6, 153.4),
  row(132, 130.5, 143.7, 156.9),
  row(138, 133.5, 147.1, 160.7),
  row(144, 136.8, 150.8, 164.8),
]

// ============ Girls: Height/Length for Age (cm) ============

const girlsHeight: WHOPercentileRow[] = [
  // 0-60 months
  row(0, 45.6, 49.1, 52.7),
  row(3, 56.2, 59.8, 63.5),
  row(6, 61.5, 65.7, 70.0),
  row(9, 65.6, 70.1, 74.7),
  row(12, 69.2, 74.0, 78.9),
  row(15, 72.2, 77.5, 82.7),
  row(18, 74.8, 80.7, 86.5),
  row(21, 77.5, 83.6, 89.7),
  row(24, 80.0, 86.4, 92.9),
  row(27, 82.2, 88.9, 95.7),
  row(30, 84.1, 91.3, 98.4),
  row(33, 85.8, 93.2, 100.6),
  row(36, 87.4, 95.1, 102.7),
  row(39, 89.0, 96.9, 104.9),
  row(42, 90.6, 98.8, 107.0),
  row(45, 92.0, 100.7, 109.5),
  row(48, 93.4, 102.7, 112.0),
  row(51, 94.9, 104.5, 114.1),
  row(54, 96.4, 106.2, 116.0),
  row(57, 97.9, 107.8, 117.8),
  row(60, 99.5, 109.4, 119.3),
  // 61-144 months
  row(66, 102.3, 112.5, 122.8),
  row(72, 105.0, 115.5, 126.0),
  row(78, 107.7, 118.5, 129.3),
  row(84, 110.3, 121.4, 132.5),
  row(90, 112.9, 124.3, 135.7),
  row(96, 115.5, 127.3, 139.1),
  row(102, 118.1, 130.3, 142.5),
  row(108, 120.8, 133.4, 146.0),
  row(114, 123.6, 136.7, 149.8),
  row(120, 126.6, 140.2, 153.8),
  row(126, 129.8, 143.8, 157.8),
  row(132, 133.3, 147.6, 161.9),
  row(138, 137.0, 151.4, 165.8),
  row(144, 140.5, 155.0, 169.4),
]

// ============ Boys: Weight for Age (kg) ============

const boysWeight: WHOPercentileRow[] = [
  // 0-60 months
  row(0, 2.5, 3.3, 4.4),
  row(3, 4.9, 6.4, 8.0),
  row(6, 6.4, 7.9, 9.8),
  row(9, 7.2, 8.9, 10.9),
  row(12, 7.8, 9.6, 11.8),
  row(15, 8.4, 10.3, 12.7),
  row(18, 8.8, 10.9, 13.5),
  row(21, 9.3, 11.5, 14.4),
  row(24, 9.7, 12.2, 15.3),
  row(27, 10.1, 12.7, 16.1),
  row(30, 10.5, 13.3, 16.9),
  row(33, 10.9, 13.8, 17.6),
  row(36, 11.3, 14.3, 18.3),
  row(39, 11.6, 14.8, 19.0),
  row(42, 12.0, 15.3, 19.7),
  row(45, 12.4, 15.8, 20.5),
  row(48, 12.7, 16.3, 21.2),
  row(51, 13.1, 16.8, 22.0),
  row(54, 13.4, 17.3, 22.8),
  row(57, 13.7, 17.8, 23.5),
  row(60, 14.1, 18.3, 24.2),
  // 61-120 months (WHO weight-for-age goes to 120 months)
  row(66, 14.9, 19.5, 25.8),
  row(72, 15.7, 20.7, 27.5),
  row(78, 16.5, 21.9, 29.3),
  row(84, 17.3, 23.1, 31.2),
  row(90, 18.2, 24.4, 33.3),
  row(96, 19.1, 25.8, 35.5),
  row(102, 20.0, 27.2, 37.8),
  row(108, 21.0, 28.7, 40.3),
  row(114, 22.1, 30.4, 43.0),
  row(120, 23.2, 32.2, 45.8),
]

// ============ Girls: Weight for Age (kg) ============

const girlsWeight: WHOPercentileRow[] = [
  // 0-60 months
  row(0, 2.4, 3.2, 4.2),
  row(3, 4.6, 5.8, 7.4),
  row(6, 5.8, 7.3, 9.2),
  row(9, 6.6, 8.2, 10.4),
  row(12, 7.1, 8.9, 11.2),
  row(15, 7.7, 9.7, 12.2),
  row(18, 8.2, 10.2, 12.9),
  row(21, 8.7, 10.9, 13.8),
  row(24, 9.2, 11.5, 14.8),
  row(27, 9.6, 12.1, 15.6),
  row(30, 10.0, 12.7, 16.4),
  row(33, 10.4, 13.3, 17.3),
  row(36, 10.8, 13.9, 18.1),
  row(39, 11.2, 14.4, 18.9),
  row(42, 11.6, 14.9, 19.8),
  row(45, 12.0, 15.5, 20.6),
  row(48, 12.3, 16.1, 21.5),
  row(51, 12.7, 16.6, 22.4),
  row(54, 13.0, 17.2, 23.3),
  row(57, 13.4, 17.7, 24.1),
  row(60, 13.7, 18.2, 24.9),
  // 61-120 months
  row(66, 14.6, 19.4, 26.6),
  row(72, 15.4, 20.6, 28.4),
  row(78, 16.3, 21.8, 30.3),
  row(84, 17.2, 23.1, 32.4),
  row(90, 18.2, 24.5, 34.7),
  row(96, 19.2, 26.0, 37.1),
  row(102, 20.3, 27.6, 39.8),
  row(108, 21.5, 29.3, 42.6),
  row(114, 22.8, 31.2, 45.7),
  row(120, 24.2, 33.3, 49.0),
]

// ============ Boys: BMI for Age (kg/m²) ============

const boysBMI: WHOPercentileRow[] = [
  // 24-60 months (every 3 months)
  row(24, 14.0, 16.0, 18.7),
  row(27, 13.8, 15.8, 18.5),
  row(30, 13.7, 15.6, 18.3),
  row(33, 13.5, 15.5, 18.2),
  row(36, 13.4, 15.4, 18.1),
  row(39, 13.4, 15.4, 18.1),
  row(42, 13.3, 15.3, 18.0),
  row(45, 13.3, 15.3, 18.0),
  row(48, 13.2, 15.3, 18.0),
  row(51, 13.2, 15.3, 18.0),
  row(54, 13.2, 15.3, 18.0),
  row(57, 13.2, 15.3, 18.0),
  row(60, 13.2, 15.3, 18.0),
  // 66-144 months (every 6 months)
  row(66, 13.2, 15.4, 18.2),
  row(72, 13.3, 15.4, 18.4),
  row(78, 13.3, 15.5, 18.7),
  row(84, 13.4, 15.6, 19.0),
  row(90, 13.4, 15.7, 19.3),
  row(96, 13.5, 15.8, 19.7),
  row(102, 13.5, 16.0, 20.1),
  row(108, 13.6, 16.1, 20.5),
  row(114, 13.7, 16.3, 20.9),
  row(120, 13.8, 16.6, 21.4),
  row(126, 13.9, 16.8, 21.9),
  row(132, 14.1, 17.1, 22.4),
  row(138, 14.2, 17.3, 22.9),
  row(144, 14.4, 17.6, 23.4),
]

// ============ Girls: BMI for Age (kg/m²) ============

const girlsBMI: WHOPercentileRow[] = [
  // 24-60 months (every 3 months)
  row(24, 13.7, 15.7, 18.5),
  row(27, 13.5, 15.5, 18.3),
  row(30, 13.4, 15.4, 18.2),
  row(33, 13.3, 15.3, 18.1),
  row(36, 13.2, 15.3, 18.0),
  row(39, 13.1, 15.2, 17.9),
  row(42, 13.1, 15.2, 17.8),
  row(45, 13.0, 15.1, 17.8),
  row(48, 13.0, 15.1, 17.8),
  row(51, 13.0, 15.2, 17.9),
  row(54, 12.9, 15.2, 18.0),
  row(57, 12.9, 15.2, 18.1),
  row(60, 12.9, 15.2, 18.3),
  // 66-144 months (every 6 months)
  row(66, 12.9, 15.3, 18.5),
  row(72, 13.0, 15.3, 18.8),
  row(78, 13.0, 15.4, 19.1),
  row(84, 13.0, 15.5, 19.4),
  row(90, 13.1, 15.6, 19.8),
  row(96, 13.1, 15.8, 20.3),
  row(102, 13.2, 16.0, 20.8),
  row(108, 13.3, 16.2, 21.3),
  row(114, 13.4, 16.5, 21.9),
  row(120, 13.5, 16.9, 22.6),
  row(126, 13.7, 17.2, 23.2),
  row(132, 13.9, 17.5, 23.8),
  row(138, 14.1, 17.8, 24.2),
  row(144, 14.3, 18.0, 24.5),
]

// ============ Boys: Head Circumference for Age (cm) ============

const boysHeadCircumference: WHOPercentileRow[] = [
  row(0, 32.4, 34.5, 36.5),
  row(3, 38.3, 40.5, 42.7),
  row(6, 41.0, 43.3, 45.6),
  row(9, 42.6, 45.0, 47.4),
  row(12, 43.5, 46.1, 48.6),
  row(15, 44.2, 46.8, 49.3),
  row(18, 44.8, 47.4, 49.8),
  row(21, 45.4, 47.9, 50.2),
  row(24, 46.0, 48.3, 50.5),
  row(27, 46.3, 48.6, 50.8),
  row(30, 46.6, 48.9, 51.1),
  row(33, 46.9, 49.2, 51.4),
  row(36, 47.2, 49.5, 51.7),
  row(39, 47.4, 49.7, 51.9),
  row(42, 47.5, 49.9, 52.1),
  row(45, 47.7, 50.1, 52.3),
  row(48, 47.9, 50.3, 52.5),
  row(51, 48.0, 50.4, 52.6),
  row(54, 48.1, 50.5, 52.7),
  row(57, 48.2, 50.6, 52.8),
  row(60, 48.3, 50.7, 52.9),
]

// ============ Girls: Head Circumference for Age (cm) ============

const girlsHeadCircumference: WHOPercentileRow[] = [
  row(0, 31.7, 33.9, 35.9),
  row(3, 37.4, 39.5, 41.7),
  row(6, 39.7, 42.0, 44.3),
  row(9, 41.3, 43.7, 46.1),
  row(12, 42.2, 44.9, 47.5),
  row(15, 43.0, 45.6, 48.1),
  row(18, 43.7, 46.2, 48.6),
  row(21, 44.3, 46.8, 49.1),
  row(24, 44.9, 47.3, 49.6),
  row(27, 45.2, 47.6, 49.9),
  row(30, 45.5, 47.9, 50.2),
  row(33, 45.7, 48.2, 50.5),
  row(36, 46.0, 48.5, 50.8),
  row(39, 46.2, 48.7, 51.0),
  row(42, 46.4, 48.9, 51.2),
  row(45, 46.6, 49.1, 51.4),
  row(48, 46.8, 49.3, 51.6),
  row(51, 46.9, 49.4, 51.7),
  row(54, 47.0, 49.5, 51.8),
  row(57, 47.1, 49.6, 51.9),
  row(60, 47.2, 49.6, 51.9),
]

// ============ Main Data Export ============

export const WHO_GROWTH_DATA: Record<Gender, Partial<Record<GrowthMetric, WHOPercentileRow[]>>> = {
  male: {
    height: boysHeight,
    weight: boysWeight,
    bmi: boysBMI,
    headCircumference: boysHeadCircumference,
  },
  female: {
    height: girlsHeight,
    weight: girlsWeight,
    bmi: girlsBMI,
    headCircumference: girlsHeadCircumference,
  },
}

// ============ Utility: Labels & Units ============

export const GROWTH_METRIC_INFO: Record<GrowthMetric, { label: string; unit: string; shortLabel: string }> = {
  height: { label: '身高/身长', unit: 'cm', shortLabel: '身高' },
  weight: { label: '体重', unit: 'kg', shortLabel: '体重' },
  bmi: { label: '体质指数 (BMI)', unit: 'kg/m²', shortLabel: 'BMI' },
  headCircumference: { label: '头围', unit: 'cm', shortLabel: '头围' },
}

// ============ Utility: Percentile Calculation ============

/**
 * Estimate the percentile of a measured value given the WHO percentile row.
 * Uses linear interpolation between known percentile boundaries.
 * Returns a number between 0 and 100.
 */
export function estimatePercentile(value: number, row: WHOPercentileRow): number {
  const points: [number, number][] = [
    [3, row.p3],
    [10, row.p10],
    [25, row.p25],
    [50, row.p50],
    [75, row.p75],
    [90, row.p90],
    [97, row.p97],
  ]

  // Below P3
  if (value <= row.p3) {
    // Extrapolate below P3 (clamp to 0.1)
    const slope = (10 - 3) / (row.p10 - row.p3)
    const estimated = 3 - (row.p3 - value) * slope
    return Math.max(0.1, Math.round(estimated * 10) / 10)
  }

  // Above P97
  if (value >= row.p97) {
    // Extrapolate above P97 (clamp to 99.9)
    const slope = (97 - 90) / (row.p97 - row.p90)
    const estimated = 97 + (value - row.p97) * slope
    return Math.min(99.9, Math.round(estimated * 10) / 10)
  }

  // Interpolate between known points
  for (let i = 0; i < points.length - 1; i++) {
    const [pLow, vLow] = points[i]
    const [pHigh, vHigh] = points[i + 1]
    if (value >= vLow && value <= vHigh) {
      const ratio = (value - vLow) / (vHigh - vLow)
      const percentile = pLow + ratio * (pHigh - pLow)
      return Math.round(percentile * 10) / 10
    }
  }

  return 50 // fallback
}

/**
 * Find the closest WHO percentile row for a given age in months.
 * If the age is between two data points, returns the nearest one.
 */
export function findClosestRow(ageMonths: number, data: WHOPercentileRow[]): WHOPercentileRow | null {
  if (data.length === 0) return null

  let closest = data[0]
  let minDiff = Math.abs(ageMonths - closest.ageMonths)

  for (const row of data) {
    const diff = Math.abs(ageMonths - row.ageMonths)
    if (diff < minDiff) {
      minDiff = diff
      closest = row
    }
  }

  return closest
}

/**
 * Interpolate a WHO percentile row for an exact age between two data points.
 * Returns an interpolated row with all percentile values.
 */
export function interpolateRow(ageMonths: number, data: WHOPercentileRow[]): WHOPercentileRow | null {
  if (data.length === 0) return null

  // Exact match
  const exact = data.find((r) => r.ageMonths === ageMonths)
  if (exact) return exact

  // Find bounding rows
  let lower: WHOPercentileRow | null = null
  let upper: WHOPercentileRow | null = null

  for (const r of data) {
    if (r.ageMonths <= ageMonths) {
      if (!lower || r.ageMonths > lower.ageMonths) lower = r
    }
    if (r.ageMonths >= ageMonths) {
      if (!upper || r.ageMonths < upper.ageMonths) upper = r
    }
  }

  // Out of range - return boundary
  if (!lower) return upper
  if (!upper) return lower

  // Interpolate
  if (lower.ageMonths === upper.ageMonths) return lower
  const ratio = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths)

  const lerp = (a: number, b: number) => Math.round((a + (b - a) * ratio) * 10) / 10

  return {
    ageMonths,
    p3: lerp(lower.p3, upper.p3),
    p10: lerp(lower.p10, upper.p10),
    p25: lerp(lower.p25, upper.p25),
    p50: lerp(lower.p50, upper.p50),
    p75: lerp(lower.p75, upper.p75),
    p90: lerp(lower.p90, upper.p90),
    p97: lerp(lower.p97, upper.p97),
  }
}

/**
 * Get the percentile value for a child's measurement.
 * Returns null if no matching data is found for the given gender/metric/age.
 */
export function getPercentile(
  gender: Gender,
  metric: GrowthMetric,
  ageMonths: number,
  value: number
): number | null {
  const data = WHO_GROWTH_DATA[gender]?.[metric]
  if (!data || data.length === 0) return null

  const row = interpolateRow(ageMonths, data)
  if (!row) return null

  return estimatePercentile(value, row)
}
