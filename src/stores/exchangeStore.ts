import { create } from 'zustand'
import type { Exchange } from '../types'
import { exchangesApi } from '../lib/api'

interface ExchangeStore {
  exchanges: Exchange[]
  isLoading: boolean
  error: string | null

  // Server-first async methods
  fetchExchanges: (childId: string) => Promise<void>
  fetchPendingExchanges: () => Promise<void>
  createExchange: (data: { childId: string; rewardId: string; rewardName: string; rewardIcon: string; points: number }) => Promise<Exchange>
  reviewExchange: (exchangeId: string, status: 'approved' | 'rejected', rejectReason?: string) => Promise<Exchange>
  deleteByChildId: (childId: string) => void

  // Local-only helpers
  getChildExchanges: (childId: string) => Exchange[]
  getPendingExchanges: (childId?: string) => Exchange[]
  updateLocal: (exchange: Exchange) => void
}

export const useExchangeStore = create<ExchangeStore>()((set, get) => ({
  exchanges: [],
  isLoading: false,
  error: null,

  fetchExchanges: async (childId) => {
    set({ isLoading: true, error: null })
    try {
      const exchanges = await exchangesApi.list(childId)
      set((s) => {
        const otherExchanges = s.exchanges.filter((e) => e.childId !== childId)
        return { exchanges: [...otherExchanges, ...exchanges], isLoading: false }
      })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  fetchPendingExchanges: async () => {
    set({ isLoading: true, error: null })
    try {
      const pending = await exchangesApi.listPending()
      // Replace only pending exchanges, keep reviewed ones
      set((s) => {
        const reviewed = s.exchanges.filter((e) => e.status !== 'pending')
        return { exchanges: [...reviewed, ...pending], isLoading: false }
      })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
      throw e
    }
  },

  createExchange: async (data) => {
    const exchange = await exchangesApi.create(data)
    set((s) => ({ exchanges: [exchange, ...s.exchanges] }))
    return exchange
  },

  reviewExchange: async (exchangeId, status, rejectReason) => {
    const exchange = await exchangesApi.review(exchangeId, { status, rejectReason })
    set((s) => ({
      exchanges: s.exchanges.map((e) => (e.exchangeId === exchangeId ? exchange : e)),
    }))
    return exchange
  },

  deleteByChildId: (childId) => {
    set((s) => ({ exchanges: s.exchanges.filter((e) => e.childId !== childId) }))
  },

  getChildExchanges: (childId) => {
    return get().exchanges.filter((e) => e.childId === childId)
  },

  getPendingExchanges: (childId?) => {
    return get().exchanges.filter(
      (e) => e.status === 'pending' && (!childId || e.childId === childId)
    )
  },

  updateLocal: (exchange) => {
    set((s) => ({
      exchanges: s.exchanges.map((e) => (e.exchangeId === exchange.exchangeId ? exchange : e)),
    }))
  },
}))
