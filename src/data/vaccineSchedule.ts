export type VaccineCategory = 'planned' | 'optional'

export interface VaccineScheduleItem {
  id: string
  name: string
  category: VaccineCategory
  doseNumber: number
  totalDoses: number
  recommendedAgeMonths: number
  ageRangeLabel: string
  description: string
}

// 国家免疫规划疫苗（2024版）
export const PLANNED_VACCINES: VaccineScheduleItem[] = [
  { id: 'hepb_1', name: '乙肝疫苗', category: 'planned', doseNumber: 1, totalDoses: 3, recommendedAgeMonths: 0, ageRangeLabel: '出生时', description: '预防乙型肝炎' },
  { id: 'bcg', name: '卡介苗', category: 'planned', doseNumber: 1, totalDoses: 1, recommendedAgeMonths: 0, ageRangeLabel: '出生时', description: '预防结核病' },
  { id: 'hepb_2', name: '乙肝疫苗', category: 'planned', doseNumber: 2, totalDoses: 3, recommendedAgeMonths: 1, ageRangeLabel: '1月龄', description: '预防乙型肝炎' },
  { id: 'ipv_1', name: '脊灰灭活疫苗', category: 'planned', doseNumber: 1, totalDoses: 4, recommendedAgeMonths: 2, ageRangeLabel: '2月龄', description: '预防脊髓灰质炎' },
  { id: 'ipv_2', name: '脊灰灭活疫苗', category: 'planned', doseNumber: 2, totalDoses: 4, recommendedAgeMonths: 3, ageRangeLabel: '3月龄', description: '预防脊髓灰质炎' },
  { id: 'dpt_1', name: '百白破疫苗', category: 'planned', doseNumber: 1, totalDoses: 4, recommendedAgeMonths: 3, ageRangeLabel: '3月龄', description: '预防百日咳、白喉、破伤风' },
  { id: 'opv_3', name: '脊灰减毒活疫苗', category: 'planned', doseNumber: 3, totalDoses: 4, recommendedAgeMonths: 4, ageRangeLabel: '4月龄', description: '预防脊髓灰质炎' },
  { id: 'dpt_2', name: '百白破疫苗', category: 'planned', doseNumber: 2, totalDoses: 4, recommendedAgeMonths: 4, ageRangeLabel: '4月龄', description: '预防百日咳、白喉、破伤风' },
  { id: 'dpt_3', name: '百白破疫苗', category: 'planned', doseNumber: 3, totalDoses: 4, recommendedAgeMonths: 5, ageRangeLabel: '5月龄', description: '预防百日咳、白喉、破伤风' },
  { id: 'hepb_3', name: '乙肝疫苗', category: 'planned', doseNumber: 3, totalDoses: 3, recommendedAgeMonths: 6, ageRangeLabel: '6月龄', description: '预防乙型肝炎' },
  { id: 'mena_1', name: 'A群流脑多糖疫苗', category: 'planned', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 6, ageRangeLabel: '6月龄', description: '预防A群脑膜炎球菌' },
  { id: 'mmr_1', name: '麻腮风疫苗', category: 'planned', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 8, ageRangeLabel: '8月龄', description: '预防麻疹、腮腺炎、风疹' },
  { id: 'je_1', name: '乙脑减毒活疫苗', category: 'planned', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 8, ageRangeLabel: '8月龄', description: '预防流行性乙型脑炎' },
  { id: 'mena_2', name: 'A群流脑多糖疫苗', category: 'planned', doseNumber: 2, totalDoses: 2, recommendedAgeMonths: 9, ageRangeLabel: '9月龄', description: '预防A群脑膜炎球菌' },
  { id: 'mmr_2', name: '麻腮风疫苗', category: 'planned', doseNumber: 2, totalDoses: 2, recommendedAgeMonths: 18, ageRangeLabel: '18月龄', description: '预防麻疹、腮腺炎、风疹' },
  { id: 'dpt_4', name: '百白破疫苗', category: 'planned', doseNumber: 4, totalDoses: 4, recommendedAgeMonths: 18, ageRangeLabel: '18月龄', description: '预防百日咳、白喉、破伤风' },
  { id: 'hepa', name: '甲肝减毒活疫苗', category: 'planned', doseNumber: 1, totalDoses: 1, recommendedAgeMonths: 18, ageRangeLabel: '18月龄', description: '预防甲型肝炎' },
  { id: 'je_2', name: '乙脑减毒活疫苗', category: 'planned', doseNumber: 2, totalDoses: 2, recommendedAgeMonths: 24, ageRangeLabel: '2岁', description: '预防流行性乙型脑炎' },
  { id: 'menac_1', name: 'A群C群流脑多糖疫苗', category: 'planned', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 36, ageRangeLabel: '3岁', description: '预防A群C群脑膜炎球菌' },
  { id: 'opv_4', name: '脊灰减毒活疫苗', category: 'planned', doseNumber: 4, totalDoses: 4, recommendedAgeMonths: 48, ageRangeLabel: '4岁', description: '预防脊髓灰质炎' },
  { id: 'dt', name: '白破疫苗', category: 'planned', doseNumber: 1, totalDoses: 1, recommendedAgeMonths: 72, ageRangeLabel: '6岁', description: '预防白喉、破伤风' },
  { id: 'menac_2', name: 'A群C群流脑多糖疫苗', category: 'planned', doseNumber: 2, totalDoses: 2, recommendedAgeMonths: 72, ageRangeLabel: '6岁', description: '预防A群C群脑膜炎球菌' },
]

// 非免疫规划疫苗（自愿自费）
export const OPTIONAL_VACCINES: VaccineScheduleItem[] = [
  { id: 'pcv13', name: '13价肺炎球菌疫苗', category: 'optional', doseNumber: 1, totalDoses: 4, recommendedAgeMonths: 2, ageRangeLabel: '2-15月龄', description: 'WHO推荐，预防肺炎球菌感染，约700元/剂' },
  { id: 'rv', name: '轮状病毒疫苗', category: 'optional', doseNumber: 1, totalDoses: 3, recommendedAgeMonths: 2, ageRangeLabel: '2-6月龄起', description: '预防轮状病毒腹泻，约200-300元/剂' },
  { id: 'flu', name: '流感疫苗', category: 'optional', doseNumber: 1, totalDoses: 1, recommendedAgeMonths: 6, ageRangeLabel: '≥6月龄，每年', description: '建议每年接种，约100-200元/剂' },
  { id: 'varicella', name: '水痘疫苗', category: 'optional', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 12, ageRangeLabel: '12月龄起', description: '部分地区已纳入免疫规划，约150-200元/剂' },
  { id: 'ev71', name: '手足口病疫苗(EV71)', category: 'optional', doseNumber: 1, totalDoses: 2, recommendedAgeMonths: 6, ageRangeLabel: '6月龄-5岁', description: '预防EV71型重症手足口，约200元/剂' },
]

export const ALL_VACCINES = [...PLANNED_VACCINES, ...OPTIONAL_VACCINES]
