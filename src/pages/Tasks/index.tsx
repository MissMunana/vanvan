import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useBadgeStore } from '../../stores/badgeStore'
import { useToast } from '../../components/common/Toast'
import { PointAnimation } from '../../components/common/PointAnimation'
import { Modal } from '../../components/common/Modal'
import { useSound } from '../../hooks/useSound'
import GraduationCeremony from '../../components/common/GraduationCeremony'
import { CATEGORY_INFO, HABIT_STAGE_INFO, type TaskCategory } from '../../types'
import { BADGE_LIST } from '../../data/badges'
import { AppIcon } from '../../components/common/AppIcon'

const EMOTIONS = [
  { icon: 'Smile', label: '开心' },
  { icon: 'Dumbbell', label: '自豪' },
  { icon: 'SmilePlus', label: '轻松' },
  { icon: 'Meh', label: '没什么感觉' },
]

export default function Tasks() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const incrementCompletionCount = useAppStore((s) => s.incrementCompletionCount)
  const updatePoints = useAppStore((s) => s.updatePoints)
  const allTasks = useTaskStore((s) => s.tasks)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const tasksByCategory = useMemo(() => {
    const activeTasks = allTasks.filter((t) => t.childId === childId && t.isActive)
    const grouped: Record<TaskCategory, typeof activeTasks> = {
      life: [], study: [], manner: [], chore: [],
    }
    activeTasks.forEach((t) => { grouped[t.category].push(t) })
    return grouped
  }, [allTasks, childId])
  const completeTask = useTaskStore((s) => s.completeTask)
  const undoComplete = useTaskStore((s) => s.undoComplete)
  const addLog = usePointStore((s) => s.addLog)
  const checkAndUnlock = useBadgeStore((s) => s.checkAndUnlock)
  const { showToast } = useToast()
  const { play } = useSound()

  const [animTrigger, setAnimTrigger] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')
  const [emotionModal, setEmotionModal] = useState<{ taskId: string; points: number } | null>(null)
  const [graduation, setGraduation] = useState<{ show: boolean; taskName: string }>({ show: false, taskName: '' })

  const handleComplete = useCallback((taskId: string, taskName: string, _basePoints: number) => {
    if (!child) return

    const result = completeTask(taskId)
    const totalPoints = result.earnedPoints + result.bonusPoints

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

    // Play sound
    play('complete')
    if (result.bonusPoints > 0) {
      setTimeout(() => play('applause'), 300)
    }

    // Check badges
    const updatedTasks = useTaskStore.getState().tasks.filter((t) => t.childId === child.childId)
    const updatedLogs = usePointStore.getState().logs
    const unlockedBadgeIds = useBadgeStore.getState().getChildBadges(child.childId).map((b) => b.badgeId)
    const newBadges = checkAndUnlock({
      child,
      tasks: updatedTasks,
      logs: updatedLogs,
      unlockedBadgeIds,
    })
    if (newBadges.length > 0) {
      setTimeout(() => {
        play('badge')
        const badge = BADGE_LIST.find((b) => b.badgeId === newBadges[0])
        if (badge) {
          showToast(`${badge.icon} 获得勋章：${badge.name}！`)
        }
      }, 800)
    }

    // Check graduation
    if (result.graduated) {
      setTimeout(() => {
        setGraduation({ show: true, taskName })
        play('levelup')
      }, 1200)
    }

    let message = `你坚持做到了! +${totalPoints}分`
    if (result.bonusPoints > 0) {
      message = `连续${result.consecutiveDays}天! 额外奖励+${result.bonusPoints}分`
    }
    if (result.stageChanged && !result.graduated) {
      const stageInfo = HABIT_STAGE_INFO[result.newStage]
      message += ` ${stageInfo.icon} 进入${stageInfo.label}!`
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
  }, [child, completeTask, updatePoints, incrementCompletionCount, addLog, showToast, undoComplete, play, checkAndUnlock])

  const handleEmotionSelect = (emotion: string) => {
    if (!child || !emotionModal) return
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
      <GraduationCeremony
        show={graduation.show}
        taskName={graduation.taskName}
        onClose={() => setGraduation({ show: false, taskName: '' })}
      />

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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name={info.icon} size={16} /> {info.label}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {displayTasks.map((task) => {
            const stageInfo = task.stage ? HABIT_STAGE_INFO[task.stage] : null
            return (
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
                  flexShrink: 0,
                }}>
                  <AppIcon name={task.completedToday ? 'CheckCircle' : task.icon} size={28} color={task.completedToday ? '#9E9E9E' : undefined} />
                </div>

                {/* Task info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    textDecoration: task.completedToday ? 'line-through' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {task.name}
                    {stageInfo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }} title={stageInfo.description}>
                        <AppIcon name={stageInfo.icon} size={14} />
                      </span>
                    )}
                  </div>
                  {task.consecutiveDays > 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-warning)',
                      marginTop: 2,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><AppIcon name="Flame" size={14} /> 已连续 {task.consecutiveDays} 天</span>
                      {stageInfo && <span> · {stageInfo.label}</span>}
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
                      <AppIcon name="Check" size={20} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {displayTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          color: 'var(--color-text-secondary)',
        }}>
          <div style={{ marginBottom: 12 }}><AppIcon name="ClipboardList" size={48} color="var(--color-text-secondary)" /></div>
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
              key={e.icon}
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
              <AppIcon name={e.icon} size={28} />
              <span style={{ fontWeight: 600 }}>{e.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
