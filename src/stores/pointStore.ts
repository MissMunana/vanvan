import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointLog } from '../types'
import { generateId } from '../utils/generateId'

const MAX_LOGS = 200

interface PointStore {
  logs: PointLog[]
  addLog: (log: Omit<PointLog, 'logId' | 'createdAt'>) => void
  getChildLogs: (childId: string, limit?: number) => PointLog[]
  getWeeklyStats: (childId: string) => { tasksCompleted: number; pointsEarned: number; pointsSpent: number }
}

export const usePointStore = create<PointStore>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (logData) => {
        const log: PointLog = {
          ...logData,
          logId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const newLogs = [log, ...state.logs]
          return { logs: newLogs.slice(0, MAX_LOGS) }
        })
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
    }),
    { name: 'star-points' }
  )
)
