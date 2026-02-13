import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useEmotionStore } from '../../stores/emotionStore'
import { useToast } from '../../components/common/Toast'
import { getToday } from '../../utils/generateId'
import { CONFLICT_STATUS_INFO } from '../../types'
import { FEELING_OPTIONS } from '../../data/emotionData'

type WizardStep = 0 | 1 | 2 | 3 // 0=list, 1=calm, 2=connect, 3=solve

export default function ConflictDebrief() {
  const child = useAppStore((s) => s.getCurrentChild())
  const conflictRecords = useEmotionStore((s) => s.conflictRecords)
  const addConflict = useEmotionStore((s) => s.addConflict)
  const updateConflict = useEmotionStore((s) => s.updateConflict)
  const { showToast } = useToast()

  const [step, setStep] = useState<WizardStep>(0)
  const [calmChecked, setCalmChecked] = useState(false)
  const [description, setDescription] = useState('')
  const [childFeeling, setChildFeeling] = useState('')
  const [parentFeeling, setParentFeeling] = useState('')
  const [agreements, setAgreements] = useState([''])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!child) return null

  const resetWizard = () => {
    setStep(0)
    setCalmChecked(false)
    setDescription('')
    setChildFeeling('')
    setParentFeeling('')
    setAgreements([''])
    setNote('')
  }

  const handleSubmit = async () => {
    if (!description || !childFeeling || !parentFeeling || agreements.filter(Boolean).length === 0) {
      showToast('请填写完整信息')
      return
    }
    setSaving(true)
    try {
      await addConflict({
        childId: child.childId,
        date: getToday(),
        description,
        childFeeling,
        parentFeeling,
        agreements: agreements.filter(Boolean),
        status: 'recorded',
        note: note || '',
      })
      showToast('冲突复盘已保存')
      resetWizard()
    } catch {
      showToast('保存失败，请重试')
    }
    setSaving(false)
  }

  const handleResolve = async (conflictId: string) => {
    try {
      await updateConflict(conflictId, { status: 'resolved' })
      showToast('已标记为已解决')
    } catch {
      showToast('操作失败')
    }
  }

  const records = conflictRecords.filter((r) => r.childId === child.childId)

  const stepLabels = ['', '冷静', '连接', '解决']
  const stepColors = ['', '#FF9800', '#A8A8E6', '#4CAF50']

  return (
    <div>
      {/* Wizard or list view */}
      {step === 0 ? (
        <div>
          {/* New conflict button */}
          <button
            onClick={() => setStep(1)}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
              background: '#A8A8E6', color: '#fff', fontSize: '0.9rem', fontWeight: 600,
              cursor: 'pointer', marginBottom: 16,
            }}
          >
            🤝 开始冲突复盘
          </button>

          {/* History */}
          {records.length > 0 ? (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>历史记录</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {records.map((record) => {
                  const statusInfo = CONFLICT_STATUS_INFO[record.status]
                  const isExpanded = expandedId === record.conflictId
                  return (
                    <div
                      key={record.conflictId}
                      style={{
                        background: 'var(--color-surface)', borderRadius: 12, padding: 12,
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : record.conflictId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.85rem', fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {record.description}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                            {record.date}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10,
                          background: `${statusInfo.color}15`, color: statusInfo.color,
                          fontWeight: 600,
                        }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10, fontSize: '0.82rem' }}>
                              <div style={{ marginBottom: 6 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>孩子感受：</span>{record.childFeeling}
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>家长感受：</span>{record.parentFeeling}
                              </div>
                              {record.agreements.length > 0 && (
                                <div style={{ marginBottom: 6 }}>
                                  <span style={{ color: 'var(--color-text-secondary)' }}>协议：</span>
                                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                    {record.agreements.map((a, i) => (
                                      <li key={i} style={{ marginBottom: 2 }}>{a}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {record.note && (
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                                  备注：{record.note}
                                </div>
                              )}
                              {record.status !== 'resolved' && (
                                <button
                                  onClick={() => handleResolve(record.conflictId)}
                                  style={{
                                    marginTop: 8, padding: '4px 14px', borderRadius: 8,
                                    border: '1px solid #4CAF5040', background: 'none',
                                    color: '#4CAF50', fontSize: '0.8rem', cursor: 'pointer',
                                  }}
                                >
                                  ✓ 标记为已解决
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🕊️</div>
              <div style={{ fontSize: '0.85rem' }}>还没有冲突复盘记录</div>
              <div style={{ fontSize: '0.78rem', marginTop: 4 }}>冲突不可怕，复盘让我们更亲近</div>
            </div>
          )}
        </div>
      ) : (
        /* Wizard steps */
        <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 16 }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700,
                  background: step >= s ? stepColors[s] : 'var(--color-bg)',
                  color: step >= s ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s',
                }}>
                  {s}
                </div>
                <span style={{ fontSize: '0.75rem', color: step >= s ? stepColors[s] : 'var(--color-text-secondary)', fontWeight: step === s ? 600 : 400 }}>
                  {stepLabels[s]}
                </span>
                {s < 3 && <span style={{ color: 'var(--color-border)', margin: '0 2px' }}>→</span>}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Calm down */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🧘</div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>先冷静下来</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    在冲突后至少等待15分钟再进行复盘。
                    深呼吸，让情绪平复，才能有效地沟通。
                  </div>
                </div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: 12, background: 'var(--color-bg)', borderRadius: 10, cursor: 'pointer',
                  marginBottom: 12,
                }}>
                  <input
                    type="checkbox"
                    checked={calmChecked}
                    onChange={(e) => setCalmChecked(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>我现在已经平静下来了</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetWizard} style={btnOutline}>取消</button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!calmChecked}
                    style={{ ...btnPrimary, opacity: calmChecked ? 1 : 0.4 }}
                  >
                    下一步
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Connect */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12, textAlign: 'center' }}>
                  💬 说说发生了什么
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>发生了什么？</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要描述冲突的情况..."
                    style={textareaStyle}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>孩子的感受</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {FEELING_OPTIONS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setChildFeeling(childFeeling === f ? '' : f)}
                        style={{
                          padding: '3px 10px', borderRadius: 14, fontSize: '0.78rem',
                          border: childFeeling === f ? '1.5px solid #A8A8E6' : '1.5px solid var(--color-border)',
                          background: childFeeling === f ? '#A8A8E615' : 'var(--color-bg)',
                          color: childFeeling === f ? '#A8A8E6' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>你的感受</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {FEELING_OPTIONS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setParentFeeling(parentFeeling === f ? '' : f)}
                        style={{
                          padding: '3px 10px', borderRadius: 14, fontSize: '0.78rem',
                          border: parentFeeling === f ? '1.5px solid #A8A8E6' : '1.5px solid var(--color-border)',
                          background: parentFeeling === f ? '#A8A8E615' : 'var(--color-bg)',
                          color: parentFeeling === f ? '#A8A8E6' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(1)} style={btnOutline}>上一步</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!description || !childFeeling || !parentFeeling}
                    style={{ ...btnPrimary, opacity: description && childFeeling && parentFeeling ? 1 : 0.4 }}
                  >
                    下一步
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Solve */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12, textAlign: 'center' }}>
                  🎯 下次我们可以怎么做？
                </div>
                {agreements.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{i + 1}.</span>
                    <input
                      type="text"
                      value={a}
                      onChange={(e) => {
                        const next = [...agreements]
                        next[i] = e.target.value
                        setAgreements(next)
                      }}
                      placeholder="例如：先深呼吸，再说出自己的感受"
                      style={inputStyle}
                    />
                    {agreements.length > 1 && (
                      <button
                        onClick={() => setAgreements(agreements.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {agreements.length < 3 && (
                  <button
                    onClick={() => setAgreements([...agreements, ''])}
                    style={{ background: 'none', border: 'none', color: '#A8A8E6', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginBottom: 10 }}
                  >
                    + 添加一条协议
                  </button>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>备注（可选）</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="其他想记录的..."
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStep(2)} style={btnOutline}>上一步</button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || agreements.filter(Boolean).length === 0}
                    style={{ ...btnPrimary, opacity: agreements.filter(Boolean).length > 0 ? 1 : 0.4 }}
                  >
                    {saving ? '保存中...' : '完成记录'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Shared styles
const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 500, marginBottom: 6, display: 'block', color: 'var(--color-text)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--color-border)',
  fontSize: '0.85rem', background: 'var(--color-bg)', resize: 'none', minHeight: 60,
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
  fontSize: '0.85rem', background: 'var(--color-bg)',
}

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
  background: '#A8A8E6', color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
}

const btnOutline: React.CSSProperties = {
  flex: 0, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--color-border)',
  background: 'none', color: 'var(--color-text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
}
