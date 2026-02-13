// ============ 基础类型 ============

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
  courseDays?: number
  courseNote?: string
  administrationNote?: string
  isAgeBased?: boolean
}

// ============ Drug Registry 类型 ============

export type DrugId =
  | 'ibuprofen' | 'acetaminophen'
  | 'oseltamivir' | 'baloxavir'
  | 'amoxicillin_clavulanate' | 'azithromycin'
  | 'montelukast' | 'cetirizine' | 'loratadine'
  | 'ors' | 'montmorillonite'

export type DrugCategory = 'antipyretic' | 'antiviral' | 'antibiotic' | 'allergy' | 'gi'

export interface DrugInfo {
  id: DrugId
  genericName: string
  chineseName: string
  brandNames: string[]
  category: DrugCategory
  icon: string
  color: string
  formulations: DrugFormulation[]
  intervalHours: number | null
  defaultReason: string
  requiresWeight: boolean
  requiresAge: boolean
  minAgeMonths?: number
  calculate: (weightKg: number, ageMonths: number, formulation: DrugFormulation) => DosageResult
}

export const DRUG_CATEGORY_INFO: Record<DrugCategory, { label: string; icon: string }> = {
  antipyretic: { label: '退烧/止痛', icon: '🌡️' },
  antiviral: { label: '抗流感', icon: '🦠' },
  antibiotic: { label: '抗感染', icon: '💊' },
  allergy: { label: '抗过敏/哮喘', icon: '🌸' },
  gi: { label: '胃肠', icon: '🩺' },
}

// ============ 通用计算辅助 ============

function roundDose(mg: number): number {
  return Math.round(mg * 10) / 10
}

function calcVolume(mg: number, concentration: number): number {
  return Math.round((mg / concentration) * 10) / 10
}

// ============ 各药品计算函数 ============

function calcIbuprofen(weightKg: number, _ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (weightKg < 5) warnings.push('体重过低，请咨询医生')
  if (weightKg > 80) warnings.push('请确认体重是否正确')

  const standardMg = roundDose(weightKg * 7)
  const minMg = roundDose(weightKg * 5)
  const maxMg = roundDose(weightKg * 10)
  const maxDailyMg = Math.min(roundDose(weightKg * 40), 1200)

  const effectiveMg = Math.min(standardMg, 400)
  if (standardMg > 400) warnings.push('单次剂量已限制为最大值 400mg')

  return {
    recommendedDoseMg: effectiveMg,
    recommendedDoseVolume: calcVolume(effectiveMg, formulation.concentration),
    minDoseMg: minMg,
    maxDoseMg: Math.min(maxMg, 400),
    maxDailyDoseMg: maxDailyMg,
    maxDailyTimes: 4,
    intervalHours: 6,
    warnings,
    unit: formulation.unit,
  }
}

function calcAcetaminophen(weightKg: number, _ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (weightKg < 5) warnings.push('体重过低，请咨询医生')
  if (weightKg > 80) warnings.push('请确认体重是否正确')

  const standardMg = roundDose(weightKg * 12)
  const minMg = roundDose(weightKg * 10)
  const maxMg = roundDose(weightKg * 15)
  const maxDailyMg = Math.min(roundDose(weightKg * 60), 2000)

  const effectiveMg = Math.min(standardMg, 500)
  if (standardMg > 500) warnings.push('单次剂量已限制为最大值 500mg')

  return {
    recommendedDoseMg: effectiveMg,
    recommendedDoseVolume: calcVolume(effectiveMg, formulation.concentration),
    minDoseMg: minMg,
    maxDoseMg: Math.min(maxMg, 500),
    maxDailyDoseMg: maxDailyMg,
    maxDailyTimes: 5,
    intervalHours: 4,
    warnings,
    unit: formulation.unit,
  }
}

function calcOseltamivir(weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (ageMonths < 12) warnings.push('1岁以下婴儿需要在医生指导下使用')

  let doseMg: number
  if (weightKg <= 15) doseMg = 30
  else if (weightKg <= 23) doseMg = 45
  else if (weightKg <= 40) doseMg = 60
  else doseMg = 75

  warnings.push('需在症状出现48小时内开始服用')

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: doseMg * 2,
    maxDailyTimes: 2,
    intervalHours: 12,
    warnings,
    unit: formulation.unit,
    courseDays: 5,
    courseNote: '每日2次，连续服用5天',
  }
}

