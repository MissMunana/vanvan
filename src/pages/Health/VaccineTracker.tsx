import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { PLANNED_VACCINES, OPTIONAL_VACCINES, ALL_VACCINES, type VaccineScheduleItem } from '../../data/vaccineSchedule'

type ViewMode = 'schedule' | 'history'

export default function VaccineTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const addVaccinationRecord = useHealthStore((s) => s.addVaccinationRecord)
  const deleteVaccinationRecord = useHealthStore((s) => s.deleteVaccinationRecord)
  const vaccinationRecords = useHealthStore((s) => s.vaccinationRecords)
  const { showToast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('schedule')
  const [showRecord, setShowRecord] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineScheduleItem | null>(null)
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [batchNumber, setBatchNumber] = useState('')
  const [site, setSite] = useState('')
  const [note, setNote] = useState('')

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
    const now = new Date()
    const birth = new Date(child.birthday)
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  }, [child])

  const openRecordModal = (vaccine: VaccineScheduleItem) => {
    setSelectedVaccine(vaccine)
    setRecordDate(new Date().toISOString().split('T')[0])
    setBatchNumber('')
    setSite('')
    setNote('')
    setShowRecord(true)
  }

  const handleSaveRecord = () => {
    if (!child || !selectedVaccine) return

    addVaccinationRecord({
      childId: child.childId,
      vaccineName: selectedVaccine.name,
      vaccineType: selectedVaccine.category,
      doseNumber: selectedVaccine.doseNumber,
      totalDoses: selectedVaccine.totalDoses,
      date: recordDate,
      batchNumber,
      site,
      vaccinator: '',
      reactions: [],
      note,
    })

    showToast('接种记录已保存')
    setShowRecord(false)
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode('schedule')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: viewMode === 'schedule' ? 700 : 400,
            background: viewMode === 'schedule' ? 'var(--color-vaccine)' : 'transparent',
            color: viewMode === 'schedule' ? 'white' : 'var(--color-text-secondary)',
            border: viewMode === 'schedule' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          📋 接种日程
        </button>
        <button
          onClick={() => setViewMode('history')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: viewMode === 'history' ? 700 : 400,
            background: viewMode === 'history' ? 'var(--color-vaccine)' : 'transparent',
            color: viewMode === 'history' ? 'white' : 'var(--color-text-secondary)',
            border: viewMode === 'history' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          📝 接种记录 ({records.length})
        </button>
      </div>

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
              background: 'var(--color-vaccine)10',
              border: '1px solid var(--color-vaccine)30',
              borderRadius: 'var(--radius-md)',
              padding: 12,
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                💉 {selectedVaccine.name}（第{selectedVaccine.doseNumber}剂）
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {selectedVaccine.description}
              </div>
            </div>

            <div>
              <label style={labelStyle}>接种日期</label>
              <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>批号（选填）</label>
              <input
                type="text"
                placeholder="疫苗批号"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>接种部位（选填）</label>
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
              <label style={labelStyle}>备注（选填）</label>
              <input
                type="text"
                placeholder="例如：无不良反应"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button
              className="btn btn-block"
              onClick={handleSaveRecord}
              style={{ background: 'var(--color-vaccine)', color: 'white', fontWeight: 700 }}
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
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>接种进度</div>
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
            color="#4CAF50"
          />
        </div>
        <div style={{
          marginTop: 10,
          height: 6,
          borderRadius: 3,
          background: '#F0F0F0',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(completedVaccineIds.size / ALL_VACCINES.length) * 100}%`,
            background: 'var(--color-vaccine)',
            borderRadius: 3,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Planned vaccines schedule */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>🏥 国家免疫规划疫苗</div>
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
              borderLeft: isCurrent ? '3px solid var(--color-vaccine)' : allDone ? '3px solid #4CAF50' : '3px solid transparent',
              opacity: isPast && allDone ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {group.label}
                {isCurrent && <span style={{ fontSize: '0.65rem', color: 'var(--color-vaccine)', marginLeft: 6 }}>← 当前</span>}
              </span>
              {allDone && <span style={{ fontSize: '0.7rem', color: '#4CAF50' }}>✅ 已完成</span>}
            </div>
            {group.vaccines.map((v) => {
              const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
              return (
                <VaccineRow
                  key={v.id}
                  vaccine={v}
                  done={done}
                  onRecord={() => onRecord(v)}
                />
              )
            })}
          </div>
        )
      })}

      {/* Optional vaccines */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 16, marginBottom: 8 }}>💡 非免疫规划疫苗（自费）</div>
      <div className="card" style={{ padding: '10px 14px' }}>
        {OPTIONAL_VACCINES.map((v) => {
          const done = completedVaccineIds.has(`${v.name}_${v.doseNumber}`)
          return (
            <VaccineRow key={v.id} vaccine={v} done={done} onRecord={() => onRecord(v)} />
          )
        })}
      </div>
    </div>
  )
}

function VaccineRow({
  vaccine,
  done,
  onRecord,
}: {
  vaccine: VaccineScheduleItem
  done: boolean
  onRecord: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {done ? '✅' : '⬜'} {vaccine.name}
          {vaccine.totalDoses > 1 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              （第{vaccine.doseNumber}/{vaccine.totalDoses}剂）
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
            background: 'var(--color-vaccine)15',
            color: 'var(--color-vaccine)',
            border: '1px solid var(--color-vaccine)30',
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
  records: ReturnType<typeof useHealthStore.getState>['vaccinationRecords']
  onDelete: (recordId: string) => void
}) {
  if (records.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        暂无接种记录
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
                💉 {r.vaccineName}
                {r.totalDoses > 1 && `（第${r.doseNumber}/${r.totalDoses}剂）`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                📅 {r.date}
                {r.site && ` · 部位：${r.site}`}
                {r.batchNumber && ` · 批号：${r.batchNumber}`}
              </div>
              {r.note && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  📝 {r.note}
                </div>
              )}
            </div>
            <button
              onClick={() => { if (window.confirm('确定要删除这条接种记录吗？')) onDelete(r.recordId) }}
              style={{ fontSize: '0.7rem', color: 'var(--color-danger)', padding: '4px 8px' }}
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
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
        {value}<span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/{total}</span>
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
