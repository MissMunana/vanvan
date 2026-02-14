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

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const loadedRef = useRef<Set<string>>(new Set())
  const childIdRef = useRef<string | null>(null)
  const needsKeyRef = useRef<string>('')

  // Compute needs key for comparison
  const needsKey = [...needs].sort().join(',')

  useEffect(() => {
    if (!currentChildId || fetchingRef.current) return

    // Check if we actually need to refetch
    const childChanged = childIdRef.current !== currentChildId
    const needsChanged = needsKeyRef.current !== needsKey
    
    if (!childChanged && !needsChanged) return

    // Reset loaded tracking when child or needs change
    if (childChanged) {
      childIdRef.current = currentChildId
      loadedRef.current = new Set()
    }
    needsKeyRef.current = needsKey

    const fetchMap: Record<DataKey, (childId: string) => Promise<void>> = {
      tasks: fetchTasks,
      rewards: fetchRewards,
      exchanges: fetchExchanges,
      logs: fetchLogs,
      badges: fetchBadges,
      health: fetchAllHealth,
    }

    const missing = needs.filter((key) => !loadedRef.current.has(key))
    if (missing.length === 0) return

    fetchingRef.current = true
    setIsLoading(true)
    setError(null)

    Promise.all(missing.map((key) => fetchMap[key](currentChildId)))
      .then(() => {
        missing.forEach((key) => loadedRef.current.add(key))
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => {
        setIsLoading(false)
        fetchingRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChildId, needsKey, fetchTasks, fetchRewards, fetchExchanges, fetchLogs, fetchBadges, fetchAllHealth])

  return { isLoading, error }
}
