export interface ScreenTimeConfig {
  dailyLimitMinutes: number
  lockStartHour: number
  lockEndHour: number
  enabled: boolean
}

export interface Child {
  childId: string
  name: string
  gender: 'male' | 'female'
  birthday: string
  age: number
  ageGroup: '3-5' | '6-8' | '9-12'
  avatar: string
  totalPoints: number
  themeColor?: string
  settings: {
    soundEnabled: boolean
    vibrationEnabled: boolean
    screenTime: ScreenTimeConfig
  }
  createdAt: string
}

export const CHILD_THEME_COLORS = ['#FFB800', '#4ECDC4', '#FF6B6B', '#A8A8E6', '#95E1D3']

export interface AppState {
  currentChildId: string | null
  children: Child[]
  parentPin: string
  onboardingCompleted: boolean
}

export type TaskCategory = 'life' | 'study' | 'manner' | 'chore'

export type HabitStage = 'start' | 'persist' | 'stable' | 'graduated'

export interface Task {
  taskId: string
  childId: string
  name: string
  category: TaskCategory
  points: number
  icon: string
  description: string
  isActive: boolean
  frequency: 'daily' | 'weekly' | 'anytime'
  consecutiveDays: number
  lastCompletedDate: string | null
  completedToday: boolean
  stage: HabitStage
  totalCompletions: number
  createdAt: string
}

export interface PointLog {
  logId: string
  childId: string
  taskId: string | null
  type: 'earn' | 'spend' | 'adjust'
  points: number
  reason: string
  emotion: string | null
  operator: 'child' | 'parent'
  createdAt: string
}

export type RewardCategory = 'time' | 'privilege' | 'material'

export interface Reward {
  rewardId: string
  childId: string
  name: string
  category: RewardCategory
  points: number
  icon: string
  description: string
  limit: {
    type: 'daily' | 'weekly' | 'monthly' | 'unlimited'
    count: number
  }
  stock: number
  isActive: boolean
  createdAt: string
}

export type ExchangeStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface Exchange {
  exchangeId: string
  childId: string
  rewardId: string
  rewardName: string
  rewardIcon: string
  points: number
  status: ExchangeStatus
  requestedAt: string
  reviewedAt: string | null
  rejectReason: string | null
}

export interface AgeGroupConfig {
  fontSize: {
    title: string
    body: string
    points: string
    button: string
  }
  buttonSize: string
  iconSize: string
  animationLevel: 'full' | 'medium' | 'minimal'
}

export const CATEGORY_INFO: Record<TaskCategory, { label: string; icon: string }> = {
  life: { label: '生活习惯', icon: '🌙' },
  study: { label: '学习习惯', icon: '🔮' },
  manner: { label: '礼貌行为', icon: '🦄' },
  chore: { label: '家务帮助', icon: '⭐' },
}

export const REWARD_CATEGORY_INFO: Record<RewardCategory, { label: string; icon: string }> = {
  time: { label: '亲子时光', icon: '🌟' },
  privilege: { label: '小特权', icon: '🪐' },
  material: { label: '实物奖励', icon: '💫' },
}

export type BadgeCategory = 'habit' | 'points' | 'special'

export interface BadgeDefinition {
  badgeId: string
  name: string
  icon: string
  description: string
  category: BadgeCategory
}

export interface UnlockedBadge {
  childId: string
  badgeId: string
  unlockedAt: string
}

export const HABIT_STAGE_INFO: Record<HabitStage, { label: string; icon: string; description: string }> = {
  start: { label: '启动期', icon: '🌰', description: '1-7天，积分×1.5' },
  persist: { label: '坚持期', icon: '🌱', description: '8-21天，正常积分' },
  stable: { label: '稳定期', icon: '🌿', description: '22-66天，积分×0.8' },
  graduated: { label: '已毕业', icon: '🌸', description: '66天+，习惯大师' },
}

// ============ V2.0 健康管理模块类型 ============

