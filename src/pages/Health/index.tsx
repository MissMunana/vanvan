import { useState } from 'react'
import type { HealthTab } from '../../types'
import SubTabBar from '../../components/Layout/SubTabBar'
import MedicalDisclaimer from '../../components/common/MedicalDisclaimer'
import GrowthDashboard from './GrowthDashboard'
import FeverTracker from './FeverTracker'
import MedicationTracker from './MedicationTracker'
import VaccineTracker from './VaccineTracker'
import MilestoneTracker from './MilestoneTracker'

const HEALTH_TABS: { key: HealthTab; label: string; icon: string }[] = [
  { key: 'growth', label: '生长曲线', icon: 'Ruler' },
  { key: 'fever', label: '发烧记录', icon: 'Thermometer' },
  { key: 'medication', label: '用药管理', icon: 'Pill' },
  { key: 'vaccine', label: '疫苗', icon: 'Syringe' },
  { key: 'milestone', label: '里程碑', icon: 'Star' },
]

export default function Health() {
  const [activeTab, setActiveTab] = useState<HealthTab>('growth')

  return (
    <div className="page">
      <MedicalDisclaimer compact />
      <SubTabBar tabs={HEALTH_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'growth' && <GrowthDashboard />}
      {activeTab === 'fever' && <FeverTracker />}
      {activeTab === 'medication' && <MedicationTracker />}
      {activeTab === 'vaccine' && <VaccineTracker />}
      {activeTab === 'milestone' && <MilestoneTracker />}
    </div>
  )
}
