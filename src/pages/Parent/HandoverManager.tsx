import { useState, useEffect, useMemo } from 'react'
import { useFamilyStore } from '../../stores/familyStore'
import { useAppStore } from '../../stores/appStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { HANDOVER_PRIORITY_INFO } from '../../types'
import type { HandoverPriority } from '../../types'
import { getToday } from '../../utils/generateId'

export default function HandoverManager() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const handoverLogs = useFamilyStore((s) => s.handoverLogs)
  const fetchHandoverLogs = useFamilyStore((s) => s.fetchHandoverLogs)
  const addHandoverLog = useFamilyStore((s) => s.addHandoverLog)
  const deleteHandoverLog = useFamilyStore((s) => s.deleteHandoverLog)
  const currentMember = useFamilyStore((s) => s.currentMember)
  const { showToast } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [childId, setChildId] = useState(currentChildId || '')
  const [priority, setPriority] = useState<HandoverPriority>('normal')
  const [tasksSummary, setTasksSummary] = useState('')
  const [mealsSummary, setMealsSummary] = useState('')
  const [sleepSummary, setSleepSummary] = useState('')
  const [healthSummary, setHealthSummary] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchHandoverLogs(currentChildId || undefined).catch(() => {})
  }, [fetchHandoverLogs, currentChildId])

  const logsByDate = useMemo(() => {
    const map = new Map<string, typeof handoverLogs>()
    for (const log of handoverLogs) {
      const group = map.get(log.date) || []
      group.push(log)
      map.set(log.date, group)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [handoverLogs])

  const resetForm = () => {
    setChildId(currentChildId || '')
    setPriority('normal')
    setTasksSummary('')
    setMealsSummary('')
    setSleepSummary('')
    setHealthSummary('')
    setSpecialNotes('')
  }

  const handleCreate = async () => {
    if (!childId) {
      showToast('请选择孩子')
      return
    }
    setSaving(true)
    try {
      const today = getToday()
      await addHandoverLog({
        childId,
        authorUserId: currentMember?.userId || '',
        authorName: currentMember?.displayName || '',
        date: today,
        tasksSummary,
        mealsSummary,
        sleepSummary,
        healthSummary,
        specialNotes,
        priority,
      })
      setShowCreate(false)
      resetForm()
      showToast('交接日志已创建')
    } catch {
      showToast('创建失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (logId: string) => {
    try {
      await deleteHandoverLog(logId)
      setDeleteConfirm(null)
      showToast('已删除')
    } catch {
      showToast('删除失败')
    }
  }

  const priorityColor = (p: HandoverPriority) => {
    const info = HANDOVER_PRIORITY_INFO[p]
    return { icon: info.icon, bg: p === 'urgent' ? '#FFEBEE' : p === 'important' ? '#FFF8E1' : '#F5F5F5' }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>交接日志</h3>
        <button
          className="btn btn-primary"
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          onClick={() => { setShowCreate(true); resetForm() }}
        >
          + 写日志
        </button>
      </div>

      {/* Urgent banner */}
      {handoverLogs.some((l) => l.priority === 'urgent') && (
        <div style={{
          background: '#FFEBEE',
          border: '1px solid #EF9A9A',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: '0.8rem',
          color: '#C62828',
          fontWeight: 600,
        }}>
          {HANDOVER_PRIORITY_INFO.urgent.icon} 有紧急交接事项，请注意查看
        </div>
      )}

      {/* Logs by date */}
      {logsByDate.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          暂无交接日志
        </div>
      ) : (
        logsByDate.map(([date, logs]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {date === getToday() ? '今天' : date}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map((log) => {
                const pc = priorityColor(log.priority)
                const child = children.find((c) => c.childId === log.childId)
                return (
                  <div
                    key={log.logId}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      border: log.priority === 'urgent' ? '2px solid #EF5350' : '1px solid var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: pc.bg,
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem' }}>{pc.icon}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.authorName}</span>
                        {child && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                            {child.avatar} {child.name}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '12px 14px' }}>
                      {log.tasksSummary && (
                        <Section label="任务完成" icon="📋" text={log.tasksSummary} />
                      )}
                      {log.mealsSummary && (
                        <Section label="饮食情况" icon="🍽️" text={log.mealsSummary} />
                      )}
                      {log.sleepSummary && (
                        <Section label="睡眠情况" icon="😴" text={log.sleepSummary} />
                      )}
                      {log.healthSummary && (
                        <Section label="健康状况" icon="🏥" text={log.healthSummary} />
                      )}
                      {log.specialNotes && (
                        <Section label="特别备注" icon="📝" text={log.specialNotes} />
                      )}
                      {!log.tasksSummary && !log.mealsSummary && !log.sleepSummary && !log.healthSummary && !log.specialNotes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>无内容</div>
                      )}
                    </div>

                    {/* Actions */}
                    {log.authorUserId === currentMember?.userId && (
                      <div style={{ padding: '0 14px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => setDeleteConfirm(log.logId)}
                          style={{ fontSize: '0.7rem', color: 'var(--color-danger)', padding: '4px 8px' }}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建交接日志">
        <div style={{ padding: 16, maxHeight: '70dvh', overflowY: 'auto' }}>
          {/* Child select */}
          {children.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>选择孩子</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {children.map((c) => (
                  <button
                    key={c.childId}
                    onClick={() => setChildId(c.childId)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: childId === c.childId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: childId === c.childId ? 'var(--color-primary-light)' : 'white',
                      fontSize: '0.85rem',
                    }}
                  >
                    {c.avatar} {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>优先级</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['normal', 'important', 'urgent'] as HandoverPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: priority === p ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: priority === p ? 'var(--color-primary-light)' : 'white',
                    fontSize: '0.8rem',
                  }}
                >
                  {HANDOVER_PRIORITY_INFO[p].icon} {HANDOVER_PRIORITY_INFO[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <TextArea label="📋 任务完成情况" value={tasksSummary} onChange={setTasksSummary} placeholder="今日完成了哪些任务..." />
          <TextArea label="🍽️ 饮食情况" value={mealsSummary} onChange={setMealsSummary} placeholder="早餐/午餐/晚餐/零食..." />
          <TextArea label="😴 睡眠情况" value={sleepSummary} onChange={setSleepSummary} placeholder="午睡/入睡时间/睡眠质量..." />
          <TextArea label="🏥 健康状况" value={healthSummary} onChange={setHealthSummary} placeholder="体温/用药/症状..." />
          <TextArea label="📝 特别备注" value={specialNotes} onChange={setSpecialNotes} placeholder="需要特别注意的事项..." />

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? '保存中...' : '提交日志'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="确认删除">
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>确定要删除这条交接日志吗？</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>取消</button>
            <button
              className="btn"
              style={{ flex: 1, background: 'var(--color-danger)', color: 'white' }}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Section({ label, icon, text }: { label: string; icon: string; text: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          fontSize: '0.85rem',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
