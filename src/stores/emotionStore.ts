import { create } from 'zustand'
import type { MoodRecord, ConflictRecord, MoodStats } from '../types'
import { emotionApi } from '../lib/api'

interface EmotionStore {
  moodRecords: MoodRecord[]
  conflictRecords: ConflictRecord[]
  moodStats: MoodStats | null
  isLoading: boolean
  error: string | null

  fetchMoods: (childId: string) => Promise<void>
  addMood: (data: Omit<MoodRecord, 'recordId' | 'createdAt'>) => Promise<MoodRecord>
  deleteMood: (recordId: string) => Promise<void>
  fetchMoodStats: (childId: string) => Promise<void>

  fetchConflicts: (childId: string) => Promise<void>
  addConflict: (data: Omit<ConflictRecord, 'conflictId' | 'createdAt' | 'updatedAt'>) => Promise<ConflictRecord>
  updateConflict: (conflictId: string, data: Partial<ConflictRecord>) => Promise<void>
  deleteConflict: (conflictId: string) => Promise<void>

  fetchAll: (childId: string) => Promise<void>
  deleteByChildId: (childId: string) => void
}

export const useEmotionStore = create<EmotionStore>()(
  (set) => ({
    moodRecords: [],
    conflictRecords: [],
    moodStats: null,
    isLoading: false,
    error: null,

    fetchMoods: async (childId) => {
      try {
        const data = await emotionApi.moods.list(childId)
        set({ moodRecords: data })
      } catch (err: any) {
        set({ error: err.message || '加载心情数据失败' })
      }
    },

    addMood: async (data) => {
      const record = await emotionApi.moods.create(data)
      set((state) => {
        // Upsert: replace if same date exists, otherwise prepend
        const idx = state.moodRecords.findIndex(
          (r) => r.childId === data.childId && r.date === data.date
        )
        if (idx >= 0) {
          const updated = [...state.moodRecords]
          updated[idx] = record
          return { moodRecords: updated }
        }
        return { moodRecords: [record, ...state.moodRecords] }
      })
      return record
    },

    deleteMood: async (recordId) => {
      await emotionApi.moods.delete(recordId)
      set((s) => ({ moodRecords: s.moodRecords.filter((r) => r.recordId !== recordId) }))
    },

    fetchMoodStats: async (childId) => {
      try {
        const stats = await emotionApi.moods.stats(childId)
        set({ moodStats: stats })
      } catch (err: any) {
        set({ error: err.message || '加载情绪统计失败' })
      }
    },

    fetchConflicts: async (childId) => {
      try {
        const data = await emotionApi.conflicts.list(childId)
        set({ conflictRecords: data })
      } catch (err: any) {
        set({ error: err.message || '加载冲突记录失败' })
      }
    },

    addConflict: async (data) => {
      const record = await emotionApi.conflicts.create(data)
      set((s) => ({ conflictRecords: [record, ...s.conflictRecords] }))
      return record
    },

    updateConflict: async (conflictId, data) => {
      const updated = await emotionApi.conflicts.update(conflictId, data)
      set((s) => ({
        conflictRecords: s.conflictRecords.map((r) =>
          r.conflictId === conflictId ? updated : r
        ),
      }))
    },

    deleteConflict: async (conflictId) => {
      await emotionApi.conflicts.delete(conflictId)
      set((s) => ({
        conflictRecords: s.conflictRecords.filter((r) => r.conflictId !== conflictId),
      }))
    },

    fetchAll: async (childId) => {
      set({ isLoading: true, error: null })
      try {
        const [moods, conflicts] = await Promise.all([
          emotionApi.moods.list(childId),
          emotionApi.conflicts.list(childId),
        ])
        set({ moodRecords: moods, conflictRecords: conflicts, isLoading: false })
      } catch (err: any) {
        set({ isLoading: false, error: err.message || '加载情绪数据失败' })
      }
    },

    deleteByChildId: (childId) => {
      set((s) => ({
        moodRecords: s.moodRecords.filter((r) => r.childId !== childId),
        conflictRecords: s.conflictRecords.filter((r) => r.childId !== childId),
        moodStats: null,
      }))
    },
  })
)
