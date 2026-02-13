import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'

import {
  DRUG_REGISTRY,
  DRUG_CATEGORY_INFO,
  getDrugsByCategory,
  type DrugId,
  type DrugCategory,
  type DrugInfo,
  type DrugFormulation,
  type DosageResult,
} from '../../utils/dosageUtils'

export default function MedicationTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const addMedicationRecord = useHealthStore((s) => s.addMedicationRecord)
  const medicationRecords = useHealthStore((s) => s.medicationRecords)
  const deleteMedicationRecord = useHealthStore((s) => s.deleteMedicationRecord)
  const checkMedicationInterval = useHealthStore((s) => s.checkMedicationInterval)
  const growthRecords = useHealthStore((s) => s.growthRecords)
  const { showToast } = useToast()

  const [activeCategory, setActiveCategory] = useState<DrugCategory>('antipyretic')
  const [showCalc, setShowCalc] = useState(false)
  const [selectedDrugId, setSelectedDrugId] = useState<DrugId>('ibuprofen')
  const [weight, setWeight] = useState('')
  const [formulationIdx, setFormulationIdx] = useState(0)

  const drugsByCategory = useMemo(() => getDrugsByCategory(), [])
  const selectedDrug = DRUG_REGISTRY[selectedDrugId]

  const records = useMemo(() => {
    if (!child) return []
    return medicationRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => b.administrationTime.localeCompare(a.administrationTime))
  }, [child, medicationRecords])

  const latestWeight = useMemo(() => {
    if (!child) return null
    const growth = growthRecords
      .filter((r) => r.childId === child.childId)
      .sort((a, b) => a.date.localeCompare(b.date))
    const latest = growth.length > 0 ? growth[growth.length - 1] : null
    return latest?.weight ?? null
  }, [child, growthRecords])

  const ageMonths = useMemo(() => {
    if (!child?.birthday) return 0
    const birth = new Date(child.birthday)
    const now = new Date()
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  }, [child])

  const formulations = selectedDrug.formulations
  const selectedFormulation = formulations[formulationIdx] || formulations[0]

  const dosageResult: DosageResult | null = useMemo(() => {
    const w = parseFloat(weight)
    if (selectedDrug.requiresWeight && (!w || w <= 0)) return null
    if (selectedDrug.requiresAge && !ageMonths) return null
    return selectedDrug.calculate(w || 0, ageMonths, selectedFormulation)
  }, [weight, ageMonths, selectedDrug, selectedFormulation])

  const intervalCheck = useMemo(() => {
    if (!child || !selectedDrug.intervalHours) return { safe: true, minutesRemaining: 0 }
    return checkMedicationInterval(child.childId, selectedDrugId)
  }, [child, selectedDrugId, medicationRecords, checkMedicationInterval])

  const openCalc = (drugId: DrugId) => {
    setSelectedDrugId(drugId)
    setFormulationIdx(0)
    setWeight(latestWeight ? String(latestWeight) : '')
    setShowCalc(true)
  }

  const handleSaveMedication = async (formulation: DrugFormulation, result: DosageResult) => {
    if (!child) return

    if (selectedDrug.intervalHours && !intervalCheck.safe) {
      showToast(`距离上次用药不足${selectedDrug.intervalHours}小时`)
      return
    }

    const dosageForm = formulation.id.includes('drops') ? 'suspension_drops' as const
      : formulation.id.includes('susp') ? 'suspension' as const
      : formulation.id.includes('gran') || formulation.id.includes('powder') ? 'granules' as const
      : formulation.id.includes('cap') ? 'capsules' as const
      : formulation.id.includes('chew') ? 'chewable_tablets' as const
      : formulation.id.includes('syrup') ? 'syrup' as const
      : 'tablets' as const

    const noteExtra = [
      `${result.recommendedDoseMg > 0 ? result.recommendedDoseMg + 'mg ' : ''}(${result.recommendedDoseVolume}${result.unit})`,
      result.courseNote,
    ].filter(Boolean).join(' · ')

    try {
      await addMedicationRecord({
        childId: child.childId,
        drugName: formulation.name,
        genericName: selectedDrugId,
        dosageForm,
        singleDose: result.recommendedDoseVolume,
        doseUnit: result.unit,
        administrationTime: new Date().toISOString(),
        route: 'oral',
        reason: selectedDrug.defaultReason,
        note: noteExtra,
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
      {/* Category tabs */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 10 }}>💊 药品分类</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {(Object.keys(DRUG_CATEGORY_INFO) as DrugCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: activeCategory === cat ? '2px solid var(--color-health)' : '1px solid var(--color-border)',
                background: activeCategory === cat ? 'var(--color-health-light)' : 'transparent',
                fontWeight: activeCategory === cat ? 700 : 400,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                color: activeCategory === cat ? 'var(--color-health-dark)' : 'var(--color-text-secondary)',
              }}
            >
              {DRUG_CATEGORY_INFO[cat].icon} {DRUG_CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>

        {/* Drug buttons grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          {drugsByCategory[activeCategory].map((drug) => (
            <DrugButton
              key={drug.id}
              drug={drug}
              intervalCheck={
                drug.intervalHours && child
                  ? checkMedicationInterval(child.childId, drug.id)
                  : { safe: true, minutesRemaining: 0 }
              }
              onClick={() => openCalc(drug.id)}
            />
          ))}
        </div>
      </div>

      {/* Medication history */}
      {records.length > 0 && (
        <div>
          <div className="section-header">用药记录</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {records.slice(0, 20).map((r) => {
              const time = new Date(r.administrationTime)
              const drugInfo = DRUG_REGISTRY[r.genericName as DrugId]
              return (
                <div key={r.recordId} className="record-item">
                  <div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' as any }}>
                      {drugInfo?.icon || '💊'} {drugInfo?.chineseName || r.drugName.split('(')[0].trim()}
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

      {/* Generic dosage calculator modal */}
      <Modal open={showCalc} onClose={() => setShowCalc(false)} title={`${selectedDrug.icon} ${selectedDrug.chineseName}剂量计算`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Brand names */}
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            商品名：{selectedDrug.brandNames.join('、')}
          </div>

          {/* Age restriction warning */}
          {selectedDrug.minAgeMonths && ageMonths < selectedDrug.minAgeMonths && (
            <div className="alert alert-danger">
              ⚠️ 该药品建议 {Math.floor(selectedDrug.minAgeMonths / 12)} 岁以上使用，当前孩子 {Math.floor(ageMonths / 12)} 岁
            </div>
          )}

          {/* Interval warning */}
          {selectedDrug.intervalHours && !intervalCheck.safe && (
            <div className="alert alert-danger">
              ⚠️ 距离上次用药还需等待 <strong>{formatMinutes(intervalCheck.minutesRemaining)}</strong>
            </div>
          )}

          {/* Weight input (if required) */}
          {selectedDrug.requiresWeight && (
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
          )}

          {/* Age display (if age-based) */}
          {selectedDrug.requiresAge && (
            <div>
              <label className="form-label">孩子年龄</label>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                {Math.floor(ageMonths / 12)}岁{ageMonths % 12}个月 ({ageMonths}月龄)
              </div>
            </div>
          )}

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

              {/* ORS uses volume-only display */}
              {selectedDrugId === 'ors' ? (
                <ResultRow label="每次补充量" value={`${dosageResult.recommendedDoseVolume}${dosageResult.unit}`} />
              ) : (
                <>
                  <ResultRow label="推荐单次剂量" value={`${dosageResult.recommendedDoseMg}mg（${dosageResult.recommendedDoseVolume}${dosageResult.unit}）`} />
                  {dosageResult.minDoseMg !== dosageResult.maxDoseMg && (
                    <ResultRow label="剂量范围" value={`${dosageResult.minDoseMg} - ${dosageResult.maxDoseMg}mg`} />
                  )}
                </>
              )}

              {dosageResult.intervalHours > 0 && (
                <ResultRow label="给药间隔" value={`每${dosageResult.intervalHours}小时以上`} />
              )}
              {dosageResult.maxDailyDoseMg > 0 && (
                <ResultRow label="每日最大剂量" value={`${dosageResult.maxDailyDoseMg}mg`} />
              )}
              {dosageResult.maxDailyTimes > 0 && (
                <ResultRow label="每日最多次数" value={`${dosageResult.maxDailyTimes}次`} />
              )}

              {/* Course note */}
              {dosageResult.courseNote && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-health-dark)' }}>
                  📋 {dosageResult.courseNote}
                </div>
              )}

              {/* Administration note */}
              {dosageResult.administrationNote && (
                <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  💡 {dosageResult.administrationNote}
                </div>
              )}

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
            disabled={!dosageResult || (selectedDrug.intervalHours ? !intervalCheck.safe : false)}
          >
            保存用药记录
          </button>
        </div>
      </Modal>
    </div>
  )
}

function DrugButton({
  drug,
  intervalCheck,
  onClick,
}: {
  drug: DrugInfo
  intervalCheck: { safe: boolean; minutesRemaining: number }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 8px',
        borderRadius: 'var(--radius-md)',
        background: drug.color + '10',
        border: `1px solid ${drug.color}30`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: drug.color }}>{drug.chineseName}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
        ({drug.brandNames[0]})
      </div>
      {!intervalCheck.safe && (
        <div style={{ fontSize: '0.6rem', color: 'var(--color-alert-danger-text)', marginTop: 4 }}>
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
