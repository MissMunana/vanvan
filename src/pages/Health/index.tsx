import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function Health() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<HealthTab>('growth')

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <MedicalDisclaimer compact />
        <button
          onClick={() => navigate('/health-report')}
          className="btn btn-outline"
          style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
        >
          🖨️ 就医报告
        </button>
      </div>
      <SubTabBar tabs={HEALTH_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'growth' && <GrowthDashboard />}
      {activeTab === 'fever' && <FeverTracker />}
      {activeTab === 'medication' && <MedicationTracker />}
      {activeTab === 'vaccine' && <VaccineTracker />}
      {activeTab === 'milestone' && <MilestoneTracker />}
    </div>
  )
}
