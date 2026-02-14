import { create } from 'zustand'
import type { FamilyMember, FamilyInvite, FamilyRole, HandoverLog } from '../types'
import { ROLE_PERMISSIONS } from '../types'
import { familyApi } from '../lib/api'

interface FamilyStore {
  members: FamilyMember[]
  currentMember: FamilyMember | null
  handoverLogs: HandoverLog[]

  // Members
  fetchMembers: () => Promise<void>
  fetchCurrentMember: () => Promise<void>
  inviteMember: (role: FamilyRole) => Promise<FamilyInvite>
  updateMemberRole: (memberId: string, role: FamilyRole) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  joinFamily: (inviteCode: string, confirmTransfer?: boolean) => Promise<FamilyMember>

  // Handovers
  fetchHandoverLogs: (childId?: string, startDate?: string) => Promise<void>
  addHandoverLog: (data: Omit<HandoverLog, 'logId' | 'familyId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateHandoverLog: (logId: string, updates: Partial<HandoverLog>) => Promise<void>
  deleteHandoverLog: (logId: string) => Promise<void>
  getUrgentLogs: () => HandoverLog[]

  // Permissions
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS['admin']) => boolean

  // Cleanup
  logout: () => void
}

export const useFamilyStore = create<FamilyStore>()(
  (set, get) => ({
    members: [],
    currentMember: null,
    handoverLogs: [],

    fetchMembers: async () => {
      try {
        const data = await familyApi.members.list()
        set({ members: data })
      } catch (error) {
        console.error('Failed to fetch members:', error)
        // Keep existing members on error
      }
    },

    fetchCurrentMember: async () => {
      try {
        const data = await familyApi.me()
        set({ currentMember: data })
      } catch (error) {
        console.error('Failed to fetch current member:', error)
        set({ currentMember: null })
      }
    },

    inviteMember: async (role) => {
      try {
        return await familyApi.members.invite(role)
      } catch (error) {
        console.error('Failed to invite member:', error)
        throw error
      }
    },

    updateMemberRole: async (memberId, role) => {
      const previousMembers = get().members
      // Optimistic update
      set((state) => ({
        members: state.members.map((m) => m.memberId === memberId ? { ...m, role } : m),
      }))
      try {
        const updated = await familyApi.members.updateRole(memberId, role)
        set((state) => ({
          members: state.members.map((m) => m.memberId === memberId ? updated : m),
        }))
      } catch (error) {
        // Rollback on error
        set({ members: previousMembers })
        console.error('Failed to update member role:', error)
        throw error
      }
    },

    removeMember: async (memberId) => {
      const previousMembers = get().members
      // Optimistic update
      set((state) => ({
        members: state.members.filter((m) => m.memberId !== memberId),
      }))
      try {
        await familyApi.members.remove(memberId)
      } catch (error) {
        // Rollback on error
        set({ members: previousMembers })
        console.error('Failed to remove member:', error)
        throw error
      }
    },

    joinFamily: async (inviteCode, confirmTransfer) => {
      try {
        const member = await familyApi.join(inviteCode, confirmTransfer)
        set({ currentMember: member, members: [...get().members, member] })
        return member
      } catch (error) {
        console.error('Failed to join family:', error)
        throw error
      }
    },

    fetchHandoverLogs: async (childId, startDate) => {
      try {
        const data = await familyApi.handovers.list(childId, startDate)
        set({ handoverLogs: data })
      } catch (error) {
        console.error('Failed to fetch handover logs:', error)
      }
    },

    addHandoverLog: async (data) => {
      try {
        const log = await familyApi.handovers.create(data)
        set((state) => ({ handoverLogs: [log, ...state.handoverLogs] }))
      } catch (error) {
        console.error('Failed to add handover log:', error)
        throw error
      }
    },

    updateHandoverLog: async (logId, updates) => {
      const previousLogs = get().handoverLogs
      // Optimistic update
      set((state) => ({
        handoverLogs: state.handoverLogs.map((l) => l.logId === logId ? { ...l, ...updates } : l),
      }))
      try {
        const updated = await familyApi.handovers.update(logId, updates)
        set((state) => ({
          handoverLogs: state.handoverLogs.map((l) => l.logId === logId ? updated : l),
        }))
      } catch (error) {
        // Rollback on error
        set({ handoverLogs: previousLogs })
        console.error('Failed to update handover log:', error)
        throw error
      }
    },

    deleteHandoverLog: async (logId) => {
      const previousLogs = get().handoverLogs
      // Optimistic update
      set((state) => ({
        handoverLogs: state.handoverLogs.filter((l) => l.logId !== logId),
      }))
      try {
        await familyApi.handovers.delete(logId)
      } catch (error) {
        // Rollback on error
        set({ handoverLogs: previousLogs })
        console.error('Failed to delete handover log:', error)
        throw error
      }
    },

    getUrgentLogs: () => {
      return get().handoverLogs.filter((l) => l.priority === 'urgent')
    },

    hasPermission: (permission) => {
      const member = get().currentMember
      if (!member) return false
      return ROLE_PERMISSIONS[member.role]?.[permission] ?? false
    },

    logout: () => {
      set({
        members: [],
        currentMember: null,
        handoverLogs: [],
      })
    },
  })
)
