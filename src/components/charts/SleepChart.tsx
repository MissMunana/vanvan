import { useMemo } from 'react'
import type { SleepRecord } from '../../types'
import { toLocalDateStr } from '../../utils/generateId'

interface SleepChartProps {
  records: SleepRecord[]
  recommendedMin: number
  recommendedMax: number
  days?: 7 | 30
}

const PAD = { top: 16, right: 12, bottom: 36, left: 38 }

interface DayData {
  date: string
  label: string
  nightHours: number
  napHours: number
  totalHours: number
}

export default function SleepChart({
  records,
  recommendedMin,
  recommendedMax,
  days = 7,
}: SleepChartProps) {
  const width = 360
  const height = 200
  const chartW = width - PAD.left - PAD.right
  const chartH = height - PAD.top - PAD.bottom

  const yMin = 0
  const yMax = 16

  const toY = (hours: number) =>
    PAD.top + (1 - (hours - yMin) / (yMax - yMin)) * chartH

  const dayData = useMemo((): DayData[] => {
    const now = new Date()
    const result: DayData[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = toLocalDateStr(d)
      const label = `${d.getMonth() + 1}/${d.getDate()}`

      const record = records.find((r) => r.date === dateStr)
      if (record && record.durationMinutes != null) {
        const nightHours = record.durationMinutes / 60
        const napHours = record.totalNapMinutes / 60
        result.push({
          date: dateStr,
          label,
          nightHours,
          napHours,
          totalHours: nightHours + napHours,
        })
      } else {
        result.push({ date: dateStr, label, nightHours: 0, napHours: 0, totalHours: 0 })
      }
    }
    return result
  }, [records, days])

  const yTicks = [0, 4, 8, 12, 16]
  const barWidth = Math.min(20, (chartW / dayData.length) * 0.6)
  const barGap = chartW / dayData.length

  const getBarColor = (totalHours: number): string => {
    if (totalHours === 0) return 'transparent'
    if (totalHours >= recommendedMin && totalHours <= recommendedMax) return '#4CAF50'
    if (
      (totalHours >= recommendedMin - 1 && totalHours < recommendedMin) ||
      (totalHours > recommendedMax && totalHours <= recommendedMax + 1)
    ) return '#FFB800'
    return '#FF5252'
  }

  const getNapColor = (totalHours: number): string => {
    if (totalHours === 0) return 'transparent'
    if (totalHours >= recommendedMin && totalHours <= recommendedMax) return '#81C784'
    if (
      (totalHours >= recommendedMin - 1 && totalHours < recommendedMin) ||
      (totalHours > recommendedMax && totalHours <= recommendedMax + 1)
    ) return '#FFD54F'
    return '#FF8A80'
  }

  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        暂无{days === 7 ? '7天' : '30天'}内的睡眠记录
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {/* Recommended range overlay */}
      <rect
        x={PAD.left}
        y={toY(Math.min(recommendedMax, yMax))}
        width={chartW}
        height={toY(Math.max(recommendedMin, yMin)) - toY(Math.min(recommendedMax, yMax))}
        fill="rgba(76, 175, 80, 0.08)"
      />
      {/* Recommended range lines */}
      <line
        x1={PAD.left} x2={width - PAD.right}
        y1={toY(recommendedMin)} y2={toY(recommendedMin)}
        stroke="#4CAF50" strokeWidth={0.8} strokeDasharray="4,3"
      />
      <line
        x1={PAD.left} x2={width - PAD.right}
        y1={toY(recommendedMax)} y2={toY(recommendedMax)}
        stroke="#4CAF50" strokeWidth={0.8} strokeDasharray="4,3"
      />
      <text x={width - PAD.right + 2} y={toY(recommendedMin) + 3} fontSize={6} fill="#4CAF50">
        {recommendedMin}h
      </text>
      <text x={width - PAD.right + 2} y={toY(recommendedMax) + 3} fontSize={6} fill="#4CAF50">
        {recommendedMax}h
      </text>

      {/* Y axis */}
      {yTicks.map((v) => (
        <g key={`y-${v}`}>
          <line
            x1={PAD.left} x2={width - PAD.right}
            y1={toY(v)} y2={toY(v)}
            stroke="#E0E0E0" strokeWidth={0.5}
          />
          <text x={PAD.left - 4} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#999">
            {v}h
          </text>
        </g>
      ))}

      {/* X axis labels and bars */}
      {dayData.map((d, i) => {
        const cx = PAD.left + i * barGap + barGap / 2
        const barX = cx - barWidth / 2
        const nightBarHeight = (d.nightHours / (yMax - yMin)) * chartH
        const napBarHeight = (d.napHours / (yMax - yMin)) * chartH
        const nightBarY = toY(d.nightHours)
        const napBarY = nightBarY - napBarHeight

        // Show label on every bar for 7d, every other for 30d
        const showLabel = days === 7 || i % 3 === 0

        return (
          <g key={d.date}>
            {/* Nighttime sleep bar */}
            {d.nightHours > 0 && (
              <rect
                x={barX}
                y={nightBarY}
                width={barWidth}
                height={nightBarHeight}
                rx={2}
                fill={getBarColor(d.totalHours)}
              />
            )}
            {/* Nap bar (lighter, stacked on top) */}
            {d.napHours > 0 && (
              <rect
                x={barX}
                y={napBarY}
                width={barWidth}
                height={napBarHeight}
                rx={2}
                fill={getNapColor(d.totalHours)}
                opacity={0.7}
              />
            )}
            {/* Total hours label on top of bar */}
            {d.totalHours > 0 && (
              <text
                x={cx}
                y={(d.napHours > 0 ? napBarY : nightBarY) - 3}
                textAnchor="middle"
                fontSize={6}
                fill="#666"
              >
                {d.totalHours.toFixed(1)}
              </text>
            )}
            {/* X axis label */}
            {showLabel && (
              <text
                x={cx}
                y={height - PAD.bottom + 12}
                textAnchor="middle"
                fontSize={7}
                fill="#999"
              >
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
