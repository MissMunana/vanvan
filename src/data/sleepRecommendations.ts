export interface SleepRecommendation {
  ageRangeMonths: [number, number]
  ageLabel: string
  minHours: number
  maxHours: number
  includesNaps: boolean
  napNote: string
}

export const SLEEP_RECOMMENDATIONS: SleepRecommendation[] = [
  { ageRangeMonths: [0, 3], ageLabel: '0-3月龄', minHours: 14, maxHours: 17, includesNaps: true, napNote: '含所有小睡（每天3-5次）' },
  { ageRangeMonths: [4, 11], ageLabel: '4-11月龄', minHours: 12, maxHours: 15, includesNaps: true, napNote: '含小睡（每天2-3次）' },
  { ageRangeMonths: [12, 24], ageLabel: '1-2岁', minHours: 11, maxHours: 14, includesNaps: true, napNote: '含小睡（每天1-2次）' },
  { ageRangeMonths: [25, 60], ageLabel: '3-5岁', minHours: 10, maxHours: 13, includesNaps: true, napNote: '含午睡（部分可不午睡）' },
  { ageRangeMonths: [61, 144], ageLabel: '6-12岁', minHours: 9, maxHours: 12, includesNaps: false, napNote: '一般不需要午睡' },
]

export function getRecommendationForAge(ageMonths: number): SleepRecommendation | null {
  return SLEEP_RECOMMENDATIONS.find(r =>
    ageMonths >= r.ageRangeMonths[0] && ageMonths <= r.ageRangeMonths[1]
  ) || null
}
