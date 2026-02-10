import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { generateHealthSummary, generateWeeklyReport, generateMonthlyReport } from '../../utils/reportUtils'

export default function GrowthReport({ childId }: { childId: string }) {
  const child = useAppStore((s) => s.children.find((c) => c.childId === childId))
  const tasks = useTaskStore((s) => s.tasks)

  const [expanded, setExpanded] = useState<string | null>('health')

  const health = useMemo(() => generateHealthSummary(childId), [childId])
  const weekly = useMemo(() => generateWeeklyReport(childId), [childId])
  const monthly = useMemo(() => generateMonthlyReport(childId), [childId])

  const habitStats = useMemo(() => {
    const childTasks = tasks.filter((t) => t.childId === childId)
    const active = childTasks.filter((t) => t.isActive)
    const graduated = childTasks.filter((t) => t.stage === 'graduated')
    const totalCompletions = childTasks.reduce((s, t) => s + t.totalCompletions, 0)
    const maxStreak = Math.max(0, ...childTasks.map((t) => t.consecutiveDays))
    return { active: active.length, graduated: graduated.length, totalCompletions, maxStreak }
  }, [tasks, childId])

  if (!child) return null

  const toggle = (section: string) => setExpanded(expanded === section ? null : section)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Health Summary */}
      <Section
        title="📊 健康总览"
        expanded={expanded === 'health'}
        onToggle={() => toggle('health')}
      >
        {health.latestGrowth ? (
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 }}>
            {health.latestGrowth.height !== null && (
              <MiniStat label="身高" value={`${health.latestGrowth.height}cm`} sub={health.latestGrowth.heightP !== null ? `P${health.latestGrowth.heightP}` : undefined} />
            )}
            {health.latestGrowth.weight !== null && (
              <MiniStat label="体重" value={`${health.latestGrowth.weight}kg`} sub={health.latestGrowth.weightP !== null ? `P${health.latestGrowth.weightP}` : undefined} />
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>暂无生长记录</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <MiniStat label="疫苗接种" value={`${health.vaccineProgress.done}/${health.vaccineProgress.total}`} />
          <MiniStat label="里程碑达成" value={`${health.milestonesAchieved}`} sub={health.milestonesInProgress > 0 ? `${health.milestonesInProgress}进行中` : undefined} />
        </div>
        {(health.recentFeverCount > 0 || health.recentMedCount > 0) && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#FF9800', background: '#FFF3E0', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
            近7天：
            {health.recentFeverCount > 0 && `${health.recentFeverCount}次体温记录 `}
            {health.recentMedCount > 0 && `${health.recentMedCount}次用药记录`}
          </div>
        )}
      </Section>

      {/* Habit Summary */}
      <Section
        title="🌟 习惯总览"
        expanded={expanded === 'habit'}
        onToggle={() => toggle('habit')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 8 }}>
          <MiniStat label="进行中习惯" value={`${habitStats.active}`} />
          <MiniStat label="已毕业" value={`${habitStats.graduated}`} />
          <MiniStat label="最长连续" value={`${habitStats.maxStreak}天`} />
        </div>
        {weekly.topHabits.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>本周 Top 习惯</div>
            {weekly.topHabits.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', padding: '3px 0' }}>
                <span>{h.icon}</span>
                <span style={{ flex: 1 }}>{h.name}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{h.count}次</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Weekly Report */}
      <Section
        title={`📅 本周总结 (${weekly.periodLabel})`}
        expanded={expanded === 'weekly'}
        onToggle={() => toggle('weekly')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <MiniStat label="完成任务" value={`${weekly.tasksCompleted}`} />
          <MiniStat label="获得积分" value={`+${weekly.pointsEarned}`} color="var(--color-success)" />
          <MiniStat label="消费积分" value={`${weekly.pointsSpent}`} color="var(--color-info)" />
        </div>
        {weekly.healthEvents.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            健康事件：{weekly.healthEvents.map((e) => `${e.type}${e.count}次`).join('、')}
          </div>
        )}
      </Section>

      {/* Monthly Report */}
      <Section
        title={`📊 本月总结 (${monthly.periodLabel})`}
        expanded={expanded === 'monthly'}
        onToggle={() => toggle('monthly')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 8 }}>
          <MiniStat label="完成任务" value={`${monthly.tasksCompleted}`} />
          <MiniStat label="获得积分" value={`+${monthly.pointsEarned}`} color="var(--color-success)" />
        </div>
        {(monthly.growthChange.height || monthly.growthChange.weight) && (
          <div style={{ fontSize: '0.78rem', padding: '6px 10px', background: 'var(--color-health-light)', borderRadius: 'var(--radius-sm)' }}>
            生长变化：
            {monthly.growthChange.height && `身高${monthly.growthChange.height} `}
            {monthly.growthChange.weight && `体重${monthly.growthChange.weight}`}
          </div>
        )}
        {monthly.milestonesAchieved > 0 && (
          <div style={{ fontSize: '0.78rem', marginTop: 6, color: '#4CAF50' }}>
            本月新达成 {monthly.milestonesAchieved} 个里程碑
          </div>
        )}
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
          习惯：{monthly.habitTrend.active}个进行中 · {monthly.habitTrend.graduated}个已毕业
          {monthly.habitTrend.newStarted > 0 && ` · ${monthly.habitTrend.newStarted}个新增`}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, expanded, onToggle, children }: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: expanded ? 'var(--color-bg-secondary)' : 'white',
          border: 'none',
          fontWeight: 700,
          fontSize: '0.85rem',
        }}
      >
        {title}
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '10px 14px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: color ?? 'var(--color-text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)' }}>{sub}</div>}
    </div>
  )
}
