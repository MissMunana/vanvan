import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { getAgeInMonths } from '../../utils/growthUtils'
import { getRecommendationForAge } from '../../data/sleepRecommendations'
import SleepChart from '../../components/charts/SleepChart'
import type { SleepQuality, NapRecord } from '../../types'
import { SLEEP_QUALITY_INFO } from '../../types'
import { getToday, toLocalDateStr } from '../../utils/generateId'

const QUALITIES: SleepQuality[] = ['great', 'good', 'fair', 'poor']
const CARD = { background: 'var(--color-surface)', borderRadius: 12, padding: 16, marginBottom: 12 } as const
const LABEL = { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 } as const
const INPUT = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.9rem' } as const
const STATUS_COLORS = { green: '#4CAF50', yellow: '#FFB800', red: '#FF5252' } as const

function calcDurationMinutes(sleepTime: string, wakeTime: string): number {
  const [sh, sm] = sleepTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let sleepMin = sh * 60 + sm, wakeMin = wh * 60 + wm
  if (wakeMin <= sleepMin) wakeMin += 24 * 60
  return wakeMin - sleepMin
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function averageTimeString(times: string[]): string {
  if (times.length === 0) return '--:--'
  // Use circular mean to handle midnight crossover correctly
  let sinSum = 0, cosSum = 0
  for (const t of times) {
    const [h, m] = t.split(':').map(Number)
    const angle = ((h * 60 + m) / (24 * 60)) * 2 * Math.PI
    sinSum += Math.sin(angle)
    cosSum += Math.cos(angle)
  }
  let avgAngle = Math.atan2(sinSum / times.length, cosSum / times.length)
  if (avgAngle < 0) avgAngle += 2 * Math.PI
  const avgMin = Math.round((avgAngle / (2 * Math.PI)) * 24 * 60)
  return `${(Math.floor(avgMin / 60) % 24).toString().padStart(2, '0')}:${(avgMin % 60).toString().padStart(2, '0')}`
}

export default function SleepTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const sleepRecords = useHealthStore((s) => s.sleepRecords)
  const addSleepRecord = useHealthStore((s) => s.addSleepRecord)
  const deleteSleepRecord = useHealthStore((s) => s.deleteSleepRecord)
  const { showToast } = useToast()
  const today = getToday()

  const [date, setDate] = useState(today)
  const [bedTime, setBedTime] = useState('')
  const [sleepTime, setSleepTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [getUpTime, setGetUpTime] = useState('')
  const [quality, setQuality] = useState<SleepQuality>('good')
  const [note, setNote] = useState('')
  const [naps, setNaps] = useState<{ start: string; end: string }[]>([])
  const [period, setPeriod] = useState<7 | 30>(7)

  const records = useMemo(() => {
    if (!child) return []
    return sleepRecords.filter((r) => r.childId === child.childId).sort((a, b) => b.date.localeCompare(a.date))
  }, [child, sleepRecords])

  const ageMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, today)
  }, [child, today])

  const recommendation = useMemo(() => getRecommendationForAge(ageMonths), [ageMonths])

  const autoCalcDuration = useMemo(() => {
    if (!sleepTime || !wakeTime) return null
    return calcDurationMinutes(sleepTime, wakeTime)
  }, [sleepTime, wakeTime])

  const addNap = useCallback(() => setNaps((prev) => [...prev, { start: '', end: '' }]), [])
  const removeNap = useCallback((i: number) => setNaps((prev) => prev.filter((_, idx) => idx !== i)), [])
  const updateNap = useCallback((i: number, field: 'start' | 'end', v: string) => {
    setNaps((prev) => prev.map((n, idx) => (idx === i ? { ...n, [field]: v } : n)))
  }, [])

  const handleSubmit = async () => {
    if (!child) return
    if (!sleepTime || !wakeTime) { showToast('请填写入睡时间和醒来时间'); return }
    const durationMinutes = calcDurationMinutes(sleepTime, wakeTime)
    if (durationMinutes > 16 * 60) { showToast('夜间睡眠时长超过16小时，请检查时间'); return }
    const napRecords: NapRecord[] = naps.filter((n) => n.start && n.end).map((n) => ({
      startTime: n.start, endTime: n.end, durationMinutes: calcDurationMinutes(n.start, n.end),
    }))
    const badNap = napRecords.find((n) => n.durationMinutes > 4 * 60)
    if (badNap) { showToast('单次小睡超过4小时，请检查时间'); return }
    const totalNapMinutes = napRecords.reduce((sum, n) => sum + n.durationMinutes, 0)
    try {
      await addSleepRecord({
        childId: child.childId, date, bedTime: bedTime || null, sleepTime, wakeTime,
        getUpTime: getUpTime || null, durationMinutes, naps: napRecords, totalNapMinutes,
        sleepQuality: quality, note,
      })
      showToast('睡眠记录已保存')
      setBedTime(''); setSleepTime(''); setWakeTime(''); setGetUpTime('')
      setQuality('good'); setNote(''); setNaps([])
    } catch { showToast('记录失败，请重试') }
  }

  const stats = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period)
    const cutoffStr = toLocalDateStr(cutoff)
    const pr = records.filter((r) => r.date >= cutoffStr)
    const wd = pr.filter((r) => r.durationMinutes != null)
    const avgDuration = wd.length > 0
      ? Math.round(wd.reduce((s, r) => s + r.durationMinutes! + r.totalNapMinutes, 0) / wd.length) : 0
    return {
      count: pr.length, avgDuration,
      avgBedTime: averageTimeString(pr.filter((r) => r.bedTime).map((r) => r.bedTime!)),
      avgWakeTime: averageTimeString(pr.filter((r) => r.wakeTime).map((r) => r.wakeTime!)),
    }
  }, [records, period])

  const avgHours = stats.avgDuration / 60
  const recStatus = recommendation && stats.count > 0
    ? avgHours >= recommendation.minHours && avgHours <= recommendation.maxHours ? 'green'
      : Math.abs(avgHours - recommendation.minHours) <= 1 || Math.abs(avgHours - recommendation.maxHours) <= 1 ? 'yellow' : 'red'
    : null

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Recommendation banner */}
      {recommendation && recStatus && (
        <div style={{
          background: `${STATUS_COLORS[recStatus]}14`, border: `1px solid ${STATUS_COLORS[recStatus]}40`,
          borderRadius: 12, padding: 12, marginBottom: 12,
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            {recommendation.ageLabel} 建议睡眠
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {recommendation.minHours}-{recommendation.maxHours} 小时/天
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {recommendation.napNote}
          </div>
          {stats.count > 0 && (
            <div style={{ fontSize: '0.8rem', marginTop: 6, color: STATUS_COLORS[recStatus] }}>
              近{period}天平均: {stats.avgDuration > 0 ? formatMinutes(stats.avgDuration) : '暂无数据'}
            </div>
          )}
        </div>
      )}

      {/* Record form */}
      <div style={CARD}>
        <div className="section-header" style={{ justifyContent: 'center', marginBottom: 12 }}>🌙 记录睡眠</div>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL}>日期</label>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} style={INPUT} />
        </div>

        {/* Time inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: '上床时间', value: bedTime, set: setBedTime },
            { label: '入睡时间', value: sleepTime, set: setSleepTime },
            { label: '醒来时间', value: wakeTime, set: setWakeTime },
            { label: '起床时间', value: getUpTime, set: setGetUpTime },
          ].map((f) => (
            <div key={f.label}>
              <label style={LABEL}>{f.label}</label>
              <input type="time" value={f.value} onChange={(e) => f.set(e.target.value)} style={INPUT} />
            </div>
          ))}
        </div>

        {autoCalcDuration != null && (
          <div style={{ background: 'rgba(76,175,80,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.85rem', textAlign: 'center' }}>
            夜间睡眠时长: <strong>{formatMinutes(autoCalcDuration)}</strong>
          </div>
        )}

        {/* Naps */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>小睡/午睡</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={addNap}>+ 添加小睡</button>
          </div>
          {naps.map((nap, i) => {
            const dur = nap.start && nap.end ? calcDurationMinutes(nap.start, nap.end) : null
            const napInput = { flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: '0.85rem' } as const
            return (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <input type="time" value={nap.start} onChange={(e) => updateNap(i, 'start', e.target.value)} style={napInput} />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>~</span>
                <input type="time" value={nap.end} onChange={(e) => updateNap(i, 'end', e.target.value)} style={napInput} />
                {dur != null && <span style={{ fontSize: '0.75rem', color: dur > 240 ? '#FF5252' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{dur > 240 ? '时间异常' : `${dur}分`}</span>}
                <button onClick={() => removeNap(i)} style={{ background: 'none', border: 'none', color: '#FF5252', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px' }}>x</button>
              </div>
            )
          })}
        </div>

        {/* Sleep quality */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>睡眠质量</div>
          <div className="toggle-group" style={{ justifyContent: 'center' }}>
            {QUALITIES.map((q) => {
              const info = SLEEP_QUALITY_INFO[q]; const active = quality === q
              return (
                <button key={q} className={`toggle-btn${active ? ' active' : ''}`} onClick={() => setQuality(q)}
                  style={active ? { background: info.color, color: '#fff' } : undefined}>
                  {info.icon} {info.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <textarea placeholder="备注（可选）" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            style={{ ...INPUT, fontSize: '0.85rem', resize: 'vertical' as const }} />
        </div>
        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={!sleepTime || !wakeTime}>记录睡眠</button>
      </div>

      {/* Statistics */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="section-header" style={{ marginBottom: 0 }}>睡眠统计</span>
          <div className="toggle-group" style={{ gap: 4, flex: 'none' }}>
            {([7, 30] as const).map((p) => (
              <button key={p} className={`toggle-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}
                style={{ padding: '3px 8px', fontSize: 'var(--text-xs)', flex: 'none', ...(period === p ? { background: 'var(--color-child-accent, #7E57C2)' } : {}) }}>
                {p}天
              </button>
            ))}
          </div>
        </div>
        {stats.count > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: '平均就寝', value: stats.avgBedTime },
                { label: '平均醒来', value: stats.avgWakeTime },
                { label: '平均时长', value: stats.avgDuration > 0 ? `${(stats.avgDuration / 60).toFixed(1)}h` : '--' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{s.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <SleepChart records={records} recommendedMin={recommendation?.minHours ?? 9}
              recommendedMax={recommendation?.maxHours ?? 12} days={period} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            暂无{period}天内的睡眠记录
          </div>
        )}
      </div>

      {/* Recent records */}
      {records.length > 0 && (
        <div>
          <div className="section-header">最近记录</div>
          <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 0 }}>
            {records.slice(0, 10).map((r) => {
              const qi = SLEEP_QUALITY_INFO[r.sleepQuality]
              const totalMin = (r.durationMinutes ?? 0) + r.totalNapMinutes
              return (
                <div key={r.recordId} className="record-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{r.date.slice(5)}</span>
                      {r.sleepTime && r.wakeTime && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{r.sleepTime}-{r.wakeTime}</span>
                      )}
                      {totalMin > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatMinutes(totalMin)}</span>}
                      <span style={{ fontSize: 'var(--text-xs)', color: qi.color, background: qi.color + '15', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                        {qi.icon} {qi.label}
                      </span>
                    </div>
                    {r.naps.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        小睡 {r.naps.length}次 共{r.totalNapMinutes}分钟
                      </div>
                    )}
                  </div>
                  <button className="btn-delete" onClick={async () => {
                    if (window.confirm('确定要删除这条记录吗？')) {
                      try { await deleteSleepRecord(r.recordId) } catch { showToast('删除失败') }
                    }
                  }}>删除</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
