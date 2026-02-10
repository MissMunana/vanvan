import { useMemo } from 'react'
import type { TemperatureRecord, MedicationRecord } from '../../types'

interface TemperatureChartProps {
  records: TemperatureRecord[]
  medications?: MedicationRecord[]
  timeWindow: '24h' | '3d' | '7d'
  height?: number
}

const ZONES = [
  { min: 35.5, max: 37.3, color: 'rgba(76, 175, 80, 0.10)', label: '正常' },
  { min: 37.3, max: 38.5, color: 'rgba(255, 184, 0, 0.10)', label: '低热' },
  { min: 38.5, max: 40.0, color: 'rgba(255, 152, 0, 0.10)', label: '中热' },
  { min: 40.0, max: 42.0, color: 'rgba(255, 82, 82, 0.10)', label: '高热' },
]

const PAD = { top: 16, right: 12, bottom: 36, left: 38 }

const WINDOW_HOURS: Record<string, number> = {
  '24h': 24,
  '3d': 72,
  '7d': 168,
}

export default function TemperatureChart({
  records,
  medications = [],
  timeWindow,
  height = 200,
}: TemperatureChartProps) {
  const hours = WINDOW_HOURS[timeWindow]
  // Snap to nearest minute to stabilize useMemo deps
  const now = useMemo(() => Math.floor(Date.now() / 60000) * 60000, [timeWindow, records])
  const startTime = now - hours * 3600000

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => new Date(r.measureTime).getTime() >= startTime)
      .sort((a, b) => a.measureTime.localeCompare(b.measureTime))
  }, [records, startTime])

  const filteredMeds = useMemo(() => {
    return medications
      .filter((m) => new Date(m.administrationTime).getTime() >= startTime)
      .sort((a, b) => a.administrationTime.localeCompare(b.administrationTime))
  }, [medications, startTime])

  const width = 360
  const chartW = width - PAD.left - PAD.right
  const chartH = height - PAD.top - PAD.bottom

  const yMin = 35.5
  const yMax = 42.0

  const toX = (time: number) =>
    PAD.left + ((time - startTime) / (now - startTime)) * chartW

  const toY = (temp: number) =>
    PAD.top + (1 - (temp - yMin) / (yMax - yMin)) * chartH

  const yTicks = [36, 37, 38, 38.5, 39, 40, 41]

  const xTicks = useMemo(() => {
    const step = hours <= 24 ? 4 : hours <= 72 ? 12 : 24
    const ticks: number[] = []
    const start = Math.ceil(startTime / (step * 3600000)) * step * 3600000
    for (let t = start; t <= now; t += step * 3600000) {
      ticks.push(t)
    }
    return ticks
  }, [startTime, now, hours])

  const dataPath = useMemo(() => {
    return filteredRecords
      .map((r, i) => {
        const t = new Date(r.measureTime).getTime()
        return `${i === 0 ? 'M' : 'L'}${toX(t).toFixed(1)},${toY(r.temperature).toFixed(1)}`
      })
      .join(' ')
  }, [filteredRecords, startTime, now])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    if (hours <= 24) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    return `${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours()}时`
  }

  if (filteredRecords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        暂无{timeWindow === '24h' ? '24小时' : timeWindow === '3d' ? '3天' : '7天'}内的体温记录
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {/* Color zones */}
      {ZONES.map((zone) => (
        <rect
          key={zone.label}
          x={PAD.left}
          y={toY(Math.min(zone.max, yMax))}
          width={chartW}
          height={toY(Math.max(zone.min, yMin)) - toY(Math.min(zone.max, yMax))}
          fill={zone.color}
        />
      ))}

      {/* 38.5 reference line */}
      <line
        x1={PAD.left}
        x2={width - PAD.right}
        y1={toY(38.5)}
        y2={toY(38.5)}
        stroke="#FF9800"
        strokeWidth={1}
        strokeDasharray="4,3"
      />
      <text x={width - PAD.right + 2} y={toY(38.5) + 3} fontSize={7} fill="#FF9800">
        38.5
      </text>

      {/* Y axis */}
      {yTicks.map((v) => (
        <g key={`y-${v}`}>
          <line x1={PAD.left} x2={width - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#E0E0E0" strokeWidth={0.5} />
          <text x={PAD.left - 4} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#999">
            {v}℃
          </text>
        </g>
      ))}

      {/* X axis */}
      {xTicks.map((t) => (
        <g key={`x-${t}`}>
          <line x1={toX(t)} x2={toX(t)} y1={PAD.top} y2={height - PAD.bottom} stroke="#F0F0F0" strokeWidth={0.5} />
          <text x={toX(t)} y={height - PAD.bottom + 12} textAnchor="middle" fontSize={7} fill="#999">
            {formatTime(t)}
          </text>
        </g>
      ))}

      {/* Data line */}
      {dataPath && (
        <path d={dataPath} fill="none" stroke="#FF5252" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Data points */}
      {filteredRecords.map((r, i) => {
        const t = new Date(r.measureTime).getTime()
        const color =
          r.temperature >= 40 ? '#FF5252' :
          r.temperature >= 38.5 ? '#FF9800' :
          r.temperature >= 37.3 ? '#FFB800' : '#4CAF50'
        return (
          <circle
            key={i}
            cx={toX(t)}
            cy={toY(r.temperature)}
            r={3.5}
            fill={color}
            stroke="white"
            strokeWidth={1.5}
          />
        )
      })}

      {/* Medication markers */}
      {filteredMeds.map((m, i) => {
        const t = new Date(m.administrationTime).getTime()
        const x = toX(t)
        return (
          <g key={`med-${i}`}>
            <line x1={x} x2={x} y1={PAD.top} y2={height - PAD.bottom} stroke="#7E57C2" strokeWidth={0.8} strokeDasharray="2,2" />
            <text x={x} y={PAD.top - 4} textAnchor="middle" fontSize={10} fill="#7E57C2">
              Rx
            </text>
          </g>
        )
      })}
    </svg>
  )
}