export type MeasureMethod = 'ear' | 'forehead' | 'armpit' | 'rectal' | 'oral'

export type SymptomTag = 'cough' | 'runny_nose' | 'vomiting' | 'diarrhea' | 'rash' | 'lethargy' | 'headache' | 'sore_throat' | 'other'

export type DosageForm = 'suspension_drops' | 'suspension' | 'granules' | 'tablets' | 'suppository'

export type AdministrationRoute = 'oral' | 'topical' | 'rectal'

export type FeverLevel = 'normal' | 'low' | 'moderate' | 'high'

export type HealthTab = 'growth' | 'fever' | 'medication' | 'vaccine' | 'milestone'

export type GrowthMetric = 'height' | 'weight' | 'bmi' | 'headCircumference'

export interface GrowthRecord {
  recordId: string
  childId: string
  date: string
  ageInMonths: number
  height: number | null
  weight: number | null
  headCircumference: number | null
  bmi: number | null
  heightPercentile: number | null
  weightPercentile: number | null
  bmiPercentile: number | null
  note: string
  createdAt: string
}

export interface TemperatureRecord {
  recordId: string
  childId: string
  temperature: number
  measureMethod: MeasureMethod
  measureTime: string
  symptoms: SymptomTag[]
  note: string
  createdAt: string
}

export interface MedicationRecord {
  recordId: string
  childId: string
  drugName: string
  genericName: string
  dosageForm: DosageForm
  singleDose: number
  doseUnit: string
  administrationTime: string
  route: AdministrationRoute
  reason: string
  note: string
  createdAt: string
}

export interface VaccinationRecord {
  recordId: string
  childId: string
  vaccineName: string
  vaccineType: 'planned' | 'optional'
  doseNumber: number
  totalDoses: number
  date: string
  batchNumber: string
  site: string
  vaccinator: string
  reactions: VaccineReaction[]
  note: string
  createdAt: string
}

export interface VaccineReaction {
  type: string
  severity: 'mild' | 'moderate' | 'severe'
  duration: string
}

export type MilestoneStatus = 'not_started' | 'in_progress' | 'achieved'

export interface MilestoneRecord {
  recordId: string
  childId: string
  milestoneId: string
  status: MilestoneStatus
  achievedDate: string | null
  note: string
  photoTaken?: boolean
  photoNote?: string
  createdAt: string
}

export const FEVER_LEVEL_INFO: Record<FeverLevel, { label: string; color: string; range: string; advice: string }> = {
  normal: { label: '正常', color: '#4CAF50', range: '36.0-37.2℃', advice: '体温正常' },
  low: { label: '低中热', color: '#FFB800', range: '37.3-38.4℃', advice: '关注孩子精神状态，保持正常穿着，少量多次饮水' },
  moderate: { label: '中高热', color: '#FF9800', range: '38.5-39.9℃', advice: '如孩子明显不适，可考虑使用退烧药改善舒适度（遵医嘱）' },
  high: { label: '高热', color: '#FF5252', range: '≥40.0℃', advice: '建议使用退烧药并密切观察，如伴有严重症状请立即就医' },
}

export const SYMPTOM_TAG_INFO: Record<SymptomTag, { label: string; icon: string }> = {
  cough: { label: '咳嗽', icon: '🤧' },
  runny_nose: { label: '流涕', icon: '🤒' },
  vomiting: { label: '呕吐', icon: '🤮' },
  diarrhea: { label: '腹泻', icon: '💩' },
  rash: { label: '皮疹', icon: '🔴' },
  lethargy: { label: '精神差', icon: '😴' },
  headache: { label: '头痛', icon: '🤕' },
  sore_throat: { label: '嗓子痛', icon: '😣' },
  other: { label: '其他', icon: '📝' },
}

export const MEASURE_METHOD_INFO: Record<MeasureMethod, { label: string }> = {
  ear: { label: '耳温' },
  forehead: { label: '额温' },
  armpit: { label: '腋温' },
  rectal: { label: '肛温' },
  oral: { label: '口温' },
}
