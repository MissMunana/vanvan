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
  isFamilyTask: boolean
  requiresParentConfirm: boolean
  parentConfirmed: boolean
  parentConfirmedBy: string | null
  parentConfirmedAt: string | null
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
  operatorUserId: string | null
  operatorName: string
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

export type DosageForm = 'suspension_drops' | 'suspension' | 'granules' | 'tablets' | 'suppository' | 'capsules' | 'chewable_tablets' | 'syrup' | 'powder'

export type AdministrationRoute = 'oral' | 'topical' | 'rectal'

export type FeverLevel = 'normal' | 'low' | 'moderate' | 'high'

export type HealthTab = 'growth' | 'fever' | 'medication' | 'vaccine' | 'milestone' | 'sleep' | 'cabinet'

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

// ============ V2.5 睡眠管理类型 ============

export type SleepQuality = 'great' | 'good' | 'fair' | 'poor'

export interface NapRecord {
  startTime: string
  endTime: string
  durationMinutes: number
}

export interface SleepRecord {
  recordId: string
  childId: string
  date: string
  bedTime: string | null
  sleepTime: string | null
  wakeTime: string | null
  getUpTime: string | null
  durationMinutes: number | null
  naps: NapRecord[]
  totalNapMinutes: number
  sleepQuality: SleepQuality
  note: string
  createdAt: string
}

export const SLEEP_QUALITY_INFO: Record<SleepQuality, { label: string; icon: string; color: string }> = {
  great: { label: '很好', icon: '😴', color: '#4CAF50' },
  good: { label: '良好', icon: '🙂', color: '#8BC34A' },
  fair: { label: '一般', icon: '😐', color: '#FFB800' },
  poor: { label: '较差', icon: '😟', color: '#FF5252' },
}

// ============ V2.5 应急安全类型 ============

export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'unknown'
export type RhFactor = 'positive' | 'negative' | 'unknown'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
}

export interface EmergencyProfile {
  profileId: string
  childId: string
  bloodType: BloodType
  rhFactor: RhFactor
  drugAllergies: string[]
  foodAllergies: string[]
  otherAllergies: string[]
  medicalConditions: string[]
  emergencyContacts: EmergencyContact[]
  preferredHospital: string
  hospitalAddress: string
  hospitalPhone: string
  insuranceInfo: string
  note: string
  updatedAt: string
  createdAt: string
}

export type SafetyAgeGroup = '0-1' | '1-3' | '3-6' | '6-12'

export interface SafetyChecklistItem {
  id: string
  ageGroup: SafetyAgeGroup
  category: string
  text: string
  priority: 'high' | 'medium'
}

export interface SafetyChecklistProgress {
  id: string
  childId: string
  checklistItemId: string
  completed: boolean
  completedAt: string | null
  createdAt: string
}

export interface FirstAidStep {
  stepNumber: number
  title: string
  description: string
  icon?: string
}

export interface FirstAidGuide {
  id: string
  title: string
  icon: string
  severity: 'common' | 'urgent' | 'emergency'
  ageNotes?: Record<string, string>
  steps: FirstAidStep[]
  warnings: string[]
  whenToCallEmergency: string[]
}

export const BLOOD_TYPE_INFO: Record<BloodType, { label: string }> = {
  A: { label: 'A型' },
  B: { label: 'B型' },
  AB: { label: 'AB型' },
  O: { label: 'O型' },
  unknown: { label: '未知' },
}

export const SAFETY_AGE_GROUP_INFO: Record<SafetyAgeGroup, { label: string; description: string }> = {
  '0-1': { label: '0-1岁', description: '新生儿和婴儿安全' },
  '1-3': { label: '1-3岁', description: '学步期安全' },
  '3-6': { label: '3-6岁', description: '学前期安全' },
  '6-12': { label: '6-12岁', description: '学龄期安全' },
}

// ============ V2.5 循证育儿知识库类型 ============

