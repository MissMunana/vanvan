import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useBadgeStore } from '../../stores/badgeStore'
import { Modal } from '../../components/common/Modal'
import { AppIcon } from '../../components/common/AppIcon'
import { formatAge } from '../../hooks/useAgeGroup'
import LineChart from '../../components/charts/LineChart'
import PieChart from '../../components/charts/PieChart'
import { CATEGORY_INFO, type TaskCategory } from '../../types'
import { BADGE_LIST } from '../../data/badges'

export default function Profile() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const logs = usePointStore((s) => s.logs)
  const allExchanges = useExchangeStore((s) => s.exchanges)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

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

  const allTasks = useTaskStore((s) => s.tasks)
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges)

  const recentLogs = useMemo(() => logs.filter((l) => l.childId === childId).slice(0, 20), [logs, childId])
  const exchanges = useMemo(() => allExchanges.filter((e) => e.childId === childId), [allExchanges, childId])
  const navigate = useNavigate()

  const badgeCount = useMemo(() => unlockedBadges.filter((b) => b.childId === childId).length, [unlockedBadges, childId])

  // Weekly points trend (last 4 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; value: number }[] = []
    const now = new Date()
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() - w * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      const startStr = weekStart.toISOString()
      const endStr = weekEnd.toISOString()
      const earned = logs
        .filter((l) => l.childId === childId && l.createdAt >= startStr && l.createdAt < endStr && (l.type === 'earn' || (l.type === 'adjust' && l.points > 0)))
        .reduce((sum, l) => sum + l.points, 0)
      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
      weeks.push({ label, value: earned })
    }
    return weeks
  }, [logs, childId])

  // Category completion pie chart
  const categoryStats = useMemo(() => {
    const childTasks = allTasks.filter((t) => t.childId === childId && t.isActive)
    const colors: Record<TaskCategory, string> = {
      life: 'var(--color-category-life)',
      study: 'var(--color-category-study)',
      manner: 'var(--color-category-manner)',
      chore: 'var(--color-category-chore)',
    }
    return (Object.keys(CATEGORY_INFO) as TaskCategory[]).map((cat) => ({
      label: CATEGORY_INFO[cat].label,
      value: childTasks.filter((t) => t.category === cat && t.completedToday).length,
      color: colors[cat],
    }))
  }, [allTasks, childId])

  // Top 3 favorite tasks
  const topTasks = useMemo(() => {
    return allTasks
      .filter((t) => t.childId === childId && (t.totalCompletions || 0) > 0)
      .sort((a, b) => (b.totalCompletions || 0) - (a.totalCompletions || 0))
      .slice(0, 3)
  }, [allTasks, childId])

  const [showHistory, setShowHistory] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  if (!child) return null

  const approvedExchanges = exchanges.filter((e) => e.status === 'approved').length

  return (
    <div className="page">
      {/* Profile header */}
      <div style={{
        textAlign: 'center',
        padding: '20px 0',
        marginBottom: 20,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 12px',
          boxShadow: '0 4px 16px rgba(255,184,0,0.2)',
        }}>
          {child.avatar}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{child.name}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          {formatAge(child.birthday, child.age)} · {child.gender === 'male' ? '男孩' : '女孩'}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'var(--grid-stats-cols)',
        gap: 10,
        marginBottom: 20,
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {child.totalPoints}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            当前积分
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {weeklyStats.tasksCompleted}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            本周完成
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-info)' }}>
            {approvedExchanges}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            已兑换
          </div>
        </div>
      </div>

      {/* Growth curves */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>积分趋势（近4周）</div>
        <LineChart data={weeklyTrend} />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>今日分类完成</div>
        <PieChart segments={categoryStats} />
      </div>

      {topTasks.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>最喜欢的习惯 Top 3</div>
          {topTasks.map((t, i) => (
            <div key={t.taskId} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
            }}>
              <span style={{ fontWeight: 700, color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', width: 20 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {t.totalCompletions || 0}次
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => navigate('/badges')}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <AppIcon name="Medal" size={22} color="var(--color-primary)" />
          <span style={{ flex: 1, fontWeight: 600 }}>我的勋章</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
            {badgeCount}/{BADGE_LIST.length}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>

        <button
          onClick={() => setShowHistory(true)}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <AppIcon name="BarChart3" size={22} color="var(--color-text-secondary)" />
          <span style={{ flex: 1, fontWeight: 600 }}>积分历史</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>

        <button
          onClick={() => navigate('/parent')}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <AppIcon name="Users" size={22} color="var(--color-text-secondary)" />
          <span style={{ flex: 1, fontWeight: 600 }}>家长控制台</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>

        <button
          onClick={() => setShowAbout(true)}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <AppIcon name="Info" size={22} color="var(--color-text-secondary)" />
          <span style={{ flex: 1, fontWeight: 600 }}>关于</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>
      </div>

      {/* About modal */}
      <Modal
        open={showAbout}
        onClose={() => setShowAbout(false)}
        title="关于"
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ marginBottom: 12 }}><AppIcon name="Star" size={48} color="var(--color-primary)" /></div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>小星星成长宝</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            V1.5 体验优化版
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 8,
            background: 'var(--color-bg)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            fontFamily: 'monospace',
          }}>
            Build: {typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'}
          </div>
        </div>
      </Modal>

      {/* Points history modal */}
      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="积分历史"
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {recentLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
              还没有积分记录
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.logId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(log.createdAt).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.emotion && ` · ${log.emotion}`}
                  </div>
                </div>
                <span style={{
                  fontWeight: 700,
                  color: log.points > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {log.points > 0 ? '+' : ''}{log.points}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
