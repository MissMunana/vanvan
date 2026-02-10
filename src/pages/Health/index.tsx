import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HealthTab } from '../../types'
import SubTabBar from '../../components/Layout/SubTabBar'
import MedicalDisclaimer from '../../components/common/MedicalDisclaimer'
import GrowthDashboard from './GrowthDashboard'
import FeverTracker from './FeverTracker'
import MedicationTracker from './MedicationTracker'
import VaccineTracker from './VaccineTracker'
import MilestoneTracker from './MilestoneTracker'

const HEALTH_TABS: { key: HealthTab; label: string; icon: string }[] = [
  { key: 'growth', label: '生长曲线', icon: '📏' },
  { key: 'fever', label: '发烧记录', icon: '🌡️' },
  { key: 'medication', label: '用药管理', icon: '💊' },
  { key: 'vaccine', label: '疫苗', icon: '💉' },
  { key: 'milestone', label: '里程碑', icon: '🌟' },
]

const TAB_INDEX: Record<HealthTab, number> = {
  growth: 0, fever: 1, medication: 2, vaccine: 3, milestone: 4,
}

function getTabContent(tab: HealthTab) {
  switch (tab) {
    case 'growth': return <GrowthDashboard />
    case 'fever': return <FeverTracker />
    case 'medication': return <MedicationTracker />
    case 'vaccine': return <VaccineTracker />
    case 'milestone': return <MilestoneTracker />
  }
}

export default function Health() {
  const [activeTab, setActiveTab] = useState<HealthTab>('growth')
  const prevTabRef = useRef<number>(0)
  const direction = TAB_INDEX[activeTab] >= prevTabRef.current ? 1 : -1

  const handleTabChange = (tab: HealthTab) => {
    prevTabRef.current = TAB_INDEX[activeTab]
    setActiveTab(tab)
  }

  return (
    <div className="page">
      <MedicalDisclaimer compact />
      <SubTabBar tabs={HEALTH_TABS} active={activeTab} onChange={handleTabChange} />

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
