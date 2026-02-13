import { create } from 'zustand'
import type { GrowthRecord, TemperatureRecord, MedicationRecord, VaccinationRecord, MilestoneRecord, MilestoneStatus, SleepRecord, EmergencyProfile, SafetyChecklistProgress, MedicineCabinetItem } from '../types'
import { healthApi, emergencyApi } from '../lib/api'

interface HealthStore {
  growthRecords: GrowthRecord[]
  temperatureRecords: TemperatureRecord[]
  medicationRecords: MedicationRecord[]
  vaccinationRecords: VaccinationRecord[]
  milestoneRecords: MilestoneRecord[]
  sleepRecords: SleepRecord[]
  emergencyProfile: EmergencyProfile | null
  safetyChecklistProgress: SafetyChecklistProgress[]
  isLoading: boolean
  error: string | null

  // Fetch methods
  fetchGrowthRecords: (childId: string) => Promise<void>
  fetchTemperatureRecords: (childId: string) => Promise<void>
  fetchMedicationRecords: (childId: string) => Promise<void>
  fetchVaccinationRecords: (childId: string) => Promise<void>
  fetchMilestoneRecords: (childId: string) => Promise<void>
  fetchSleepRecords: (childId: string) => Promise<void>
  fetchEmergencyProfile: (childId: string) => Promise<void>
  fetchSafetyChecklistProgress: (childId: string) => Promise<void>
  fetchAllHealth: (childId: string) => Promise<void>

  // Growth
  addGrowthRecord: (data: Omit<GrowthRecord, 'recordId' | 'createdAt'>) => Promise<void>
  updateGrowthRecord: (recordId: string, updates: Partial<Omit<GrowthRecord, 'recordId' | 'childId' | 'createdAt'>>) => Promise<void>
  deleteGrowthRecord: (recordId: string) => Promise<void>

  // Temperature
  addTemperatureRecord: (data: Omit<TemperatureRecord, 'recordId' | 'createdAt'>) => Promise<void>
  deleteTemperatureRecord: (recordId: string) => Promise<void>

  // Medication
  addMedicationRecord: (data: Omit<MedicationRecord, 'recordId' | 'createdAt'>) => Promise<void>
  deleteMedicationRecord: (recordId: string) => Promise<void>
  getLastMedicationTime: (childId: string, genericName: string) => string | null
  checkMedicationInterval: (childId: string, genericName: string) => { safe: boolean; minutesRemaining: number }

  // Vaccination
  addVaccinationRecord: (data: Omit<VaccinationRecord, 'recordId' | 'createdAt'>) => Promise<void>
  deleteVaccinationRecord: (recordId: string) => Promise<void>

  // Milestone
  updateMilestoneStatus: (childId: string, milestoneId: string, status: MilestoneStatus, note?: string, extra?: { photoTaken?: boolean; photoNote?: string }) => Promise<void>

  // Sleep
  addSleepRecord: (data: Omit<SleepRecord, 'recordId' | 'createdAt'>) => Promise<void>
  updateSleepRecord: (recordId: string, updates: Partial<SleepRecord>) => Promise<void>
  deleteSleepRecord: (recordId: string) => Promise<void>

