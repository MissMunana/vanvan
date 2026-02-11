import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GrowthRecord, TemperatureRecord, MedicationRecord, VaccinationRecord, MilestoneRecord, MilestoneStatus } from '../types'
import { generateId } from '../utils/generateId'

const MAX_RECORDS = 500

interface HealthStore {
  growthRecords: GrowthRecord[]
  temperatureRecords: TemperatureRecord[]
  medicationRecords: MedicationRecord[]
  vaccinationRecords: VaccinationRecord[]
  milestoneRecords: MilestoneRecord[]

  addGrowthRecord: (data: Omit<GrowthRecord, 'recordId' | 'createdAt'>) => void
  updateGrowthRecord: (recordId: string, updates: Partial<Omit<GrowthRecord, 'recordId' | 'childId' | 'createdAt'>>) => void
  deleteGrowthRecord: (recordId: string) => void
  getChildGrowthRecords: (childId: string) => GrowthRecord[]

  addTemperatureRecord: (data: Omit<TemperatureRecord, 'recordId' | 'createdAt'>) => void
  deleteTemperatureRecord: (recordId: string) => void
  getChildTemperatureRecords: (childId: string, hours?: number) => TemperatureRecord[]

  addMedicationRecord: (data: Omit<MedicationRecord, 'recordId' | 'createdAt'>) => void
  deleteMedicationRecord: (recordId: string) => void
  getChildMedicationRecords: (childId: string) => MedicationRecord[]
  getLastMedicationTime: (childId: string, genericName: string) => string | null
  checkMedicationInterval: (childId: string, genericName: string) => { safe: boolean; minutesRemaining: number }

  addVaccinationRecord: (data: Omit<VaccinationRecord, 'recordId' | 'createdAt'>) => void
  deleteVaccinationRecord: (recordId: string) => void
  getChildVaccinationRecords: (childId: string) => VaccinationRecord[]

  updateMilestoneStatus: (childId: string, milestoneId: string, status: MilestoneStatus, note?: string, extra?: { photoTaken?: boolean; photoNote?: string }) => void
  getChildMilestoneRecords: (childId: string) => MilestoneRecord[]
  getMilestoneStatus: (childId: string, milestoneId: string) => MilestoneRecord | undefined

  deleteByChildId: (childId: string) => void
  hydrateFromCloud: (data: {
    growthRecords?: GrowthRecord[]
    temperatureRecords?: TemperatureRecord[]
    medicationRecords?: MedicationRecord[]
    vaccinationRecords?: VaccinationRecord[]
    milestoneRecords?: MilestoneRecord[]
  }) => void
}

