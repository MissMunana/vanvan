interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  height?: number
  color?: string
}

export default function LineChart({ data, height = 160, color = '#FFB800' }: LineChartProps) {
  if (data.length === 0) return null

  const padding = { top: 10, right: 10, bottom: 28, left: 36 }
  const width = 300
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const minVal = 0

  const points = data.map((d, i) => ({
    x: padding.left + (chartW / Math.max(data.length - 1, 1)) * i,
    y: padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD = pathD +
    ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
    ` L ${points[0].x} ${padding.top + chartH} Z`

  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minVal + ((maxVal - minVal) / yTicks) * i
    return Math.round(val)
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Y-axis labels and grid */}
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - (chartH / yTicks) * i
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#eee"
              strokeWidth={1}
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              fill="#999"
              fontSize={9}
            >
              {val}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
          <text
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fill="#999"
            fontSize={8}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
