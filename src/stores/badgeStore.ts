import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UnlockedBadge } from '../types'
import { BADGE_LIST, type BadgeContext } from '../data/badges'

interface BadgeStore {
  unlockedBadges: UnlockedBadge[]
  checkAndUnlock: (ctx: BadgeContext) => string[]
  getChildBadges: (childId: string) => UnlockedBadge[]
}

export const useBadgeStore = create<BadgeStore>()(
  persist(
    (set, get) => ({
      unlockedBadges: [],

      checkAndUnlock: (ctx) => {
        const current = get().unlockedBadges
        const childUnlocked = new Set(
          current.filter((b) => b.childId === ctx.child.childId).map((b) => b.badgeId)
        )

        const newlyUnlocked: string[] = []

        for (const badge of BADGE_LIST) {
          if (childUnlocked.has(badge.badgeId)) continue
          if (badge.check(ctx)) {
            newlyUnlocked.push(badge.badgeId)
          }
        }

        if (newlyUnlocked.length > 0) {
          const newBadges: UnlockedBadge[] = newlyUnlocked.map((badgeId) => ({
            childId: ctx.child.childId,
            badgeId,
            unlockedAt: new Date().toISOString(),
          }))
          set((state) => ({
            unlockedBadges: [...state.unlockedBadges, ...newBadges],
          }))
        }

        return newlyUnlocked
      },

      getChildBadges: (childId) => {
        return get().unlockedBadges.filter((b) => b.childId === childId)
      },
    }),
    { name: 'star-badges', version: 1 }
  )
)