function calcBaloxavir(weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (ageMonths < 60) warnings.push('5岁以下儿童不推荐使用')
  if (weightKg < 20) warnings.push('体重低于20kg不推荐使用')

  const doseMg = weightKg >= 80 ? 40 : 20

  warnings.push('空腹或饭后2小时服用，避免同时服用含钙/镁制品')

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: doseMg,
    maxDailyTimes: 1,
    intervalHours: 0,
    warnings,
    unit: formulation.unit,
    courseDays: 1,
    courseNote: '仅需服用1次',
    administrationNote: '空腹或饭后2小时服用',
  }
}

function calcAmoxicillinClavulanate(weightKg: number, _ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (weightKg < 5) warnings.push('体重过低，请咨询医生')

  // 标准剂量：25-45mg/kg/day ÷ 2-3次，取中间值 ~15mg/kg/次 (TID)
  const singleMg = roundDose(weightKg * 15)
  const minMg = roundDose(weightKg * 8)
  const maxSingleMg = Math.min(roundDose(weightKg * 22.5), 500)
  const maxDailyMg = Math.min(roundDose(weightKg * 45), 2000)

  const effectiveMg = Math.min(singleMg, 500)
  if (singleMg > 500) warnings.push('单次剂量已限制为最大值 500mg (阿莫西林成分)')

  warnings.push('随餐服用，减少胃肠不适')

  return {
    recommendedDoseMg: effectiveMg,
    recommendedDoseVolume: calcVolume(effectiveMg, formulation.concentration),
    minDoseMg: minMg,
    maxDoseMg: maxSingleMg,
    maxDailyDoseMg: maxDailyMg,
    maxDailyTimes: 3,
    intervalHours: 8,
    warnings,
    unit: formulation.unit,
    courseNote: '每日3次，疗程通常5-10天，请遵医嘱',
    administrationNote: '随餐服用',
  }
}

function calcAzithromycin(weightKg: number, _ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (weightKg < 5) warnings.push('体重过低，请咨询医生')

  // Day 1: 10mg/kg, Day 2-5: 5mg/kg
  const day1Mg = roundDose(weightKg * 10)
  const day2Mg = roundDose(weightKg * 5)
  const effectiveDay1 = Math.min(day1Mg, 500)
  const effectiveDay2 = Math.min(day2Mg, 250)

  if (day1Mg > 500) warnings.push('首日剂量已限制为最大值 500mg')

  warnings.push('饭前1小时或饭后2小时服用')

  return {
    recommendedDoseMg: effectiveDay1,
    recommendedDoseVolume: calcVolume(effectiveDay1, formulation.concentration),
    minDoseMg: effectiveDay2,
    maxDoseMg: effectiveDay1,
    maxDailyDoseMg: effectiveDay1,
    maxDailyTimes: 1,
    intervalHours: 24,
    warnings,
    unit: formulation.unit,
    courseDays: 3,
    courseNote: `第1天：${effectiveDay1}mg，第2-3天：${effectiveDay2}mg（或连续3天每天${effectiveDay1}mg）`,
    administrationNote: '饭前1小时或饭后2小时',
  }
}

function calcMontelukast(_weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (ageMonths < 6) warnings.push('6月龄以下请咨询医生')

  let doseMg: number
  if (ageMonths < 72) doseMg = 4      // 6m - 5y
  else if (ageMonths < 180) doseMg = 5 // 6 - 14y
  else doseMg = 10                      // >= 15y

  warnings.push('不用于哮喘急性发作的治疗')

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: doseMg,
    maxDailyTimes: 1,
    intervalHours: 24,
    warnings,
    unit: formulation.unit,
    isAgeBased: true,
    administrationNote: '每日1次，晚间服用',
  }
}

