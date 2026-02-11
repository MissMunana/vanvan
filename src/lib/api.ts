import { useAuthStore } from '../stores/authStore'
import type {
  Child, Task, TaskCategory, HabitStage, Reward, RewardCategory, Exchange,
  PointLog, UnlockedBadge,
  GrowthRecord, TemperatureRecord, MedicationRecord, VaccinationRecord, MilestoneRecord,
  MilestoneStatus,
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
}

export interface CompleteTaskResult {
  task: Task
  earnedPoints: number
  bonusPoints: number
  consecutiveDays: number
  stageChanged: boolean
  newStage: HabitStage
  graduated: boolean
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
