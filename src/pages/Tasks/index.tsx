import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useToast } from '../../components/common/Toast'
import { PointAnimation } from '../../components/common/PointAnimation'
import { Modal } from '../../components/common/Modal'
import { CATEGORY_INFO, type TaskCategory } from '../../types'

const EMOTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '💪', label: '自豪' },
  { emoji: '😌', label: '轻松' },
  { emoji: '🤔', label: '没什么感觉' },
]

export default function Tasks() {
  const child = useAppStore((s) => s.getCurrentChild())
  const incrementCompletionCount = useAppStore((s) => s.incrementCompletionCount)
  const updatePoints = useAppStore((s) => s.updatePoints)
  const tasksByCategory = useTaskStore((s) => s.getChildTasksByCategory(child?.childId || ''))
  const completeTask = useTaskStore((s) => s.completeTask)
  const undoComplete = useTaskStore((s) => s.undoComplete)
  const addLog = usePointStore((s) => s.addLog)
  const { showToast } = useToast()

  const [animTrigger, setAnimTrigger] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')
  const [emotionModal, setEmotionModal] = useState<{ taskId: string; points: number } | null>(null)

  const handleComplete = useCallback((taskId: string, taskName: string, points: number) => {
    if (!child) return

    const { bonusPoints, consecutiveDays } = completeTask(taskId)
    const totalPoints = points + bonusPoints

    updatePoints(child.childId, totalPoints)

    const count = incrementCompletionCount()

    addLog({
      childId: child.childId,
      taskId,
      type: 'earn',
      points: totalPoints,
      reason: `完成任务: ${taskName}`,
      emotion: null,
      operator: 'child',
    })

    setLastPoints(totalPoints)
    setAnimTrigger((t) => t + 1)

    let message = `你坚持做到了! +${totalPoints}分`
    if (bonusPoints > 0) {
      message = `连续${consecutiveDays}天! 额外奖励+${bonusPoints}分 🎉`
    }

    showToast(message, {
      label: '撤销',
      onClick: () => {
        undoComplete(taskId)
        updatePoints(child.childId, -totalPoints)
        showToast('已撤销')
      },
    })

    // Emotion reflection every 3rd completion
    if (count % 3 === 0) {
      setTimeout(() => {
        setEmotionModal({ taskId, points: totalPoints })
      }, 1500)
    }
  }, [child, completeTask, updatePoints, incrementCompletionCount, addLog, showToast, undoComplete])

  const handleEmotionSelect = (emotion: string) => {
    if (!child || !emotionModal) return
    // Update the last log with emotion
    const logs = usePointStore.getState().logs
    const lastLog = logs.find((l) => l.taskId === emotionModal.taskId)
    if (lastLog) {
      const updatedLogs = logs.map((l) =>
        l.logId === lastLog.logId ? { ...l, emotion } : l
      )
      usePointStore.setState({ logs: updatedLogs })
    }
    showToast(`你感到${emotion}，真棒!`)
    setEmotionModal(null)
  }

  if (!child) return null

  const categories = Object.entries(CATEGORY_INFO) as [TaskCategory, { label: string; icon: string }][]
  const displayTasks = activeCategory === 'all'
    ? Object.values(tasksByCategory).flat()
    : tasksByCategory[activeCategory] || []

  return (
    <div className="page">
      <PointAnimation trigger={animTrigger} points={lastPoints} />

      <h2 className="page-title">今日任务</h2>

      {/* Category filter */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginBottom: 16,
        paddingBottom: 4,
      }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.85rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            background: activeCategory === 'all' ? 'var(--color-primary)' : 'white',
            color: activeCategory === 'all' ? 'white' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          全部
        </button>
        {categories.map(([key, info]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: activeCategory === key ? 'var(--color-primary)' : 'white',
              color: activeCategory === key ? 'white' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            {info.icon} {info.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {displayTasks.map((task) => (
            <motion.div
              key={task.taskId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                opacity: task.completedToday ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Task icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: task.completedToday ? '#f0f0f0' : 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}>
                {task.completedToday ? '✅' : task.icon}
              </div>

              {/* Task info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: task.completedToday ? 'line-through' : 'none',
                }}>
                  {task.name}
                </div>
                {task.consecutiveDays > 0 && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-warning)',
                    marginTop: 2,
                  }}>
                    🔥 已连续 {task.consecutiveDays} 天
                  </div>
                )}
              </div>

              {/* Points and complete button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontSize: '1rem',
                }}>
                  +{task.points}
                </span>
                {!task.completedToday && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleComplete(task.taskId, task.name, task.points)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(255,184,0,0.4)',
                    }}
                  >
                    ✓
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {displayTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          color: 'var(--color-text-secondary)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <div>还没有任务哦</div>
          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>让家长在家长控制台添加任务吧</div>
        </div>
      )}

      {/* Emotion reflection modal */}
      <Modal
        open={!!emotionModal}
        onClose={() => setEmotionModal(null)}
        title="做完这件事你的感觉怎么样?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {EMOTIONS.map((e) => (
            <button
              key={e.emoji}
              onClick={() => handleEmotionSelect(e.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'white',
                fontSize: '1rem',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{e.emoji}</span>
              <span style={{ fontWeight: 600 }}>{e.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