export type KnowledgeCategory = 'age_guide' | 'behavior' | 'illness_care' | 'myth_busting'

export type KnowledgeAgeGroup = '0-1' | '1-3' | '3-6' | '6-12'

export type EvidenceLevel = 'systematic_review' | 'guideline' | 'rct' | 'expert_consensus'

export interface KnowledgeArticle {
  articleId: string
  category: KnowledgeCategory
  ageGroup: KnowledgeAgeGroup | null
  title: string
  summary: string
  content: string
  icon: string
  tags: string[]
  sourceName: string
  sourceLevel: EvidenceLevel
  sourceUrl: string | null
  relatedArticleIds: string[]
  sortOrder: number
  isPublished: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export type KnowledgeArticleSummary = Omit<KnowledgeArticle, 'content'>

export interface KnowledgeBookmark {
  id: string
  familyId: string
  articleId: string
  createdAt: string
}

export const KNOWLEDGE_CATEGORY_INFO: Record<KnowledgeCategory, { label: string; icon: string }> = {
  age_guide: { label: '分龄指南', icon: '👶' },
  behavior: { label: '行为管理', icon: '🧠' },
  illness_care: { label: '疾病护理', icon: '🏥' },
  myth_busting: { label: '科学辟谣', icon: '🔬' },
}

export const KNOWLEDGE_AGE_GROUP_INFO: Record<KnowledgeAgeGroup, { label: string; description: string }> = {
  '0-1': { label: '0-1岁', description: '婴儿期' },
  '1-3': { label: '1-3岁', description: '幼儿期' },
  '3-6': { label: '3-6岁', description: '学龄前期' },
  '6-12': { label: '6-12岁', description: '学龄期' },
}

export const EVIDENCE_LEVEL_INFO: Record<EvidenceLevel, { label: string; stars: number; description: string }> = {
  systematic_review: { label: '系统综述', stars: 5, description: 'Cochrane Review等' },
  guideline: { label: '权威指南', stars: 5, description: 'AAP/WHO/中华医学会' },
  rct: { label: '随机对照试验', stars: 4, description: '发表于权威期刊' },
  expert_consensus: { label: '专家共识', stars: 3, description: '中国专家共识' },
}

// ============ V2.5 情绪心理发展模块 ============

export type MoodValue = 'joy' | 'sadness' | 'anger' | 'fear' | 'calm'

export type EmotionAgeGroup = '3-5' | '6-8' | '9-12'

export interface MoodRecord {
  recordId: string
  childId: string
  date: string
  moodValue: MoodValue
  moodEmoji: string
  moodLabel: string
  subEmotion: string | null
  reason: string | null
  journalEntry: string | null
  ageGroup: EmotionAgeGroup
  createdAt: string
}

export type ConflictStatus = 'recorded' | 'resolved' | 'reminded'

export interface ConflictRecord {
  conflictId: string
  childId: string
  date: string
  description: string
  childFeeling: string
  parentFeeling: string
  agreements: string[]
  status: ConflictStatus
  note: string
  createdAt: string
  updatedAt: string
}

export interface MoodStats {
  distribution: Record<MoodValue, number>
  records: { date: string; mood_value: MoodValue }[]
  totalDays: number
}

export const MOOD_VALUE_INFO: Record<MoodValue, { label: string; color: string }> = {
  joy: { label: '快乐', color: '#FFD700' },
  sadness: { label: '悲伤', color: '#6495ED' },
  anger: { label: '愤怒', color: '#FF6347' },
  fear: { label: '恐惧', color: '#9370DB' },
  calm: { label: '平静', color: '#90EE90' },
}

export const CONFLICT_STATUS_INFO: Record<ConflictStatus, { label: string; color: string }> = {
  recorded: { label: '已记录', color: '#FFB800' },
  resolved: { label: '已解决', color: '#4CAF50' },
  reminded: { label: '已提醒', color: '#2196F3' },
}

// ============ V3.0 家庭药箱管理类型 ============

export type StorageCondition = 'room_temp' | 'refrigerate' | 'cool_dark' | 'other'

export interface MedicineCabinetItem {
  itemId: string
  familyId: string
  name: string
  genericName: string
  quantity: number
  quantityUnit: string
  expiryDate: string
  openedDate: string | null
  openedShelfLifeDays: number | null
  storageCondition: StorageCondition
  storageNote: string
  purchaseDate: string | null
  batchNumber: string
  note: string
  createdAt: string
  updatedAt: string
}

export const STORAGE_CONDITION_INFO: Record<StorageCondition, { label: string; icon: string }> = {
  room_temp: { label: '常温', icon: '🏠' },
  refrigerate: { label: '冷藏', icon: '❄️' },
  cool_dark: { label: '阴凉避光', icon: '🌑' },
  other: { label: '其他', icon: '📦' },
}

// ============ V3.0 家庭协作类型 ============

export type FamilyRole = 'admin' | 'co_admin' | 'observer'

export interface FamilyMember {
  memberId: string
  familyId: string
  userId: string
  role: FamilyRole
  displayName: string
  avatar: string
  invitedBy: string | null
  joinedAt: string
  createdAt: string
}

export interface FamilyInvite {
  inviteId: string
  familyId: string
  inviteCode: string
  role: FamilyRole
  invitedBy: string
  usedBy: string | null
  expiresAt: string
  createdAt: string
}

export const FAMILY_ROLE_INFO: Record<FamilyRole, { label: string; icon: string; description: string }> = {
  admin: { label: '主管理员', icon: '👑', description: '全部权限，管理成员' },
  co_admin: { label: '协管理员', icon: '🤝', description: '日常操作，不可删除/管理成员' },
  observer: { label: '观察者', icon: '👀', description: '查看数据，记录交接日志' },
}

export const ROLE_PERMISSIONS: Record<FamilyRole, {
  canManageTasks: boolean
  canManageRewards: boolean
  canAdjustPoints: boolean
  canReviewExchanges: boolean
  canManageChildren: boolean
  canManageMembers: boolean
  canDeleteData: boolean
  canChangeSettings: boolean
  canCreateHandoverLog: boolean
  canViewAllData: boolean
}> = {
  admin: {
    canManageTasks: true, canManageRewards: true, canAdjustPoints: true,
    canReviewExchanges: true, canManageChildren: true, canManageMembers: true,
    canDeleteData: true, canChangeSettings: true, canCreateHandoverLog: true, canViewAllData: true,
  },
  co_admin: {
    canManageTasks: true, canManageRewards: true, canAdjustPoints: true,
    canReviewExchanges: true, canManageChildren: false, canManageMembers: false,
    canDeleteData: false, canChangeSettings: false, canCreateHandoverLog: true, canViewAllData: true,
  },
  observer: {
    canManageTasks: false, canManageRewards: false, canAdjustPoints: false,
    canReviewExchanges: false, canManageChildren: false, canManageMembers: false,
    canDeleteData: false, canChangeSettings: false, canCreateHandoverLog: true, canViewAllData: true,
  },
}

// ============ V3.0 交接日志类型 ============

export type HandoverPriority = 'normal' | 'important' | 'urgent'

export interface HandoverLog {
  logId: string
  familyId: string
  childId: string
  authorUserId: string
  authorName: string
  date: string
  tasksSummary: string
  mealsSummary: string
  sleepSummary: string
  healthSummary: string
  specialNotes: string
  priority: HandoverPriority
  createdAt: string
  updatedAt: string
}

export const HANDOVER_PRIORITY_INFO: Record<HandoverPriority, { label: string; icon: string; color: string }> = {
  normal: { label: '普通', icon: '🟢', color: '#4CAF50' },
  important: { label: '重要', icon: '🟡', color: '#FFB800' },
  urgent: { label: '紧急', icon: '🔴', color: '#FF5252' },
}
