import { useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useTaskStore } from '../stores/taskStore'
import { usePointStore } from '../stores/pointStore'
import { useRewardStore } from '../stores/rewardStore'
import { useExchangeStore } from '../stores/exchangeStore'
import { useBadgeStore } from '../stores/badgeStore'
import { useHealthStore } from '../stores/healthStore'

const API_BASE = '/api'

export function useSync() {
  const session = useAuthStore((s) => s.session)
  const setDataLoaded = useAuthStore((s) => s.setDataLoaded)

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }), [session])

  // Push all localStorage data to cloud
  const pushToCloud = useCallback(async () => {
    if (!session?.access_token) return

    const appState = useAppStore.getState()
    const taskState = useTaskStore.getState()
    const pointState = usePointStore.getState()
    const rewardState = useRewardStore.getState()
    const exchangeState = useExchangeStore.getState()
    const badgeState = useBadgeStore.getState()
    const healthState = useHealthStore.getState()

    const body = {
      appState: {
        parentPin: appState.parentPin,
        onboardingCompleted: appState.onboardingCompleted,
        completionCount: appState.completionCount,
      },
      children: appState.children,
      tasks: taskState.tasks,
      rewards: rewardState.rewards,
      exchanges: exchangeState.exchanges,
      pointLogs: pointState.logs,
      badges: badgeState.unlockedBadges || [],
      health: {
        growthRecords: healthState.growthRecords || [],
        temperatureRecords: healthState.temperatureRecords || [],
        medicationRecords: healthState.medicationRecords || [],
        vaccinationRecords: healthState.vaccinationRecords || [],
        milestoneRecords: healthState.milestoneRecords || [],
      },
    }

    const res = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Push failed')
    }

    return await res.json()
  }, [session, getHeaders])

  // Pull cloud data and hydrate all stores
  const pullFromCloud = useCallback(async () => {
    if (!session?.access_token) return null

    const res = await fetch(`${API_BASE}/sync/pull`, {
      method: 'GET',
      headers: getHeaders(),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Pull failed')
    }

    const data = await res.json()

    // Check if cloud has data
    const hasCloudData = data.children && data.children.length > 0

    if (hasCloudData) {
      // Hydrate stores from cloud data
      const appStore = useAppStore.getState()
      const taskStore = useTaskStore.getState()
      const pointStore = usePointStore.getState()
      const rewardStore = useRewardStore.getState()
      const exchangeStore = useExchangeStore.getState()
      const badgeStore = useBadgeStore.getState()
      const healthStore = useHealthStore.getState()

      if (data.family) {
        appStore.hydrateFromCloud({
          children: data.children,
          parentPin: data.family.parentPin,
          onboardingCompleted: data.family.onboardingCompleted,
          completionCount: data.family.completionCount,
        })
      }

      taskStore.hydrateFromCloud(data.tasks || [])
      pointStore.hydrateFromCloud(data.pointLogs || [])
      rewardStore.hydrateFromCloud(data.rewards || [])
      exchangeStore.hydrateFromCloud(data.exchanges || [])

      if (badgeStore.hydrateFromCloud) {
        badgeStore.hydrateFromCloud(data.badges || [])
      }
      if (healthStore.hydrateFromCloud) {
        healthStore.hydrateFromCloud(data.health || {})
      }
    }

    setDataLoaded(true)
    return data
  }, [session, getHeaders, setDataLoaded])

  // Check if localStorage has data but cloud is empty, and migrate
  const migrateIfNeeded = useCallback(async () => {
    if (!session?.access_token) return

    const cloudData = await pullFromCloud()

    if (cloudData && (!cloudData.children || cloudData.children.length === 0)) {
      // Cloud is empty - check if localStorage has data
      const appState = useAppStore.getState()
      if (appState.children.length > 0) {
        // Migrate localStorage data to cloud
        await pushToCloud()
      }
    }
  }, [session, pullFromCloud, pushToCloud])

  return { pushToCloud, pullFromCloud, migrateIfNeeded }
}
