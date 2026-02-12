import { create } from 'zustand'
import type { Reward, RewardCategory } from '../types'
import { rewardsApi } from '../lib/api'

interface RewardStore {
  rewards: Reward[]
  isLoading: boolean
  error: string | null
  _loadedChildIds: Set<string>

  // Server-first async methods
  fetchRewards: (childId: string) => Promise<void>
  addReward: (reward: { childId: string; name: string; category: RewardCategory; points: number; icon: string; description: string; limit: Reward['limit']; stock: number; isActive: boolean }) => Promise<void>
  addRewards: (rewards: { childId: string; name: string; category: RewardCategory; points: number; icon: string; description: string; limit: Reward['limit']; stock: number; isActive: boolean }[]) => Promise<void>
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>
  deleteReward: (rewardId: string) => Promise<void>
  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildRewards: (childId: string) => Reward[]
  getChildRewardsByCategory: (childId: string) => Record<RewardCategory, Reward[]>
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
    const reward = await rewardsApi.create(rewardData)
    set((s) => ({ rewards: [...s.rewards, reward] }))
  },

  addRewards: async (rewardDataList) => {
    const rewards = await rewardsApi.createBatch(rewardDataList)
    set((s) => ({ rewards: [...s.rewards, ...rewards] }))
  },

  updateReward: async (rewardId, updates) => {
    const reward = await rewardsApi.update(rewardId, updates)
    set((s) => ({
      rewards: s.rewards.map((r) => (r.rewardId === rewardId ? reward : r)),
    }))
  },

  deleteReward: async (rewardId) => {
    await rewardsApi.delete(rewardId)
    set((s) => ({
      rewards: s.rewards.filter((r) => r.rewardId !== rewardId),
    }))
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
}))
