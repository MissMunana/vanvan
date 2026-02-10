import { useState, useMemo, useEffect } from 'react'

import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import type { GrowthMetric } from '../../types'
import GrowthCurveChart from '../../components/charts/GrowthCurveChart'
import GrowthEntry from './GrowthEntry'
import { calculateGrowthVelocity, getAgeInMonths, checkGrowthAlert } from '../../utils/growthUtils'

const METRIC_TABS: { key: GrowthMetric; label: string }[] = [
  { key: 'height', label: '身高' },
  { key: 'weight', label: '体重' },
  { key: 'bmi', label: 'BMI' },
  { key: 'headCircumference', label: '头围' },
]

export default function GrowthDashboard() {
  const child = useAppStore((s) => s.getCurrentChild())
  const growthRecords = useHealthStore((s) => s.growthRecords)
  const deleteGrowthRecord = useHealthStore((s) => s.deleteGrowthRecord)
  const [metric, setMetric] = useState<GrowthMetric>('height')
  const [showEntry, setShowEntry] = useState(false)

  const records = useMemo(() => {
    if (!child) return []
    return growthRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [child, growthRecords])

  const latest = records.length > 0 ? records[records.length - 1] : null

  const chartPoints = useMemo(() => {
    return records
      .filter((r) => {
        if (metric === 'height') return r.height !== null
        if (metric === 'weight') return r.weight !== null
        if (metric === 'bmi') return r.bmi !== null
        if (metric === 'headCircumference') return r.headCircumference !== null
        return false
      })
      .map((r) => ({
        ageMonths: r.ageInMonths,
        value:
          metric === 'height' ? r.height! :
          metric === 'weight' ? r.weight! :
          metric === 'bmi' ? r.bmi! :
          r.headCircumference!,
        date: r.date,
      }))
  }, [records, metric])

  const velocity = useMemo(() => {
    if (metric !== 'height' && metric !== 'weight') return []
    const points = chartPoints.map((p) => ({ date: p.date, value: p.value }))
    return calculateGrowthVelocity(points)
  }, [chartPoints, metric])

  const ageMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, new Date().toISOString().split('T')[0])
  }, [child])
  const showHeadCirc = child && ageMonths <= 36
  const visibleTabs = showHeadCirc ? METRIC_TABS : METRIC_TABS.filter((t) => t.key !== 'headCircumference')

  // Smart growth alerts
  const growthAlerts = useMemo(() => {
    if (!latest || !child) return []
    const alerts: { message: string; level: 'warning' | 'info' }[] = []

    // Check latest percentiles against P3/P97
    if (latest.height !== null) {
      const alert = checkGrowthAlert(child.gender, 'height', latest.ageInMonths, latest.height)
      if (alert === 'low') alerts.push({ message: '身高偏低（低于P3），建议关注', level: 'warning' })
      if (alert === 'high') alerts.push({ message: '身高偏高（高于P97）', level: 'info' })
    }
    if (latest.weight !== null) {
      const alert = checkGrowthAlert(child.gender, 'weight', latest.ageInMonths, latest.weight)
      if (alert === 'low') alerts.push({ message: '体重偏低（低于P3），建议关注', level: 'warning' })
      if (alert === 'high') alerts.push({ message: '体重偏高（高于P97）', level: 'info' })
    }
    if (latest.bmi !== null) {
      const alert = checkGrowthAlert(child.gender, 'bmi', latest.ageInMonths, latest.bmi)
      if (alert === 'low') alerts.push({ message: 'BMI偏低（低于P3），建议关注', level: 'warning' })
      if (alert === 'high') alerts.push({ message: 'BMI偏高（高于P97），建议关注', level: 'warning' })
    }

    // Growth velocity alert: percentile change ≥25 within 3 months
    if (records.length >= 2) {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const recent = records.filter((r) => new Date(r.date) >= threeMonthsAgo)
      if (recent.length >= 2) {
        const oldest = recent[0]
        const newest = recent[recent.length - 1]
        if (oldest.heightPercentile !== null && newest.heightPercentile !== null) {
          if (Math.abs(newest.heightPercentile - oldest.heightPercentile) >= 25) {
            alerts.push({ message: '身高百分位3个月内变化较大，建议评估', level: 'warning' })
          }
        }
        if (oldest.weightPercentile !== null && newest.weightPercentile !== null) {
          if (Math.abs(newest.weightPercentile - oldest.weightPercentile) >= 25) {
            alerts.push({ message: '体重百分位3个月内变化较大，建议评估', level: 'warning' })
          }
        }
      }
    }

    return alerts
  }, [latest, records, child])

  // Reset metric if current tab is no longer visible (e.g. switching to older child)
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === metric)) {
      setMetric('height')
    }
  }, [visibleTabs, metric])

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Growth alerts */}
      {growthAlerts.length > 0 && (
        <div style={{
          marginBottom: 12,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: '#FFF3E0',
          border: '1px solid #FFE0B2',
        }}>
          {growthAlerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', color: a.level === 'warning' ? '#E65100' : '#F57C00',
              padding: '3px 0',
            }}>
              <span>{a.level === 'warning' ? '⚠️' : '💡'}</span>
              <span>{a.message}</span>
            </div>
          ))}
          <div style={{ fontSize: '0.72rem', color: '#BF360C', marginTop: 4 }}>
            建议带孩子到儿保科进行评估
          </div>
        </div>
      )}

      {/* Latest data card */}
      {latest ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            最近测量：{latest.date}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {latest.height !== null && (
              <StatItem label="身高" value={`${latest.height}cm`} percentile={latest.heightPercentile} />
            )}
            {latest.weight !== null && (
              <StatItem label="体重" value={`${latest.weight}kg`} percentile={latest.weightPercentile} />
            )}
            {latest.bmi !== null && (
              <StatItem label="BMI" value={`${latest.bmi}`} percentile={latest.bmiPercentile} />
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          还没有生长记录，点击下方按钮添加
        </div>
      )}

      {/* Metric tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMetric(tab.key)}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: metric === tab.key ? 700 : 400,
              background: metric === tab.key ? 'var(--color-health)' : 'transparent',
              color: metric === tab.key ? 'white' : 'var(--color-text-secondary)',
              border: metric === tab.key ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Growth chart */}
      <div className="card" style={{ padding: '12px 8px' }}>
        <GrowthCurveChart
          metric={metric}
          gender={child.gender}
          dataPoints={chartPoints}
        />
      </div>

      {/* Growth velocity */}
      {velocity.length > 0 && (metric === 'height' || metric === 'weight') && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>
            生长速度
          </div>
          {velocity.map((v, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: i < velocity.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{v.period}</span>
              <span style={{ fontWeight: 600 }}>
                {v.velocity > 0 ? '+' : ''}{v.velocity}{metric === 'height' ? 'cm' : 'kg'}/月
              </span>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {records.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>历史记录</div>
          {[...records].reverse().map((r) => (
            <div key={r.recordId} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.date}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {r.height !== null && `身高${r.height}cm `}
                  {r.weight !== null && `体重${r.weight}kg `}
                  {r.bmi !== null && `BMI${r.bmi}`}
                </div>
              </div>
              <button
                onClick={() => { if (window.confirm('确定要删除这条记录吗？')) deleteGrowthRecord(r.recordId) }}
                style={{ fontSize: '0.75rem', color: 'var(--color-danger)', padding: '4px 8px' }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        className="btn btn-block"
        onClick={() => setShowEntry(true)}
        style={{
          marginTop: 16,
          background: 'var(--color-health)',
          color: 'white',
          fontWeight: 700,
          padding: '14px 0',
          borderRadius: 'var(--radius-lg)',
          fontSize: '1rem',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>📏 添加测量记录</span>
      </button>

      <GrowthEntry open={showEntry} onClose={() => setShowEntry(false)} />
    </div>
  )
}

function StatItem({ label, value, percentile }: { label: string; value: string; percentile: number | null }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-health-dark)' }}>{value}</div>
      {percentile !== null && (
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>P{percentile}</div>
      )}
    </div>
  )
}
