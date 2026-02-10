export interface DrugFormulation {
  id: string
  name: string
  concentration: number
  unit: string
}

export interface DosageResult {
  recommendedDoseMg: number
  recommendedDoseVolume: number
  minDoseMg: number
  maxDoseMg: number
  maxDailyDoseMg: number
  maxDailyTimes: number
  intervalHours: number
  warnings: string[]
  unit: string
}

export const IBUPROFEN_FORMULATIONS: DrugFormulation[] = [
  { id: 'ibu_drops', name: '美林混悬滴剂 (40mg/ml)', concentration: 40, unit: 'ml' },
  { id: 'ibu_susp', name: '美林混悬液 (20mg/ml)', concentration: 20, unit: 'ml' },
  { id: 'ibu_gran', name: '布洛芬颗粒 (200mg/包)', concentration: 200, unit: '包' },
]

export const ACETAMINOPHEN_FORMULATIONS: DrugFormulation[] = [
  { id: 'ace_drops', name: '泰诺林混悬滴剂 (100mg/ml)', concentration: 100, unit: 'ml' },
  { id: 'ace_susp', name: '泰诺林混悬液 (32mg/ml)', concentration: 32, unit: 'ml' },
  { id: 'ace_gran', name: '对乙酰氨基酚颗粒 (250mg/包)', concentration: 250, unit: '包' },
]

export function calculateIbuprofenDose(
  weightKg: number,
  formulation: DrugFormulation
): DosageResult {
  const warnings: string[] = []

  if (weightKg < 5) warnings.push('体重过低，请咨询医生')
  if (weightKg > 80) warnings.push('请确认体重是否正确')

  // 5-10 mg/kg，标准 ~7 mg/kg
  const standardMg = Math.round(weightKg * 7)
  const minMg = Math.round(weightKg * 5)
  const maxMg = Math.round(weightKg * 10)
  const maxDailyMg = Math.min(Math.round(weightKg * 40), 1200)

  // 超过单次最大值则限制
  const effectiveMg = Math.min(standardMg, 400)
  if (standardMg > 400) {
    warnings.push('单次剂量已限制为最大值 400mg')
  }

  const volume =
    Math.round((effectiveMg / formulation.concentration) * 10) / 10

  return {
    recommendedDoseMg: effectiveMg,
    recommendedDoseVolume: volume,
    minDoseMg: minMg,
    maxDoseMg: Math.min(maxMg, 400),
    maxDailyDoseMg: maxDailyMg,
    maxDailyTimes: 4,
    intervalHours: 6,
    warnings,
    unit: formulation.unit,
  }
}

export function calculateAcetaminophenDose(
  weightKg: number,
  formulation: DrugFormulation
): DosageResult {
  const warnings: string[] = []

  if (weightKg < 5) warnings.push('体重过低，请咨询医生')
  if (weightKg > 80) warnings.push('请确认体重是否正确')

  // 10-15 mg/kg，标准 ~12 mg/kg
  const standardMg = Math.round(weightKg * 12)
  const minMg = Math.round(weightKg * 10)
  const maxMg = Math.round(weightKg * 15)
  const maxDailyMg = Math.min(Math.round(weightKg * 60), 2000)

  const effectiveMg = Math.min(standardMg, 500)
  if (standardMg > 500) {
    warnings.push('单次剂量已限制为最大值 500mg')
  }

  const volume =
    Math.round((effectiveMg / formulation.concentration) * 10) / 10

  return {
    recommendedDoseMg: effectiveMg,
    recommendedDoseVolume: volume,
    minDoseMg: minMg,
    maxDoseMg: Math.min(maxMg, 500),
    maxDailyDoseMg: maxDailyMg,
    maxDailyTimes: 5,
    intervalHours: 4,
    warnings,
    unit: formulation.unit,
  }
}
