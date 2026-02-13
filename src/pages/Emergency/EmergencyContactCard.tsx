import { useMemo } from 'react'
import { useHealthStore } from '../../stores/healthStore'
import type { EmergencyProfile, Child } from '../../types'
import { BLOOD_TYPE_INFO } from '../../types'

interface EmergencyContactCardProps {
  profile: EmergencyProfile | null
  child: Child
  onEdit: () => void
}

const QUICK_DIAL = [
  { label: '120 急救', phone: '120', color: '#FF5252', icon: '🚑' },
  { label: '110 报警', phone: '110', color: '#2196F3', icon: '🚔' },
  { label: '中毒热线', phone: '010-83132345', color: '#FF9800', icon: '☠️' },
]

const BLOOD_TYPE_COLORS: Record<string, string> = {
  A: '#FF5252',
  B: '#2196F3',
  AB: '#9C27B0',
  O: '#4CAF50',
  unknown: '#999',
}

export default function EmergencyContactCard({ profile, child, onEdit }: EmergencyContactCardProps) {
  const growthRecords = useHealthStore((s) => s.growthRecords)

  const latestWeight = useMemo(() => {
    const childRecords = growthRecords
      .filter((r) => r.childId === child.childId && r.weight !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
    return childRecords.length > 0 ? childRecords[0].weight : null
  }, [growthRecords, child.childId])

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    border: '2px solid #FF525240',
    position: 'relative',
  }

  const chipContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  }

  const allergyChipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    background: color + '15',
    color,
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 500,
  })

  const noneStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    marginBottom: 4,
    marginTop: 10,
  }

  // Empty state: no profile
  if (!profile) {
    return (
      <div style={{
        ...cardStyle,
        textAlign: 'center',
        padding: 24,
        borderStyle: 'dashed',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🆘</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          尚未设置紧急信息
        </div>
        <button className="btn btn-primary" onClick={onEdit} style={{ background: '#FF5252' }}>
          设置紧急信息
        </button>
      </div>
    )
  }

  const bloodColor = BLOOD_TYPE_COLORS[profile.bloodType] || '#999'
  const primaryContact = profile.emergencyContacts.find((c) => c.isPrimary)
  const otherContacts = profile.emergencyContacts.filter((c) => !c.isPrimary)

  return (
    <div style={cardStyle}>
      {/* Edit button */}
      <button
        onClick={onEdit}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#FF525215',
          border: 'none',
          borderRadius: 8,
          padding: '6px 8px',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
        }}
        aria-label="编辑紧急信息"
      >
        ✏️
      </button>

      {/* Child info header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: '1.8rem' }}>{child.avatar}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{child.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {child.age}岁
            {latestWeight !== null && ` / ${latestWeight}kg`}
          </div>
        </div>
        {/* Blood type badge */}
        <div style={{
          marginLeft: 'auto',
          marginRight: 32,
          background: bloodColor + '15',
          color: bloodColor,
          fontWeight: 700,
          fontSize: '0.85rem',
          padding: '4px 10px',
          borderRadius: 8,
          border: `1px solid ${bloodColor}30`,
        }}>
          {BLOOD_TYPE_INFO[profile.bloodType]?.label ?? profile.bloodType}
          {profile.rhFactor !== 'unknown' && (
            <span style={{ fontSize: '0.7rem', marginLeft: 2 }}>
              {profile.rhFactor === 'positive' ? 'Rh+' : 'Rh-'}
            </span>
          )}
        </div>
      </div>

      {/* Allergies */}
      <div style={sectionLabel}>过敏信息</div>
      <div style={{ marginBottom: 4 }}>
        {profile.drugAllergies.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>药物: </span>
            <div style={chipContainerStyle}>
              {profile.drugAllergies.map((a) => (
                <span key={a} style={allergyChipStyle('#FF5252')}>{a}</span>
              ))}
            </div>
          </div>
        )}
        {profile.foodAllergies.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>食物: </span>
            <div style={chipContainerStyle}>
              {profile.foodAllergies.map((a) => (
                <span key={a} style={allergyChipStyle('#FF9800')}>{a}</span>
              ))}
            </div>
          </div>
        )}
        {profile.otherAllergies.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>其他: </span>
            <div style={chipContainerStyle}>
              {profile.otherAllergies.map((a) => (
                <span key={a} style={allergyChipStyle('#9C27B0')}>{a}</span>
              ))}
            </div>
          </div>
        )}
        {profile.drugAllergies.length === 0 && profile.foodAllergies.length === 0 && profile.otherAllergies.length === 0 && (
          <span style={noneStyle}>无</span>
        )}
      </div>

      {/* Medical conditions */}
      <div style={sectionLabel}>既往病史</div>
      <div style={{ marginBottom: 4 }}>
        {profile.medicalConditions.length > 0 ? (
          <div style={chipContainerStyle}>
            {profile.medicalConditions.map((c) => (
              <span key={c} style={allergyChipStyle('#607D8B')}>{c}</span>
            ))}
          </div>
        ) : (
          <span style={noneStyle}>无</span>
        )}
      </div>

      {/* Emergency contacts */}
      {profile.emergencyContacts.length > 0 && (
        <>
          <div style={sectionLabel}>紧急联系人</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
            {primaryContact && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FF525210',
                borderRadius: 8,
                padding: '8px 10px',
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{primaryContact.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 6 }}>{primaryContact.relationship}</span>
                  <span style={{ fontSize: '0.65rem', color: '#FF5252', marginLeft: 4, fontWeight: 500 }}>首要</span>
                </div>
                <a
                  href={`tel:${primaryContact.phone}`}
                  style={{
                    background: '#FF5252',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {primaryContact.phone}
                </a>
              </div>
            )}
            {otherContacts.map((contact, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--color-bg)',
                borderRadius: 8,
                padding: '8px 10px',
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{contact.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 6 }}>{contact.relationship}</span>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  style={{
                    color: '#FF5252',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {contact.phone}
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hospital info */}
      {profile.preferredHospital && (
        <>
          <div style={sectionLabel}>常去医院</div>
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: '0.85rem',
            marginBottom: 4,
          }}>
            <div style={{ fontWeight: 600 }}>{profile.preferredHospital}</div>
            {profile.hospitalAddress && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {profile.hospitalAddress}
              </div>
            )}
            {profile.hospitalPhone && (
              <a
                href={`tel:${profile.hospitalPhone}`}
                style={{ fontSize: '0.8rem', color: '#FF5252', fontWeight: 500, textDecoration: 'none' }}
              >
                {profile.hospitalPhone}
              </a>
            )}
          </div>
        </>
      )}

      {/* Quick-dial row */}
      <div style={{ ...sectionLabel, marginTop: 12 }}>一键拨号</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {QUICK_DIAL.map((item) => (
          <a
            key={item.phone}
            href={`tel:${item.phone}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: item.color + '12',
              border: `1px solid ${item.color}30`,
              borderRadius: 10,
              padding: '10px 6px',
              textDecoration: 'none',
              color: item.color,
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}
