import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Reward, RewardCategory } from '../types'

interface RewardStore {
  rewards: Reward[]
  addReward: (reward: Omit<Reward, 'rewardId' | 'createdAt'>) => void
  addRewards: (rewards: Omit<Reward, 'rewardId' | 'createdAt'>[]) => void
  updateReward: (rewardId: string, updates: Partial<Reward>) => void
  deleteReward: (rewardId: string) => void
  getChildRewards: (childId: string) => Reward[]
  getChildRewardsByCategory: (childId: string) => Record<RewardCategory, Reward[]>
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useRewardStore = create<RewardStore>()(
  persist(
    (set, get) => ({
      rewards: [],

      addReward: (rewardData) => {
        const reward: Reward = {
          ...rewardData,
          rewardId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ rewards: [...state.rewards, reward] }))
      },

      addRewards: (rewardDataList) => {
        const newRewards = rewardDataList.map((rd) => ({
          ...rd,
          rewardId: generateId(),
          createdAt: new Date().toISOString(),
        }))
        set((state) => ({ rewards: [...state.rewards, ...newRewards] }))
      },

      updateReward: (rewardId, updates) => {
        set((state) => ({
          rewards: state.rewards.map((r) =>
            r.rewardId === rewardId ? { ...r, ...updates } : r
          ),
        }))
      },

      deleteReward: (rewardId) => {
        set((state) => ({
          rewards: state.rewards.filter((r) => r.rewardId !== rewardId),
        }))
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
    }),
    { name: 'star-rewards' }
  )
)
