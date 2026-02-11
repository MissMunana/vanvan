import { create } from 'zustand'
import type { Child } from '../types'
import { familyApi, childrenApi, type CreateChildInput, type UpdateChildInput } from '../lib/api'

interface AppStore {
  currentChildId: string | null
  children: Child[]
  parentPin: string
  onboardingCompleted: boolean
  completionCount: number
  isLoading: boolean
  error: string | null

  // Server-first async methods
  fetchFamily: () => Promise<void>
  fetchChildren: () => Promise<void>
  addChild: (data: CreateChildInput) => Promise<string>
  updateChild: (childId: string, updates: UpdateChildInput) => Promise<void>
  deleteChild: (childId: string) => Promise<void>
  updatePoints: (childId: string, delta: number) => Promise<number>
  updateFamilySettings: (data: { parentPin?: string; onboardingCompleted?: boolean; completionCount?: number }) => Promise<void>

  // Local-only helpers
  setCurrentChild: (childId: string) => void
  getCurrentChild: () => Child | null
  setChildrenAndFamily: (children: Child[], family: { parentPin: string; onboardingCompleted: boolean; completionCount: number }) => void
  setChildPoints: (childId: string, totalPoints: number) => void

  // Cleanup
  logout: () => void
  resetData: () => void
}

export const useAppStore = create<AppStore>()((set, get) => ({
  currentChildId: null,
  children: [],
  parentPin: '',
  onboardingCompleted: false,
  completionCount: 0,
  isLoading: false,
  error: null,

  fetchFamily: async () => {
    try {
      const family = await familyApi.get()
      set({
        parentPin: family.parentPin,
        onboardingCompleted: family.onboardingCompleted,
        completionCount: family.completionCount,
      })
    } catch (e) {
      set({ error: (e as Error).message })
      throw e
    }
  },

  fetchChildren: async () => {
    try {
      const children = await childrenApi.list()
      const currentChildId = get().currentChildId
      set({
        children,
        currentChildId: children.find((c) => c.childId === currentChildId)
          ? currentChildId
          : (children[0]?.childId || null),
      })
    } catch (e) {
      set({ error: (e as Error).message })
      throw e
    }
  },

  addChild: async (data) => {
    const child = await childrenApi.create(data)
    set((s) => ({
      children: [...s.children, child],
      currentChildId: child.childId,
    }))
    return child.childId
  },

  updateChild: async (childId, updates) => {
    const child = await childrenApi.update(childId, updates)
    set((s) => ({
      children: s.children.map((c) => (c.childId === childId ? child : c)),
    }))
  },

  deleteChild: async (childId) => {
    await childrenApi.delete(childId)
    set((s) => {
      const remaining = s.children.filter((c) => c.childId !== childId)
      return {
        children: remaining,
        currentChildId: s.currentChildId === childId
          ? (remaining[0]?.childId || null)
          : s.currentChildId,
      }
    })
  },

  updatePoints: async (childId, delta) => {
    const { totalPoints } = await childrenApi.updatePoints(childId, delta)
    set((s) => ({
      children: s.children.map((c) =>
        c.childId === childId ? { ...c, totalPoints } : c
      ),
    }))
    return totalPoints
  },

  updateFamilySettings: async (data) => {
    const family = await familyApi.update(data)
    set({
      parentPin: family.parentPin,
      onboardingCompleted: family.onboardingCompleted,
      completionCount: family.completionCount,
    })
  },

  setCurrentChild: (childId) => set({ currentChildId: childId }),

  getCurrentChild: () => {
    const { children, currentChildId } = get()
    return children.find((c) => c.childId === currentChildId) || null
  },

  setChildrenAndFamily: (children, family) => {
    set({
      children,
      currentChildId: children[0]?.childId || null,
      parentPin: family.parentPin,
      onboardingCompleted: family.onboardingCompleted,
      completionCount: family.completionCount,
    })
  },

  setChildPoints: (childId, totalPoints) => {
    set((s) => ({
      children: s.children.map((c) =>
        c.childId === childId ? { ...c, totalPoints } : c
      ),
    }))
  },

  logout: () => set({
    onboardingCompleted: false,
    currentChildId: null,
    children: [],
    parentPin: '',
    completionCount: 0,
  }),

  resetData: () => set({
    currentChildId: null,
    children: [],
    parentPin: '',
    onboardingCompleted: false,
    completionCount: 0,
    isLoading: false,
    error: null,
  }),
}))
