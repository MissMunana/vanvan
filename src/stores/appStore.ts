import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child } from '../types'
import { getAgeGroup } from '../hooks/useAgeGroup'

interface AppStore {
  currentChildId: string | null
  children: Child[]
  parentPin: string
  onboardingCompleted: boolean
  completionCount: number

  addChild: (child: Omit<Child, 'childId' | 'ageGroup' | 'totalPoints' | 'settings' | 'createdAt'>) => string
  setCurrentChild: (childId: string) => void
  setParentPin: (pin: string) => void
  completeOnboarding: () => void
  updatePoints: (childId: string, delta: number) => void
  getCurrentChild: () => Child | null
  incrementCompletionCount: () => number
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
        const child: Child = {
          childId,
          name: data.name,
          gender: data.gender,
          age: data.age,
          ageGroup: getAgeGroup(data.age),
          avatar: data.avatar,
          totalPoints: 0,
          settings: {
            soundEnabled: true,
            vibrationEnabled: true,
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

      resetData: () => set({
        currentChildId: null,
        children: [],
        parentPin: '',
        onboardingCompleted: false,
        completionCount: 0,
      }),
    }),
    { name: 'star-app' }
  )
)
