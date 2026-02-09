export interface Child {
  childId: string
  name: string
  gender: 'male' | 'female'
  birthday: string
  age: number
  ageGroup: '3-5' | '6-8' | '9-12'
  avatar: string
  totalPoints: number
  settings: {
    soundEnabled: boolean
    vibrationEnabled: boolean
  }
  createdAt: string
}

export interface AppState {
  currentChildId: string | null
  children: Child[]
  parentPin: string
  onboardingCompleted: boolean
}

export type TaskCategory = 'life' | 'study' | 'manner' | 'chore'

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
  life: { label: '生活习惯', icon: '🌈' },
  study: { label: '学习习惯', icon: '📖' },
  manner: { label: '礼貌行为', icon: '🌸' },
  chore: { label: '家务帮助', icon: '🏠' },
}

export const REWARD_CATEGORY_INFO: Record<RewardCategory, { label: string; icon: string }> = {
  time: { label: '亲子时光', icon: '🥰' },
  privilege: { label: '小特权', icon: '👑' },
  material: { label: '实物奖励', icon: '🎁' },
}
