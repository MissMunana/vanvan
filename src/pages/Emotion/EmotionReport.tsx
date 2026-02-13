import { useEffect, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useEmotionStore } from '../../stores/emotionStore'
import type { MoodValue } from '../../types'
import { MOOD_VALUE_INFO } from '../../types'

const MOOD_KEYS: MoodValue[] = ['joy', 'calm', 'sadness', 'anger', 'fear']

export default function EmotionReport() {
  const child = useAppStore((s) => s.getCurrentChild())
  const moodRecords = useEmotionStore((s) => s.moodRecords)
  const moodStats = useEmotionStore((s) => s.moodStats)
  const fetchMoodStats = useEmotionStore((s) => s.fetchMoodStats)
  const conflictRecords = useEmotionStore((s) => s.conflictRecords)

  useEffect(() => {
    if (child?.childId) fetchMoodStats(child.childId)
  }, [child?.childId, fetchMoodStats])

  // Recent 14 days for trend
  const recent14 = useMemo(() => {
    if (!child) return []
    const childMoods = moodRecords.filter((r) => r.childId === child.childId)
    const days: { date: string; moodValue: MoodValue; emoji: string }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const record = childMoods.find((r) => r.date === dateStr)
      if (record) {
        days.push({ date: dateStr, moodValue: record.moodValue, emoji: record.moodEmoji })
      }
    }
    return days
  }, [child, moodRecords])

  // Conflict stats
  const conflictStats = useMemo(() => {
    if (!child) return { total: 0, resolved: 0, last30: 0 }
    const childConflicts = conflictRecords.filter((r) => r.childId === child.childId)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyStr = thirtyDaysAgo.toISOString().split('T')[0]
    return {
      total: childConflicts.length,
      resolved: childConflicts.filter((r) => r.status === 'resolved').length,
      last30: childConflicts.filter((r) => r.date >= thirtyStr).length,
    }
  }, [child, conflictRecords])

  if (!child) return null

  // Distribution for pie chart
  const distribution = moodStats?.distribution || { joy: 0, sadness: 0, anger: 0, fear: 0, calm: 0 }
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Mood Distribution */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>心情分布</div>
        {total > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <PieChart distribution={distribution} total={total} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOOD_KEYS.map((key) => {
                const count = distribution[key] || 0
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: MOOD_VALUE_INFO[key].color, flexShrink: 0,
                    }} />
                    <span style={{ flex: 1 }}>{MOOD_VALUE_INFO[key].label}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            暂无心情数据
          </div>
        )}
        {moodStats && (
          <div style={{
            marginTop: 10, fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center',
          }}>
            共记录 {moodStats.totalDays} 天
          </div>
        )}
      </div>

      {/* 14-day Mood Trend */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>最近14天心情趋势</div>
        {recent14.length > 0 ? (
          <div style={{
            display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {recent14.map((day) => (
              <div key={day.date} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{day.emoji}</span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: MOOD_VALUE_INFO[day.moodValue].color,
                }} />
                <span style={{ fontSize: '0.55rem', color: 'var(--color-text-secondary)' }}>
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            暂无近期记录
          </div>
        )}
      </div>

      {/* Conflict Stats */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 14, padding: 16,
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>冲突复盘统计</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard label="累计冲突" value={conflictStats.total} color="#A8A8E6" />
          <StatCard label="已解决" value={conflictStats.resolved} color="#4CAF50" />
          <StatCard label="近30天" value={conflictStats.last30} color="#FFB800" />
        </div>
        {conflictStats.total > 0 && conflictStats.resolved > 0 && (
          <div style={{
            marginTop: 10, fontSize: '0.78rem', color: 'var(--color-text-secondary)', textAlign: 'center',
          }}>
            解决率 {Math.round((conflictStats.resolved / conflictStats.total) * 100)}%
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '12px 8px',
      background: `${color}10`, borderRadius: 10,
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// Simple SVG pie chart
function PieChart({ distribution, total }: { distribution: Record<MoodValue, number>; total: number }) {
  const size = 100
  const cx = size / 2
  const cy = size / 2
  const r = 38

  let cumAngle = -90 // Start at top
  const slices: { path: string; color: string }[] = []

  for (const key of MOOD_KEYS) {
    const count = distribution[key] || 0
    if (count === 0) continue
    const angle = (count / total) * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle

    if (angle >= 359.99) {
      // Full circle
      slices.push({
        path: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`,
        color: MOOD_VALUE_INFO[key as MoodValue].color,
      })
    } else {
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      const x1 = cx + r * Math.cos(startRad)
      const y1 = cy + r * Math.sin(startRad)
      const x2 = cx + r * Math.cos(endRad)
      const y2 = cy + r * Math.sin(endRad)
      const largeArc = angle > 180 ? 1 : 0
      slices.push({
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: MOOD_VALUE_INFO[key as MoodValue].color,
      })
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.length > 0 ? (
        slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="var(--color-border)" opacity={0.3} />
      )}
    </svg>
  )
}
