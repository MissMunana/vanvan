import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'

import type { MeasureMethod, SymptomTag } from '../../types'
import { FEVER_LEVEL_INFO, SYMPTOM_TAG_INFO, MEASURE_METHOD_INFO } from '../../types'
import { getFeverLevel, getAgeInMonths } from '../../utils/growthUtils'
import TemperatureChart from '../../components/charts/TemperatureChart'

const METHODS: MeasureMethod[] = ['ear', 'forehead', 'armpit']
const SYMPTOMS: SymptomTag[] = ['cough', 'runny_nose', 'vomiting', 'diarrhea', 'rash', 'lethargy', 'headache', 'sore_throat']

export default function FeverTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const addTemperatureRecord = useHealthStore((s) => s.addTemperatureRecord)
  const temperatureRecords = useHealthStore((s) => s.temperatureRecords)
  const deleteTemperatureRecord = useHealthStore((s) => s.deleteTemperatureRecord)
  const medicationRecords = useHealthStore((s) => s.medicationRecords)
  const { showToast } = useToast()

  const [temperature, setTemperature] = useState('')
  const [method, setMethod] = useState<MeasureMethod>('ear')
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomTag[]>([])
  const [note, setNote] = useState('')
  const [timeWindow, setTimeWindow] = useState<'24h' | '3d' | '7d'>('24h')

  const records = useMemo(() => {
    if (!child) return []
    return temperatureRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => a.measureTime.localeCompare(b.measureTime))
  }, [child, temperatureRecords])

  const medications = useMemo(() => {
    if (!child) return []
    return medicationRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => b.administrationTime.localeCompare(a.administrationTime))
  }, [child, medicationRecords])

  const temp = parseFloat(temperature)
  const feverLevel = temp >= 35 && temp <= 43 ? getFeverLevel(temp) : null
  const feverInfo = feverLevel ? FEVER_LEVEL_INFO[feverLevel] : null

  const toggleSymptom = useCallback((sym: SymptomTag) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    )
  }, [])

  const ageMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, new Date().toISOString().split('T')[0])
  }, [child])

  const seekMedicalAttention = useMemo(() => {
    if (!child || !temp) return []
    const warnings: string[] = []

    if (ageMonths < 3 && temp >= 38) {
      warnings.push('3月龄以下婴儿体温≥38℃，请立即就医')
    }
    if (ageMonths >= 3 && ageMonths < 6 && temp >= 39) {
      warnings.push('3-6月龄婴儿体温≥39℃，请尽快就医')
    }
    if (temp >= 40) {
      warnings.push('体温≥40℃，建议使用退烧药并密切观察')
    }

    // Check if fever has lasted > 72h
    const last72h = records.filter((r) => {
      const t = new Date(r.measureTime).getTime()
      return Date.now() - t < 72 * 3600000 && r.temperature >= 37.3
    })
    if (last72h.length >= 3) {
      const earliest = new Date(last72h[0].measureTime).getTime()
      if (Date.now() - earliest > 48 * 3600000) {
        warnings.push('发烧可能已超过48小时，如持续请就医')
      }
    }

    if (selectedSymptoms.includes('lethargy')) {
      warnings.push('孩子精神差，请密切关注')
    }

    return warnings
  }, [child, temp, ageMonths, records, selectedSymptoms])

  const handleRecord = () => {
    if (!child || !temp || temp < 35 || temp > 43) {
      showToast('请输入有效体温（35-43℃）')
      return
    }
    addTemperatureRecord({
      childId: child.childId,
      temperature: temp,
      measureMethod: method,
      measureTime: new Date().toISOString(),
      symptoms: selectedSymptoms,
      note,
    })
    showToast(`已记录 ${temp}℃`)
    setTemperature('')
    setSelectedSymptoms([])
    setNote('')
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Temperature input */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="section-header" style={{ justifyContent: 'center', marginBottom: 12 }}>🌡️ 记录体温</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            inputMode="decimal"
            placeholder="37.0"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            step="0.1"
            min="35"
            max="43"
            style={{
              width: 120,
              fontSize: '2rem',
              fontWeight: 700,
              textAlign: 'center',
              padding: '8px 12px',
              borderColor: feverInfo ? feverInfo.color : 'var(--color-border)',
            }}
          />
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>℃</span>
        </div>

        {/* Fever level indicator */}
        {feverInfo && (
          <div style={{
            background: feverInfo.color + '15',
            border: `1px solid ${feverInfo.color}30`,
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: '0.8rem',
            color: feverInfo.color,
          }}>
            <strong>{feverInfo.label}</strong>（{feverInfo.range}）
            <div style={{ marginTop: 4, color: 'var(--color-text)' }}>{feverInfo.advice}</div>
          </div>
        )}

        {/* Measure method */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>测量方式</div>
          <div className="toggle-group" style={{ justifyContent: 'center' }}>
            {METHODS.map((m) => (
              <button
                key={m}
                className={`toggle-btn${method === m ? ' active' : ''}`}
                onClick={() => setMethod(m)}
                style={method === m ? { background: 'var(--color-health)' } : undefined}
              >
                {MEASURE_METHOD_INFO[m].label}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>伴随症状（可选）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {SYMPTOMS.map((sym) => {
              const info = SYMPTOM_TAG_INFO[sym]
              const selected = selectedSymptoms.includes(sym)
              return (
                <button
                  key={sym}
                  className={`symptom-chip${selected ? ' selected' : ''}`}
                  onClick={() => toggleSymptom(sym)}
                >
                  {info.icon} {info.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Medical attention warnings */}
        {seekMedicalAttention.length > 0 && (
          <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: 12 }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>🚨 就医提醒</strong>
            {seekMedicalAttention.map((w, i) => <div key={i} style={{ marginTop: 4 }}>• {w}</div>)}
          </div>
        )}

        <button
          className="btn btn-health btn-block"
          onClick={handleRecord}
          disabled={!temperature}
        >
          记录体温
        </button>
      </div>

      {/* Temperature chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="section-header" style={{ marginBottom: 0 }}>体温曲线</span>
          <div className="toggle-group" style={{ gap: 4, flex: 'none' }}>
            {(['24h', '3d', '7d'] as const).map((tw) => (
              <button
                key={tw}
                className={`toggle-btn${timeWindow === tw ? ' active' : ''}`}
                onClick={() => setTimeWindow(tw)}
                style={{
                  padding: '3px 8px',
                  fontSize: 'var(--text-xs)',
                  flex: 'none',
                  ...(timeWindow === tw ? { background: 'var(--color-health)' } : {}),
                }}
              >
                {tw === '24h' ? '24小时' : tw === '3d' ? '3天' : '7天'}
              </button>
            ))}
          </div>
        </div>
        <TemperatureChart records={records} medications={medications} timeWindow={timeWindow} />
      </div>

      {/* Recent records */}
      {records.length > 0 && (
        <div>
          <div className="section-header">最近记录</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[...records].reverse().slice(0, 10).map((r) => {
              const level = getFeverLevel(r.temperature)
              const color = FEVER_LEVEL_INFO[level].color
              const time = new Date(r.measureTime)
              return (
                <div key={r.recordId} className="record-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' as any, color }}>{r.temperature}℃</span>
                      <span style={{ fontSize: 'var(--text-xs)', color, background: color + '15', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                        {FEVER_LEVEL_INFO[level].label}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{MEASURE_METHOD_INFO[r.measureMethod].label}
                      {r.symptoms.length > 0 && ` · ${r.symptoms.map((s) => SYMPTOM_TAG_INFO[s].label).join('、')}`}
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => { if (window.confirm('确定要删除这条记录吗？')) deleteTemperatureRecord(r.recordId) }}
                  >
                    删除
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
