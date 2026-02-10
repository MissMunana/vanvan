import { useState } from 'react'

interface MedicalDisclaimerProps {
  compact?: boolean
}

export default function MedicalDisclaimer({ compact = false }: MedicalDisclaimerProps) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: '#FFF3E0',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: 12,
          fontSize: '0.75rem',
          color: '#E65100',
          cursor: 'pointer',
          lineHeight: 1.5,
        }}
      >
        <span style={{ marginRight: 4 }}>⚠️</span>
        {expanded
          ? '本功能提供的所有信息和计算结果仅供参考，不构成医疗建议。儿童用药请务必遵医嘱，具体用药方案以医生处方为准。如孩子出现紧急症状，请立即就医。'
          : '医疗免责声明（点击展开）'}
      </div>
    )
  }

  return (
    <div style={{
      background: '#FFF3E0',
      border: '1px solid #FFE0B2',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      marginBottom: 16,
      fontSize: '0.8rem',
      color: '#E65100',
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ 重要提示</div>
      <p>本功能提供的所有信息和计算结果仅供参考，不构成医疗建议。</p>
      <p>儿童用药请务必遵医嘱，具体用药方案以医生处方为准。</p>
      <p>如孩子出现紧急症状，请立即就医。</p>
    </div>
  )
}
