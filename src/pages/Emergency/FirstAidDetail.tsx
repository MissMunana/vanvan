import type { FirstAidGuide } from '../../types'

interface FirstAidDetailProps {
  guide: FirstAidGuide
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  common: { label: '常见', color: '#4CAF50' },
  urgent: { label: '紧急', color: '#FF9800' },
  emergency: { label: '危急', color: '#FF5252' },
}

export default function FirstAidDetail({ guide }: FirstAidDetailProps) {
  const severity = SEVERITY_CONFIG[guide.severity]

  return (
    <div>
      {/* Title with severity badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '1.4rem' }}>{guide.icon}</span>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{guide.title}</h4>
        <span style={{
          display: 'inline-block',
          background: severity.color + '15',
          color: severity.color,
          padding: '2px 8px',
          borderRadius: 10,
          fontSize: '0.7rem',
          fontWeight: 600,
        }}>
          {severity.label}
        </span>
      </div>

      {/* Age notes */}
      {guide.ageNotes && (
        <div style={{
          background: '#2196F310',
          border: '1px solid #2196F330',
          borderRadius: 8,
          padding: 10,
          marginBottom: 12,
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 600, color: '#2196F3', marginBottom: 4 }}>
            年龄提示
          </div>
          {Object.entries(guide.ageNotes).map(([key, note]) => (
            <div key={key} style={{ marginBottom: 2, color: 'var(--color-text)' }}>
              {note}
            </div>
          ))}
        </div>
      )}

      {/* Numbered steps */}
      <div style={{ marginBottom: 12 }}>
        {guide.steps.map((step) => (
          <div key={step.stepNumber} style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: severity.color + '15',
              color: severity.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {step.icon || step.stepNumber}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>
                {step.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning box (red) */}
      {guide.warnings.length > 0 && (
        <div style={{
          background: '#FF525212',
          border: '1px solid #FF525230',
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 700, color: '#FF5252', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠️</span> 注意事项
          </div>
          {guide.warnings.map((warning, idx) => (
            <div key={idx} style={{ color: '#C62828', marginBottom: 3, paddingLeft: 4, lineHeight: 1.5 }}>
              <span style={{ marginRight: 4 }}>x</span> {warning}
            </div>
          ))}
        </div>
      )}

      {/* When to call 120 (orange) */}
      {guide.whenToCallEmergency.length > 0 && (
        <div style={{
          background: '#FF980012',
          border: '1px solid #FF980030',
          borderRadius: 8,
          padding: 10,
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 700, color: '#FF9800', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🚑</span> 何时拨打120
          </div>
          {guide.whenToCallEmergency.map((item, idx) => (
            <div key={idx} style={{ color: '#E65100', marginBottom: 3, paddingLeft: 4, lineHeight: 1.5 }}>
              <span style={{ color: '#FF9800', marginRight: 4 }}>!</span> {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
