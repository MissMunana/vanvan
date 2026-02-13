import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SubTabBar from '../../components/Layout/SubTabBar'
import MoodCheckin from './MoodCheckin'
import ConflictDebrief from './ConflictDebrief'
import EmotionReport from './EmotionReport'

type EmotionTab = 'mood' | 'conflict' | 'report'

const EMOTION_TABS: { key: EmotionTab; label: string; icon: string }[] = [
  { key: 'mood', label: '心情日记', icon: '🎭' },
  { key: 'conflict', label: '冲突复盘', icon: '🤝' },
  { key: 'report', label: '情绪报告', icon: '📊' },
]

const TAB_INDEX: Record<EmotionTab, number> = { mood: 0, conflict: 1, report: 2 }

function getTabContent(tab: EmotionTab) {
  switch (tab) {
    case 'mood': return <MoodCheckin />
    case 'conflict': return <ConflictDebrief />
    case 'report': return <EmotionReport />
  }
}

export default function Emotion() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<EmotionTab>('mood')
  const prevTabRef = useRef<number>(0)
  const direction = TAB_INDEX[activeTab] >= prevTabRef.current ? 1 : -1

  const handleTabChange = (tab: EmotionTab) => {
    prevTabRef.current = TAB_INDEX[activeTab]
    setActiveTab(tab)
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', padding: '4px 8px 4px 0', color: 'var(--color-text)',
          }}
        >
          ←
        </button>
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>情绪心理</span>
      </div>

      <SubTabBar tabs={EMOTION_TABS} active={activeTab} onChange={handleTabChange} color="#A8A8E6" />

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
    </div>
  )
}
