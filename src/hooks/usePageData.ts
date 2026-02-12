import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useTaskStore } from '../stores/taskStore'
import { useRewardStore } from '../stores/rewardStore'
import { useExchangeStore } from '../stores/exchangeStore'
import { usePointStore } from '../stores/pointStore'
import { useBadgeStore } from '../stores/badgeStore'
import { useHealthStore } from '../stores/healthStore'

export type DataKey = 'tasks' | 'rewards' | 'exchanges' | 'logs' | 'badges' | 'health'

/**
 * 页面级按需数据加载 hook
 *
 * 用法: const { isLoading, error } = usePageData(['tasks', 'exchanges', 'badges'])
 *
 * 只在当前 child 的对应数据尚未加载时触发 fetch，已加载则跳过。
 */
export function usePageData(needs: DataKey[]) {
  const currentChildId = useAppStore((s) => s.currentChildId)

  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const fetchRewards = useRewardStore((s) => s.fetchRewards)
  const fetchExchanges = useExchangeStore((s) => s.fetchExchanges)
  const fetchLogs = usePointStore((s) => s.fetchLogs)
  const fetchBadges = useBadgeStore((s) => s.fetchBadges)
  const fetchAllHealth = useHealthStore((s) => s.fetchAllHealth)

  const tasksLoaded = useTaskStore((s) => s._loadedChildIds)
  const rewardsLoaded = useRewardStore((s) => s._loadedChildIds)
  const exchangesLoaded = useExchangeStore((s) => s._loadedChildIds)
  const logsLoaded = usePointStore((s) => s._loadedChildIds)
  const badgesLoaded = useBadgeStore((s) => s._loadedChildIds)
  const healthLoaded = useHealthStore((s) => s._loadedChildIds)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    if (!currentChildId || fetchingRef.current) return

    const loadedMap: Record<DataKey, Set<string>> = {
      tasks: tasksLoaded,
      rewards: rewardsLoaded,
      exchanges: exchangesLoaded,
      logs: logsLoaded,
      badges: badgesLoaded,
      health: healthLoaded,
    }

    const fetchMap: Record<DataKey, (childId: string) => Promise<void>> = {
      tasks: fetchTasks,
      rewards: fetchRewards,
      exchanges: fetchExchanges,
      logs: fetchLogs,
      badges: fetchBadges,
      health: fetchAllHealth,
    }

    const missing = needs.filter((key) => !loadedMap[key].has(currentChildId))
    if (missing.length === 0) return

    fetchingRef.current = true
    setIsLoading(true)
    setError(null)

    Promise.all(missing.map((key) => fetchMap[key](currentChildId)))
      .catch((err) => setError((err as Error).message))
      .finally(() => {
        setIsLoading(false)
        fetchingRef.current = false
      })
  }, [currentChildId, needs.join(','), tasksLoaded, rewardsLoaded, exchangesLoaded, logsLoaded, badgesLoaded, healthLoaded])

  return { isLoading, error }
}
