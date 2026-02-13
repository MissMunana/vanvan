import type { BadgeDefinition, Task, PointLog, Child } from '../types'
import { toLocalDateStr } from '../utils/generateId'

export interface BadgeContext {
  child: Child
  tasks: Task[]
  logs: PointLog[]
  unlockedBadgeIds: string[]
}

export type BadgeChecker = (ctx: BadgeContext) => boolean

export interface BadgeWithChecker extends BadgeDefinition {
  check: BadgeChecker
}

function getWeekLogs(logs: PointLog[], childId: string, weeksAgo: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay() - weeksAgo * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  const startStr = start.toISOString()
  const endStr = end.toISOString()
  return logs.filter((l) => l.childId === childId && l.createdAt >= startStr && l.createdAt < endStr)
}

export const BADGE_LIST: BadgeWithChecker[] = [
  // Habit badges
  {
    badgeId: 'starter',
    name: '启动者',
    icon: '🌱',
    description: '第一次完成任务',
    category: 'habit',
    check: ({ tasks }) => tasks.some((t) => (t.totalCompletions || 0) > 0),
  },
  {
    badgeId: 'persister',
    name: '坚持者',
    icon: '🔥',
    description: '任意任务连续完成7天',
    category: 'habit',
    check: ({ tasks }) => tasks.some((t) => t.consecutiveDays >= 7),
  },
  {
    badgeId: 'expert',
    name: '习惯达人',
    icon: '⭐',
    description: '任意任务连续完成30天',
    category: 'habit',
    check: ({ tasks }) => tasks.some((t) => t.consecutiveDays >= 30),
  },
  {
    badgeId: 'master',
    name: '习惯大师',
    icon: '🏆',
    description: '任意任务连续完成66天',
    category: 'habit',
    check: ({ tasks }) => tasks.some((t) => t.consecutiveDays >= 66),
  },

  // Points badges
  {
    badgeId: 'rich100',
    name: '小富翁',
    icon: '💰',
    description: '累计获得100积分',
    category: 'points',
    check: ({ logs, child }) => {
      const totalEarned = logs
        .filter((l) => l.childId === child.childId && (l.type === 'earn' || (l.type === 'adjust' && l.points > 0)))
        .reduce((sum, l) => sum + l.points, 0)
      return totalEarned >= 100
    },
  },
  {
    badgeId: 'rich500',
    name: '大富翁',
    icon: '💎',
    description: '累计获得500积分',
    category: 'points',
    check: ({ logs, child }) => {
      const totalEarned = logs
        .filter((l) => l.childId === child.childId && (l.type === 'earn' || (l.type === 'adjust' && l.points > 0)))
        .reduce((sum, l) => sum + l.points, 0)
      return totalEarned >= 500
    },
  },
  {
    badgeId: 'rich1000',
    name: '积分王',
    icon: '👑',
    description: '累计获得1000积分',
    category: 'points',
    check: ({ logs, child }) => {
      const totalEarned = logs
        .filter((l) => l.childId === child.childId && (l.type === 'earn' || (l.type === 'adjust' && l.points > 0)))
        .reduce((sum, l) => sum + l.points, 0)
      return totalEarned >= 1000
    },
  },

  // Special badges
  {
    badgeId: 'allrounder',
    name: '全能选手',
    icon: '🎯',
    description: '4个分类各完成过至少1次',
    category: 'special',
    check: ({ tasks }) => {
      const categories = new Set(tasks.filter((t) => (t.totalCompletions || 0) > 0).map((t) => t.category))
      return categories.size >= 4
    },
  },
  {
    badgeId: 'perfect_week',
    name: '全勤之星',
    icon: '🌟',
    description: '连续7天每天至少完成1个任务',
    category: 'special',
    check: ({ logs, child }) => {
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dateStr = toLocalDateStr(d)
        const dayLogs = logs.filter(
          (l) => l.childId === child.childId && l.type === 'earn' && l.taskId && l.createdAt.startsWith(dateStr)
        )
        if (dayLogs.length === 0) return false
      }
      return true
    },
  },
  {
    badgeId: 'improver',
    name: '进步之星',
    icon: '🚀',
    description: '本周完成任务数超过上周的1.5倍',
    category: 'special',
    check: ({ logs, child }) => {
      const thisWeek = getWeekLogs(logs, child.childId, 0).filter((l) => l.type === 'earn' && l.taskId).length
      const lastWeek = getWeekLogs(logs, child.childId, 1).filter((l) => l.type === 'earn' && l.taskId).length
      return lastWeek > 0 && thisWeek >= lastWeek * 1.5
    },
  },
]
