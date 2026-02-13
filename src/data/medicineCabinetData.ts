import type { StorageCondition } from '../types'

export interface OpenedShelfLife {
  days: number
  note: string
}

export interface StorageRecommendation {
  condition: StorageCondition
  note: string
}

export const OPENED_SHELF_LIFE: Record<string, OpenedShelfLife> = {
  ibuprofen: { days: 14, note: '布洛芬混悬液开封后冷藏保存，14天内使用' },
  acetaminophen: { days: 14, note: '泰诺林混悬液开封后冷藏保存，14天内使用' },
  oseltamivir: { days: 17, note: '奥司他韦干混悬剂配制后冷藏，17天内使用' },
  cetirizine: { days: 30, note: '西替利嗪滴剂/糖浆开封后30天内使用' },
  loratadine: { days: 30, note: '氯雷他定糖浆开封后30天内使用' },
  amoxicillin_clavulanate: { days: 7, note: '阿莫西林克拉维酸钾干混悬剂配制后冷藏，7天内使用' },
  azithromycin: { days: 10, note: '阿奇霉素干混悬剂配制后室温保存，10天内使用' },
}

export const STORAGE_RECOMMENDATIONS: Record<string, StorageRecommendation> = {
  ibuprofen: { condition: 'room_temp', note: '避光密封保存，不超过30℃；混悬液开封后需冷藏' },
  acetaminophen: { condition: 'room_temp', note: '避光密封保存，不超过25℃；混悬液开封后需冷藏' },
  oseltamivir: { condition: 'room_temp', note: '胶囊/颗粒常温保存；干混悬剂配制后需冷藏(2-8℃)' },
  baloxavir: { condition: 'room_temp', note: '密封保存，不超过25℃' },
  amoxicillin_clavulanate: { condition: 'room_temp', note: '干燥保存；干混悬剂配制后需冷藏(2-8℃)' },
  azithromycin: { condition: 'room_temp', note: '密封保存，不超过25℃' },
  montelukast: { condition: 'room_temp', note: '避光密封保存' },
  cetirizine: { condition: 'room_temp', note: '避光密封保存' },
  loratadine: { condition: 'room_temp', note: '避光密封保存' },
  ors: { condition: 'room_temp', note: '干燥保存；配制后室温24小时内使用，未用完丢弃' },
  montmorillonite: { condition: 'room_temp', note: '密封干燥保存' },
}

export const QUANTITY_UNITS = ['盒', '瓶', '包', '片', '袋', '支']
