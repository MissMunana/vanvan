import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child } from '../types'
import { getAgeGroup, getAgeFromBirthday } from '../hooks/useAgeGroup'

const DEFAULT_SCREEN_TIME = {
  dailyLimitMinutes: 30,
  lockStartHour: 22,
  lockEndHour: 6,
  enabled: false,
}

interface AppStore {
  currentChildId: string | null
  children: Child[]
  parentPin: string
  onboardingCompleted: boolean
  completionCount: number

  addChild: (child: Omit<Child, 'childId' | 'age' | 'ageGroup' | 'totalPoints' | 'settings' | 'createdAt'>) => string
  setCurrentChild: (childId: string) => void
  setParentPin: (pin: string) => void
  completeOnboarding: () => void
  updateChild: (childId: string, updates: Partial<Pick<Child, 'name' | 'gender' | 'birthday' | 'avatar'>>) => void
  deleteChild: (childId: string) => void
  updatePoints: (childId: string, delta: number) => void
  getCurrentChild: () => Child | null
  incrementCompletionCount: () => number
  logout: () => void
  resetData: () => void
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentChildId: null,
      children: [],
      parentPin: '',
      onboardingCompleted: false,
      completionCount: 0,

      addChild: (data) => {
        const childId = generateId()
        const { years } = getAgeFromBirthday(data.birthday)
        const child: Child = {
          childId,
          name: data.name,
          gender: data.gender,
          birthday: data.birthday,
          age: years,
          ageGroup: getAgeGroup(years),
          avatar: data.avatar,
          totalPoints: 0,
          settings: {
            soundEnabled: true,
            vibrationEnabled: true,
            screenTime: DEFAULT_SCREEN_TIME,
          },
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          children: [...state.children, child],
          currentChildId: childId,
        }))
        return childId
      },

      setCurrentChild: (childId) => set({ currentChildId: childId }),
      setParentPin: (pin) => set({ parentPin: pin }),
      completeOnboarding: () => set({ onboardingCompleted: true }),

      updateChild: (childId, updates) => {
        set((state) => ({
          children: state.children.map((c) => {
            if (c.childId !== childId) return c
            const updated = { ...c, ...updates }
            if (updates.birthday) {
              const { years } = getAgeFromBirthday(updates.birthday)
              updated.age = years
              updated.ageGroup = getAgeGroup(years)
            }
            return updated
          }),
        }))
      },

      deleteChild: (childId) => {
        set((state) => {
          const remaining = state.children.filter((c) => c.childId !== childId)
          return {
            children: remaining,
            currentChildId: state.currentChildId === childId
              ? (remaining[0]?.childId || null)
              : state.currentChildId,
          }
        })
      },

      updatePoints: (childId, delta) => {
        set((state) => ({
          children: state.children.map((c) =>
            c.childId === childId
              ? { ...c, totalPoints: Math.max(0, c.totalPoints + delta) }
              : c
          ),
        }))
      },

      getCurrentChild: () => {
        const { children, currentChildId } = get()
        return children.find((c) => c.childId === currentChildId) || null
      },

      incrementCompletionCount: () => {
        const newCount = get().completionCount + 1
        set({ completionCount: newCount })
        return newCount
      },

      logout: () => set({ onboardingCompleted: false }),

      resetData: () => set({
        currentChildId: null,
        children: [],
        parentPin: '',
        onboardingCompleted: false,
        completionCount: 0,
      }),
    }),
    {
      name: 'star-app',
      version: 1,
      migrate: (persistedState: any, _version: number) => {
        const state = persistedState as { children: Child[]; currentChildId: string | null; parentPin: string; onboardingCompleted: boolean; completionCount: number }
        state.children = state.children.map((child) => ({
          ...child,
          settings: {
            ...child.settings,
            screenTime: child.settings?.screenTime || DEFAULT_SCREEN_TIME,
          },
        }))
        return state
      },
    }
  )
)
