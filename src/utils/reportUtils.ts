import { usePointStore } from '../stores/pointStore'
import { useTaskStore } from '../stores/taskStore'
import { useHealthStore } from '../stores/healthStore'
import { PLANNED_VACCINES } from '../data/vaccineSchedule'

function getWeekStart(): Date {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function getMonthStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export interface WeeklyReport {
  periodLabel: string
  tasksCompleted: number
  pointsEarned: number
  pointsSpent: number
  topHabits: { name: string; icon: string; count: number }[]
  healthEvents: { type: string; count: number }[]
}

export interface MonthlyReport {
  periodLabel: string
  tasksCompleted: number
  pointsEarned: number
  growthChange: { height: string | null; weight: string | null }
  milestonesAchieved: number
  habitTrend: { graduated: number; active: number; newStarted: number }
}

export function generateWeeklyReport(childId: string): WeeklyReport {
  const weekStart = getWeekStart()
  const weekStartStr = weekStart.toISOString()
  const now = new Date()
  const periodLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${now.getMonth() + 1}/${now.getDate()}`

  const logs = usePointStore.getState().logs.filter(
    (l) => l.childId === childId && l.createdAt >= weekStartStr
  )

  const tasksCompleted = logs.filter((l) => l.type === 'earn' && l.taskId).length
  const pointsEarned = logs
    .filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0))
    .reduce((sum, l) => sum + l.points, 0)
  const pointsSpent = logs
    .filter((l) => l.type === 'spend')
    .reduce((sum, l) => sum + Math.abs(l.points), 0)

  // Top habits
  const taskCounts = new Map<string, number>()
  logs.forEach((l) => {
    if (l.taskId && l.type === 'earn') {
      taskCounts.set(l.taskId, (taskCounts.get(l.taskId) || 0) + 1)
    }
  })
  const tasks = useTaskStore.getState().tasks
  const topHabits = Array.from(taskCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([taskId, count]) => {
      const task = tasks.find((t) => t.taskId === taskId)
      return { name: task?.name ?? '未知任务', icon: task?.icon ?? '📋', count }
    })

  // Health events this week
  const healthEvents: { type: string; count: number }[] = []
  const tempRecords = useHealthStore.getState().temperatureRecords.filter(
    (r) => r.childId === childId && r.createdAt >= weekStartStr
  )
  if (tempRecords.length > 0) healthEvents.push({ type: '体温记录', count: tempRecords.length })

  const medRecords = useHealthStore.getState().medicationRecords.filter(
    (r) => r.childId === childId && r.createdAt >= weekStartStr
  )
  if (medRecords.length > 0) healthEvents.push({ type: '用药记录', count: medRecords.length })

  return { periodLabel, tasksCompleted, pointsEarned, pointsSpent, topHabits, healthEvents }
}

export function generateMonthlyReport(childId: string): MonthlyReport {
  const monthStart = getMonthStart()
  const monthStartStr = monthStart.toISOString()
  const now = new Date()
  const periodLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const logs = usePointStore.getState().logs.filter(
    (l) => l.childId === childId && l.createdAt >= monthStartStr
  )

  const tasksCompleted = logs.filter((l) => l.type === 'earn' && l.taskId).length
  const pointsEarned = logs
    .filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0))
    .reduce((sum, l) => sum + l.points, 0)

  // Growth change
  const growthRecords = useHealthStore.getState().growthRecords
    .filter((r) => r.childId === childId)
    .sort((a, b) => a.date.localeCompare(b.date))
  const monthGrowth = growthRecords.filter((r) => r.createdAt >= monthStartStr)
  let growthChange: { height: string | null; weight: string | null } = { height: null, weight: null }
  if (monthGrowth.length >= 2) {
    const first = monthGrowth[0]
    const last = monthGrowth[monthGrowth.length - 1]
    if (first.height !== null && last.height !== null) {
      const diff = Math.round((last.height - first.height) * 10) / 10
      growthChange.height = `${diff > 0 ? '+' : ''}${diff}cm`
    }
    if (first.weight !== null && last.weight !== null) {
      const diff = Math.round((last.weight - first.weight) * 10) / 10
      growthChange.weight = `${diff > 0 ? '+' : ''}${diff}kg`
    }
  }

  // Milestones achieved this month
  const milestoneRecords = useHealthStore.getState().milestoneRecords.filter(
    (r) => r.childId === childId && r.status === 'achieved' && r.achievedDate && r.achievedDate >= monthStartStr.split('T')[0]
  )

  // Habit trend
  const allTasks = useTaskStore.getState().tasks.filter((t) => t.childId === childId)
  const graduated = allTasks.filter((t) => t.stage === 'graduated').length
  const active = allTasks.filter((t) => t.isActive && t.stage !== 'graduated').length
  const newStarted = allTasks.filter((t) => t.createdAt >= monthStartStr).length

  return {
    periodLabel,
    tasksCompleted,
    pointsEarned,
    growthChange,
    milestonesAchieved: milestoneRecords.length,
    habitTrend: { graduated, active, newStarted },
  }
}

export interface HealthSummary {
  latestGrowth: { height: number | null; weight: number | null; heightP: number | null; weightP: number | null; date: string } | null
  vaccineProgress: { done: number; total: number }
  recentFeverCount: number
  recentMedCount: number
  milestonesAchieved: number
  milestonesInProgress: number
  milestonesTotal: number
}

export function generateHealthSummary(childId: string): HealthSummary {
  const health = useHealthStore.getState()

  const growthRecords = health.growthRecords
    .filter((r) => r.childId === childId)
    .sort((a, b) => a.date.localeCompare(b.date))
  const latest = growthRecords.length > 0 ? growthRecords[growthRecords.length - 1] : null

  const vaccineRecords = health.vaccinationRecords.filter((r) => r.childId === childId)
  const completedIds = new Set(vaccineRecords.map((r) => `${r.vaccineName}_${r.doseNumber}`))

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysStr = sevenDaysAgo.toISOString()

  const recentFeverCount = health.temperatureRecords.filter(
    (r) => r.childId === childId && r.createdAt >= sevenDaysStr
  ).length
  const recentMedCount = health.medicationRecords.filter(
    (r) => r.childId === childId && r.createdAt >= sevenDaysStr
  ).length

  const milestoneRecords = health.milestoneRecords.filter((r) => r.childId === childId)
  const milestonesAchieved = milestoneRecords.filter((r) => r.status === 'achieved').length
  const milestonesInProgress = milestoneRecords.filter((r) => r.status === 'in_progress').length

  return {
    latestGrowth: latest ? {
      height: latest.height,
      weight: latest.weight,
      heightP: latest.heightPercentile,
      weightP: latest.weightPercentile,
      date: latest.date,
    } : null,
    vaccineProgress: { done: completedIds.size, total: PLANNED_VACCINES.length },
    recentFeverCount,
    recentMedCount,
    milestonesAchieved,
    milestonesInProgress,
    milestonesTotal: milestoneRecords.length,
  }
}
