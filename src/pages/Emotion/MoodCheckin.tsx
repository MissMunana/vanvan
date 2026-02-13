import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useEmotionStore } from '../../stores/emotionStore'
import { useToast } from '../../components/common/Toast'
import type { MoodValue, EmotionAgeGroup } from '../../types'
import { MOOD_VALUE_INFO } from '../../types'
import {
  MOOD_OPTIONS_3_5, MOOD_OPTIONS_6_8, MASCOT_RESPONSES,
  EMOTION_FAMILIES, REASON_TAGS_6_8,
  getEmotionAgeGroup,
} from '../../data/emotionData'
import { getToday } from '../../utils/generateId'

export default function MoodCheckin() {
  const child = useAppStore((s) => s.getCurrentChild())
  const moodRecords = useEmotionStore((s) => s.moodRecords)
  const addMood = useEmotionStore((s) => s.addMood)
  const deleteMood = useEmotionStore((s) => s.deleteMood)
  const { showToast } = useToast()

  const today = getToday()
  const todayMood = moodRecords.find((r) => r.date === today && r.childId === child?.childId)
  const ageGroup: EmotionAgeGroup = child?.birthday ? getEmotionAgeGroup(child.birthday) : '6-8'

  // Selection state
  const [selected, setSelected] = useState<{ value: MoodValue; emoji: string; label: string } | null>(null)
  const [mascotMsg, setMascotMsg] = useState<string | null>(null)
  const [selectedFamily, setSelectedFamily] = useState<MoodValue | null>(null)
  const [subEmotion, setSubEmotion] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset when age group or child changes
  useEffect(() => {
    setSelected(null)
    setMascotMsg(null)
    setSelectedFamily(null)
    setSubEmotion(null)
    setReason('')
    setJournal('')
  }, [child?.childId])

  if (!child) return null

  const handleSelect3_5 = async (opt: typeof MOOD_OPTIONS_3_5[0]) => {
    setSelected(opt)
    setMascotMsg(MASCOT_RESPONSES[opt.value])
    setSaving(true)
    try {
      await addMood({
        childId: child.childId,
        date: today,
        moodValue: opt.value,
        moodEmoji: opt.emoji,
        moodLabel: opt.label,
        subEmotion: null,
        reason: null,
        journalEntry: null,
        ageGroup: '3-5',
      })
      showToast('心情已记录！')
    } catch {
      showToast('保存失败，请重试')
    }
    setSaving(false)
  }

  const handleSubmit6_8 = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await addMood({
        childId: child.childId,
        date: today,
        moodValue: selected.value,
        moodEmoji: selected.emoji,
        moodLabel: selected.label,
        subEmotion: null,
        reason: reason || null,
        journalEntry: null,
        ageGroup: '6-8',
      })
      showToast('心情已记录！')
      setSelected(null)
      setReason('')
    } catch {
      showToast('保存失败，请重试')
    }
    setSaving(false)
  }

  const handleSubmit9_12 = async () => {
    if (!selectedFamily) return
    const family = EMOTION_FAMILIES.find((f) => f.value === selectedFamily)
    if (!family) return
    setSaving(true)
    try {
      await addMood({
        childId: child.childId,
        date: today,
        moodValue: selectedFamily,
        moodEmoji: family.emoji,
        moodLabel: subEmotion
          ? family.subEmotions.find((s) => s.value === subEmotion)?.label || family.label
          : family.label,
        subEmotion: subEmotion,
        reason: null,
        journalEntry: journal || null,
        ageGroup: '9-12',
      })
      showToast('心情已记录！')
      setSelectedFamily(null)
      setSubEmotion(null)
      setJournal('')
    } catch {
      showToast('保存失败，请重试')
    }
    setSaving(false)
  }

  const recentMoods = moodRecords.filter((r) => r.childId === child.childId).slice(0, 14)

  return (
    <div>
      {/* Today's check-in */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
      }}>
        {todayMood && !selected && !selectedFamily ? (
          /* Already checked in today */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              今日心情已记录
            </div>
            <div style={{ fontSize: '3rem', marginBottom: 4 }}>{todayMood.moodEmoji}</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{todayMood.moodLabel}</div>
            {todayMood.subEmotion && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {todayMood.subEmotion}
              </div>
            )}
            {todayMood.reason && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {todayMood.reason}
              </div>
            )}
            <button
              disabled={deleting}
              onClick={async () => {
                setDeleting(true)
                try {
                  await deleteMood(todayMood.recordId)
                  setSelected(null)
                  setSelectedFamily(null)
                } catch {
                  showToast('删除失败，请重试')
                } finally {
                  setDeleting(false)
                }
              }}
              style={{
                marginTop: 10, background: 'none', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '4px 14px', fontSize: '0.8rem',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              {deleting ? '删除中...' : '重新记录'}
            </button>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, textAlign: 'center',
              color: 'var(--color-text)',
            }}>
              {ageGroup === '3-5' ? '今天你的心情像哪个小动物？' :
               ageGroup === '6-8' ? '今天你的心情怎么样？' :
               '用一个词描述今天的心情'}
            </div>

            {/* 3-5 yo: Animal buttons */}
            {ageGroup === '3-5' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {MOOD_OPTIONS_3_5.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelect3_5(opt)}
                      disabled={saving}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        background: selected?.value === opt.value ? `${MOOD_VALUE_INFO[opt.value].color}20` : 'var(--color-bg)',
                        border: selected?.value === opt.value ? `2px solid ${MOOD_VALUE_INFO[opt.value].color}` : '2px solid transparent',
                        borderRadius: 14, padding: '12px 10px', cursor: 'pointer',
                        minWidth: 56, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '2.2rem' }}>{opt.emoji}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {mascotMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 14, textAlign: 'center', padding: 12,
                        background: '#A8A8E615', borderRadius: 12,
                        fontSize: '0.9rem', color: 'var(--color-text)',
                      }}
                    >
                      {mascotMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 6-8 yo: Emoji row + optional reasons */}
            {ageGroup === '6-8' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {MOOD_OPTIONS_6_8.map((opt, i) => (
                    <motion.button
                      key={`${opt.value}-${i}`}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelected(opt)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        background: selected === opt ? `${MOOD_VALUE_INFO[opt.value].color}20` : 'var(--color-bg)',
                        border: selected === opt ? `2px solid ${MOOD_VALUE_INFO[opt.value].color}` : '2px solid transparent',
                        borderRadius: 12, padding: '10px 8px', cursor: 'pointer',
                        minWidth: 50, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.8rem' }}>{opt.emoji}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          是什么让你这样呢？（可选）
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {REASON_TAGS_6_8.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setReason(reason === tag ? '' : tag)}
                              style={{
                                padding: '3px 10px', borderRadius: 14, fontSize: '0.75rem',
                                border: reason === tag ? '1.5px solid #A8A8E6' : '1.5px solid var(--color-border)',
                                background: reason === tag ? '#A8A8E615' : 'var(--color-bg)',
                                color: reason === tag ? '#A8A8E6' : 'var(--color-text-secondary)',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleSubmit6_8}
                          disabled={saving}
                          style={{
                            marginTop: 12, width: '100%', padding: '8px 0',
                            borderRadius: 10, border: 'none',
                            background: '#A8A8E6', color: '#fff',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {saving ? '保存中...' : '记录心情'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 9-12 yo: Emotion families → sub-emotions → journal */}
            {ageGroup === '9-12' && (
              <div>
                {/* Family selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {EMOTION_FAMILIES.map((fam) => (
                    <motion.button
                      key={fam.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setSelectedFamily(fam.value); setSubEmotion(null) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        background: selectedFamily === fam.value ? `${MOOD_VALUE_INFO[fam.value].color}20` : 'var(--color-bg)',
                        border: selectedFamily === fam.value ? `2px solid ${MOOD_VALUE_INFO[fam.value].color}` : '2px solid transparent',
                        borderRadius: 12, padding: '10px 10px', cursor: 'pointer',
                        minWidth: 54, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.6rem' }}>{fam.emoji}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>{fam.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Sub-emotions */}
                <AnimatePresence>
                  {selectedFamily && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          更具体地说？
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {EMOTION_FAMILIES.find((f) => f.value === selectedFamily)?.subEmotions.map((sub) => (
                            <button
                              key={sub.value}
                              onClick={() => setSubEmotion(subEmotion === sub.value ? null : sub.value)}
                              style={{
                                padding: '4px 12px', borderRadius: 14, fontSize: '0.8rem',
                                border: subEmotion === sub.value ? `1.5px solid ${MOOD_VALUE_INFO[selectedFamily].color}` : '1.5px solid var(--color-border)',
                                background: subEmotion === sub.value ? `${MOOD_VALUE_INFO[selectedFamily].color}15` : 'var(--color-bg)',
                                color: subEmotion === sub.value ? MOOD_VALUE_INFO[selectedFamily].color : 'var(--color-text-secondary)',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={journal}
                          onChange={(e) => setJournal(e.target.value.slice(0, 100))}
                          placeholder="想写一句话记录今天吗？（可选）"
                          style={{
                            marginTop: 10, width: '100%', padding: 10, borderRadius: 10,
                            border: '1px solid var(--color-border)', fontSize: '0.85rem',
                            background: 'var(--color-bg)', resize: 'none', minHeight: 50,
                          }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                          {journal.length}/100
                        </div>
                        <button
                          onClick={handleSubmit9_12}
                          disabled={saving}
                          style={{
                            marginTop: 6, width: '100%', padding: '8px 0',
                            borderRadius: 10, border: 'none',
                            background: '#A8A8E6', color: '#fff',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {saving ? '保存中...' : '记录心情'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mood history */}
      {recentMoods.length > 0 && (
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>最近记录</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentMoods.map((record) => (
              <div
                key={record.recordId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--color-surface)', borderRadius: 10, padding: '8px 12px',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{record.moodEmoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{record.moodLabel}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    {record.date}
                    {record.reason && ` · ${record.reason}`}
                    {record.journalEntry && ` · ${record.journalEntry}`}
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: MOOD_VALUE_INFO[record.moodValue].color, flexShrink: 0,
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
