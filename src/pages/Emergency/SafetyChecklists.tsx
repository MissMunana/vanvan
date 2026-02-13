import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { getChecklistForAgeGroup, getChecklistCategories } from '../../data/safetyChecklists'
import type { SafetyAgeGroup } from '../../types'
import { SAFETY_AGE_GROUP_INFO } from '../../types'

const AGE_GROUPS: SafetyAgeGroup[] = ['0-1', '1-3', '3-6', '6-12']

function mapChildAgeGroup(childAgeGroup: string, birthday: string): SafetyAgeGroup {
  // Calculate age in months from birthday for more precise mapping
  const birth = new Date(birthday)
  const now = new Date()
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())

  if (ageMonths < 12) return '0-1'
  if (ageMonths < 36) return '1-3'

  // Use ageGroup from child for older kids
  switch (childAgeGroup) {
    case '3-5': return '3-6'
    case '6-8':
    case '9-12': return '6-12'
    default: return '3-6'
  }
}

export default function SafetyChecklists() {
  const child = useAppStore((s) => s.getCurrentChild())
  const safetyChecklistProgress = useHealthStore((s) => s.safetyChecklistProgress)
  const toggleSafetyChecklistItem = useHealthStore((s) => s.toggleSafetyChecklistItem)

  const defaultAgeGroup = useMemo(() => {
    if (!child) return '3-6' as SafetyAgeGroup
    return mapChildAgeGroup(child.ageGroup, child.birthday)
  }, [child])

  const [activeGroup, setActiveGroup] = useState<SafetyAgeGroup>(defaultAgeGroup)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Sync active age group when child changes
  useEffect(() => {
    setActiveGroup(defaultAgeGroup)
    setCollapsedCategories(new Set())
  }, [defaultAgeGroup])

  const items = useMemo(() => getChecklistForAgeGroup(activeGroup), [activeGroup])
  const categories = useMemo(() => getChecklistCategories(activeGroup), [activeGroup])

  const completedSet = useMemo(() => {
    if (!child) return new Set<string>()
    return new Set(
      safetyChecklistProgress
        .filter((p) => p.childId === child.childId && p.completed)
        .map((p) => p.checklistItemId)
    )
  }, [child, safetyChecklistProgress])

  const totalItems = items.length
  const completedCount = items.filter((item) => completedSet.has(item.id)).length
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleToggleItem = useCallback(async (itemId: string) => {
    if (!child) return
    const isCompleted = completedSet.has(itemId)
    try {
      await toggleSafetyChecklistItem(child.childId, itemId, !isCompleted)
    } catch {
      // Silently fail - the store will handle error state
    }
  }, [child, completedSet, toggleSafetyChecklistItem])

  if (!child) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
        请先选择孩子
      </div>
    )
  }

  return (
    <div>
      {/* Age group tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 12,
        overflowX: 'auto',
        paddingBottom: 2,
      }}>
        {AGE_GROUPS.map((group) => {
          const isActive = activeGroup === group
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`toggle-btn${isActive ? ' active' : ''}`}
              style={{
                flex: '1 0 auto',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                ...(isActive ? { background: '#FF5252', color: 'white' } : {}),
              }}
            >
              {SAFETY_AGE_GROUP_INFO[group].label}
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
          fontSize: '0.8rem',
        }}>
          <span style={{ fontWeight: 600 }}>
            {SAFETY_AGE_GROUP_INFO[activeGroup].description}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {completedCount}/{totalItems} ({progressPercent}%)
          </span>
        </div>
        <div style={{
          height: 8,
          background: '#eee',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: progressPercent === 100 ? '#4CAF50' : '#FF5252',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Checklist by category */}
      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category)
        const categoryCompleted = categoryItems.filter((item) => completedSet.has(item.id)).length
        const isCollapsed = collapsedCategories.has(category)

        return (
          <div key={category} style={{ marginBottom: 8 }}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'var(--color-surface)',
                border: 'none',
                borderRadius: isCollapsed ? 10 : '10px 10px 0 0',
                padding: '10px 14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: '0.7rem',
                  transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}>
                  ▼
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{category}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {categoryCompleted}/{categoryItems.length}
              </span>
            </button>

            {/* Category items */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    background: 'var(--color-surface)',
                    borderRadius: '0 0 10px 10px',
                    padding: '0 10px 8px',
                  }}>
                    {categoryItems.map((item) => {
                      const isChecked = completedSet.has(item.id)
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '8px 4px',
                            borderBottom: '1px solid var(--color-border)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item.id)}
                            style={{
                              marginTop: 2,
                              width: 18,
                              height: 18,
                              flexShrink: 0,
                              accentColor: '#FF5252',
                            }}
                          />
                          <span style={{
                            flex: 1,
                            fontSize: '0.85rem',
                            lineHeight: 1.4,
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: isChecked ? 'var(--color-text-secondary)' : 'var(--color-text)',
                          }}>
                            {item.text}
                          </span>
                          {/* Priority badge */}
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.priority === 'high' ? '#FF5252' : '#FFB800',
                            flexShrink: 0,
                            marginTop: 5,
                          }} />
                        </label>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
