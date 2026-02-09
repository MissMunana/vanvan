import { useEffect, useRef, useCallback } from 'react'
import type { ScreenTimeConfig } from '../types'

const STORAGE_KEY = 'star-screen-time'
const CHECK_INTERVAL = 60_000 // 1 minute

interface ScreenTimeData {
  date: string
  seconds: number
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function loadData(): ScreenTimeData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as ScreenTimeData
      if (data.date === getToday()) return data
    }
  } catch { /* ignore */ }
  return { date: getToday(), seconds: 0 }
}

function saveData(data: ScreenTimeData) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useScreenTime(
  config: ScreenTimeConfig | undefined,
  onLimitReached: () => void,
  onNightLock: () => void,
) {
  const dataRef = useRef(loadData())

  const checkNightLock = useCallback(() => {
    if (!config?.enabled) return false
    const hour = new Date().getHours()
    if (hour >= config.lockStartHour || hour < config.lockEndHour) {
      onNightLock()
      return true
    }
    return false
  }, [config, onNightLock])

  useEffect(() => {
    if (!config?.enabled) return

    // Initial night lock check
    checkNightLock()

    const interval = setInterval(() => {
      // Night lock check
      if (checkNightLock()) return

      // Accumulate time
      const data = dataRef.current
      if (data.date !== getToday()) {
        data.date = getToday()
        data.seconds = 0
      }
      data.seconds += CHECK_INTERVAL / 1000
      saveData(data)
      dataRef.current = data

      // Check limit
      const usedMinutes = Math.floor(data.seconds / 60)
      if (usedMinutes >= config.dailyLimitMinutes) {
        onLimitReached()
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [config, onLimitReached, checkNightLock])
}
