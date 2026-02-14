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

  fetchTasks: (childId: string) => Promise<void>
  addTask: (task: CreateTaskInput) => Promise<Task>
  addTasks: (tasks: CreateTaskInput[]) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<CompleteTaskResult>
  undoComplete: (taskId: string) => Promise<void>
  deleteByChildId: (childId: string) => void

  getChildTasks: (childId: string) => Task[]
  getChildTasksByCategory: (childId: string) => Record<TaskCategory, Task[]>
  updateLocalTask: (task: Task) => void

  logout: () => void
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  _loadedChildIds: new Set<string>(),

  fetchTasks: async (childId) => {
    console.log(`[TaskStore] fetchTasks START for childId=${childId}`)
    set({ isLoading: true, error: null })
    try {
      const tasks = await tasksApi.list(childId)
      console.log(`[TaskStore] fetchTasks API returned ${tasks.length} tasks for childId=${childId}`)
      tasks.forEach(t => {
        if (t.completedToday) {
          console.log(`[TaskStore]   - Completed task: ${t.name}, lastCompletedDate=${t.lastCompletedDate}`)
        }
      })
      
      set((s) => {
        const otherTasks = s.tasks.filter((t) => t.childId !== childId)
        const newLoaded = new Set(s._loadedChildIds)
        newLoaded.add(childId)
        const newTasks = [...otherTasks, ...tasks]
        console.log(`[TaskStore] fetchTasks SET state: ${newTasks.length} total tasks, ${otherTasks.length} other children, ${tasks.length} for current child`)
        return { tasks: newTasks, isLoading: false, _loadedChildIds: newLoaded }
      })
    } catch (e) {
      console.error(`[TaskStore] fetchTasks ERROR for childId=${childId}:`, e)
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
    console.log(`[TaskStore] fetchTasks END for childId=${childId}`)
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
    
    set((s) => ({ tasks: [...s.tasks, tempTask] }))
    
    try {
      const task = await tasksApi.create(taskData)
      set((s) => ({ 
        tasks: s.tasks.map((t) => t.taskId === tempId ? task : t) 
      }))
      return task
    } catch (error) {
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
    
    console.log(`[TaskStore] completeTask START taskId=${taskId}`)
    
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
      console.log(`[TaskStore] completeTask API returned: completedToday=${result.task.completedToday}, lastCompletedDate=${result.task.lastCompletedDate}`)
      set((s) => ({
        tasks: s.tasks.map((t) => (t.taskId === taskId ? result.task : t)),
      }))
      return result
    } catch (error) {
      console.error(`[TaskStore] completeTask ERROR taskId=${taskId}:`, error)
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

  updateLocalTask: (task) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.taskId === task.taskId ? task : t)),
    }))
  },

  logout: () => {
    set({
      tasks: [],
      isLoading: false,
      error: null,
      _loadedChildIds: new Set<string>(),
    })
  },
}))
