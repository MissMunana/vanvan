import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'

import { PLANNED_VACCINES, OPTIONAL_VACCINES, ALL_VACCINES, type VaccineScheduleItem } from '../../data/vaccineSchedule'
import { getAgeInMonths } from '../../utils/growthUtils'
import type { VaccinationRecord, VaccineReaction } from '../../types'
import { getToday } from '../../utils/generateId'

type ViewMode = 'schedule' | 'history'

const REACTION_TYPES = [
  { value: 'fever', label: '发热' },
  { value: 'redness', label: '接种部位红肿' },
  { value: 'pain', label: '接种部位疼痛' },
  { value: 'fussiness', label: '哭闹/烦躁' },
  { value: 'rash', label: '皮疹' },
  { value: 'lethargy', label: '精神不振' },
  { value: 'other', label: '其他' },
]

const SEVERITY_OPTIONS: { value: VaccineReaction['severity']; label: string }[] = [
  { value: 'mild', label: '轻微' },
  { value: 'moderate', label: '中等' },
  { value: 'severe', label: '严重' },
]

function getVaccineStatus(ageMonths: number, recommendedAgeMonths: number, done: boolean): { label: string; color: string; bg: string } | null {
  if (done) return null
  const diff = ageMonths - recommendedAgeMonths
  if (diff < -1) return null
  if (diff <= 1) return { label: '应接种', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' }
  if (diff <= 3) return { label: '即将超期', color: '#FF9800', bg: 'rgba(255,152,0,0.1)' }
  return { label: '已超期', color: '#FF5252', bg: 'rgba(255,82,82,0.1)' }
}

export default function VaccineTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const addVaccinationRecord = useHealthStore((s) => s.addVaccinationRecord)
  const deleteVaccinationRecord = useHealthStore((s) => s.deleteVaccinationRecord)
  const vaccinationRecords = useHealthStore((s) => s.vaccinationRecords)
  const { showToast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('schedule')
  const [showRecord, setShowRecord] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineScheduleItem | null>(null)
  const [recordDate, setRecordDate] = useState(getToday())
  const [batchNumber, setBatchNumber] = useState('')
  const [site, setSite] = useState('')
  const [note, setNote] = useState('')
  const [reactions, setReactions] = useState<VaccineReaction[]>([])

  const records = useMemo(() => {
    if (!child) return []
    return vaccinationRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [child, vaccinationRecords])

  const completedVaccineIds = useMemo(() => {
    return new Set(records.map((r) => `${r.vaccineName}_${r.doseNumber}`))
  }, [records])

  const ageMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, getToday())
  }, [child])

  const openRecordModal = (vaccine: VaccineScheduleItem) => {
    setSelectedVaccine(vaccine)
    setRecordDate(getToday())
    setBatchNumber('')
    setSite('')
    setNote('')
    setReactions([])
    setShowRecord(true)
  }

  const handleSaveRecord = async () => {
    if (!child || !selectedVaccine) return

    try {
      await addVaccinationRecord({
        childId: child.childId,
        vaccineName: selectedVaccine.name,
        vaccineType: selectedVaccine.category,
        doseNumber: selectedVaccine.doseNumber,
        totalDoses: selectedVaccine.totalDoses,
        date: recordDate,
        batchNumber,
        site,
        vaccinator: '',
        reactions,
        note,
      })

      showToast('接种记录已保存')
      setShowRecord(false)
    } catch {
      showToast('保存失败，请重试')
    }
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* View toggle */}
      <div className="toggle-group" style={{ marginBottom: 16 }}>
        <button
          className={`toggle-btn${viewMode === 'schedule' ? ' active' : ''}`}
          onClick={() => setViewMode('schedule')}
          style={viewMode === 'schedule' ? { background: 'var(--color-vaccine)' } : undefined}
        >
          📋 接种日程
        </button>
        <button
          className={`toggle-btn${viewMode === 'history' ? ' active' : ''}`}
          onClick={() => setViewMode('history')}
          style={viewMode === 'history' ? { background: 'var(--color-vaccine)' } : undefined}
        >
          📝 接种记录 ({records.length})
        </button>
      </div>

      {/* Vaccine reminder banner (1-C) */}
      {viewMode === 'schedule' && (() => {
        const allVaccines = [...PLANNED_VACCINES, ...OPTIONAL_VACCINES]
        const dueCount = allVaccines.filter((v) => {
          const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
          const status = getVaccineStatus(ageMonths, v.recommendedAgeMonths, done)
          return status?.label === '应接种'
        }).length
        const overdueCount = allVaccines.filter((v) => {
          const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
          const status = getVaccineStatus(ageMonths, v.recommendedAgeMonths, done)
          return status?.label === '已超期' || status?.label === '即将超期'
        }).length

        if (dueCount === 0 && overdueCount === 0) return null
        return (
          <div style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: overdueCount > 0 ? '#FFF3E0' : '#E8F5E9',
            border: `1px solid ${overdueCount > 0 ? '#FFE0B2' : '#C8E6C9'}`,
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: overdueCount > 0 ? '#E65100' : '#2E7D32' }}>
              {overdueCount > 0 ? '⚠️' : '💡'}{' '}
              {dueCount > 0 && `${dueCount}项疫苗待接种`}
              {dueCount > 0 && overdueCount > 0 && '，'}
              {overdueCount > 0 && `${overdueCount}项已超期或即将超期`}
            </div>
          </div>
        )
      })()}

      {viewMode === 'schedule' ? (
        <VaccineScheduleView
          ageMonths={ageMonths}
          completedVaccineIds={completedVaccineIds}
          onRecord={openRecordModal}
        />
      ) : (
        <VaccineHistoryView records={records} onDelete={deleteVaccinationRecord} />
      )}

      {/* Record Modal */}
      <Modal open={showRecord} onClose={() => setShowRecord(false)} title="记录接种">
        {selectedVaccine && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'var(--color-health-light)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>💉 {selectedVaccine.name}（第{selectedVaccine.doseNumber}剂）</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {selectedVaccine.description}
              </div>
            </div>

            <div>
              <label className="form-label">接种日期</label>
              <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} min={child.birthday} max={getToday()} />
            </div>

            <div>
              <label className="form-label">批号（选填）</label>
              <input
                type="text"
                placeholder="疫苗批号"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">接种部位（选填）</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['左上臂', '右上臂', '左大腿', '右大腿', '口服'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSite(s)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      background: site === s ? 'var(--color-vaccine)' : 'var(--color-bg-secondary)',
                      color: site === s ? 'white' : 'var(--color-text)',
                      border: 'none',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">备注（选填）</label>
              <input
                type="text"
                placeholder="例如：无不良反应"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Reaction tracking */}
            <div>
              <label style={labelStyle}>接种后不良反应（选填）</label>
              {reactions.map((r, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', marginBottom: 6,
                  background: 'rgba(255,152,0,0.06)', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                }}>
                  <span style={{ flex: 1 }}>
                    {REACTION_TYPES.find((t) => t.value === r.type)?.label ?? r.type}
                    {' · '}
                    <span style={{ color: r.severity === 'severe' ? '#FF5252' : r.severity === 'moderate' ? '#FF9800' : '#4CAF50' }}>
                      {SEVERITY_OPTIONS.find((s) => s.value === r.severity)?.label}
                    </span>
                    {r.duration && ` · ${r.duration}`}
                  </span>
                  <button
                    onClick={() => setReactions((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ fontSize: '0.7rem', color: 'var(--color-danger)', padding: '2px 6px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <ReactionAdder onAdd={(r) => setReactions((prev) => [...prev, r])} />
            </div>

            <button
              className="btn btn-block"
              onClick={handleSaveRecord}
              style={{ background: 'var(--color-vaccine)', color: 'white' }}
            >
              保存接种记录
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function VaccineScheduleView({
  ageMonths,
  completedVaccineIds,
  onRecord,
}: {
  ageMonths: number
  completedVaccineIds: Set<string>
  onRecord: (vaccine: VaccineScheduleItem) => void
}) {
  // Group planned vaccines by age
  const groupedPlanned = useMemo(() => {
    const groups: { label: string; months: number; vaccines: VaccineScheduleItem[] }[] = []
    const labelMap = new Map<string, VaccineScheduleItem[]>()

    PLANNED_VACCINES.forEach((v) => {
      const key = v.ageRangeLabel
      if (!labelMap.has(key)) {
        labelMap.set(key, [])
      }
      labelMap.get(key)!.push(v)
    })

    labelMap.forEach((vaccines, label) => {
      groups.push({ label, months: vaccines[0].recommendedAgeMonths, vaccines })
    })

    return groups.sort((a, b) => a.months - b.months)
  }, [])

  return (
    <div>
      {/* Progress summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 8 }}>接种进度</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <ProgressStat
            label="已接种"
            value={completedVaccineIds.size}
            total={ALL_VACCINES.length}
            color="var(--color-vaccine)"
          />
          <ProgressStat
            label="计划内"
            value={[...completedVaccineIds].filter((id) => {
              const v = PLANNED_VACCINES.find((pv) => `${pv.name}_${pv.doseNumber}` === id)
              return !!v
            }).length}
            total={PLANNED_VACCINES.length}
            color="var(--color-success)"
          />
        </div>
        <div className="progress-bar" style={{ marginTop: 10 }}>
          <div className="progress-bar-fill" style={{
            width: `${(completedVaccineIds.size / ALL_VACCINES.length) * 100}%`,
            background: 'var(--color-vaccine)',
          }} />
        </div>
      </div>

      {/* Planned vaccines schedule */}
      <div className="section-header">🏥 国家免疫规划疫苗</div>
      {groupedPlanned.map((group) => {
        const isPast = ageMonths > group.months + 3
        const isCurrent = ageMonths >= group.months - 1 && ageMonths <= group.months + 3
        const allDone = group.vaccines.every((v) => completedVaccineIds.has(`${v.name}_${v.doseNumber}`))

        return (
          <div
            key={group.label}
            className="card"
            style={{
              padding: '10px 14px',
              marginBottom: 8,
              borderLeft: isCurrent ? '3px solid var(--color-vaccine)' : allDone ? '3px solid var(--color-success)' : '3px solid transparent',
              opacity: isPast && allDone ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {group.label}
                {isCurrent && <span style={{ fontSize: '0.65rem', color: 'var(--color-vaccine)', marginLeft: 6 }}>← 当前</span>}
              </span>
              {allDone && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>✅ 已完成</span>}
            </div>
            {group.vaccines.map((v) => {
              const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
              return (
                <VaccineRow
                  key={v.id}
                  vaccine={v}
                  done={done}
                  ageMonths={ageMonths}
                  onRecord={() => onRecord(v)}
                />
              )
            })}
          </div>
        )
      })}

      {/* Optional vaccines */}
      <div className="section-header" style={{ marginTop: 16 }}>💡 非免疫规划疫苗（自费）</div>
      <div className="card" style={{ padding: '10px 14px' }}>
        {OPTIONAL_VACCINES.map((v) => {
          const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
          return (
            <VaccineRow key={v.id} vaccine={v} done={done} ageMonths={ageMonths} onRecord={() => onRecord(v)} />
          )
        })}
      </div>
    </div>
  )
}

function VaccineRow({
  vaccine,
  done,
  ageMonths,
  onRecord,
}: {
  vaccine: VaccineScheduleItem
  done: boolean
  ageMonths: number
  onRecord: () => void
}) {
  const status = getVaccineStatus(ageMonths, vaccine.recommendedAgeMonths, done)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{done ? '✅' : '⬜'} {vaccine.name}</span>
          {vaccine.totalDoses > 1 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              （第{vaccine.doseNumber}/{vaccine.totalDoses}剂）
            </span>
          )}
          {status && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700,
              padding: '1px 6px', borderRadius: 8,
              color: status.color, background: status.bg,
            }}>
              {status.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
          {vaccine.description}
        </div>
      </div>
      {!done && (
        <button
          onClick={onRecord}
          style={{
            padding: '4px 10px',
            fontSize: '0.7rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(66, 165, 245, 0.08)',
            color: 'var(--color-vaccine)',
            border: '1px solid rgba(66, 165, 245, 0.19)',
            whiteSpace: 'nowrap',
          }}
        >
          记录
        </button>
      )}
    </div>
  )
}

function VaccineHistoryView({
  records,
  onDelete,
}: {
  records: VaccinationRecord[]
  onDelete: (recordId: string) => Promise<void>
}) {
  if (records.length === 0) {
    return (
      <div className="card">
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div className="empty-state-icon">💉</div>
          <div className="empty-state-text">暂无接种记录</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {[...records].reverse().map((r) => (
        <div key={r.recordId} className="card" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>💉 {r.vaccineName}</span>
                {r.totalDoses > 1 && `（第${r.doseNumber}/${r.totalDoses}剂）`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>📅 {r.date}</span>
                {r.site && ` · 部位：${r.site}`}
                {r.batchNumber && ` · 批号：${r.batchNumber}`}
              </div>
              {r.note && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>📝 {r.note}</span>
                </div>
              )}
              {r.reactions && r.reactions.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {r.reactions.map((rx, i) => (
                    <span key={i} style={{
                      fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8,
                      background: rx.severity === 'severe' ? 'rgba(255,82,82,0.1)' : rx.severity === 'moderate' ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)',
                      color: rx.severity === 'severe' ? '#FF5252' : rx.severity === 'moderate' ? '#FF9800' : '#4CAF50',
                    }}>
                      {REACTION_TYPES.find((t) => t.value === rx.type)?.label ?? rx.type}
                      {rx.duration && ` · ${rx.duration}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="btn-delete"
              onClick={async () => { if (window.confirm('确定要删除这条接种记录吗？')) { try { await onDelete(r.recordId) } catch { /* parent handles */ } } }}
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div className="stat-item">
      <div className="stat-item-label">{label}</div>
      <div className="stat-item-value" style={{ color }}>
        {value}<span style={{ fontSize: '0.75rem', fontWeight: 'var(--font-normal)' as any }}>/{total}</span>
      </div>
    </div>
  )
}

function ReactionAdder({ onAdd }: { onAdd: (r: VaccineReaction) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('fever')
  const [severity, setSeverity] = useState<VaccineReaction['severity']>('mild')
  const [duration, setDuration] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: '0.78rem', color: 'var(--color-vaccine)',
          padding: '6px 0', background: 'none', border: 'none',
        }}
      >
        + 添加不良反应
      </button>
    )
  }

  return (
    <div style={{
      padding: 10, borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--color-border)', marginTop: 4,
    }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>反应类型</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {REACTION_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              style={{
                padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)',
                background: type === t.value ? 'var(--color-vaccine)' : 'var(--color-bg-secondary)',
                color: type === t.value ? 'white' : 'var(--color-text)',
                border: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>严重程度</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSeverity(s.value)}
              style={{
                padding: '4px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)',
                background: severity === s.value ? (s.value === 'severe' ? '#FF5252' : s.value === 'moderate' ? '#FF9800' : '#4CAF50') : 'var(--color-bg-secondary)',
                color: severity === s.value ? 'white' : 'var(--color-text)',
                border: 'none',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>持续时间（选填）</div>
        <input
          type="text"
          placeholder="例如：24小时"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{ fontSize: '0.8rem' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            onAdd({ type, severity, duration })
            setOpen(false)
            setType('fever')
            setSeverity('mild')
            setDuration('')
          }}
          style={{
            flex: 1, padding: '6px 0', fontSize: '0.78rem', fontWeight: 600,
            background: 'var(--color-vaccine)', color: 'white',
            borderRadius: 'var(--radius-sm)', border: 'none',
          }}
        >
          添加
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            padding: '6px 12px', fontSize: '0.78rem',
            background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-sm)', border: 'none',
          }}
        >
          取消
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: 4,
  display: 'block',
}
