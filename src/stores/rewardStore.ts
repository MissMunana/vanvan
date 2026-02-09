import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Reward, RewardCategory } from '../types'
import { REWARD_TEMPLATES } from '../data/templates'
import { generateId } from '../utils/generateId'

interface RewardStore {
  rewards: Reward[]
  addReward: (reward: Omit<Reward, 'rewardId' | 'createdAt'>) => void
  addRewards: (rewards: Omit<Reward, 'rewardId' | 'createdAt'>[]) => void
  updateReward: (rewardId: string, updates: Partial<Reward>) => void
  deleteReward: (rewardId: string) => void
  getChildRewards: (childId: string) => Reward[]
  getChildRewardsByCategory: (childId: string) => Record<RewardCategory, Reward[]>
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
    {
      name: 'star-rewards',
      version: 1,
      migrate: (persistedState: any, _version: number) => {
        const state = persistedState as { rewards: Reward[] }
        const iconMap = new Map(REWARD_TEMPLATES.map((t) => [t.name, t.icon]))
        state.rewards = state.rewards.map((reward) => {
          const newIcon = iconMap.get(reward.name)
          return newIcon ? { ...reward, icon: newIcon } : reward
        })
        return state
      },
    }
  )
)
