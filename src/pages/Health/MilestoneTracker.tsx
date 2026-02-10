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
import { getAgeInMonths } from '../../utils/growthUtils'

type ViewFilter = 'current' | 'all'

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: string; color: string; bg: string; border: string }> = {
  not_started: { label: '未开始', icon: '⬜', color: '#9E9E9E', bg: 'rgba(158,158,158,0.08)', border: 'rgba(158,158,158,0.19)' },
  in_progress: { label: '进行中', icon: '🔄', color: '#FF9800', bg: 'rgba(255,152,0,0.08)', border: 'rgba(255,152,0,0.19)' },
  achieved: { label: '已达成', icon: '✅', color: '#4CAF50', bg: 'rgba(76,175,80,0.08)', border: 'rgba(76,175,80,0.19)' },
}

export default function MilestoneTracker() {
  const child = useAppStore((s) => s.getCurrentChild())
  const updateMilestoneStatus = useHealthStore((s) => s.updateMilestoneStatus)
  const allMilestoneRecords = useHealthStore((s) => s.milestoneRecords)
  const { showToast } = useToast()

  const [filter, setFilter] = useState<ViewFilter>('current')
  const [expandedCategory, setExpandedCategory] = useState<MilestoneCategory | null>(null)

  const ageMonths = useMemo(() => {
    if (!child) return 0
    return getAgeInMonths(child.birthday, new Date().toISOString().split('T')[0])
  }, [child])

  const milestoneRecords = useMemo(() => {
    if (!child) return []
    return allMilestoneRecords.filter((r) => r.childId === child.childId)
  }, [child, allMilestoneRecords])

  const getStatus = (milestoneId: string): MilestoneStatus => {
    const record = milestoneRecords.find((r) => r.milestoneId === milestoneId)
    return record?.status ?? 'not_started'
  }

  const getRecord = (milestoneId: string) => {
    return milestoneRecords.find((r) => r.milestoneId === milestoneId)
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
      showToast(`${milestone.name} 已达成！`)
    }
  }

  const handlePhotoToggle = (milestoneId: string, photoTaken: boolean, photoNote?: string) => {
    if (!child) return
    const record = getRecord(milestoneId)
    if (record) {
      updateMilestoneStatus(child.childId, milestoneId, record.status, undefined, { photoTaken, photoNote })
    }
  }

  if (!child) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>请先选择孩子</div>
  }

  return (
    <div>
      {/* Summary card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 8 }}>⭐ {child.name} 的发育进度（{ageMonths}月龄）</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <StatItem label="当前阶段" value={`${stats.total}`} sub="个里程碑" color="var(--color-text)" />
          <StatItem label="已达成" value={`${stats.achieved}`} sub={`/ ${stats.total}`} color="var(--color-success)" />
          <StatItem label="进行中" value={`${stats.inProgress}`} sub="项" color="var(--color-warning)" />
        </div>
        {stats.total > 0 && (
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-bar-fill" style={{
              width: `${(stats.achieved / stats.total) * 100}%`,
              background: 'var(--color-success)',
            }} />
          </div>
        )}
      </div>

      {/* Filter toggle */}
      <div className="toggle-group" style={{ marginBottom: 16 }}>
        <button
          className={`toggle-btn${filter === 'current' ? ' active' : ''}`}
          onClick={() => setFilter('current')}
          style={filter === 'current' ? { background: 'var(--color-health)' } : undefined}
        >
          当前阶段
        </button>
        <button
          className={`toggle-btn${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
          style={filter === 'all' ? { background: 'var(--color-health)' } : undefined}
        >
          全部里程碑
        </button>
      </div>

      {/* Upcoming milestones */}
      {filter === 'current' && upcomingMilestones.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' as any, marginBottom: 8 }}>
            🔮 即将到来
          </div>
          {upcomingMilestones.map((m) => (
            <div key={m.id} style={{ fontSize: 'var(--text-sm)', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{m.icon}</span>
              <span>{m.name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
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
                <span style={{ fontSize: '1.2rem' }}>{group.info.icon}</span>
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
                    record={getRecord(milestone.id)}
                    ageMonths={ageMonths}
                    onStatusChange={(status) => handleStatusChange(milestone, status)}
                    onPhotoToggle={(photoTaken, photoNote) => handlePhotoToggle(milestone.id, photoTaken, photoNote)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {displayMilestones.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">⭐</div>
            <div className="empty-state-text">暂无匹配的里程碑</div>
          </div>
        </div>
      )}
    </div>
  )
}

function MilestoneItem({
  milestone,
  status,
  record,
  ageMonths,
  onStatusChange,
  onPhotoToggle,
}: {
  milestone: MilestoneDefinition
  status: MilestoneStatus
  record: import('../../types').MilestoneRecord | undefined
  ageMonths: number
  onStatusChange: (status: MilestoneStatus) => void
  onPhotoToggle: (photoTaken: boolean, photoNote?: string) => void
}) {
  const [showPhotoNote, setShowPhotoNote] = useState(false)
  const [photoNoteText, setPhotoNoteText] = useState(record?.photoNote ?? '')

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
        borderLeft: isInRange && status !== 'achieved' ? '3px solid var(--color-warning)' : status === 'achieved' ? '3px solid var(--color-success)' : '3px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{milestone.icon}</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {milestone.name}
                {record?.photoTaken && <span title="已拍照留念">📷</span>}
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
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{config.icon} {config.label}</span>
        </button>
      </div>
      {/* Photo toggle for achieved milestones */}
      {status === 'achieved' && (
        <div style={{ marginTop: 6, paddingLeft: 32 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={record?.photoTaken ?? false}
              onChange={(e) => {
                onPhotoToggle(e.target.checked, photoNoteText || undefined)
                if (e.target.checked && !showPhotoNote) setShowPhotoNote(true)
                if (!e.target.checked) setShowPhotoNote(false)
              }}
              style={{ width: 14, height: 14 }}
            />
            📷 已拍照留念
          </label>
          {(showPhotoNote || record?.photoTaken) && (
            <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="照片备注（选填）"
                value={photoNoteText}
                onChange={(e) => setPhotoNoteText(e.target.value)}
                onBlur={() => {
                  if (record?.photoTaken) onPhotoToggle(true, photoNoteText || undefined)
                }}
                style={{ fontSize: '0.72rem', flex: 1, padding: '4px 8px' }}
              />
            </div>
          )}
          {record?.photoNote && !showPhotoNote && (
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              📝 {record.photoNote}
            </div>
          )}
        </div>
      )}
      {isPast && status === 'not_started' && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 4, paddingLeft: 32 }}>
          ⚠️ 已超过典型发展窗口期，请关注
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="stat-item">
      <div className="stat-item-label">{label}</div>
      <div className="stat-item-value" style={{ color }}>
        {value}<span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-normal)' as any, color: 'var(--color-text-secondary)' }}>{sub}</span>
      </div>
    </div>
  )
}
