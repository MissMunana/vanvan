import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FIRST_AID_GUIDES } from '../../data/firstAid'
import FirstAidDetail from './FirstAidDetail'

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  common: { label: '常见', color: '#4CAF50' },
  urgent: { label: '紧急', color: '#FF9800' },
  emergency: { label: '危急', color: '#FF5252' },
}

export default function FirstAidGuides() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}>
        {FIRST_AID_GUIDES.map((guide) => {
          const severity = SEVERITY_CONFIG[guide.severity]
          const isExpanded = expandedId === guide.id

          return (
            <div key={guide.id} style={{ gridColumn: isExpanded ? '1 / -1' : undefined }}>
              <motion.div
                layout
                onClick={() => handleToggle(guide.id)}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  border: isExpanded ? `2px solid ${severity.color}40` : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1.6rem' }}>{guide.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {guide.title}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      background: severity.color + '15',
                      color: severity.color,
                      padding: '1px 8px',
                      borderRadius: 10,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}>
                      {severity.label}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                        <FirstAidDetail guide={guide} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
