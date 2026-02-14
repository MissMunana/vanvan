import { create } from 'zustand'
import type { Task, TaskCategory } from '../types'
import { tasksApi, type CompleteTaskResult, type CreateTaskInput } from '../lib/api'
import { getToday } from '../utils/generateId'

// Helper to generate temporary IDs for optimistic updates
let tempIdCounter = 0
const generateTempId = () => `temp_${Date.now()}_${++tempIdCounter}`

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  _loadedChildIds: Set<string>

  // Server-first async methods
  fetchTasks: (childId: string) => Promise<void>
  addTask: (task: CreateTaskInput) => Promise<Task>
  addTasks: (tasks: CreateTaskInput[]) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<CompleteTaskResult>
  undoComplete: (taskId: string) => Promise<void>
  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildTasks: (childId: string) => Task[]
  getChildTasksByCategory: (childId: string) => Record<TaskCategory, Task[]>
  refreshDailyStatus: () => void
  updateLocalTask: (task: Task) => void
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  _loadedChildIds: new Set<string>(),

  fetchTasks: async (childId) => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await tasksApi.list(childId)
      set((s) => {
        const otherTasks = s.tasks.filter((t) => t.childId !== childId)
        const newLoaded = new Set(s._loadedChildIds)
        newLoaded.add(childId)
        return { tasks: [...otherTasks, ...tasks], isLoading: false, _loadedChildIds: newLoaded }
      })
      get().refreshDailyStatus()
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  addTask: async (taskData) => {
    const previousTasks = get().tasks
    const tempId = generateTempId()
    const tempTask = { 
      ...taskData, 
      taskId: tempId, 
      isPending: true,
      consecutiveDays: 0,
      lastCompletedDate: null,
      completedToday: false,
      stage: 'start' as const,
      totalCompletions: 0,
      createdAt: new Date().toISOString(),
    } as unknown as Task
    
    // Optimistic update
    set((s) => ({ tasks: [...s.tasks, tempTask] }))
    
    try {
      const task = await tasksApi.create(taskData)
      set((s) => ({ 
        tasks: s.tasks.map((t) => t.taskId === tempId ? task : t) 
      }))
      return task
    } catch (error) {
      // Rollback on error
      set({ tasks: previousTasks })
      throw error
    }
  },

  addTasks: async (taskDataList) => {
    const tasks = await tasksApi.createBatch(taskDataList)
    set((s) => ({ tasks: [...s.tasks, ...tasks] }))
  },

  updateTask: async (taskId, updates) => {
    const task = await tasksApi.update(taskId, updates)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.taskId === taskId ? task : t)),
    }))
  },

  deleteTask: async (taskId) => {
    await tasksApi.delete(taskId)
    set((s) => ({
      tasks: s.tasks.filter((t) => t.taskId !== taskId),
    }))
  },

  completeTask: async (taskId) => {
    const previousTask = get().tasks.find((t) => t.taskId === taskId)
    if (!previousTask) throw new Error('Task not found')
    
    // Optimistic update
    set((s) => ({
      tasks: s.tasks.map((t) => (t.taskId === taskId ? { 
        ...t, 
        completedToday: true,
        totalCompletions: (t.totalCompletions || 0) + 1,
        lastCompletedDate: getToday()
      } : t)),
    }))
    
    try {
      const result = await tasksApi.complete(taskId)
      set((s) => ({
        tasks: s.tasks.map((t) => (t.taskId === taskId ? result.task : t)),
      }))
      return result
    } catch (error) {
      // Rollback on error
      set((s) => ({
        tasks: s.tasks.map((t) => (t.taskId === taskId ? previousTask : t)),
      }))
      throw error
    }
  },

  undoComplete: async (taskId) => {
    const task = await tasksApi.undoComplete(taskId)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.taskId === taskId ? task : t)),
    }))
  },

  deleteByChildId: (childId) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.childId !== childId) }))
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
    set((s) => ({
      tasks: s.tasks.map((t) => ({
        ...t,
        completedToday: t.lastCompletedDate === today,
      })),
    }))
  },

  updateLocalTask: (task) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.taskId === task.taskId ? task : t)),
    }))
  },
}))
