import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import SubTabBar from '../../components/Layout/SubTabBar'
import EmergencyContactCard from './EmergencyContactCard'
import EmergencyProfileEditor from './EmergencyProfileEditor'
import FirstAidGuides from './FirstAidGuides'
import SafetyChecklists from './SafetyChecklists'

type EmergencyTab = 'first-aid' | 'safety'

const TABS: { key: EmergencyTab; label: string; icon: string }[] = [
  { key: 'first-aid', label: '急救指南', icon: '🩹' },
  { key: 'safety', label: '安全清单', icon: '🛡️' },
]

const TAB_INDEX: Record<EmergencyTab, number> = {
  'first-aid': 0,
  'safety': 1,
}

function getTabContent(tab: EmergencyTab) {
  switch (tab) {
    case 'first-aid': return <FirstAidGuides />
    case 'safety': return <SafetyChecklists />
  }
}

export default function Emergency() {
  const navigate = useNavigate()
  const child = useAppStore((s) => s.getCurrentChild())
  const emergencyProfile = useHealthStore((s) => s.emergencyProfile)
  const fetchEmergencyProfile = useHealthStore((s) => s.fetchEmergencyProfile)
  const fetchSafetyChecklistProgress = useHealthStore((s) => s.fetchSafetyChecklistProgress)

  const [activeTab, setActiveTab] = useState<EmergencyTab>('first-aid')
  const [editorOpen, setEditorOpen] = useState(false)
  const prevTabRef = useRef<number>(0)

  const direction = TAB_INDEX[activeTab] >= prevTabRef.current ? 1 : -1

  useEffect(() => {
    if (child) {
      fetchEmergencyProfile(child.childId).catch(() => {})
      fetchSafetyChecklistProgress(child.childId).catch(() => {})
    }
  }, [child?.childId])

  const handleTabChange = (tab: EmergencyTab) => {
    prevTabRef.current = TAB_INDEX[activeTab]
    setActiveTab(tab)
  }

  if (!child) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
        请先选择孩子
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--color-text)',
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>紧急安全</h2>
      </div>

      {/* Emergency contact card always at top */}
      <EmergencyContactCard
        profile={emergencyProfile}
        child={child}
        onEdit={() => setEditorOpen(true)}
      />

      {/* Sub tabs */}
      <SubTabBar
        tabs={TABS}
        active={activeTab}
        onChange={handleTabChange}
        color="#FF5252"
      />

      {/* Tab content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 30 }}
          transition={{ duration: 0.2 }}
        >
          {getTabContent(activeTab)}
        </motion.div>
      </AnimatePresence>

      {/* Emergency profile editor modal */}
      <EmergencyProfileEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        profile={emergencyProfile}
        childId={child.childId}
      />
    </div>
  )
}
