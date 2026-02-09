import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useToast } from '../../components/common/Toast'
import { PointAnimation } from '../../components/common/PointAnimation'

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
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [animTrigger, setAnimTrigger] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)

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

  const handleComplete = useCallback((taskId: string, taskName: string, points: number) => {
    if (!child) return
    const { bonusPoints, consecutiveDays } = completeTask(taskId)
    const totalPoints = points + bonusPoints
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
  }, [child, completeTask, updatePoints, incrementCompletionCount, addLog, showToast, undoComplete])

  if (!child) return null

  return (
    <div className="page">
      <PointAnimation trigger={animTrigger} points={lastPoints} />
      {/* Header with avatar and greeting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            {child.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {getGreeting()}，{child.name}!
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

      {/* Points Planet */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, #FFE082 0%, #FFB800 50%, #FF9800 100%)',
          borderRadius: 24,
          padding: '28px 20px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
          boxShadow: '0 8px 32px rgba(255,184,0,0.3)',
        }}
      >
        {/* Floating decorations */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 15,
          fontSize: '1.5rem',
          opacity: 0.6,
          animation: 'float 3s ease-in-out infinite',
        }}>⭐</div>
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: '1.2rem',
          opacity: 0.5,
          animation: 'float 3s ease-in-out infinite 1s',
        }}>✨</div>
        <div style={{
          position: 'absolute',
          bottom: 15,
          left: 30,
          fontSize: '1rem',
          opacity: 0.4,
          animation: 'float 3s ease-in-out infinite 0.5s',
        }}>🌟</div>

        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: 4 }}>我的积分</div>
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
            🎉 太棒了! 今天的任务全部完成!
          </div>
        )}
      </div>

      {/* Pending tasks */}
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
            <div key={task.taskId} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
            }}>
              <span style={{ fontSize: '1.5rem' }}>{task.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{task.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  +{task.points}
                </span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleComplete(task.taskId, task.name, task.points)}
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
          ))}
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
            🎁 你有 {pendingExchanges.length} 个兑换申请等待家长确认
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
