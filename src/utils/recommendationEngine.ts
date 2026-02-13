import type { Task, TaskCategory, Child, PointLog, Reward, Exchange, TemperatureRecord, SleepRecord } from '../types'
import { CATEGORY_INFO, HABIT_STAGE_INFO } from '../types'
import { TASK_TEMPLATES, type TaskTemplate } from '../data/templates'
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from '../data/knowledgeArticles'
import { getToday } from './generateId'

// ============ Task Recommendations ============

export interface TaskRecommendation {
  template: TaskTemplate
  reason: string
  reasonType: 'weakness' | 'advancement' | 'peer' | 'new_category'
  priority: number
}

interface CategoryStat {
  category: TaskCategory
  taskCount: number
  completionRate: number
  avgConsecutiveDays: number
  graduatedCount: number
}

function computeCategoryStats(tasks: Task[]): CategoryStat[] {
  const categories: TaskCategory[] = ['life', 'study', 'manner', 'chore']
  return categories.map((category) => {
    const catTasks = tasks.filter((t) => t.category === category)
    const taskCount = catTasks.length
    const completedCount = catTasks.filter((t) => t.completedToday).length
    const completionRate = taskCount > 0 ? completedCount / taskCount : 0
    const avgConsecutiveDays = taskCount > 0
      ? catTasks.reduce((s, t) => s + t.consecutiveDays, 0) / taskCount
      : 0
    const graduatedCount = catTasks.filter((t) => t.stage === 'graduated').length
    return { category, taskCount, completionRate, avgConsecutiveDays, graduatedCount }
  })
}

export function getTaskRecommendations(
  child: Child,
  tasks: Task[],
  maxResults: number = 5
): TaskRecommendation[] {
  const activeTasks = tasks.filter((t) => t.childId === child.childId && t.isActive)
  const activeTaskNames = new Set(activeTasks.map((t) => t.name))
  const stats = computeCategoryStats(activeTasks)

  const availableTemplates = TASK_TEMPLATES.filter(
    (t) => t.ageGroups.includes(child.ageGroup) && !activeTaskNames.has(t.name)
  )

  const recommendations: TaskRecommendation[] = []
  const addedNames = new Set<string>()

  const addRec = (template: TaskTemplate, reason: string, reasonType: TaskRecommendation['reasonType'], priority: number) => {
    if (addedNames.has(template.name)) return
    addedNames.add(template.name)
    recommendations.push({ template, reason, reasonType, priority })
  }

  // Strategy A: Fill weak categories (completionRate < 0.5 or no tasks)
  const weakCategories = stats
    .filter((s) => s.completionRate < 0.5 || s.taskCount === 0)
    .sort((a, b) => a.completionRate - b.completionRate)

  for (const weak of weakCategories) {
    const candidates = availableTemplates.filter((t) => t.category === weak.category)
    for (const candidate of candidates) {
      const basePriority = weak.taskCount === 0 ? 15 : 10 - weak.completionRate * 10
      addRec(
        candidate,
        weak.taskCount === 0
          ? `还没有${CATEGORY_INFO[weak.category].label}方面的任务，试试看`
          : `${CATEGORY_INFO[weak.category].label}方面还可以加强`,
        weak.taskCount === 0 ? 'new_category' : 'weakness',
        basePriority
      )
    }
  }

  // Strategy B: Advancement from graduated tasks
  const graduated = activeTasks.filter((t) => t.stage === 'graduated')
  for (const grad of graduated) {
    const advancedCandidates = availableTemplates.filter(
      (t) => t.category === grad.category && t.points > grad.points
    )
    for (const candidate of advancedCandidates) {
      addRec(
        candidate,
        `已经掌握了"${grad.name}"，试试进阶任务`,
        'advancement',
        8
      )
    }
  }

  // Strategy C: Peer-based (age-appropriate templates not yet assigned)
  for (const template of availableTemplates) {
    addRec(
      template,
      `${child.ageGroup}岁小朋友都在做这个任务`,
      'peer',
      3
    )
  }

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxResults)
}