function calcCetirizine(_weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (ageMonths < 6) warnings.push('6月龄以下不推荐使用')

  let doseMg: number
  let maxDaily: number
  let times: number

  if (ageMonths < 12) {
    doseMg = 2.5; maxDaily = 2.5; times = 1
  } else if (ageMonths < 72) {
    doseMg = 2.5; maxDaily = 5; times = 2
  } else if (ageMonths < 144) {
    doseMg = 5; maxDaily = 10; times = 2
  } else {
    doseMg = 10; maxDaily = 10; times = 1
  }

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: maxDaily,
    maxDailyTimes: times,
    intervalHours: times === 1 ? 24 : 12,
    warnings,
    unit: formulation.unit,
    isAgeBased: true,
  }
}

function calcLoratadine(weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []
  if (ageMonths < 24) warnings.push('2岁以下不推荐使用')

  const doseMg = (ageMonths < 72 && weightKg < 30) ? 5 : 10

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: doseMg,
    maxDailyTimes: 1,
    intervalHours: 24,
    warnings,
    unit: formulation.unit,
    isAgeBased: true,
  }
}

function calcORS(_weightKg: number, ageMonths: number, _formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []

  // 每次腹泻后补充量 (ml)
  let dosePerStool: number
  let maxDaily: number

  if (ageMonths < 6) {
    dosePerStool = 50; maxDaily = 500
  } else if (ageMonths < 24) {
    dosePerStool = 100; maxDaily = 1000
  } else if (ageMonths < 120) {
    dosePerStool = 150; maxDaily = 2000
  } else {
    dosePerStool = 200; maxDaily = 3000
  }

  warnings.push('一包溶于250ml温水，不要加糖')
  warnings.push('配制后24小时内使用，未用完需丢弃')

  // ORS 的剂量以 ml 为单位，不是 mg
  return {
    recommendedDoseMg: 0,
    recommendedDoseVolume: dosePerStool,
    minDoseMg: 0,
    maxDoseMg: 0,
    maxDailyDoseMg: 0,
    maxDailyTimes: 0,
    intervalHours: 0,
    warnings,
    unit: 'ml',
    isAgeBased: true,
    courseNote: `每次腹泻后补充 ${dosePerStool}ml，每日不超过 ${maxDaily}ml`,
    administrationNote: '少量多次喂服，每次腹泻后补充',
  }
}

function calcMontmorillonite(_weightKg: number, ageMonths: number, formulation: DrugFormulation): DosageResult {
  const warnings: string[] = []

  let doseMg: number
  let doseNote: string
  if (ageMonths < 12) {
    doseMg = 1000; doseNote = '1g (1/3包)'
  } else if (ageMonths < 24) {
    doseMg = 1500; doseNote = '1.5g (1/2包)'
  } else {
    doseMg = 3000; doseNote = '3g (1包)'
  }

  warnings.push('两餐之间服用')
  warnings.push('溶于50ml温水中服用')
  warnings.push('与其他药物间隔1-2小时')

  return {
    recommendedDoseMg: doseMg,
    recommendedDoseVolume: calcVolume(doseMg, formulation.concentration),
    minDoseMg: doseMg,
    maxDoseMg: doseMg,
    maxDailyDoseMg: doseMg * 3,
    maxDailyTimes: 3,
    intervalHours: 8,
    warnings,
    unit: formulation.unit,
    isAgeBased: true,
    courseNote: `每日3次，每次 ${doseNote}`,
    administrationNote: '两餐之间服用',
  }
}

// ============ Drug Registry ============

