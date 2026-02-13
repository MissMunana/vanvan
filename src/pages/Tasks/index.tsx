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
import { usePageData } from '../../hooks/usePageData'
import PageLoading from '../../components/common/PageLoading'
const EMOTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '💪', label: '自豪' },
  { emoji: '😌', label: '轻松' },
  { emoji: '🤔', label: '没什么感觉' },
]

export default function Tasks() {
  const { isLoading: pageLoading, error: pageError } = usePageData(['tasks', 'logs', 'badges'])
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
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
  const checkAndUnlock = useBadgeStore((s) => s.checkAndUnlock)
  const { showToast } = useToast()
  const { play } = useSound()

  const [animTrigger, setAnimTrigger] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')
  const [emotionModal, setEmotionModal] = useState<{ taskId: string; points: number } | null>(null)
  const [graduation, setGraduation] = useState<{ show: boolean; taskName: string }>({ show: false, taskName: '' })

  const handleComplete = useCallback(async (taskId: string, taskName: string, _basePoints: number) => {
    if (!child) return
    try {
      const result = await completeTask(taskId)

      // If awaiting parent confirmation, show different message
      if (result.awaitingConfirm) {
        play('complete')
        showToast('已完成! 等待家长确认后获得积分', {
          label: '撤销',
          onClick: async () => {
            await undoComplete(taskId)
            showToast('已撤销')
          },
        })
        return
      }

      const totalPoints = result.earnedPoints + result.bonusPoints

      // Update local stores with server response
      if (result.totalPoints != null) {
        useAppStore.getState().setChildPoints(child.childId, result.totalPoints)
      }
      if (result.pointLog) {
        usePointStore.getState().prependLog(result.pointLog)
      }

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
      const newBadges = await checkAndUnlock({
        child: { ...child, totalPoints: result.totalPoints ?? child.totalPoints },
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
        onClick: async () => {
          await undoComplete(taskId)
          showToast('已撤销')
        },
      })

      // Emotion reflection every 3rd completion (use local completion count from appStore)
      const count = useAppStore.getState().completionCount
      if (count % 3 === 0) {
        setTimeout(() => {
          setEmotionModal({ taskId, points: totalPoints })
        }, 1500)
      }
    } catch {
      showToast('操作失败，请重试')
    }
  }, [child, completeTask, showToast, undoComplete, play, checkAndUnlock])

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
    <PageLoading isLoading={pageLoading} error={pageError}>
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
          className={`chip-filter${activeCategory === 'all' ? ' active' : ''}`}
          onClick={() => setActiveCategory('all')}
          style={activeCategory === 'all' ? { background: 'var(--color-primary)' } : undefined}
        >
          全部
        </button>
        {categories.map(([key, info]) => (
          <button
            key={key}
            className={`chip-filter${activeCategory === key ? ' active' : ''}`}
            onClick={() => setActiveCategory(key)}
            style={activeCategory === key ? { background: 'var(--color-primary)' } : undefined}
          >
            {info.icon} {info.label}
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
                  <span style={{ fontSize: '1.8rem' }}>{task.completedToday ? '✅' : task.icon}</span>
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
                    {task.isFamilyTask && (
                      <span style={{ fontSize: '0.65rem', background: '#E3F2FD', color: '#1565C0', padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>
                        🏠 家庭
                      </span>
                    )}
                    {stageInfo && (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }} title={stageInfo.description}>
                        {stageInfo.icon}
                      </span>
                    )}
                  </div>
                  {task.completedToday && task.requiresParentConfirm && !task.parentConfirmed && (
                    <div style={{ fontSize: '0.75rem', color: '#E65100', marginTop: 2 }}>
                      ⏳ 等待家长确认
                    </div>
                  )}
                  {task.consecutiveDays > 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-warning)',
                      marginTop: 2,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>🔥 已连续 {task.consecutiveDays} 天</span>
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
                      ✓
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {displayTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div>还没有任务哦</div>
          <div className="empty-state-text" style={{ marginTop: 4 }}>让家长在家长控制台添加任务吧</div>
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
              <span style={{ fontSize: '1.8rem' }}>{e.emoji}</span>
              <span style={{ fontWeight: 600 }}>{e.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
    </PageLoading>
  )
}
