import { useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useBadgeStore } from '../../stores/badgeStore'
import { useToast } from '../../components/common/Toast'
import { PointAnimation } from '../../components/common/PointAnimation'
import { useSound } from '../../hooks/useSound'
import GraduationCeremony from '../../components/common/GraduationCeremony'
import { HABIT_STAGE_INFO } from '../../types'
import { BADGE_LIST } from '../../data/badges'
import { AppIcon } from '../../components/common/AppIcon'

export default function Home() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const incrementCompletionCount = useAppStore((s) => s.incrementCompletionCount)
  const updatePoints = useAppStore((s) => s.updatePoints)
  const allTasks = useTaskStore((s) => s.tasks)
  const completeTask = useTaskStore((s) => s.completeTask)
  const undoComplete = useTaskStore((s) => s.undoComplete)
  const logs = usePointStore((s) => s.logs)
  const addLog = usePointStore((s) => s.addLog)
  const exchanges = useExchangeStore((s) => s.exchanges)
  const checkAndUnlock = useBadgeStore((s) => s.checkAndUnlock)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { play } = useSound()
  const [animTrigger, setAnimTrigger] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropHighlight, setDropHighlight] = useState(false)
  const [graduation, setGraduation] = useState<{ show: boolean; taskName: string }>({ show: false, taskName: '' })
  const [showChildSwitcher, setShowChildSwitcher] = useState(false)
  const planetRef = useRef<HTMLDivElement>(null)
  const setCurrentChild = useAppStore((s) => s.setCurrentChild)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const tasks = useMemo(() => allTasks.filter((t) => t.childId === childId && t.isActive), [allTasks, childId])

  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString()
    const weekLogs = logs.filter((l) => l.childId === childId && l.createdAt >= weekStartStr)
    return {
      tasksCompleted: weekLogs.filter((l) => l.type === 'earn' && l.taskId).length,
      pointsEarned: weekLogs.filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0)).reduce((sum, l) => sum + l.points, 0),
      pointsSpent: weekLogs.filter((l) => l.type === 'spend').reduce((sum, l) => sum + Math.abs(l.points), 0),
    }
  }, [logs, childId])

  const pendingExchanges = useMemo(() => exchanges.filter((e) => e.status === 'pending' && e.childId === childId), [exchanges, childId])

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => !t.completedToday).slice(0, 4)
  }, [tasks])

  const completedCount = tasks.filter((t) => t.completedToday).length

  const handleComplete = useCallback((taskId: string, taskName: string, _basePoints: number) => {
    if (!child) return
    const result = completeTask(taskId)
    const totalPoints = result.earnedPoints + result.bonusPoints
    updatePoints(child.childId, totalPoints)
    incrementCompletionCount()
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
  }, [child, completeTask, updatePoints, incrementCompletionCount, addLog, showToast, undoComplete, play, checkAndUnlock])

  const isInDropZone = useCallback((info: PanInfo) => {
    if (!planetRef.current) return false
    const rect = planetRef.current.getBoundingClientRect()
    const isYoung = child?.ageGroup === '3-5'
    if (isYoung) {
      return info.point.y < rect.bottom + 50
    }
    return (
      info.point.x >= rect.left - 20 &&
      info.point.x <= rect.right + 20 &&
      info.point.y >= rect.top - 20 &&
      info.point.y <= rect.bottom + 20
    )
  }, [child?.ageGroup])

  const handleDragEnd = useCallback((taskId: string, taskName: string, points: number, info: PanInfo) => {
    setDraggingId(null)
    setDropHighlight(false)
    if (isInDropZone(info)) {
      handleComplete(taskId, taskName, points)
      play('coin')
    }
  }, [isInDropZone, handleComplete, play])

  if (!child) return null

  return (
    <div className="page">
      <PointAnimation trigger={animTrigger} points={lastPoints} />
      <GraduationCeremony
        show={graduation.show}
        taskName={graduation.taskName}
        onClose={() => setGraduation({ show: false, taskName: '' })}
      />

      {/* Header with avatar and greeting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: children.length > 1 ? 'pointer' : 'default' }}
          onClick={() => children.length > 1 && setShowChildSwitcher(!showChildSwitcher)}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AppIcon name={child.avatar} size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              {getGreeting()}，{child.name}!
              {children.length > 1 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  {showChildSwitcher ? '▲' : '▼'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              今天也要加油哦
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/parent')}
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.04)',
          }}
        >
          家长
        </button>
      </div>

      {/* Child switcher dropdown */}
      {showChildSwitcher && children.length > 1 && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          {children.map((c) => (
            <button
              key={c.childId}
              onClick={() => {
                setCurrentChild(c.childId)
                setShowChildSwitcher(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                background: c.childId === currentChildId ? 'var(--color-primary-light)' : 'white',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <AppIcon name={c.avatar} size={20} />
              <span style={{ flex: 1, fontWeight: c.childId === currentChildId ? 700 : 400 }}>{c.name}</span>
              {c.childId === currentChildId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>当前</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Points Planet (Drop Target) */}
      <motion.div
        ref={planetRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          boxShadow: dropHighlight
            ? '0 8px 40px rgba(76,175,80,0.5)'
            : '0 8px 32px rgba(255,184,0,0.3)',
        }}
        style={{
          background: dropHighlight
            ? 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)'
            : 'linear-gradient(135deg, #FFE082 0%, #FFB800 50%, #FF9800 100%)',
          borderRadius: 24,
          padding: '28px 20px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Floating decorations */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 15,
          opacity: 0.6,
          animation: 'float 3s ease-in-out infinite',
        }}><AppIcon name="Star" size={24} color="rgba(255,255,255,0.9)" /></div>
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          opacity: 0.5,
          animation: 'float 3s ease-in-out infinite 1s',
        }}><AppIcon name="Sparkles" size={20} color="rgba(255,255,255,0.9)" /></div>
        <div style={{
          position: 'absolute',
          bottom: 15,
          left: 30,
          opacity: 0.4,
          animation: 'float 3s ease-in-out infinite 0.5s',
        }}><AppIcon name="Star" size={16} color="rgba(255,255,255,0.9)" /></div>

        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: 4 }}>
          {draggingId ? '松手即可加分!' : '我的积分'}
        </div>
        <motion.div
          key={child.totalPoints}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {child.totalPoints}
        </motion.div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 4 }}>
          本周获得 {weeklyStats.pointsEarned} 分
        </div>
      </motion.div>

      {/* Today's progress */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ fontWeight: 700 }}>今日进度</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            {completedCount}/{tasks.length}
          </span>
        </div>
        <div style={{
          height: 8,
          background: 'var(--color-primary-light)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'var(--color-primary)',
              borderRadius: 4,
            }}
          />
        </div>
        {completedCount === tasks.length && tasks.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: 10,
            fontSize: '0.9rem',
            color: 'var(--color-success)',
            fontWeight: 600,
          }}>
            太棒了! 今天的任务全部完成!
          </div>
        )}
      </div>

      {/* Pending tasks with drag support */}
      {todayTasks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontWeight: 700 }}>待完成任务</span>
            <button
              onClick={() => navigate('/tasks')}
              style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}
            >
              查看全部 →
            </button>
          </div>
          {todayTasks.map((task) => (
            <DraggableTaskCard
              key={task.taskId}
              task={task}
              onComplete={() => handleComplete(task.taskId, task.name, task.points)}
              onDragStart={() => setDraggingId(task.taskId)}
              onDrag={(info) => setDropHighlight(isInDropZone(info))}
              onDragEnd={(info) => handleDragEnd(task.taskId, task.name, task.points, info)}
              isDragging={draggingId === task.taskId}
            />
          ))}
          {draggingId && (
            <div style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: 4,
            }}>
              拖到积分池即可加分
            </div>
          )}
        </div>
      )}

      {/* Weekly stats */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>本周统计</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {weeklyStats.tasksCompleted}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>完成任务</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {weeklyStats.pointsEarned}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>获得积分</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-info)' }}>
              {weeklyStats.pointsSpent}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>消费积分</div>
          </div>
        </div>
      </div>

      {/* Pending exchanges notification */}
      {pendingExchanges.length > 0 && (
        <div className="card" style={{
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary)',
          marginTop: 12,
        }}>
          <div style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            你有 {pendingExchanges.length} 个兑换申请等待家长确认
          </div>
        </div>
      )}
    </div>
  )
}

