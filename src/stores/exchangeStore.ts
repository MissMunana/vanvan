import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exchange, ExchangeStatus } from '../types'
import { generateId } from '../utils/generateId'

interface ExchangeStore {
  exchanges: Exchange[]
  createExchange: (data: Omit<Exchange, 'exchangeId' | 'requestedAt' | 'reviewedAt' | 'rejectReason' | 'status'>) => void
  reviewExchange: (exchangeId: string, status: 'approved' | 'rejected', rejectReason?: string) => void
  getChildExchanges: (childId: string) => Exchange[]
  getPendingExchanges: (childId?: string) => Exchange[]
  deleteByChildId: (childId: string) => void
}

export const useExchangeStore = create<ExchangeStore>()(
  persist(
    (set, get) => ({
      exchanges: [],

      createExchange: (data) => {
        const exchange: Exchange = {
          ...data,
          exchangeId: generateId(),
          status: 'pending' as ExchangeStatus,
          requestedAt: new Date().toISOString(),
          reviewedAt: null,
          rejectReason: null,
        }
        set((state) => ({ exchanges: [exchange, ...state.exchanges] }))
      },

      reviewExchange: (exchangeId, status, rejectReason) => {
        set((state) => ({
          exchanges: state.exchanges.map((e) =>
            e.exchangeId === exchangeId
              ? {
                  ...e,
                  status,
                  reviewedAt: new Date().toISOString(),
                  rejectReason: rejectReason || null,
                }
              : e
          ),
        }))
      },

      getChildExchanges: (childId) => {
        return get().exchanges.filter((e) => e.childId === childId)
      },

      getPendingExchanges: (childId?) => {
        return get().exchanges.filter(
          (e) => e.status === 'pending' && (!childId || e.childId === childId)
        )
      },

      deleteByChildId: (childId) => {
        set((state) => ({ exchanges: state.exchanges.filter((e) => e.childId !== childId) }))
      },
    }),
    { name: 'star-exchanges' }
  )
)
