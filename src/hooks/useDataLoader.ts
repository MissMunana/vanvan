import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useTaskStore } from '../stores/taskStore'
import { useRewardStore } from '../stores/rewardStore'
import { useExchangeStore } from '../stores/exchangeStore'
import { usePointStore } from '../stores/pointStore'
import { useBadgeStore } from '../stores/badgeStore'
import { useHealthStore } from '../stores/healthStore'

export function useDataLoader() {
  const fetchFamily = useAppStore((s) => s.fetchFamily)
  const fetchChildren = useAppStore((s) => s.fetchChildren)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchRewards = useRewardStore((s) => s.fetchRewards)
  const fetchExchanges = useExchangeStore((s) => s.fetchExchanges)
  const fetchLogs = usePointStore((s) => s.fetchLogs)
  const fetchBadges = useBadgeStore((s) => s.fetchBadges)
  const fetchAllHealth = useHealthStore((s) => s.fetchAllHealth)

  const loadCoreData = useCallback(async () => {
    await Promise.all([fetchFamily(), fetchChildren()])
  }, [fetchFamily, fetchChildren])

  const loadChildData = useCallback(async (childId: string) => {
    await Promise.all([
      fetchTasks(childId),
      fetchRewards(childId),
      fetchExchanges(childId),
      fetchLogs(childId),
      fetchBadges(childId),
      fetchAllHealth(childId),
    ])
  }, [fetchTasks, fetchRewards, fetchExchanges, fetchLogs, fetchBadges, fetchAllHealth])

  return { loadCoreData, loadChildData }
}
