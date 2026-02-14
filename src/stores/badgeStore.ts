import { create } from 'zustand'
import type { UnlockedBadge } from '../types'
import { BADGE_LIST, type BadgeContext } from '../data/badges'
import { badgesApi } from '../lib/api'

interface BadgeStore {
  unlockedBadges: UnlockedBadge[]
  isLoading: boolean
  error: string | null
  _loadedChildIds: Set<string>

  // Server-first async methods
  fetchBadges: (childId: string) => Promise<void>

  // Check badges locally, persist new ones to server
  checkAndUnlock: (ctx: BadgeContext) => Promise<string[]>

  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildBadges: (childId: string) => UnlockedBadge[]

  // Cleanup
  logout: () => void
}

export const useBadgeStore = create<BadgeStore>()((set, get) => ({
  unlockedBadges: [],
  isLoading: false,
  error: null,
  _loadedChildIds: new Set<string>(),

  fetchBadges: async (childId) => {
    set({ isLoading: true, error: null })
    try {
      const badges = await badgesApi.list(childId)
      set((s) => {
        const otherBadges = s.unlockedBadges.filter((b) => b.childId !== childId)
        const newLoaded = new Set(s._loadedChildIds)
        newLoaded.add(childId)
        return { unlockedBadges: [...otherBadges, ...badges], isLoading: false, _loadedChildIds: newLoaded }
      })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  checkAndUnlock: async (ctx) => {
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
      set((s) => ({
        unlockedBadges: [...s.unlockedBadges, ...newBadges],
      }))

      // Persist to server (fire-and-forget)
      for (const badgeId of newlyUnlocked) {
        badgesApi.unlock(ctx.child.childId, badgeId).catch(console.error)
      }
    }

    return newlyUnlocked
  },

  getChildBadges: (childId) => {
    return get().unlockedBadges.filter((b) => b.childId === childId)
  },

  deleteByChildId: (childId) => {
    set((s) => ({ unlockedBadges: s.unlockedBadges.filter((b) => b.childId !== childId) }))
  },

  logout: () => {
    set({
      unlockedBadges: [],
      isLoading: false,
      error: null,
      _loadedChildIds: new Set<string>(),
    })
  },
}))
