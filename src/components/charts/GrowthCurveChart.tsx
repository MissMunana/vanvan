import { useMemo } from 'react'
import type { GrowthMetric } from '../../types'
import { getWHOData } from '../../utils/growthUtils'
import type { WHOPercentileRow } from '../../data/whoGrowthData'

interface DataPoint {
  ageMonths: number
  value: number
  date: string
}

interface GrowthCurveChartProps {
  metric: GrowthMetric
  gender: 'male' | 'female'
  dataPoints: DataPoint[]
  height?: number
}

const PERCENTILE_COLORS = {
  band: 'rgba(78, 205, 196, 0.08)',
  p3: '#E0E0E0',
  p10: '#BDBDBD',
  p25: '#9E9E9E',
  p50: '#4ECDC4',
  p75: '#9E9E9E',
  p90: '#BDBDBD',
  p97: '#E0E0E0',
}

const METRIC_LABELS: Record<GrowthMetric, string> = {
  height: '身高 (cm)',
  weight: '体重 (kg)',
  bmi: 'BMI',
  headCircumference: '头围 (cm)',
}

const PAD = { top: 20, right: 16, bottom: 32, left: 42 }

export default function GrowthCurveChart({
  metric,
  gender,
  dataPoints,
  height = 240,
}: GrowthCurveChartProps) {
  const whoData = useMemo(() => getWHOData(gender, metric), [gender, metric])

  const { ageRange, valueRange, filteredWHO } = useMemo(() => {
    if (whoData.length === 0) {
      return { ageRange: [0, 60], valueRange: [0, 100], filteredWHO: [] }
    }

    let minAge = whoData[0].ageMonths
    let maxAge = whoData[whoData.length - 1].ageMonths

    if (dataPoints.length > 0) {
      const ages = dataPoints.map((d) => d.ageMonths)
      const dataMin = Math.min(...ages)
      const dataMax = Math.max(...ages)
      minAge = Math.max(0, Math.min(minAge, dataMin - 3))
      maxAge = Math.min(whoData[whoData.length - 1].ageMonths, Math.max(dataMax + 6, dataMin + 24))
    } else {
      maxAge = Math.min(maxAge, 36)
    }

    const filtered = whoData.filter(
      (r) => r.ageMonths >= minAge && r.ageMonths <= maxAge
    )

    if (filtered.length === 0) {
      return { ageRange: [minAge, maxAge], valueRange: [0, 100], filteredWHO: [] }
    }

    const allValues = filtered.flatMap((r) => [r.p3, r.p97])
    const minVal = Math.floor(Math.min(...allValues) - 2)
    const maxVal = Math.ceil(Math.max(...allValues) + 2)

    return {
      ageRange: [minAge, maxAge],
      valueRange: [minVal, maxVal],
      filteredWHO: filtered,
    }
  }, [whoData, dataPoints])

  const width = 360
  const chartW = width - PAD.left - PAD.right
  const chartH = height - PAD.top - PAD.bottom

  const toX = (age: number) =>
    PAD.left + ((age - ageRange[0]) / (ageRange[1] - ageRange[0])) * chartW

  const toY = (val: number) =>
    PAD.top + (1 - (val - valueRange[0]) / (valueRange[1] - valueRange[0])) * chartH

  const buildPath = (rows: WHOPercentileRow[], key: keyof WHOPercentileRow) => {
    return rows
      .map((r, i) => `${i === 0 ? 'M' : 'L'}${toX(r.ageMonths).toFixed(1)},${toY(r[key] as number).toFixed(1)}`)
      .join(' ')
  }

  const bandPath = useMemo(() => {
    if (filteredWHO.length === 0) return ''
    const upper = filteredWHO
      .map((r) => `${toX(r.ageMonths).toFixed(1)},${toY(r.p97).toFixed(1)}`)
      .join(' L')
    const lower = [...filteredWHO]
      .reverse()
      .map((r) => `${toX(r.ageMonths).toFixed(1)},${toY(r.p3).toFixed(1)}`)
      .join(' L')
    return `M${upper} L${lower} Z`
  }, [filteredWHO, ageRange, valueRange])

  const yTicks = useMemo(() => {
    const range = valueRange[1] - valueRange[0]
    const step = range <= 20 ? 2 : range <= 50 ? 5 : 10
    const ticks: number[] = []
    for (let v = Math.ceil(valueRange[0] / step) * step; v <= valueRange[1]; v += step) {
      ticks.push(v)
    }
    return ticks
  }, [valueRange])

  const xTicks = useMemo(() => {
    const range = ageRange[1] - ageRange[0]
    const step = range <= 24 ? 3 : range <= 60 ? 6 : 12
    const ticks: number[] = []
    for (let a = Math.ceil(ageRange[0] / step) * step; a <= ageRange[1]; a += step) {
      ticks.push(a)
    }
    return ticks
  }, [ageRange])

  const dataPath = useMemo(() => {
    const sorted = [...dataPoints].sort((a, b) => a.ageMonths - b.ageMonths)
    return sorted
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(d.ageMonths).toFixed(1)},${toY(d.value).toFixed(1)}`)
      .join(' ')
  }, [dataPoints, ageRange, valueRange])

  if (filteredWHO.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
        暂无该指标的参考数据
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
        {METRIC_LABELS[metric]}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Background band P3-P97 */}
        <path d={bandPath} fill={PERCENTILE_COLORS.band} />

        {/* Grid lines */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line x1={PAD.left} x2={width - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#F0F0F0" strokeWidth={0.5} />
            <text x={PAD.left - 4} y={toY(v) + 3} textAnchor="end" fontSize={8} fill="#999">
              {v}
            </text>
          </g>
        ))}

        {/* Percentile lines */}
        {([['p3', PERCENTILE_COLORS.p3], ['p97', PERCENTILE_COLORS.p97]] as const).map(([key, color]) => (
          <path
            key={key}
            d={buildPath(filteredWHO, key)}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ))}
        {([['p10', PERCENTILE_COLORS.p10], ['p25', PERCENTILE_COLORS.p25], ['p75', PERCENTILE_COLORS.p75], ['p90', PERCENTILE_COLORS.p90]] as const).map(([key, color]) => (
          <path
            key={key}
            d={buildPath(filteredWHO, key)}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            strokeDasharray="2,4"
          />
        ))}
        <path
          d={buildPath(filteredWHO, 'p50')}
          fill="none"
          stroke={PERCENTILE_COLORS.p50}
          strokeWidth={1.5}
        />

        {/* Percentile labels */}
        {filteredWHO.length > 0 && (
          <g>
            {(['p3', 'p50', 'p97'] as const).map((key) => {
              const last = filteredWHO[filteredWHO.length - 1]
              const label = key.toUpperCase()
              return (
                <text
                  key={key}
                  x={toX(last.ageMonths) + 2}
                  y={toY(last[key]) + 3}
                  fontSize={7}
                  fill="#999"
                >
                  {label}
                </text>
              )
            })}
          </g>
        )}

        {/* X axis */}
        {xTicks.map((a) => (
          <g key={`x-${a}`}>
            <line x1={toX(a)} x2={toX(a)} y1={PAD.top} y2={height - PAD.bottom} stroke="#F0F0F0" strokeWidth={0.5} />
            <text x={toX(a)} y={height - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#999">
              {a >= 12 ? `${Math.floor(a / 12)}岁${a % 12 ? `${a % 12}月` : ''}` : `${a}月`}
            </text>
          </g>
        ))}

        {/* Child data line */}
        {dataPath && (
          <path d={dataPath} fill="none" stroke="#4ECDC4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Child data points */}
        {dataPoints.map((d, i) => (
          <circle
            key={i}
            cx={toX(d.ageMonths)}
            cy={toY(d.value)}
            r={4}
            fill="white"
            stroke="#4ECDC4"
            strokeWidth={2}
          />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4, fontSize: '0.7rem', color: '#999' }}>
        <span>--- P3/P97</span>
        <span style={{ color: '#4ECDC4', fontWeight: 700 }}>— P50 (中位数)</span>
        <span style={{ color: '#4ECDC4' }}>● 实测值</span>
      </div>
    </div>
  )
}