  // Emergency
  upsertEmergencyProfile: (data: Omit<EmergencyProfile, 'profileId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  toggleSafetyChecklistItem: (childId: string, checklistItemId: string, completed: boolean) => Promise<void>

  // Medicine Cabinet
  cabinetItems: MedicineCabinetItem[]
  fetchCabinetItems: () => Promise<void>
  addCabinetItem: (data: Omit<MedicineCabinetItem, 'itemId' | 'familyId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCabinetItem: (itemId: string, updates: Partial<MedicineCabinetItem>) => Promise<void>
  deleteCabinetItem: (itemId: string) => Promise<void>
  getExpiringItems: (daysAhead?: number) => MedicineCabinetItem[]
  getOpenedExpiredItems: () => MedicineCabinetItem[]

  // Cleanup
  deleteByChildId: (childId: string) => void
}

const MEDICATION_INTERVALS: Record<string, number> = {
  ibuprofen: 6 * 60,
  acetaminophen: 4 * 60,
  oseltamivir: 12 * 60,
  amoxicillin_clavulanate: 8 * 60,
  azithromycin: 24 * 60,
  montelukast: 24 * 60,
  cetirizine: 12 * 60,
  loratadine: 24 * 60,
  montmorillonite: 8 * 60,
}

export const useHealthStore = create<HealthStore>()(
  (set, get) => ({
    growthRecords: [],
    temperatureRecords: [],
    medicationRecords: [],
    vaccinationRecords: [],
    milestoneRecords: [],
    sleepRecords: [],
    emergencyProfile: null,
    safetyChecklistProgress: [],
    isLoading: false,
    error: null,

    fetchGrowthRecords: async (childId) => {
      const data = await healthApi.growth.list(childId)
      set({ growthRecords: data })
    },

    fetchTemperatureRecords: async (childId) => {
      const data = await healthApi.temperature.list(childId)
      set({ temperatureRecords: data })
    },

    fetchMedicationRecords: async (childId) => {
      const data = await healthApi.medication.list(childId)
      set({ medicationRecords: data })
    },

    fetchVaccinationRecords: async (childId) => {
      const data = await healthApi.vaccination.list(childId)
      set({ vaccinationRecords: data })
    },

    fetchMilestoneRecords: async (childId) => {
      const data = await healthApi.milestone.list(childId)
      set({ milestoneRecords: data })
    },

    fetchSleepRecords: async (childId) => {
      const data = await healthApi.sleep.list(childId)
      set({ sleepRecords: data })
    },

    fetchEmergencyProfile: async (childId) => {
      const data = await emergencyApi.profile.get(childId)
      set({ emergencyProfile: data })
    },

    fetchSafetyChecklistProgress: async (childId) => {
      const data = await emergencyApi.checklist.list(childId)
      set({ safetyChecklistProgress: data })
    },

    fetchAllHealth: async (childId) => {
      set({ isLoading: true, error: null })
      try {
        const [growth, temperature, medication, vaccination, milestone, sleep] = await Promise.all([
          healthApi.growth.list(childId),
          healthApi.temperature.list(childId),
          healthApi.medication.list(childId),
          healthApi.vaccination.list(childId),
          healthApi.milestone.list(childId),
          healthApi.sleep.list(childId),
        ])
        set({
          growthRecords: growth,
          temperatureRecords: temperature,
          medicationRecords: medication,
          vaccinationRecords: vaccination,
          milestoneRecords: milestone,
          sleepRecords: sleep,
          isLoading: false,
        })
        // Fetch emergency data non-blocking
        Promise.all([
          emergencyApi.profile.get(childId).then((data) => set({ emergencyProfile: data })),
          emergencyApi.checklist.list(childId).then((data) => set({ safetyChecklistProgress: data })),
        ]).catch(() => { /* non-critical */ })
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Failed to load health data' })
      }
    },

    addGrowthRecord: async (data) => {
      const record = await healthApi.growth.create(data)
      set((state) => ({
        growthRecords: [...state.growthRecords, record]
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
    },

    updateGrowthRecord: async (recordId, updates) => {
      const updated = await healthApi.growth.update(recordId, updates)
      set((state) => ({
        growthRecords: state.growthRecords.map((r) =>
          r.recordId === recordId ? updated : r
        ),
      }))
    },

    deleteGrowthRecord: async (recordId) => {
      await healthApi.growth.delete(recordId)
      set((state) => ({
        growthRecords: state.growthRecords.filter((r) => r.recordId !== recordId),
      }))
    },

    addTemperatureRecord: async (data) => {
      const record = await healthApi.temperature.create(data)
      set((state) => ({
        temperatureRecords: [record, ...state.temperatureRecords],
      }))
    },

    deleteTemperatureRecord: async (recordId) => {
      await healthApi.temperature.delete(recordId)
      set((state) => ({
        temperatureRecords: state.temperatureRecords.filter((r) => r.recordId !== recordId),
      }))
    },

    addMedicationRecord: async (data) => {
      const record = await healthApi.medication.create(data)
      set((state) => ({
        medicationRecords: [record, ...state.medicationRecords],
      }))
    },

    deleteMedicationRecord: async (recordId) => {
      await healthApi.medication.delete(recordId)
      set((state) => ({
        medicationRecords: state.medicationRecords.filter((r) => r.recordId !== recordId),
      }))
    },

    getLastMedicationTime: (childId, genericName) => {
      const records = get()
        .medicationRecords.filter(
          (r) => r.childId === childId && r.genericName === genericName
        )
        .sort((a, b) => b.administrationTime.localeCompare(a.administrationTime))
      return records.length > 0 ? records[0].administrationTime : null
    },

    checkMedicationInterval: (childId, genericName) => {
      const minInterval = MEDICATION_INTERVALS[genericName]
      if (!minInterval) return { safe: true, minutesRemaining: 0 }

      const lastTime = get().getLastMedicationTime(childId, genericName)
      if (!lastTime) return { safe: true, minutesRemaining: 0 }

      const elapsed = (Date.now() - new Date(lastTime).getTime()) / 60000
      const remaining = minInterval - elapsed
      return {
        safe: remaining <= 0,
        minutesRemaining: Math.max(0, Math.ceil(remaining)),
      }
    },

    addVaccinationRecord: async (data) => {
      const record = await healthApi.vaccination.create(data)
      set((state) => ({
        vaccinationRecords: [...state.vaccinationRecords, record],
      }))
    },

    deleteVaccinationRecord: async (recordId) => {
      await healthApi.vaccination.delete(recordId)
      set((state) => ({
        vaccinationRecords: state.vaccinationRecords.filter((r) => r.recordId !== recordId),
      }))
    },

    updateMilestoneStatus: async (childId, milestoneId, status, note, extra) => {
      const record = await healthApi.milestone.upsert({
        childId,
        milestoneId,
        status,
        note,
        photoTaken: extra?.photoTaken,
        photoNote: extra?.photoNote,
      })
      set((state) => {
        const existing = state.milestoneRecords.find(
          (r) => r.childId === childId && r.milestoneId === milestoneId
        )
        if (existing) {
          return {
            milestoneRecords: state.milestoneRecords.map((r) =>
              r.childId === childId && r.milestoneId === milestoneId ? record : r
            ),
          }
        }
        return { milestoneRecords: [...state.milestoneRecords, record] }
      })
    },

    addSleepRecord: async (data) => {
      const record = await healthApi.sleep.create(data)
      set((state) => ({
        sleepRecords: [record, ...state.sleepRecords],
      }))
    },

    updateSleepRecord: async (recordId, updates) => {
      const updated = await healthApi.sleep.update(recordId, updates)
      set((state) => ({
        sleepRecords: state.sleepRecords.map((r) =>
          r.recordId === recordId ? updated : r
        ),
      }))
    },

    deleteSleepRecord: async (recordId) => {
      await healthApi.sleep.delete(recordId)
      set((state) => ({
        sleepRecords: state.sleepRecords.filter((r) => r.recordId !== recordId),
      }))
    },

    upsertEmergencyProfile: async (data) => {
      const profile = await emergencyApi.profile.upsert(data)
      set({ emergencyProfile: profile })
    },

    toggleSafetyChecklistItem: async (childId, checklistItemId, completed) => {
      const progress = await emergencyApi.checklist.toggle(childId, checklistItemId, completed)
      set((state) => {
        const existing = state.safetyChecklistProgress.find(
          (p) => p.childId === childId && p.checklistItemId === checklistItemId
        )
        if (existing) {
          return {
            safetyChecklistProgress: state.safetyChecklistProgress.map((p) =>
              p.childId === childId && p.checklistItemId === checklistItemId ? progress : p
            ),
          }
        }
        return { safetyChecklistProgress: [...state.safetyChecklistProgress, progress] }
      })
    },

    // Medicine Cabinet
    cabinetItems: [],

    fetchCabinetItems: async () => {
      const data = await healthApi.cabinet.list()
      set({ cabinetItems: data })
    },

    addCabinetItem: async (data) => {
      const item = await healthApi.cabinet.create(data)
      set((state) => ({ cabinetItems: [...state.cabinetItems, item] }))
    },

    updateCabinetItem: async (itemId, updates) => {
      const updated = await healthApi.cabinet.update(itemId, updates)
      set((state) => ({
        cabinetItems: state.cabinetItems.map((i) => i.itemId === itemId ? updated : i),
      }))
    },

    deleteCabinetItem: async (itemId) => {
      await healthApi.cabinet.delete(itemId)
      set((state) => ({
        cabinetItems: state.cabinetItems.filter((i) => i.itemId !== itemId),
      }))
    },

    getExpiringItems: (daysAhead = 30) => {
      const now = new Date()
      const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      const thresholdStr = threshold.toISOString().split('T')[0]
      return get().cabinetItems.filter((i) => i.expiryDate <= thresholdStr)
    },

    getOpenedExpiredItems: () => {
      const today = new Date().toISOString().split('T')[0]
      return get().cabinetItems.filter((i) => {
        if (!i.openedDate || !i.openedShelfLifeDays) return false
        const opened = new Date(i.openedDate)
        opened.setDate(opened.getDate() + i.openedShelfLifeDays)
        return opened.toISOString().split('T')[0] <= today
      })
    },

    deleteByChildId: (childId) => {
      set((state) => ({
        growthRecords: state.growthRecords.filter((r) => r.childId !== childId),
        temperatureRecords: state.temperatureRecords.filter((r) => r.childId !== childId),
        medicationRecords: state.medicationRecords.filter((r) => r.childId !== childId),
        vaccinationRecords: state.vaccinationRecords.filter((r) => r.childId !== childId),
        milestoneRecords: state.milestoneRecords.filter((r) => r.childId !== childId),
        sleepRecords: state.sleepRecords.filter((r) => r.childId !== childId),
        emergencyProfile: state.emergencyProfile?.childId === childId ? null : state.emergencyProfile,
        safetyChecklistProgress: state.safetyChecklistProgress.filter((p) => p.childId !== childId),
      }))
    },
  })
)