// ============ Points Suggestions ============

export type SuggestionSeverity = 'info' | 'warning' | 'success'

export interface PointsSuggestion {
  id: string
  icon: string
  message: string
  detail: string
  severity: SuggestionSeverity
  actionLabel?: string
}

function diffDays(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export function getPointsSuggestions(
  child: Child,
  tasks: Task[],
  logs: PointLog[],
  exchanges: Exchange[],
  rewards: Reward[]
): PointsSuggestion[] {
  const suggestions: PointsSuggestion[] = []
  const today = getToday()
  const childTasks = tasks.filter((t) => t.childId === child.childId && t.isActive)
  const childLogs = logs.filter((l) => l.childId === child.childId)
  const childRewards = rewards.filter((r) => r.childId === child.childId && r.isActive)

  // 1. Detect stalled tasks (3+ days without completion)
  const stalledTasks: string[] = []
  for (const task of childTasks) {
    if (task.stage === 'graduated') continue
    if (task.lastCompletedDate) {
      const daysSince = diffDays(today, task.lastCompletedDate)
      if (daysSince >= 3) {
        stalledTasks.push(task.name)
      }
    }
  }
  if (stalledTasks.length > 0) {
    const names = stalledTasks.length <= 2
      ? stalledTasks.map((n) => `"${n}"`).join('、')
      : `"${stalledTasks[0]}"等${stalledTasks.length}个任务`
    suggestions.push({
      id: 'stalled-tasks',
      icon: '⚠️',
      message: `${names}已多天未完成`,
      detail: '可能任务难度偏高，建议降低积分或拆分成更小的步骤',
      severity: 'warning',
      actionLabel: '管理任务',
    })
  }

  // 2. Points flow analysis (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLogs = childLogs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo)

  const totalEarned = recentLogs
    .filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0))
    .reduce((s, l) => s + l.points, 0)
  const totalSpent = recentLogs
    .filter((l) => l.type === 'spend')
    .reduce((s, l) => s + Math.abs(l.points), 0)

  if (totalEarned > 50) {
    const spendRatio = totalSpent / totalEarned
    if (spendRatio < 0.1) {
      suggestions.push({
        id: 'low-spend',
        icon: '💡',
        message: '积分累积快但很少兑换',
        detail: '建议增加更有吸引力的奖励，让孩子感受积分的价值',
        severity: 'warning',
        actionLabel: '管理奖励',
      })
    } else if (spendRatio > 0.9) {
      suggestions.push({
        id: 'high-spend',
        icon: '💡',
        message: '积分消耗接近获取速度',
        detail: '孩子花积分很积极！确保奖励设置合理，保持适度的"延迟满足"',
        severity: 'info',
      })
    }
  }

  // 3. Economy health score
  const completionRate = childTasks.length > 0
    ? childTasks.filter((t) => t.completedToday).length / childTasks.length
    : 0

  let healthLabel: string
  let healthIcon: string
  let healthDetail: string
  let healthSeverity: SuggestionSeverity

  if (completionRate >= 0.7 && childTasks.length >= 3) {
    healthLabel = '良好'
    healthIcon = '✅'
    healthDetail = '任务完成率高，习惯养成进展顺利'
    healthSeverity = 'success'
  } else if (completionRate >= 0.4 || childTasks.length < 3) {
    healthLabel = '需关注'
    healthIcon = '⚠️'
    healthDetail = childTasks.length < 3
      ? '当前任务较少，建议添加更多习惯任务'
      : '部分任务完成率偏低，可以调整任务难度'
    healthSeverity = 'warning'
  } else {
    healthLabel = '需改善'
    healthIcon = '🔴'
    healthDetail = '多数任务未完成，建议减少任务数量或降低难度，循序渐进'
    healthSeverity = 'warning'
  }

  suggestions.push({
    id: 'health-score',
    icon: healthIcon,
    message: `习惯养成进展：${healthLabel}`,
    detail: healthDetail,
    severity: healthSeverity,
  })

  // 4. Low reward variety
  if (childRewards.length < 3) {
    suggestions.push({
      id: 'low-rewards',
      icon: '🎁',
      message: '奖励种类较少',
      detail: '建议添加不同类型的奖励（亲子时光、小特权、实物），让孩子有更多选择',
      severity: 'info',
      actionLabel: '添加奖励',
    })
  }

  // 5. High pending exchanges
  const pendingExchanges = exchanges.filter(
    (e) => e.childId === child.childId && e.status === 'pending'
  )
  if (pendingExchanges.length >= 3) {
    suggestions.push({
      id: 'pending-exchanges',
      icon: '📋',
      message: `有 ${pendingExchanges.length} 个待审核兑换请求`,
      detail: '及时审核兑换请求可以提高孩子的积极性',
      severity: 'warning',
      actionLabel: '审核兑换',
    })
  }

  return suggestions
}

