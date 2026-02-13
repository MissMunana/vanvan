import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase-browser'

interface AuthStore {
  user: User | null
  session: Session | null
  familyId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isDataLoaded: boolean

  initialize: () => Promise<void>
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setFamilyId: (id: string | null) => void
  setDataLoaded: (loaded: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      familyId: null,
      isAuthenticated: false,
      isLoading: true,
      isDataLoaded: false,

      initialize: async () => {
        set({ isLoading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            set({
              session,
              user: session.user,
              isAuthenticated: true,
            })
            // Fetch family ID from family_members (supports multi-caregiver)
            const { data } = await supabase
              .from('family_members')
              .select('family_id')
              .eq('user_id', session.user.id)
              .single()
            if (data) {
              set({ familyId: data.family_id })
            }
          } else {
            set({
              session: null,
              user: null,
              isAuthenticated: false,
              familyId: null,
            })
          }
        } catch {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      setSession: (session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        })
      },

      setUser: (user) => set({ user }),
      setFamilyId: (id) => set({ familyId: id }),
      setDataLoaded: (loaded) => set({ isDataLoaded: loaded }),

      logout: async () => {
        await supabase.auth.signOut()
        set({
          user: null,
          session: null,
          familyId: null,
          isAuthenticated: false,
          isDataLoaded: false,
        })
      },
    }),
    {
      name: 'star-auth',
      version: 1,
      partialize: (state) => ({
        familyId: state.familyId,
      }),
    }
  )
)