const MEDICATION_INTERVALS: Record<string, number> = {
  ibuprofen: 6 * 60,
  acetaminophen: 4 * 60,
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      growthRecords: [],
      temperatureRecords: [],
      medicationRecords: [],
      vaccinationRecords: [],
      milestoneRecords: [],

      addGrowthRecord: (data) => {
        const record: GrowthRecord = {
          ...data,
          recordId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          growthRecords: [...state.growthRecords, record]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-MAX_RECORDS),
        }))
      },

      updateGrowthRecord: (recordId, updates) => {
        set((state) => ({
          growthRecords: state.growthRecords.map((r) =>
            r.recordId === recordId ? { ...r, ...updates } : r
          ),
        }))
      },

      deleteGrowthRecord: (recordId) => {
        set((state) => ({
          growthRecords: state.growthRecords.filter((r) => r.recordId !== recordId),
        }))
      },

      getChildGrowthRecords: (childId) => {
        return get()
          .growthRecords.filter((r) => r.childId === childId)
          .sort((a, b) => a.date.localeCompare(b.date))
      },

      addTemperatureRecord: (data) => {
        const record: TemperatureRecord = {
          ...data,
          recordId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          temperatureRecords: [record, ...state.temperatureRecords].slice(0, MAX_RECORDS),
        }))
      },

      deleteTemperatureRecord: (recordId) => {
        set((state) => ({
          temperatureRecords: state.temperatureRecords.filter((r) => r.recordId !== recordId),
        }))
      },

      getChildTemperatureRecords: (childId, hours) => {
        const records = get()
          .temperatureRecords.filter((r) => r.childId === childId)
          .sort((a, b) => a.measureTime.localeCompare(b.measureTime))
        if (!hours) return records
        const cutoff = new Date(Date.now() - hours * 3600000).toISOString()
        return records.filter((r) => r.measureTime >= cutoff)
      },

      addMedicationRecord: (data) => {
        const record: MedicationRecord = {
          ...data,
          recordId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          medicationRecords: [record, ...state.medicationRecords].slice(0, MAX_RECORDS),
        }))
      },

      deleteMedicationRecord: (recordId) => {
        set((state) => ({
          medicationRecords: state.medicationRecords.filter((r) => r.recordId !== recordId),
        }))
      },

      getChildMedicationRecords: (childId) => {
        return get()
          .medicationRecords.filter((r) => r.childId === childId)
          .sort((a, b) => b.administrationTime.localeCompare(a.administrationTime))
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

      addVaccinationRecord: (data) => {
        const record: VaccinationRecord = {
          ...data,
          recordId: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          vaccinationRecords: [...state.vaccinationRecords, record].slice(-MAX_RECORDS),
        }))
      },

      deleteVaccinationRecord: (recordId) => {
        set((state) => ({
          vaccinationRecords: state.vaccinationRecords.filter((r) => r.recordId !== recordId),
        }))
      },

      getChildVaccinationRecords: (childId) => {
        return get()
          .vaccinationRecords.filter((r) => r.childId === childId)
          .sort((a, b) => a.date.localeCompare(b.date))
      },

      updateMilestoneStatus: (childId, milestoneId, status, note, extra) => {
        set((state) => {
          const existing = state.milestoneRecords.find(
            (r) => r.childId === childId && r.milestoneId === milestoneId
          )
          if (existing) {
            return {
              milestoneRecords: state.milestoneRecords.map((r) =>
                r.childId === childId && r.milestoneId === milestoneId
                  ? {
                      ...r,
                      status,
                      achievedDate: status === 'achieved' ? new Date().toISOString().split('T')[0] : r.achievedDate,
                      note: note ?? r.note,
                      ...(extra?.photoTaken !== undefined ? { photoTaken: extra.photoTaken } : {}),
                      ...(extra?.photoNote !== undefined ? { photoNote: extra.photoNote } : {}),
                    }
                  : r
              ),
            }
          }
          const record: MilestoneRecord = {
            recordId: generateId(),
            childId,
            milestoneId,
            status,
            achievedDate: status === 'achieved' ? new Date().toISOString().split('T')[0] : null,
            note: note ?? '',
            photoTaken: extra?.photoTaken,
            photoNote: extra?.photoNote,
            createdAt: new Date().toISOString(),
          }
          return { milestoneRecords: [...state.milestoneRecords, record].slice(-MAX_RECORDS) }
        })
      },

      getChildMilestoneRecords: (childId) => {
        return get().milestoneRecords.filter((r) => r.childId === childId)
      },

      getMilestoneStatus: (childId, milestoneId) => {
        return get().milestoneRecords.find(
          (r) => r.childId === childId && r.milestoneId === milestoneId
        )
      },

      deleteByChildId: (childId) => {
        set((state) => ({
          growthRecords: state.growthRecords.filter((r) => r.childId !== childId),
          temperatureRecords: state.temperatureRecords.filter((r) => r.childId !== childId),
          medicationRecords: state.medicationRecords.filter((r) => r.childId !== childId),
          vaccinationRecords: state.vaccinationRecords.filter((r) => r.childId !== childId),
          milestoneRecords: state.milestoneRecords.filter((r) => r.childId !== childId),
        }))
      },

      hydrateFromCloud: (data) => {
        set({
          growthRecords: data.growthRecords || [],
          temperatureRecords: data.temperatureRecords || [],
          medicationRecords: data.medicationRecords || [],
          vaccinationRecords: data.vaccinationRecords || [],
          milestoneRecords: data.milestoneRecords || [],
        })
      },
    }),
    {
      name: 'star-health',
      version: 1,
    }
  )
)