export const DRUG_REGISTRY: Record<DrugId, DrugInfo> = {
  ibuprofen: {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    chineseName: '布洛芬',
    brandNames: ['美林'],
    category: 'antipyretic',
    icon: '🌡️',
    color: '#FF9800',
    formulations: [
      { id: 'ibu_drops', name: '美林混悬滴剂 (40mg/ml)', concentration: 40, unit: 'ml' },
      { id: 'ibu_susp', name: '美林混悬液 (20mg/ml)', concentration: 20, unit: 'ml' },
      { id: 'ibu_gran', name: '布洛芬颗粒 (200mg/包)', concentration: 200, unit: '包' },
    ],
    intervalHours: 6,
    defaultReason: '退烧',
    requiresWeight: true,
    requiresAge: false,
    calculate: calcIbuprofen,
  },

  acetaminophen: {
    id: 'acetaminophen',
    genericName: 'Acetaminophen',
    chineseName: '对乙酰氨基酚',
    brandNames: ['泰诺林'],
    category: 'antipyretic',
    icon: '💧',
    color: '#2196F3',
    formulations: [
      { id: 'ace_drops', name: '泰诺林混悬滴剂 (100mg/ml)', concentration: 100, unit: 'ml' },
      { id: 'ace_susp', name: '泰诺林混悬液 (32mg/ml)', concentration: 32, unit: 'ml' },
      { id: 'ace_gran', name: '对乙酰氨基酚颗粒 (250mg/包)', concentration: 250, unit: '包' },
    ],
    intervalHours: 4,
    defaultReason: '退烧',
    requiresWeight: true,
    requiresAge: false,
    calculate: calcAcetaminophen,
  },

  oseltamivir: {
    id: 'oseltamivir',
    genericName: 'Oseltamivir',
    chineseName: '奥司他韦',
    brandNames: ['达菲', '可威'],
    category: 'antiviral',
    icon: '🦠',
    color: '#9C27B0',
    formulations: [
      { id: 'osel_gran', name: '奥司他韦颗粒 (15mg/包)', concentration: 15, unit: '包' },
      { id: 'osel_cap', name: '奥司他韦胶囊 (75mg/粒)', concentration: 75, unit: '粒' },
      { id: 'osel_susp', name: '奥司他韦干混悬剂 (12mg/ml)', concentration: 12, unit: 'ml' },
    ],
    intervalHours: 12,
    defaultReason: '流感',
    requiresWeight: true,
    requiresAge: true,
    calculate: calcOseltamivir,
  },

  baloxavir: {
    id: 'baloxavir',
    genericName: 'Baloxavir',
    chineseName: '玛巴洛沙韦',
    brandNames: ['速福达'],
    category: 'antiviral',
    icon: '💊',
    color: '#673AB7',
    formulations: [
      { id: 'bal_tab', name: '速福达片 (20mg/片)', concentration: 20, unit: '片' },
    ],
    intervalHours: null,
    defaultReason: '流感',
    requiresWeight: true,
    requiresAge: true,
    minAgeMonths: 60,
    calculate: calcBaloxavir,
  },

  amoxicillin_clavulanate: {
    id: 'amoxicillin_clavulanate',
    genericName: 'Amoxicillin-Clavulanate',
    chineseName: '阿莫西林克拉维酸钾',
    brandNames: ['安美汀', '力百汀'],
    category: 'antibiotic',
    icon: '🧬',
    color: '#00BCD4',
    formulations: [
      { id: 'amox_susp', name: '干混悬剂 7:1 (阿莫西林40mg/ml)', concentration: 40, unit: 'ml' },
      { id: 'amox_gran', name: '颗粒 4:1 (阿莫西林125mg/包)', concentration: 125, unit: '包' },
    ],
    intervalHours: 8,
    defaultReason: '细菌感染',
    requiresWeight: true,
    requiresAge: false,
    calculate: calcAmoxicillinClavulanate,
  },

  azithromycin: {
    id: 'azithromycin',
    genericName: 'Azithromycin',
    chineseName: '阿奇霉素',
    brandNames: ['希舒美'],
    category: 'antibiotic',
    icon: '💉',
    color: '#009688',
    formulations: [
      { id: 'azi_gran', name: '阿奇霉素干混悬剂 (100mg/包)', concentration: 100, unit: '包' },
      { id: 'azi_tab', name: '阿奇霉素片 (250mg/片)', concentration: 250, unit: '片' },
    ],
    intervalHours: 24,
    defaultReason: '细菌感染',
    requiresWeight: true,
    requiresAge: false,
    calculate: calcAzithromycin,
  },

  montelukast: {
    id: 'montelukast',
    genericName: 'Montelukast',
    chineseName: '孟鲁司特钠',
    brandNames: ['顺尔宁'],
    category: 'allergy',
    icon: '🌬️',
    color: '#4CAF50',
    formulations: [
      { id: 'mont_gran', name: '孟鲁司特钠颗粒 (4mg/包)', concentration: 4, unit: '包' },
      { id: 'mont_chew4', name: '孟鲁司特钠咀嚼片 (4mg/片)', concentration: 4, unit: '片' },
      { id: 'mont_chew5', name: '孟鲁司特钠咀嚼片 (5mg/片)', concentration: 5, unit: '片' },
      { id: 'mont_tab', name: '孟鲁司特钠片 (10mg/片)', concentration: 10, unit: '片' },
    ],
    intervalHours: 24,
    defaultReason: '过敏性鼻炎/哮喘预防',
    requiresWeight: false,
    requiresAge: true,
    minAgeMonths: 6,
    calculate: calcMontelukast,
  },

  cetirizine: {
    id: 'cetirizine',
    genericName: 'Cetirizine',
    chineseName: '西替利嗪',
    brandNames: ['仙特明', '畅迪'],
    category: 'allergy',
    icon: '🌸',
    color: '#E91E63',
    formulations: [
      { id: 'cet_drops', name: '西替利嗪滴剂 (10mg/ml)', concentration: 10, unit: 'ml' },
      { id: 'cet_syrup', name: '西替利嗪糖浆 (1mg/ml)', concentration: 1, unit: 'ml' },
      { id: 'cet_tab', name: '西替利嗪片 (10mg/片)', concentration: 10, unit: '片' },
    ],
    intervalHours: 12,
    defaultReason: '过敏',
    requiresWeight: false,
    requiresAge: true,
    minAgeMonths: 6,
    calculate: calcCetirizine,
  },

  loratadine: {
    id: 'loratadine',
    genericName: 'Loratadine',
    chineseName: '氯雷他定',
    brandNames: ['开瑞坦'],
    category: 'allergy',
    icon: '🌺',
    color: '#FF5722',
    formulations: [
      { id: 'lor_syrup', name: '氯雷他定糖浆 (1mg/ml)', concentration: 1, unit: 'ml' },
      { id: 'lor_tab', name: '氯雷他定片 (10mg/片)', concentration: 10, unit: '片' },
    ],
    intervalHours: 24,
    defaultReason: '过敏',
    requiresWeight: true,
    requiresAge: true,
    minAgeMonths: 24,
    calculate: calcLoratadine,
  },

  ors: {
    id: 'ors',
    genericName: 'ORS',
    chineseName: '口服补液盐 III',
    brandNames: ['口服补液盐III'],
    category: 'gi',
    icon: '💧',
    color: '#03A9F4',
    formulations: [
      { id: 'ors_powder', name: 'ORS III 散剂 (5.125g/包，溶于250ml)', concentration: 1, unit: 'ml' },
    ],
    intervalHours: null,
    defaultReason: '腹泻脱水',
    requiresWeight: false,
    requiresAge: true,
    calculate: calcORS,
  },

  montmorillonite: {
    id: 'montmorillonite',
    genericName: 'Montmorillonite',
    chineseName: '蒙脱石散',
    brandNames: ['思密达'],
    category: 'gi',
    icon: '🩹',
    color: '#795548',
    formulations: [
      { id: 'mont_powder', name: '蒙脱石散 (3g/包)', concentration: 3000, unit: '包' },
    ],
    intervalHours: 8,
    defaultReason: '腹泻',
    requiresWeight: false,
    requiresAge: true,
    calculate: calcMontmorillonite,
  },
}

// ============ 按分类获取药品 ============

export function getDrugsByCategory(): Record<DrugCategory, DrugInfo[]> {
  const result: Record<DrugCategory, DrugInfo[]> = {
    antipyretic: [],
    antiviral: [],
    antibiotic: [],
    allergy: [],
    gi: [],
  }
  for (const drug of Object.values(DRUG_REGISTRY)) {
    result[drug.category].push(drug)
  }
  return result
}

// ============ 向后兼容导出 ============

export const IBUPROFEN_FORMULATIONS = DRUG_REGISTRY.ibuprofen.formulations
export const ACETAMINOPHEN_FORMULATIONS = DRUG_REGISTRY.acetaminophen.formulations

export function calculateIbuprofenDose(
  weightKg: number,
  formulation: DrugFormulation
): DosageResult {
  return calcIbuprofen(weightKg, 0, formulation)
}

export function calculateAcetaminophenDose(
  weightKg: number,
  formulation: DrugFormulation
): DosageResult {
  return calcAcetaminophen(weightKg, 0, formulation)
}
