import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { getAgeInMonths, calculateBMI, estimatePercentile, checkGrowthAlert } from '../../utils/growthUtils'
import { getToday } from '../../utils/generateId'

interface GrowthEntryProps {
  open: boolean
  onClose: () => void
}

export default function GrowthEntry({ open, onClose }: GrowthEntryProps) {
  const child = useAppStore((s) => s.getCurrentChild())
  const addGrowthRecord = useHealthStore((s) => s.addGrowthRecord)
  const { showToast } = useToast()

  const [date, setDate] = useState(getToday())
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [headCirc, setHeadCirc] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setDate(getToday())
      setHeight('')
      setWeight('')
      setHeadCirc('')
      setNote('')
    }
  }, [open])

  const ageInMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, date)
  }, [child, date])

  const showHeadCirc = ageInMonths <= 36

  const bmi = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (h > 0 && w > 0) return calculateBMI(h, w)
    return null
  }, [height, weight])

  const percentiles = useMemo(() => {
    if (!child) return { height: null, weight: null, bmi: null }
    const h = parseFloat(height)
    const w = parseFloat(weight)
    return {
      height: h > 0 ? estimatePercentile(child.gender, 'height', ageInMonths, h) : null,
      weight: w > 0 ? estimatePercentile(child.gender, 'weight', ageInMonths, w) : null,
      bmi: bmi ? estimatePercentile(child.gender, 'bmi', ageInMonths, bmi) : null,
    }
  }, [child, height, weight, bmi, ageInMonths])

  const alerts = useMemo(() => {
    if (!child) return []
    const result: string[] = []
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (h > 0) {
      const alert = checkGrowthAlert(child.gender, 'height', ageInMonths, h)
      if (alert === 'low') result.push('身高偏低（低于P3），建议关注')
      if (alert === 'high') result.push('身高偏高（高于P97）')
    }
    if (w > 0) {
      const alert = checkGrowthAlert(child.gender, 'weight', ageInMonths, w)
      if (alert === 'low') result.push('体重偏低（低于P3），建议关注')
      if (alert === 'high') result.push('体重偏高（高于P97），建议关注')
    }
    return result
  }, [child, height, weight, ageInMonths])

  const canSave = parseFloat(height) > 0 || parseFloat(weight) > 0

  const handleSave = async () => {
    if (!child || !canSave) return
    const h = parseFloat(height) || null
    const w = parseFloat(weight) || null
    const hc = parseFloat(headCirc) || null

    try {
      await addGrowthRecord({
        childId: child.childId,
        date,
        ageInMonths,
        height: h,
        weight: w,
        headCircumference: hc,
        bmi: h && w ? calculateBMI(h, w) : null,
        heightPercentile: percentiles.height,
        weightPercentile: percentiles.weight,
        bmiPercentile: percentiles.bmi,
        note,
      })

      showToast('记录已保存')
      setHeight('')
      setWeight('')
      setHeadCirc('')
      setNote('')
      onClose()
    } catch {
      showToast('保存失败，请重试')
    }
  }

  if (!child) return null

  return (
    <Modal open={open} onClose={onClose} title="添加生长记录">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="form-label">测量日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={getToday()} />
          <div className="form-hint">月龄：{ageInMonths}个月</div>
        </div>

        <div>
          <label className="form-label">身高 (cm)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="例如 75.5"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            step="0.1"
            min="30"
            max="200"
          />
          {percentiles.height !== null && (
            <div className="form-hint">百分位：P{percentiles.height}</div>
          )}
        </div>

        <div>
          <label className="form-label">体重 (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="例如 9.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            step="0.1"
            min="1"
            max="100"
          />
          {percentiles.weight !== null && (
            <div className="form-hint">百分位：P{percentiles.weight}</div>
          )}
        </div>

        {showHeadCirc && (
          <div>
            <label className="form-label">头围 (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="例如 46.0"
              value={headCirc}
              onChange={(e) => setHeadCirc(e.target.value)}
              step="0.1"
              min="25"
              max="60"
            />
          </div>
        )}

        {bmi !== null && (
          <div className="form-hint" style={{ background: 'var(--color-health-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            BMI：{bmi}{percentiles.bmi !== null && ` (P${percentiles.bmi})`}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="alert alert-warning">
            {alerts.map((a, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⚠️ {a}</div>)}
            <div style={{ marginTop: 4 }}>建议带孩子到儿保科进行评估</div>
          </div>
        )}

        <div>
          <label className="form-label">备注（可选）</label>
          <input
            type="text"
            placeholder="例如：体检数据"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn-health btn-block"
          onClick={handleSave}
          disabled={!canSave}
          style={{ marginTop: 4 }}
        >
          保存记录
        </button>
      </div>
    </Modal>
  )
}

