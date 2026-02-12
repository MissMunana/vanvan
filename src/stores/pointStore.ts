import { create } from 'zustand'
import type { PointLog } from '../types'
import { pointLogsApi } from '../lib/api'

interface PointStore {
  logs: PointLog[]
  isLoading: boolean
  error: string | null
  _loadedChildIds: Set<string>

  // Server-first async methods
  fetchLogs: (childId: string, limit?: number) => Promise<void>
  addLog: (log: { childId: string; taskId?: string | null; type: 'earn' | 'spend' | 'adjust'; points: number; reason: string; emotion?: string | null; operator: 'child' | 'parent' }) => Promise<{ totalPoints: number }>

  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildLogs: (childId: string, limit?: number) => PointLog[]
  getWeeklyStats: (childId: string) => { tasksCompleted: number; pointsEarned: number; pointsSpent: number }
  prependLog: (log: PointLog) => void
}

export const usePointStore = create<PointStore>()((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,
  _loadedChildIds: new Set<string>(),

  fetchLogs: async (childId, limit = 200) => {
    set({ isLoading: true, error: null })
    try {
      const logs = await pointLogsApi.list(childId, limit)
      set((s) => {
        const otherLogs = s.logs.filter((l) => l.childId !== childId)
        const newLoaded = new Set(s._loadedChildIds)
        newLoaded.add(childId)
        return { logs: [...logs, ...otherLogs], isLoading: false, _loadedChildIds: newLoaded }
      })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  addLog: async (logData) => {
    const { log, totalPoints } = await pointLogsApi.create(logData)
    set((s) => ({ logs: [log, ...s.logs] }))
    return { totalPoints }
  },

  deleteByChildId: (childId) => {
    set((s) => ({ logs: s.logs.filter((l) => l.childId !== childId) }))
  },

  getChildLogs: (childId, limit = 30) => {
    return get().logs
      .filter((l) => l.childId === childId)
      .slice(0, limit)
  },

  getWeeklyStats: (childId) => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString()

    const weekLogs = get().logs.filter(
      (l) => l.childId === childId && l.createdAt >= weekStartStr
    )

    return {
      tasksCompleted: weekLogs.filter((l) => l.type === 'earn' && l.taskId).length,
      pointsEarned: weekLogs
        .filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0))
        .reduce((sum, l) => sum + l.points, 0),
      pointsSpent: weekLogs
        .filter((l) => l.type === 'spend')
        .reduce((sum, l) => sum + Math.abs(l.points), 0),
    }
  },

  prependLog: (log) => {
    set((s) => ({ logs: [log, ...s.logs] }))
  },
}))
