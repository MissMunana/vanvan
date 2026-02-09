import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskCategory } from '../types'
import { TASK_TEMPLATES } from '../data/templates'

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'taskId' | 'consecutiveDays' | 'lastCompletedDate' | 'completedToday' | 'createdAt'>) => void
  addTasks: (tasks: Omit<Task, 'taskId' | 'consecutiveDays' | 'lastCompletedDate' | 'completedToday' | 'createdAt'>[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  completeTask: (taskId: string) => { bonusPoints: number; consecutiveDays: number }
  undoComplete: (taskId: string) => void
  getChildTasks: (childId: string) => Task[]
  getChildTasksByCategory: (childId: string) => Record<TaskCategory, Task[]>
  refreshDailyStatus: () => void
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
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

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.taskId !== taskId) return t
            const wasYesterday = t.lastCompletedDate === yesterday
            newConsecutiveDays = wasYesterday ? t.consecutiveDays + 1 : 1

            if (newConsecutiveDays === 3) bonusPoints = 5
            else if (newConsecutiveDays === 7) bonusPoints = 20
            else if (newConsecutiveDays > 0 && newConsecutiveDays % 7 === 0) bonusPoints = 20

            return {
              ...t,
              completedToday: true,
              lastCompletedDate: today,
              consecutiveDays: newConsecutiveDays,
            }
          }),
        }))

        return { bonusPoints, consecutiveDays: newConsecutiveDays }
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
      version: 1,
      migrate: (persistedState: any, _version: number) => {
        const state = persistedState as { tasks: Task[] }
        const iconMap = new Map(TASK_TEMPLATES.map((t) => [t.name, t.icon]))
        state.tasks = state.tasks.map((task) => {
          const newIcon = iconMap.get(task.name)
          return newIcon ? { ...task, icon: newIcon } : task
        })
        return state
      },
    }
  )
)
