import { useState, useMemo } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import {
  MILESTONES,
  MILESTONE_CATEGORY_INFO,
  getMilestonesForAge,
  getUpcomingMilestones,
  type MilestoneCategory,
  type MilestoneDefinition,
} from '../../data/milestones'
import type { MilestoneStatus } from '../../types'

type ViewFilter = 'current' | 'all'

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: string; color: string }> = {
  not_started: { label: '未开始', icon: '⬜', color: 'var(--color-text-secondary)' },
  in_progress: { label: '进行中', icon: '🔄', color: '#FF9800' },
  achieved: { label: '已达成', icon: '✅', color: '#4CAF50' },
}

export default function MilestoneTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const updateMilestoneStatus = useHealthStore((s) => s.updateMilestoneStatus)
  const getChildMilestoneRecords = useHealthStore((s) => s.getChildMilestoneRecords)
  const { showToast } = useToast()

  const [filter, setFilter] = useState<ViewFilter>('current')
  const [expandedCategory, setExpandedCategory] = useState<MilestoneCategory | null>(null)

  const ageMonths = useMemo(() => {
    if (!child) return 0
    const now = new Date()
    const birth = new Date(child.birthday)
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  }, [child])

  const milestoneRecords = useMemo(() => {
    if (!child) return []
    return getChildMilestoneRecords(child.childId)
  }, [child, getChildMilestoneRecords])

  const getStatus = (milestoneId: string): MilestoneStatus => {
    const record = milestoneRecords.find((r) => r.milestoneId === milestoneId)
    return record?.status ?? 'not_started'
  }

  const currentMilestones = useMemo(() => getMilestonesForAge(ageMonths), [ageMonths])
  const upcomingMilestones = useMemo(() => getUpcomingMilestones(ageMonths), [ageMonths])

  const displayMilestones = filter === 'current' ? currentMilestones : MILESTONES

  // Group by category
  const grouped = useMemo(() => {
    const categories = Object.keys(MILESTONE_CATEGORY_INFO) as MilestoneCategory[]
    return categories
      .map((cat) => ({
        category: cat,
        info: MILESTONE_CATEGORY_INFO[cat],
        milestones: displayMilestones.filter((m) => m.category === cat),
      }))
      .filter((g) => g.milestones.length > 0)
  }, [displayMilestones])

  // Stats
  const stats = useMemo(() => {
    const total = currentMilestones.length
    const achieved = currentMilestones.filter((m) => getStatus(m.id) === 'achieved').length
    const inProgress = currentMilestones.filter((m) => getStatus(m.id) === 'in_progress').length
    return { total, achieved, inProgress }
  }, [currentMilestones, milestoneRecords])

  const handleStatusChange = (milestone: MilestoneDefinition, newStatus: MilestoneStatus) => {
    if (!child) return
    updateMilestoneStatus(child.childId, milestone.id, newStatus)
    if (newStatus === 'achieved') {
      showToast(`🎉 ${milestone.name} 已达成！`)
    }
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Summary card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>
          🌟 {child.name} 的发育进度（{ageMonths}月龄）
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatItem label="当前阶段" value={`${stats.total}`} sub="个里程碑" color="var(--color-text)" />
          <StatItem label="已达成" value={`${stats.achieved}`} sub={`/ ${stats.total}`} color="#4CAF50" />
          <StatItem label="进行中" value={`${stats.inProgress}`} sub="项" color="#FF9800" />
        </div>
        {stats.total > 0 && (
          <div style={{
            marginTop: 10,
            height: 6,
            borderRadius: 3,
            background: '#F0F0F0',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(stats.achieved / stats.total) * 100}%`,
              background: '#4CAF50',
              borderRadius: 3,
              transition: 'width 0.3s',
            }} />
          </div>
        )}
      </div>

      {/* Filter toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setFilter('current')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: filter === 'current' ? 700 : 400,
            background: filter === 'current' ? 'var(--color-health)' : 'transparent',
            color: filter === 'current' ? 'white' : 'var(--color-text-secondary)',
            border: filter === 'current' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          当前阶段
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: filter === 'all' ? 700 : 400,
            background: filter === 'all' ? 'var(--color-health)' : 'transparent',
            color: filter === 'all' ? 'white' : 'var(--color-text-secondary)',
            border: filter === 'all' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          全部里程碑
        </button>
      </div>

      {/* Upcoming milestones */}
      {filter === 'current' && upcomingMilestones.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: '#FFF8E1', border: '1px solid #FFE082' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, color: '#F57F17' }}>
            🔮 即将到来
          </div>
          {upcomingMilestones.map((m) => (
            <div key={m.id} style={{ fontSize: '0.8rem', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{m.icon}</span>
              <span>{m.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                （{m.startMonth}-{m.endMonth}月龄）
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Category groups */}
      {grouped.map((group) => {
        const isExpanded = expandedCategory === group.category || filter === 'current'
        const achievedCount = group.milestones.filter((m) => getStatus(m.id) === 'achieved').length

        return (
          <div key={group.category} style={{ marginBottom: 12 }}>
            <button
              onClick={() => {
                if (filter === 'all') {
                  setExpandedCategory(expandedCategory === group.category ? null : group.category)
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: group.info.color + '15',
                border: `1px solid ${group.info.color}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{group.info.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: group.info.color }}>
                  {group.info.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  {achievedCount}/{group.milestones.length}
                </span>
              </div>
              {filter === 'all' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </button>

            {isExpanded && (
              <div style={{ marginTop: 6 }}>
                {group.milestones.map((milestone) => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    status={getStatus(milestone.id)}
                    ageMonths={ageMonths}
                    onStatusChange={(status) => handleStatusChange(milestone, status)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {displayMilestones.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          暂无匹配的里程碑
        </div>
      )}
    </div>
  )
}

function MilestoneItem({
  milestone,
  status,
  ageMonths,
  onStatusChange,
}: {
  milestone: MilestoneDefinition
  status: MilestoneStatus
  ageMonths: number
  onStatusChange: (status: MilestoneStatus) => void
}) {
  const config = STATUS_CONFIG[status]
  const isInRange = ageMonths >= milestone.startMonth && ageMonths <= milestone.endMonth
  const isPast = ageMonths > milestone.endMonth
  const isFuture = ageMonths < milestone.startMonth

  const nextStatus: MilestoneStatus =
    status === 'not_started' ? 'in_progress' :
    status === 'in_progress' ? 'achieved' :
    'not_started'

  return (
    <div
      className="card"
      style={{
        padding: '10px 14px',
        marginBottom: 6,
        opacity: isFuture ? 0.5 : 1,
        borderLeft: isInRange && status !== 'achieved' ? '3px solid #FF9800' : status === 'achieved' ? '3px solid #4CAF50' : '3px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>{milestone.icon}</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {milestone.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {milestone.startMonth}-{milestone.endMonth}月龄 · {milestone.description}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => onStatusChange(nextStatus)}
          style={{
            padding: '4px 10px',
            fontSize: '0.7rem',
            borderRadius: 'var(--radius-sm)',
            background: config.color + '15',
            color: config.color,
            border: `1px solid ${config.color}30`,
            whiteSpace: 'nowrap',
          }}
        >
          {config.icon} {config.label}
        </button>
      </div>
      {isPast && status === 'not_started' && (
        <div style={{ fontSize: '0.7rem', color: '#FF9800', marginTop: 4, paddingLeft: 32 }}>
          ⚠️ 已超过典型发展窗口期，请关注
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>
        {value}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>{sub}</span>
      </div>
    </div>
  )
}
