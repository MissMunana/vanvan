import { create } from 'zustand'
import type { Reward, RewardCategory } from '../types'
import { rewardsApi } from '../lib/api'

// Helper to generate temporary IDs for optimistic updates
let tempIdCounter = 0
const generateTempId = () => `temp_${Date.now()}_${++tempIdCounter}`

interface RewardStore {
  rewards: Reward[]
  isLoading: boolean
  error: string | null
  _loadedChildIds: Set<string>

  // Server-first async methods
  fetchRewards: (childId: string) => Promise<void>
  addReward: (reward: { childId: string; name: string; category: RewardCategory; points: number; icon: string; description: string; limit: Reward['limit']; stock: number; isActive: boolean }) => Promise<Reward>
  addRewards: (rewards: { childId: string; name: string; category: RewardCategory; points: number; icon: string; description: string; limit: Reward['limit']; stock: number; isActive: boolean }[]) => Promise<Reward[]>
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<Reward>
  deleteReward: (rewardId: string) => Promise<void>
  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildRewards: (childId: string) => Reward[]
  getChildRewardsByCategory: (childId: string) => Record<RewardCategory, Reward[]>

  // Cleanup
  logout: () => void
}

export const useRewardStore = create<RewardStore>()((set, get) => ({
  rewards: [],
  isLoading: false,
  error: null,
  _loadedChildIds: new Set<string>(),

  fetchRewards: async (childId) => {
    set({ isLoading: true, error: null })
    try {
      const rewards = await rewardsApi.list(childId)
      set((s) => {
        const otherRewards = s.rewards.filter((r) => r.childId !== childId)
        const newLoaded = new Set(s._loadedChildIds)
        newLoaded.add(childId)
        return { rewards: [...otherRewards, ...rewards], isLoading: false, _loadedChildIds: newLoaded }
      })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  addReward: async (rewardData) => {
    const previousRewards = get().rewards
    const tempId = generateTempId()
    const tempReward = { ...rewardData, rewardId: tempId, isPending: true } as unknown as Reward
    
    // Optimistic update
    set((s) => ({ rewards: [...s.rewards, tempReward] }))
    
    try {
      const reward = await rewardsApi.create(rewardData)
      set((s) => ({ rewards: s.rewards.map((r) => r.rewardId === tempId ? reward : r) }))
      return reward
    } catch (error) {
      // Rollback on error
      set({ rewards: previousRewards })
      console.error('Failed to add reward:', error)
      throw error
    }
  },

  addRewards: async (rewardDataList) => {
    try {
      const rewards = await rewardsApi.createBatch(rewardDataList)
      set((s) => ({ rewards: [...s.rewards, ...rewards] }))
      return rewards
    } catch (error) {
      console.error('Failed to add rewards:', error)
      throw error
    }
  },

  updateReward: async (rewardId, updates) => {
    const previousRewards = get().rewards
    // Optimistic update
    set((s) => ({
      rewards: s.rewards.map((r) => (r.rewardId === rewardId ? { ...r, ...updates } : r)),
    }))
    try {
      const reward = await rewardsApi.update(rewardId, updates)
      set((s) => ({
        rewards: s.rewards.map((r) => (r.rewardId === rewardId ? reward : r)),
      }))
      return reward
    } catch (error) {
      // Rollback on error
      set({ rewards: previousRewards })
      console.error('Failed to update reward:', error)
      throw error
    }
  },

  deleteReward: async (rewardId) => {
    const previousRewards = get().rewards
    // Optimistic update
    set((s) => ({
      rewards: s.rewards.filter((r) => r.rewardId !== rewardId),
    }))
    try {
      await rewardsApi.delete(rewardId)
    } catch (error) {
      // Rollback on error
      set({ rewards: previousRewards })
      console.error('Failed to delete reward:', error)
      throw error
    }
  },

  deleteByChildId: (childId) => {
    set((s) => ({ rewards: s.rewards.filter((r) => r.childId !== childId) }))
  },

  getChildRewards: (childId) => {
    return get().rewards.filter((r) => r.childId === childId && r.isActive)
  },

  getChildRewardsByCategory: (childId) => {
    const rewards = get().getChildRewards(childId)
    const grouped: Record<RewardCategory, Reward[]> = {
      time: [], privilege: [], material: [],
    }
    rewards.forEach((r) => {
      grouped[r.category].push(r)
    })
    return grouped
  },

  logout: () => {
    set({
      rewards: [],
      isLoading: false,
      error: null,
      _loadedChildIds: new Set<string>(),
    })
  },
}))
