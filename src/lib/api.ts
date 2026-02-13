import { useAuthStore } from '../stores/authStore'
import type {
  Child, Task, TaskCategory, HabitStage, Reward, RewardCategory, Exchange,
  PointLog, UnlockedBadge,
  GrowthRecord, TemperatureRecord, MedicationRecord, VaccinationRecord, MilestoneRecord,
  MilestoneStatus, SleepRecord, EmergencyProfile, SafetyChecklistProgress,
  KnowledgeArticle, KnowledgeArticleSummary, KnowledgeBookmark,
  KnowledgeCategory, KnowledgeAgeGroup,
  MoodRecord, ConflictRecord, MoodStats,
  MedicineCabinetItem,
  FamilyMember, FamilyInvite, FamilyRole, HandoverLog,
} from '../types'

const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = useAuthStore.getState().session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(data.error || `Request failed: ${res.status}`, res.status)
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ---- Family ----
export interface FamilySettings {
  familyId: string
  parentPin: string
  onboardingCompleted: boolean
  completionCount: number
}

export const familyApi = {
  get: () => request<FamilySettings>('/family'),
  update: (data: Partial<Pick<FamilySettings, 'parentPin' | 'onboardingCompleted' | 'completionCount'>>) =>
    request<FamilySettings>('/family', { method: 'PUT', body: JSON.stringify(data) }),
  me: () => request<FamilyMember>('/family/me'),
  members: {
    list: () => request<FamilyMember[]>('/family/members'),
    invite: (role: FamilyRole) =>
      request<FamilyInvite>('/family/members', { method: 'POST', body: JSON.stringify({ role }) }),
    updateRole: (memberId: string, role: FamilyRole) =>
      request<FamilyMember>(`/family/members/${memberId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
    remove: (memberId: string) =>
      request<void>(`/family/members/${memberId}`, { method: 'DELETE' }),
  },
  join: (inviteCode: string) =>
    request<FamilyMember>('/family/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  handovers: {
    list: (childId?: string, startDate?: string) => {
      const params = new URLSearchParams()
      if (childId) params.set('childId', childId)
      if (startDate) params.set('startDate', startDate)
      const qs = params.toString()
      return request<HandoverLog[]>(`/family/handovers${qs ? `?${qs}` : ''}`)
    },
    create: (data: Omit<HandoverLog, 'logId' | 'familyId' | 'createdAt' | 'updatedAt'>) =>
      request<HandoverLog>('/family/handovers', { method: 'POST', body: JSON.stringify(data) }),
    update: (logId: string, data: Partial<HandoverLog>) =>
      request<HandoverLog>(`/family/handovers/${logId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (logId: string) =>
      request<void>(`/family/handovers/${logId}`, { method: 'DELETE' }),
  },
}

// ---- Children ----
export interface CreateChildInput {
  name: string
  gender: 'male' | 'female'
  birthday: string
  avatar: string
}

export interface UpdateChildInput {
  name?: string
  gender?: 'male' | 'female'
  birthday?: string
  avatar?: string
  themeColor?: string
  settings?: Child['settings']
}

export const childrenApi = {
  list: () => request<Child[]>('/children'),
  get: (childId: string) => request<Child>(`/children/${childId}`),
  create: (data: CreateChildInput) =>
    request<Child>('/children', { method: 'POST', body: JSON.stringify(data) }),
  update: (childId: string, data: UpdateChildInput) =>
    request<Child>(`/children/${childId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (childId: string) =>
    request<void>(`/children/${childId}`, { method: 'DELETE' }),
  updatePoints: (childId: string, delta: number) =>
    request<{ totalPoints: number }>(`/children/${childId}/points`, {
      method: 'POST', body: JSON.stringify({ delta }),
    }),
}

// ---- Tasks ----
export interface CreateTaskInput {
  childId: string
  name: string
  category: TaskCategory
  points: number
  icon: string
  description: string
  isActive: boolean
  frequency: 'daily' | 'weekly' | 'anytime'
  isFamilyTask?: boolean
  requiresParentConfirm?: boolean
}

export interface CompleteTaskResult {
  task: Task
  earnedPoints: number
  bonusPoints: number
  consecutiveDays: number
  stageChanged: boolean
  newStage: HabitStage
  graduated: boolean
  pointLog: PointLog | null
  totalPoints: number | null
  awaitingConfirm?: boolean
}

export interface ConfirmTaskResult {
  task: Task
  earnedPoints: number
  pointLog: PointLog
  totalPoints: number
}

export const tasksApi = {
  list: (childId: string) => request<Task[]>(`/children/${childId}/tasks`),
  create: (data: CreateTaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  createBatch: (tasks: CreateTaskInput[]) =>
    request<Task[]>('/tasks/batch', { method: 'POST', body: JSON.stringify({ tasks }) }),
  update: (taskId: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),
  complete: (taskId: string) =>
    request<CompleteTaskResult>(`/tasks/${taskId}/complete`, { method: 'POST' }),
  undoComplete: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/undo`, { method: 'POST' }),
  confirmTask: (taskId: string) =>
    request<ConfirmTaskResult>(`/tasks/${taskId}/confirm`, { method: 'POST' }),
}

// ---- Rewards ----
export interface CreateRewardInput {
  childId: string
  name: string
  category: RewardCategory
  points: number
  icon: string
  description: string
  limit: { type: 'daily' | 'weekly' | 'monthly' | 'unlimited'; count: number }
  stock: number
  isActive: boolean
}

export const rewardsApi = {
  list: (childId: string) => request<Reward[]>(`/children/${childId}/rewards`),
  create: (data: CreateRewardInput) =>
    request<Reward>('/rewards', { method: 'POST', body: JSON.stringify(data) }),
  createBatch: (rewards: CreateRewardInput[]) =>
    request<Reward[]>('/rewards/batch', { method: 'POST', body: JSON.stringify({ rewards }) }),
  update: (rewardId: string, data: Partial<Reward>) =>
    request<Reward>(`/rewards/${rewardId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (rewardId: string) =>
    request<void>(`/rewards/${rewardId}`, { method: 'DELETE' }),
}

// ---- Exchanges ----
export interface CreateExchangeInput {
  childId: string
  rewardId: string
  rewardName: string
  rewardIcon: string
  points: number
}

export interface ReviewExchangeInput {
  status: 'approved' | 'rejected'
  rejectReason?: string
}

export const exchangesApi = {
  list: (childId: string) => request<Exchange[]>(`/children/${childId}/exchanges`),
  listPending: () => request<Exchange[]>('/exchanges/pending'),
  create: (data: CreateExchangeInput) =>
    request<Exchange>('/exchanges', { method: 'POST', body: JSON.stringify(data) }),
  review: (exchangeId: string, data: ReviewExchangeInput) =>
    request<Exchange>(`/exchanges/${exchangeId}/review`, { method: 'POST', body: JSON.stringify(data) }),
}

// ---- Point Logs ----
export interface CreatePointLogInput {
  childId: string
  taskId?: string | null
  type: 'earn' | 'spend' | 'adjust'
  points: number
  reason: string
  emotion?: string | null
  operator: 'child' | 'parent'
}

export const pointLogsApi = {
  list: (childId: string, limit = 200) =>
    request<PointLog[]>(`/children/${childId}/point-logs?limit=${limit}`),
  create: (data: CreatePointLogInput) =>
    request<{ log: PointLog; totalPoints: number }>('/point-logs', { method: 'POST', body: JSON.stringify(data) }),
}

// ---- Badges ----
export const badgesApi = {
  list: (childId: string) => request<UnlockedBadge[]>(`/children/${childId}/badges`),
  unlock: (childId: string, badgeId: string) =>
    request<UnlockedBadge>('/badges', { method: 'POST', body: JSON.stringify({ childId, badgeId }) }),
}

// ---- Health ----
export const healthApi = {
  growth: {
    list: (childId: string) => request<GrowthRecord[]>(`/children/${childId}/health/growth`),
    create: (data: Omit<GrowthRecord, 'recordId' | 'createdAt'>) =>
      request<GrowthRecord>('/health/growth', { method: 'POST', body: JSON.stringify(data) }),
    update: (recordId: string, data: Partial<GrowthRecord>) =>
      request<GrowthRecord>(`/health/growth/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (recordId: string) =>
      request<void>(`/health/growth/${recordId}`, { method: 'DELETE' }),
  },
  temperature: {
    list: (childId: string, hours?: number) =>
      request<TemperatureRecord[]>(`/children/${childId}/health/temperature${hours ? `?hours=${hours}` : ''}`),
    create: (data: Omit<TemperatureRecord, 'recordId' | 'createdAt'>) =>
      request<TemperatureRecord>('/health/temperature', { method: 'POST', body: JSON.stringify(data) }),
    delete: (recordId: string) =>
      request<void>(`/health/temperature/${recordId}`, { method: 'DELETE' }),
  },
  medication: {
    list: (childId: string) => request<MedicationRecord[]>(`/children/${childId}/health/medication`),
    create: (data: Omit<MedicationRecord, 'recordId' | 'createdAt'>) =>
      request<MedicationRecord>('/health/medication', { method: 'POST', body: JSON.stringify(data) }),
    delete: (recordId: string) =>
      request<void>(`/health/medication/${recordId}`, { method: 'DELETE' }),
  },
  vaccination: {
    list: (childId: string) => request<VaccinationRecord[]>(`/children/${childId}/health/vaccination`),
    create: (data: Omit<VaccinationRecord, 'recordId' | 'createdAt'>) =>
      request<VaccinationRecord>('/health/vaccination', { method: 'POST', body: JSON.stringify(data) }),
    delete: (recordId: string) =>
      request<void>(`/health/vaccination/${recordId}`, { method: 'DELETE' }),
  },
  milestone: {
    list: (childId: string) => request<MilestoneRecord[]>(`/children/${childId}/health/milestone`),
    upsert: (data: { childId: string; milestoneId: string; status: MilestoneStatus; note?: string; photoTaken?: boolean; photoNote?: string }) =>
      request<MilestoneRecord>('/health/milestone', { method: 'POST', body: JSON.stringify(data) }),
  },
  sleep: {
    list: (childId: string) => request<SleepRecord[]>(`/children/${childId}/health/sleep`),
    create: (data: Omit<SleepRecord, 'recordId' | 'createdAt'>) =>
      request<SleepRecord>('/health/sleep', { method: 'POST', body: JSON.stringify(data) }),
    update: (recordId: string, data: Partial<SleepRecord>) =>
      request<SleepRecord>(`/health/sleep/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (recordId: string) =>
      request<void>(`/health/sleep/${recordId}`, { method: 'DELETE' }),
  },
  cabinet: {
    list: () => request<MedicineCabinetItem[]>('/health/cabinet'),
    create: (data: Omit<MedicineCabinetItem, 'itemId' | 'familyId' | 'createdAt' | 'updatedAt'>) =>
      request<MedicineCabinetItem>('/health/cabinet', { method: 'POST', body: JSON.stringify(data) }),
    update: (itemId: string, data: Partial<MedicineCabinetItem>) =>
      request<MedicineCabinetItem>(`/health/cabinet/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (itemId: string) =>
      request<void>(`/health/cabinet/${itemId}`, { method: 'DELETE' }),
  },
}

// ---- Emergency ----
export const emergencyApi = {
  profile: {
    get: (childId: string) => request<EmergencyProfile | null>(`/children/${childId}/emergency/profile`),
    upsert: (data: Omit<EmergencyProfile, 'profileId' | 'createdAt' | 'updatedAt'>) =>
      request<EmergencyProfile>('/health/emergency-profile', { method: 'POST', body: JSON.stringify(data) }),
  },
  checklist: {
    list: (childId: string) => request<SafetyChecklistProgress[]>(`/children/${childId}/emergency/checklist`),
    toggle: (childId: string, checklistItemId: string, completed: boolean) =>
      request<SafetyChecklistProgress>('/health/emergency-checklist', {
        method: 'POST', body: JSON.stringify({ childId, checklistItemId, completed }),
      }),
  },
}

// ---- Knowledge ----
export interface KnowledgeListParams {
  category?: KnowledgeCategory
  ageGroup?: KnowledgeAgeGroup
  search?: string
}

export const knowledgeApi = {
  articles: {
    list: (params?: KnowledgeListParams) => {
      const sp = new URLSearchParams()
      if (params?.category) sp.set('category', params.category)
      if (params?.ageGroup) sp.set('ageGroup', params.ageGroup)
      if (params?.search) sp.set('search', params.search)
      const qs = sp.toString()
      return request<KnowledgeArticleSummary[]>(`/knowledge/articles${qs ? `?${qs}` : ''}`)
    },
    get: (articleId: string) =>
      request<KnowledgeArticle>(`/knowledge/articles/${articleId}`),
  },
  bookmarks: {
    list: () => request<KnowledgeBookmark[]>('/knowledge/bookmarks'),
    create: (articleId: string) =>
      request<KnowledgeBookmark>('/knowledge/bookmarks', {
        method: 'POST', body: JSON.stringify({ articleId }),
      }),
    remove: (articleId: string) =>
      request<void>(`/knowledge/bookmarks/${articleId}`, { method: 'DELETE' }),
  },
}

// ---- Emotion ----
export const emotionApi = {
  moods: {
    list: (childId: string) => request<MoodRecord[]>(`/children/${childId}/health/moods`),
    create: (data: Omit<MoodRecord, 'recordId' | 'createdAt'>) =>
      request<MoodRecord>('/health/moods', { method: 'POST', body: JSON.stringify(data) }),
    stats: (childId: string) => request<MoodStats>(`/health/moods/stats?childId=${childId}`),
    delete: (recordId: string) =>
      request<void>(`/health/moods/${recordId}`, { method: 'DELETE' }),
  },
  conflicts: {
    list: (childId: string) => request<ConflictRecord[]>(`/children/${childId}/health/conflicts`),
    create: (data: Omit<ConflictRecord, 'conflictId' | 'createdAt' | 'updatedAt'>) =>
      request<ConflictRecord>('/health/conflicts', { method: 'POST', body: JSON.stringify(data) }),
    update: (conflictId: string, data: Partial<ConflictRecord>) =>
      request<ConflictRecord>(`/health/conflicts/${conflictId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (conflictId: string) =>
      request<void>(`/health/conflicts/${conflictId}`, { method: 'DELETE' }),
  },
}

// ---- Onboarding (batch) ----
export interface OnboardingInput {
  child: CreateChildInput
  parentPin: string
  tasks: Omit<CreateTaskInput, 'childId'>[]
  rewards: Omit<CreateRewardInput, 'childId'>[]
}

export interface OnboardingResult {
  child: Child
  tasks: Task[]
  rewards: Reward[]
  family: FamilySettings
}

export const onboardingApi = {
  setup: (data: OnboardingInput) =>
    request<OnboardingResult>('/onboarding', { method: 'POST', body: JSON.stringify(data) }),
}
