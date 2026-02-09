import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskCategory, HabitStage } from '../types'
import { TASK_TEMPLATES } from '../data/templates'
import { generateId, getToday, getYesterday } from '../utils/generateId'

function getHabitStage(consecutiveDays: number): HabitStage {
  if (consecutiveDays >= 66) return 'graduated'
  if (consecutiveDays >= 22) return 'stable'
  if (consecutiveDays >= 8) return 'persist'
  return 'start'
}

function getStageMultiplier(stage: HabitStage): number {
  switch (stage) {
    case 'start': return 1.5
    case 'persist': return 1.0
    case 'stable': return 0.8
    case 'graduated': return 0
  }
}

interface CompleteResult {
  bonusPoints: number
  consecutiveDays: number
  earnedPoints: number
  stageChanged: boolean
  newStage: HabitStage
  graduated: boolean
}

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'taskId' | 'consecutiveDays' | 'lastCompletedDate' | 'completedToday' | 'stage' | 'totalCompletions' | 'createdAt'>) => void
  addTasks: (tasks: Omit<Task, 'taskId' | 'consecutiveDays' | 'lastCompletedDate' | 'completedToday' | 'stage' | 'totalCompletions' | 'createdAt'>[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  completeTask: (taskId: string) => CompleteResult
  undoComplete: (taskId: string) => void
  getChildTasks: (childId: string) => Task[]
  getChildTasksByCategory: (childId: string) => Record<TaskCategory, Task[]>
  refreshDailyStatus: () => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          taskId: generateId(),
          consecutiveDays: 0,
          lastCompletedDate: null,
          completedToday: false,
          stage: 'start',
          totalCompletions: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
      },

      addTasks: (taskDataList) => {
        const newTasks = taskDataList.map((td) => ({
          ...td,
          taskId: generateId(),
          consecutiveDays: 0,
          lastCompletedDate: null,
          completedToday: false,
          stage: 'start' as const,
          totalCompletions: 0,
          createdAt: new Date().toISOString(),
        }))
        set((state) => ({ tasks: [...state.tasks, ...newTasks] }))
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.taskId === taskId ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.taskId !== taskId),
        }))
      },

      completeTask: (taskId) => {
        const today = getToday()
        const yesterday = getYesterday()
        let bonusPoints = 0
        let newConsecutiveDays = 0
        let earnedPoints = 0
        let stageChanged = false
        let newStage: HabitStage = 'start'
        let graduated = false

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.taskId !== taskId) return t
            const wasYesterday = t.lastCompletedDate === yesterday
            newConsecutiveDays = wasYesterday ? t.consecutiveDays + 1 : 1

            if (newConsecutiveDays === 3) bonusPoints = 5
            else if (newConsecutiveDays === 7) bonusPoints = 20
            else if (newConsecutiveDays > 0 && newConsecutiveDays % 7 === 0) bonusPoints = 20

            const oldStage = t.stage || 'start'
            newStage = getHabitStage(newConsecutiveDays)
            stageChanged = oldStage !== newStage
            graduated = newStage === 'graduated' && stageChanged

            const multiplier = getStageMultiplier(newStage)
            earnedPoints = Math.round(t.points * multiplier)

            return {
              ...t,
              completedToday: true,
              lastCompletedDate: today,
              consecutiveDays: newConsecutiveDays,
              stage: newStage,
              totalCompletions: (t.totalCompletions || 0) + 1,
            }
          }),
        }))

        return { bonusPoints, consecutiveDays: newConsecutiveDays, earnedPoints, stageChanged, newStage, graduated }
      },

      undoComplete: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.taskId !== taskId) return t
            return {
              ...t,
              completedToday: false,
              consecutiveDays: Math.max(0, t.consecutiveDays - 1),
              lastCompletedDate: t.consecutiveDays > 1 ? getYesterday() : null,
            }
          }),
        }))
      },

      getChildTasks: (childId) => {
        return get().tasks.filter((t) => t.childId === childId && t.isActive)
      },

      getChildTasksByCategory: (childId) => {
        const tasks = get().getChildTasks(childId)
        const grouped: Record<TaskCategory, Task[]> = {
          life: [], study: [], manner: [], chore: [],
        }
        tasks.forEach((t) => {
          grouped[t.category].push(t)
        })
        return grouped
      },

      refreshDailyStatus: () => {
        const today = getToday()
        set((state) => ({
          tasks: state.tasks.map((t) => ({
            ...t,
            completedToday: t.lastCompletedDate === today,
          })),
        }))
      },
    }),
    {
      name: 'star-tasks',
      version: 2,
      migrate: (persistedState: any, _version: number) => {
        const state = persistedState as { tasks: Task[] }
        const iconMap = new Map(TASK_TEMPLATES.map((t) => [t.name, t.icon]))
        state.tasks = state.tasks.map((task) => {
          const newIcon = iconMap.get(task.name)
          return {
            ...task,
            icon: newIcon || task.icon,
            stage: (task as any).stage || 'start',
            totalCompletions: (task as any).totalCompletions || 0,
          }
        })
        return state
      },
    }
  )
)
