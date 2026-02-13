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
          marginTop: 24,
          marginBottom: 8,
          padding: '6px 12px',
          fontSize: '0.7rem',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          lineHeight: 1.5,
          textAlign: 'center',
          opacity: expanded ? 1 : 0.6,
          transition: 'opacity 0.2s',
        }}
      >
        {expanded
          ? '⚠️ 本功能提供的所有信息和计算结果仅供参考，不构成医疗建议。儿童用药请务必遵医嘱，具体用药方案以医生处方为准。如孩子出现紧急症状，请立即就医。'
          : '⚠️ 医疗免责声明（点击展开）'}
      </div>
    )
  }

  return (
    <div className="alert alert-warning" style={{ padding: 16, marginBottom: 16, lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ 重要提示</div>
      <p>本功能提供的所有信息和计算结果仅供参考，不构成医疗建议。</p>
      <p>儿童用药请务必遵医嘱，具体用药方案以医生处方为准。</p>
      <p>如孩子出现紧急症状，请立即就医。</p>
    </div>
  )
}