// ============ Knowledge Recommendations ============

export interface KnowledgeRecommendation {
  article: KnowledgeArticle
  reason: string
  priority: number
}

function getAgeInMonths(birthday: string): number {
  const birth = new Date(birthday)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
}

export function getKnowledgeRecommendations(
  child: Child,
  tasks: Task[],
  temperatureRecords: TemperatureRecord[],
  sleepRecords: SleepRecord[],
  maxResults: number = 10
): KnowledgeRecommendation[] {
  const ageMonths = getAgeInMonths(child.birthday)
  const childTasks = tasks.filter((t) => t.childId === child.childId && t.isActive)
  const recommendations: KnowledgeRecommendation[] = []

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  for (const article of KNOWLEDGE_ARTICLES) {
    // Check age group filter
    if (article.ageGroups.length > 0 && !article.ageGroups.includes(child.ageGroup)) {
      continue
    }

    let matchScore = 0
    let matchReason = ''

    for (const trigger of article.triggers) {
      switch (trigger.type) {
        case 'age':
          if (ageMonths >= trigger.ageMonthsMin && ageMonths <= trigger.ageMonthsMax) {
            matchScore += article.priority
            matchReason = '适合当前年龄段'
          }
          break

        case 'health_event':
          if (trigger.event === 'fever') {
            const recentFever = temperatureRecords.filter(
              (r) => r.childId === child.childId &&
                new Date(r.createdAt) >= sevenDaysAgo &&
                r.temperature >= 37.3
            )
            if (recentFever.length > 0) {
              matchScore += article.priority * 2
              matchReason = '最近记录了发烧'
            }
          }
          if (trigger.event === 'sleep_poor') {
            const recentSleep = sleepRecords.filter(
              (r) => r.childId === child.childId && new Date(r.createdAt) >= sevenDaysAgo
            )
            const poorSleep = recentSleep.filter(
              (r) => r.sleepQuality === 'fair' || r.sleepQuality === 'poor'
            )
            if (poorSleep.length >= 2) {
              matchScore += article.priority * 1.5
              matchReason = '最近睡眠质量偏低'
            }
          }
          if (trigger.event === 'medication') {
            // Always show medication safety articles as baseline
            matchScore += article.priority * 0.5
            matchReason = '用药安全常识'
          }
          break

        case 'habit_stage': {
          const matching = childTasks.filter((t) => t.stage === trigger.stage)
          if (matching.length > 0) {
            matchScore += article.priority
            matchReason = `有任务处于${HABIT_STAGE_INFO[trigger.stage].label}阶段`
          }
          break
        }

        case 'always':
          matchScore += article.priority * 0.3
          matchReason = matchReason || '推荐阅读'
          break
      }
    }

    if (matchScore > 0) {
      recommendations.push({ article, reason: matchReason, priority: matchScore })
    }
  }

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxResults)
}
