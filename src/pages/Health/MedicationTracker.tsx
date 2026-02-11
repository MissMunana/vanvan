import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'

import {
  IBUPROFEN_FORMULATIONS,
  ACETAMINOPHEN_FORMULATIONS,
  calculateIbuprofenDose,
  calculateAcetaminophenDose,
  type DrugFormulation,
  type DosageResult,
} from '../../utils/dosageUtils'

type DrugType = 'ibuprofen' | 'acetaminophen'

export default function MedicationTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const addMedicationRecord = useHealthStore((s) => s.addMedicationRecord)
  const medicationRecords = useHealthStore((s) => s.medicationRecords)
  const deleteMedicationRecord = useHealthStore((s) => s.deleteMedicationRecord)
  const checkMedicationInterval = useHealthStore((s) => s.checkMedicationInterval)
  const growthRecords = useHealthStore((s) => s.growthRecords)
  const { showToast } = useToast()

  const [showCalc, setShowCalc] = useState(false)
  const [drugType, setDrugType] = useState<DrugType>('ibuprofen')
  const [weight, setWeight] = useState('')
  const [formulationIdx, setFormulationIdx] = useState(0)

  const records = useMemo(() => {
    if (!child) return []
    return medicationRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => b.administrationTime.localeCompare(a.administrationTime))
  }, [child, medicationRecords])

  // Auto-fill weight from latest growth record
  const latestWeight = useMemo(() => {
    if (!child) return null
    const growth = growthRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => a.date.localeCompare(b.date))
    const latest = growth.length > 0 ? growth[growth.length - 1] : null
    return latest?.weight ?? null
  }, [child, growthRecords])

  const formulations = drugType === 'ibuprofen' ? IBUPROFEN_FORMULATIONS : ACETAMINOPHEN_FORMULATIONS
  const selectedFormulation = formulations[formulationIdx] || formulations[0]

  const dosageResult: DosageResult | null = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return null
    return drugType === 'ibuprofen'
      ? calculateIbuprofenDose(w, selectedFormulation)
      : calculateAcetaminophenDose(w, selectedFormulation)
  }, [weight, drugType, selectedFormulation])

  const ibuprofenInterval = useMemo(() => {
    if (!child) return { safe: true, minutesRemaining: 0 }
    return checkMedicationInterval(child.childId, 'ibuprofen')
  }, [child, medicationRecords, checkMedicationInterval])

  const acetaminophenInterval = useMemo(() => {
    if (!child) return { safe: true, minutesRemaining: 0 }
    return checkMedicationInterval(child.childId, 'acetaminophen')
  }, [child, medicationRecords, checkMedicationInterval])

  const intervalCheck = drugType === 'ibuprofen' ? ibuprofenInterval : acetaminophenInterval

  const openCalc = (type: DrugType) => {
    setDrugType(type)
    setFormulationIdx(0)
    setWeight(latestWeight ? String(latestWeight) : '')
    setShowCalc(true)
  }

  const handleSaveMedication = async (formulation: DrugFormulation, result: DosageResult) => {
    if (!child) return

    if (!intervalCheck.safe) {
      showToast(`距离上次用药不足${drugType === 'ibuprofen' ? '6' : '4'}小时`)
      return
    }

    const dosageForm = formulation.id.includes('drops') ? 'suspension_drops'
      : formulation.id.includes('gran') ? 'granules'
      : 'suspension'

    try {
      await addMedicationRecord({
        childId: child.childId,
        drugName: formulation.name,
        genericName: drugType,
        dosageForm,
        singleDose: result.recommendedDoseVolume,
        doseUnit: result.unit,
        administrationTime: new Date().toISOString(),
        route: 'oral',
        reason: '退烧',
        note: `${result.recommendedDoseMg}mg (${result.recommendedDoseVolume}${result.unit})`,
      })

      showToast('用药记录已保存')
      setShowCalc(false)
    } catch {
      showToast('保存失败，请重试')
    }
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Quick add buttons */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>💊 快捷记录</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <QuickDrugButton
            label="布洛芬"
            subtitle="(美林)"
            color="#FF9800"
            intervalCheck={ibuprofenInterval}
            onClick={() => openCalc('ibuprofen')}
          />
          <QuickDrugButton
            label="对乙酰氨基酚"
            subtitle="(泰诺林)"
            color="#2196F3"
            intervalCheck={acetaminophenInterval}
            onClick={() => openCalc('acetaminophen')}
          />
        </div>
      </div>

      {/* Medication history */}
      {records.length > 0 && (
        <div>
          <div className="section-header">用药记录</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {records.slice(0, 20).map((r) => {
              const time = new Date(r.administrationTime)
              return (
                <div key={r.recordId} className="record-item">
                  <div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' as any }}>
                      💊 {r.drugName.split('(')[0].trim()}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {r.note} · {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={async () => { if (window.confirm('确定要删除这条记录吗？')) { try { await deleteMedicationRecord(r.recordId) } catch { showToast('删除失败') } } }}
                  >
                    删除
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-text">暂无用药记录</div>
          </div>
        </div>
      )}

      {/* Dosage calculator modal */}
      <Modal open={showCalc} onClose={() => setShowCalc(false)} title={drugType === 'ibuprofen' ? '布洛芬剂量计算' : '对乙酰氨基酚剂量计算'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Interval warning */}
          {!intervalCheck.safe && (
            <div className="alert alert-danger">
              ⚠️ 距离上次用药还需等待 <strong>{formatMinutes(intervalCheck.minutesRemaining)}</strong>
            </div>
          )}

          {/* Weight input */}
          <div>
            <label className="form-label">孩子体重 (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="例如 12.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="3"
              max="80"
            />
            {latestWeight && weight !== String(latestWeight) && (
              <button
                onClick={() => setWeight(String(latestWeight))}
                style={{ fontSize: '0.7rem', color: 'var(--color-health)', marginTop: 4, display: 'block' }}
              >
                使用最近记录体重：{latestWeight}kg
              </button>
            )}
          </div>

          {/* Formulation */}
          <div>
            <label className="form-label">制剂选择</label>
            <select
              value={formulationIdx}
              onChange={(e) => setFormulationIdx(Number(e.target.value))}
            >
              {formulations.map((f, i) => (
                <option key={f.id} value={i}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Calculation result */}
          {dosageResult && (
            <div style={{
              background: 'var(--color-health-light)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10, color: 'var(--color-health-dark)' }}>
                计算结果
              </div>
              <ResultRow label="推荐单次剂量" value={`${dosageResult.recommendedDoseMg}mg（${dosageResult.recommendedDoseVolume}${dosageResult.unit}）`} />
              <ResultRow label="剂量范围" value={`${dosageResult.minDoseMg} - ${dosageResult.maxDoseMg}mg`} />
              <ResultRow label="给药间隔" value={`每${dosageResult.intervalHours}小时以上`} />
              <ResultRow label="每日最大剂量" value={`${dosageResult.maxDailyDoseMg}mg`} />
              <ResultRow label="每日最多次数" value={`${dosageResult.maxDailyTimes}次`} />

              {dosageResult.warnings.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {dosageResult.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-alert-danger-text)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>⚠️ {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⚠️ 请遵医嘱用药，本计算仅供参考</span>
          </div>

          <button
            className="btn btn-health btn-block"
            onClick={() => dosageResult && handleSaveMedication(selectedFormulation, dosageResult)}
            disabled={!dosageResult || !intervalCheck.safe}
          >
            保存用药记录
          </button>
        </div>
      </Modal>
    </div>
  )
}

function QuickDrugButton({
  label,
  subtitle,
  color,
  intervalCheck,
  onClick,
}: {
  label: string
  subtitle: string
  color: string
  intervalCheck: { safe: boolean; minutesRemaining: number }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 8px',
        borderRadius: 'var(--radius-md)',
        background: color + '10',
        border: `1px solid ${color}30`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{subtitle}</div>
      {!intervalCheck.safe && (
        <div style={{ fontSize: '0.65rem', color: 'var(--color-alert-danger-text)', marginTop: 4 }}>
          还需等 {formatMinutes(intervalCheck.minutesRemaining)}
        </div>
      )}
    </button>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }
  return `${minutes}分钟`
}