interface DraggableTaskCardProps {
  task: { taskId: string; icon: string; name: string; points: number; stage?: string; consecutiveDays: number }
  onComplete: () => void
  onDragStart: () => void
  onDrag: (info: PanInfo) => void
  onDragEnd: (info: PanInfo) => void
  isDragging: boolean
}

function DraggableTaskCard({ task, onComplete, onDragStart, onDrag, onDragEnd, isDragging }: DraggableTaskCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useTransform([x, y], ([latestX, latestY]: number[]) => {
    const dist = Math.sqrt(latestX * latestX + latestY * latestY)
    return Math.min(1.15, 1 + dist / 1000)
  })
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [canDrag, setCanDrag] = useState(false)

  const stageInfo = task.stage ? HABIT_STAGE_INFO[task.stage as keyof typeof HABIT_STAGE_INFO] : null

  return (
    <motion.div
      style={{
        x,
        y,
        scale: isDragging ? scale : 1,
        zIndex: isDragging ? 100 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      drag={canDrag}
      dragSnapToOrigin
      dragElastic={0.8}
      onPointerDown={() => {
        longPressRef.current = setTimeout(() => {
          setCanDrag(true)
          onDragStart()
          if (navigator.vibrate) navigator.vibrate(10)
        }, 400)
      }}
      onPointerUp={() => {
        if (longPressRef.current) clearTimeout(longPressRef.current)
        setTimeout(() => setCanDrag(false), 100)
      }}
      onPointerCancel={() => {
        if (longPressRef.current) clearTimeout(longPressRef.current)
        setCanDrag(false)
      }}
      onDrag={(_e, info) => onDrag(info)}
      onDragEnd={(_e, info) => {
        onDragEnd(info)
        setTimeout(() => setCanDrag(false), 100)
      }}
      className="card"
      whileTap={canDrag ? undefined : { scale: 0.97 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
      }}>
        <AppIcon name={task.icon} size={24} color="var(--color-primary)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {task.name}
            {stageInfo && (
              <span title={stageInfo.description}><AppIcon name={stageInfo.icon} size={14} /></span>
            )}
          </div>
          {task.consecutiveDays > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: 2 }}>
              {task.consecutiveDays}天连续
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            +{task.points}
          </span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation()
              onComplete()
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(255,184,0,0.4)',
            }}
          >
            <AppIcon name="Check" size={18} color="white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
