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
}

export const useFamilyStore = create<FamilyStore>()(
  (set, get) => ({
    members: [],
    currentMember: null,
    handoverLogs: [],

    fetchMembers: async () => {
      const data = await familyApi.members.list()
      set({ members: data })
    },

    fetchCurrentMember: async () => {
      const data = await familyApi.me()
      set({ currentMember: data })
    },

    inviteMember: async (role) => {
      return await familyApi.members.invite(role)
    },

    updateMemberRole: async (memberId, role) => {
      const updated = await familyApi.members.updateRole(memberId, role)
      set((state) => ({
        members: state.members.map((m) => m.memberId === memberId ? updated : m),
      }))
    },

    removeMember: async (memberId) => {
      await familyApi.members.remove(memberId)
      set((state) => ({
        members: state.members.filter((m) => m.memberId !== memberId),
      }))
    },

    joinFamily: async (inviteCode, confirmTransfer) => {
      const member = await familyApi.join(inviteCode, confirmTransfer)
      set({ currentMember: member })
      return member
    },

    fetchHandoverLogs: async (childId, startDate) => {
      const data = await familyApi.handovers.list(childId, startDate)
      set({ handoverLogs: data })
    },

    addHandoverLog: async (data) => {
      const log = await familyApi.handovers.create(data)
      set((state) => ({ handoverLogs: [log, ...state.handoverLogs] }))
    },

    updateHandoverLog: async (logId, updates) => {
      const updated = await familyApi.handovers.update(logId, updates)
      set((state) => ({
        handoverLogs: state.handoverLogs.map((l) => l.logId === logId ? updated : l),
      }))
    },

    deleteHandoverLog: async (logId) => {
      await familyApi.handovers.delete(logId)
      set((state) => ({
        handoverLogs: state.handoverLogs.filter((l) => l.logId !== logId),
      }))
    },

    getUrgentLogs: () => {
      return get().handoverLogs.filter((l) => l.priority === 'urgent')
    },

    hasPermission: (permission) => {
      const member = get().currentMember
      if (!member) return false
      return ROLE_PERMISSIONS[member.role]?.[permission] ?? false
    },
  })
)
