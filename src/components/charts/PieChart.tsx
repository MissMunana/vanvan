interface Segment {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  segments: Segment[]
}

export default function PieChart({ segments }: PieChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) {
    return (
      <div className="pie-chart-container" style={{
        borderRadius: '50%',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)',
      }}>
        暂无数据
      </div>
    )
  }

  let cumPercent = 0
  const gradientStops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = cumPercent
      const percent = (s.value / total) * 100
      cumPercent += percent
      return `${s.color} ${start}% ${cumPercent}%`
    })
    .join(', ')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div className="pie-chart-container" style={{
        borderRadius: '50%',
        background: `conic-gradient(${gradientStops})`,
        flexShrink: 0,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>总计</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.filter((s) => s.value > 0).map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: s.color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {s.label} ({s.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
