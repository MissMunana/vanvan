import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageData } from '../../hooks/usePageData'
import PageLoading from '../../components/common/PageLoading'
import type { HealthTab } from '../../types'
import SubTabBar from '../../components/Layout/SubTabBar'
import MedicalDisclaimer from '../../components/common/MedicalDisclaimer'
import GrowthDashboard from './GrowthDashboard'
import FeverTracker from './FeverTracker'
import MedicationTracker from './MedicationTracker'
import VaccineTracker from './VaccineTracker'
import MilestoneTracker from './MilestoneTracker'
import SleepTracker from './SleepTracker'
import MedicineCabinet from './MedicineCabinet'

const HEALTH_TABS: { key: HealthTab; label: string; icon: string }[] = [
  { key: 'growth', label: '生长曲线', icon: '📏' },
  { key: 'fever', label: '发烧记录', icon: '🌡️' },
  { key: 'medication', label: '用药管理', icon: '💊' },
  { key: 'vaccine', label: '疫苗', icon: '💉' },
  { key: 'milestone', label: '里程碑', icon: '🌟' },
  { key: 'sleep', label: '睡眠', icon: '😴' },
  { key: 'cabinet', label: '药箱', icon: '🗄️' },
]

const TAB_INDEX: Record<HealthTab, number> = {
  growth: 0, fever: 1, medication: 2, vaccine: 3, milestone: 4, sleep: 5, cabinet: 6,
}

function getTabContent(tab: HealthTab) {
  switch (tab) {
    case 'growth': return <GrowthDashboard />
    case 'fever': return <FeverTracker />
    case 'medication': return <MedicationTracker />
    case 'vaccine': return <VaccineTracker />
    case 'milestone': return <MilestoneTracker />
    case 'sleep': return <SleepTracker />
    case 'cabinet': return <MedicineCabinet />
  }
}

export default function Health() {
  const { isLoading: pageLoading, error: pageError } = usePageData(['health'])

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<HealthTab>('growth')
  const prevTabRef = useRef<number>(0)
  const direction = TAB_INDEX[activeTab] >= prevTabRef.current ? 1 : -1

  const handleTabChange = (tab: HealthTab) => {
    prevTabRef.current = TAB_INDEX[activeTab]
    setActiveTab(tab)
  }

  return (
    <PageLoading isLoading={pageLoading} error={pageError}>
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
        <button
          onClick={() => navigate('/emotion')}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', borderColor: '#A8A8E640', color: '#A8A8E6' }}
        >
          🎭 情绪
        </button>
        <button
          onClick={() => navigate('/emergency')}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', borderColor: '#FF525240', color: '#FF5252' }}
        >
          🆘 应急
        </button>
        <button
          onClick={() => navigate('/health-report')}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
        >
          🖨️ 就医报告
        </button>
      </div>
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

      <MedicalDisclaimer compact />
    </div>
    </PageLoading>
  )
}
