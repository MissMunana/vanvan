import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useBadgeStore } from '../../stores/badgeStore'
import { BADGE_LIST } from '../../data/badges'
import { Modal } from '../../components/common/Modal'
import { AppIcon } from '../../components/common/AppIcon'

export default function Badges() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const unlockedIds = useMemo(() => {
    return new Set(unlockedBadges.filter((b) => b.childId === childId).map((b) => b.badgeId))
  }, [unlockedBadges, childId])

  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>()
    unlockedBadges
      .filter((b) => b.childId === childId)
      .forEach((b) => map.set(b.badgeId, b.unlockedAt))
    return map
  }, [unlockedBadges, childId])

  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)

  const selectedDef = selectedBadge ? BADGE_LIST.find((b) => b.badgeId === selectedBadge) : null

  if (!child) return null

  const categories = [
    { key: 'habit', label: '习惯勋章' },
    { key: 'points', label: '积分勋章' },
    { key: 'special', label: '特殊勋章' },
  ]

  return (
    <div className="page">
      <h2 className="page-title">
        我的勋章 ({unlockedIds.size}/{BADGE_LIST.length})
      </h2>

      {categories.map(({ key, label }) => {
        const badges = BADGE_LIST.filter((b) => b.category === key)
        return (
          <div key={key} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              marginBottom: 12,
            }}>
              {label}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'var(--grid-badges-cols)',
              gap: 12,
            }}>
              {badges.map((badge) => {
                const isUnlocked = unlockedIds.has(badge.badgeId)
                const unlockedAt = unlockedMap.get(badge.badgeId)
                return (
                  <motion.button
                    key={badge.badgeId}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedBadge(badge.badgeId)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '16px 8px',
                      borderRadius: 16,
                      background: isUnlocked ? 'white' : '#f5f5f5',
                      border: isUnlocked ? '2px solid var(--color-primary)' : '2px solid transparent',
                      boxShadow: isUnlocked ? 'var(--shadow-sm)' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.3)',
                      transition: 'filter 0.3s',
                    }}>
                      <AppIcon name={badge.icon} size={36} />
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isUnlocked ? 'var(--color-text)' : 'var(--color-text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}>
                      {badge.name}
                    </div>
                    {isUnlocked && unlockedAt && (
                      <div style={{
                        fontSize: '0.6rem',
                        color: 'var(--color-text-secondary)',
                      }}>
                        {new Date(unlockedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {isUnlocked && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(circle, rgba(255,184,0,0.15) 0%, transparent 70%)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}

      <Modal
        open={!!selectedDef}
        onClose={() => setSelectedBadge(null)}
        title={selectedDef?.name || ''}
      >
        {selectedDef && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              marginBottom: 12,
              filter: unlockedIds.has(selectedDef.badgeId) ? 'none' : 'grayscale(1) opacity(0.4)',
            }}>
              <AppIcon name={selectedDef.icon} size={64} />
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}>
              {selectedDef.description}
            </div>
            {unlockedIds.has(selectedDef.badgeId) ? (
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 20,
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                已获得 {unlockedMap.get(selectedDef.badgeId)
                  ? new Date(unlockedMap.get(selectedDef.badgeId)!).toLocaleDateString('zh-CN')
                  : ''}
              </div>
            ) : (
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 20,
                background: '#f0f0f0',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                未解锁
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
