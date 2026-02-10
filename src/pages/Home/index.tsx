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
import { Modal } from '../../components/common/Modal'
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
  const [statsModal, setStatsModal] = useState<'tasks' | 'points' | 'spent' | null>(null)
  const planetRef = useRef<HTMLDivElement>(null)

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

  const weekStartStr = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return weekStart.toISOString()
  }, [])

  const weeklyLogs = useMemo(() => {
    return logs.filter((l) => l.childId === childId && l.createdAt >= weekStartStr)
  }, [logs, childId, weekStartStr])

  const taskMap = useMemo(() => {
    const map = new Map<string, { icon: string; name: string }>()
    allTasks.forEach((t) => map.set(t.taskId, { icon: t.icon, name: t.name }))
    return map
  }, [allTasks])

  const weeklyCompletedLogs = useMemo(() => {
    return weeklyLogs.filter((l) => l.type === 'earn' && l.taskId)
  }, [weeklyLogs])

  const weeklyEarnedLogs = useMemo(() => {
    return weeklyLogs.filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0))
  }, [weeklyLogs])

  const weeklySpentLogs = useMemo(() => {
    return weeklyLogs.filter((l) => l.type === 'spend')
  }, [weeklyLogs])

  const pendingExchanges = useMemo(() => exchanges.filter((e) => e.status === 'pending' && e.childId === childId), [exchanges, childId])

  const MAX_DISPLAY = 6

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => !t.completedToday)
  }, [tasks])

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.completedToday)
  }, [tasks])

  const completedCount = completedTasks.length

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

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {getGreeting()}，{child.name}!
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          今天也要加油哦
        </div>
      </div>

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
        }}>⭐</div>
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          opacity: 0.5,
          animation: 'float 3s ease-in-out infinite 1s',
        }}>✨</div>
        <div style={{
          position: 'absolute',
          bottom: 15,
          left: 30,
          opacity: 0.4,
          animation: 'float 3s ease-in-out infinite 0.5s',
        }}>🌟</div>

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

      {/* Weekly stats */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>本周统计</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div className="stat-item" onClick={() => setStatsModal('tasks')} style={{ cursor: 'pointer' }}>
            <div className="stat-item-value" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-primary)' }}>
              {weeklyStats.tasksCompleted}
            </div>
            <div className="stat-item-label">完成任务</div>
          </div>
          <div className="stat-item" onClick={() => setStatsModal('points')} style={{ cursor: 'pointer' }}>
            <div className="stat-item-value" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-success)' }}>
              {weeklyStats.pointsEarned}
            </div>
            <div className="stat-item-label">获得积分</div>
          </div>
          <div className="stat-item" onClick={() => setStatsModal('spent')} style={{ cursor: 'pointer' }}>
            <div className="stat-item-value" style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-info)' }}>
              {weeklyStats.pointsSpent}
            </div>
            <div className="stat-item-label">消费积分</div>
          </div>
        </div>
      </div>

      {/* Today's progress */}
      <div className="card" onClick={() => navigate('/tasks')} style={{ marginBottom: 16, cursor: 'pointer' }}>
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

      {/* Task section - always visible */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontWeight: 700 }}>今日任务</span>
          <button
            onClick={() => navigate('/tasks')}
            style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}
          >
            查看全部 →
          </button>
        </div>

        {tasks.length === 0 ? (
          <div
            className="card"
            onClick={() => navigate('/tasks')}
            style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              暂无任务，请家长在控制台添加
            </div>
          </div>
        ) : (
          <>
            {/* Uncompleted tasks (draggable), limited to MAX_DISPLAY total with completed */}
            {todayTasks.slice(0, MAX_DISPLAY).map((task) => (
              <DraggableTaskCard
                key={task.taskId}
                task={task}
                onComplete={() => handleComplete(task.taskId, task.name, task.points)}
                onDragStart={() => setDraggingId(task.taskId)}
                onDrag={(info) => setDropHighlight(isInDropZone(info))}
                onDragEnd={(info) => handleDragEnd(task.taskId, task.name, task.points, info)}
                isDragging={draggingId === task.taskId}
                onNavigate={() => navigate('/tasks')}
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

            {/* Completed tasks, fill remaining slots up to MAX_DISPLAY */}
            {completedTasks.slice(0, Math.max(0, MAX_DISPLAY - todayTasks.length)).map((task) => (
              <div
                key={task.taskId}
                className="card"
                onClick={() => navigate('/tasks')}
                style={{ opacity: 0.55, cursor: 'pointer' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{task.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      textDecoration: 'line-through',
                      color: 'var(--color-text-secondary)',
                    }}>
                      {task.name}
                    </div>
                  </div>
                  <span style={{ fontSize: '1.1rem', color: 'var(--color-success)' }}>✅</span>
                </div>
              </div>
            ))}
            {tasks.length > MAX_DISPLAY && (
              <button
                onClick={() => navigate('/tasks')}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  fontSize: '0.85rem',
                  color: 'var(--color-primary)',
                  textAlign: 'center',
                }}
              >
                还有 {tasks.length - MAX_DISPLAY} 个任务，查看全部 →
              </button>
            )}
          </>
        )}
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

      {/* Weekly completed tasks modal */}
      <Modal open={statsModal === 'tasks'} onClose={() => setStatsModal(null)} title="本周完成任务">
        <div style={{
          background: 'linear-gradient(135deg, #FFE082 0%, #FFB800 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          textAlign: 'center',
          color: 'white',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{weeklyStats.tasksCompleted}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {weeklyStats.tasksCompleted > 0 ? '太厉害了，继续加油!' : '本周还没有完成任务哦'}
          </div>
        </div>
        <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
          {weeklyCompletedLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-text">快去完成第一个任务吧!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weeklyCompletedLogs.map((log) => {
                const task = taskMap.get(log.taskId!)
                return (
                  <div key={log.logId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--color-primary-light)',
                    borderRadius: 12,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      {task?.icon || '⭐'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {task?.name || log.reason}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {log.emotion && ` · ${log.emotion}`}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem', flexShrink: 0 }}>
                      +{log.points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Weekly earned points modal */}
      <Modal open={statsModal === 'points'} onClose={() => setStatsModal(null)} title="本周获得积分">
        <div style={{
          background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          textAlign: 'center',
          color: 'white',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>+{weeklyStats.pointsEarned}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {weeklyStats.pointsEarned > 0 ? '积分越来越多啦!' : '完成任务就能获得积分'}
          </div>
        </div>
        <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
          {weeklyEarnedLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <div className="empty-state-text">完成任务就能获得积分哦!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weeklyEarnedLogs.map((log) => {
                const task = log.taskId ? taskMap.get(log.taskId) : null
                return (
                  <div key={log.logId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--color-alert-success-bg)',
                    borderRadius: 12,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      {task?.icon || (log.type === 'adjust' ? '🎁' : '⭐')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {log.reason}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {log.emotion && ` · ${log.emotion}`}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem', flexShrink: 0 }}>
                      +{log.points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Weekly spent points modal */}
      <Modal open={statsModal === 'spent'} onClose={() => setStatsModal(null)} title="本周消费积分">
        <div style={{
          background: 'linear-gradient(135deg, #64B5F6 0%, #2196F3 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          textAlign: 'center',
          color: 'white',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{weeklyStats.pointsSpent}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {weeklyStats.pointsSpent > 0 ? '用积分换到了好东西!' : '攒够积分就能兑换奖励'}
          </div>
        </div>
        <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
          {weeklySpentLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛍️</div>
              <div className="empty-state-text">去积分商店看看有什么好东西吧!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weeklySpentLogs.map((log) => (
                <div key={log.logId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--color-alert-info-bg)',
                  borderRadius: 12,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    🎁
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {log.reason}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-info)', fontSize: '0.95rem', flexShrink: 0 }}>
                    -{Math.abs(log.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
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
  onNavigate: () => void
}

function DraggableTaskCard({ task, onComplete, onDragStart, onDrag, onDragEnd, isDragging, onNavigate }: DraggableTaskCardProps) {
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
      onClick={() => { if (!canDrag) onNavigate() }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>{task.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {task.name}
            {stageInfo && (
              <span title={stageInfo.description}>{stageInfo.icon}</span>
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
            ✓
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
