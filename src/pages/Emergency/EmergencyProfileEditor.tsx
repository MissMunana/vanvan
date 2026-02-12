import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import type { EmergencyProfile, EmergencyContact, BloodType, RhFactor } from '../../types'
import { BLOOD_TYPE_INFO } from '../../types'

interface EmergencyProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  profile: EmergencyProfile | null
  childId: string
}

const BLOOD_TYPES: BloodType[] = ['A', 'B', 'AB', 'O', 'unknown']
const RH_OPTIONS: { value: RhFactor; label: string }[] = [
  { value: 'positive', label: 'Rh+' },
  { value: 'negative', label: 'Rh-' },
  { value: 'unknown', label: '未知' },
]
const RELATIONSHIPS = ['爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆', '其他']

const emptyContact = (): EmergencyContact => ({
  name: '',
  relationship: '爸爸',
  phone: '',
  isPrimary: false,
})

export default function EmergencyProfileEditor({ isOpen, onClose, profile, childId }: EmergencyProfileEditorProps) {
  const upsertEmergencyProfile = useHealthStore((s) => s.upsertEmergencyProfile)
  const { showToast } = useToast()

  const [bloodType, setBloodType] = useState<BloodType>('unknown')
  const [rhFactor, setRhFactor] = useState<RhFactor>('unknown')
  const [drugAllergies, setDrugAllergies] = useState<string[]>([])
  const [foodAllergies, setFoodAllergies] = useState<string[]>([])
  const [otherAllergies, setOtherAllergies] = useState<string[]>([])
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [contacts, setContacts] = useState<EmergencyContact[]>([emptyContact()])
  const [preferredHospital, setPreferredHospital] = useState('')
  const [hospitalAddress, setHospitalAddress] = useState('')
  const [hospitalPhone, setHospitalPhone] = useState('')
  const [insuranceInfo, setInsuranceInfo] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Tag input states
  const [drugInput, setDrugInput] = useState('')
  const [foodInput, setFoodInput] = useState('')
  const [otherInput, setOtherInput] = useState('')
  const [conditionInput, setConditionInput] = useState('')

  useEffect(() => {
    if (profile) {
      setBloodType(profile.bloodType)
      setRhFactor(profile.rhFactor)
      setDrugAllergies([...profile.drugAllergies])
      setFoodAllergies([...profile.foodAllergies])
      setOtherAllergies([...profile.otherAllergies])
      setMedicalConditions([...profile.medicalConditions])
      setContacts(profile.emergencyContacts.length > 0 ? [...profile.emergencyContacts] : [emptyContact()])
      setPreferredHospital(profile.preferredHospital)
      setHospitalAddress(profile.hospitalAddress)
      setHospitalPhone(profile.hospitalPhone)
      setInsuranceInfo(profile.insuranceInfo)
      setNote(profile.note)
    } else {
      setBloodType('unknown')
      setRhFactor('unknown')
      setDrugAllergies([])
      setFoodAllergies([])
      setOtherAllergies([])
      setMedicalConditions([])
      setContacts([emptyContact()])
      setPreferredHospital('')
      setHospitalAddress('')
      setHospitalPhone('')
      setInsuranceInfo('')
      setNote('')
    }
  }, [profile, isOpen])

  const addTag = useCallback((
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setter((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed])
    inputSetter('')
  }, [])

  const removeTag = useCallback((
    tag: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.filter((t) => t !== tag))
  }, [])

  const updateContact = useCallback((index: number, field: keyof EmergencyContact, value: string | boolean) => {
    setContacts((prev) => prev.map((c, i) => {
      if (i === index) return { ...c, [field]: value }
      // When setting isPrimary to true, unset all others
      if (field === 'isPrimary' && value === true) return { ...c, isPrimary: false }
      return c
    }))
  }, [])

  const addContact = useCallback(() => {
    setContacts((prev) => [...prev, emptyContact()])
  }, [])

  const removeContact = useCallback((index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertEmergencyProfile({
        childId,
        bloodType,
        rhFactor,
        drugAllergies,
        foodAllergies,
        otherAllergies,
        medicalConditions,
        emergencyContacts: contacts.filter((c) => c.name.trim() || c.phone.trim()),
        preferredHospital,
        hospitalAddress,
        hospitalPhone,
        insuranceInfo,
        note,
      })
      showToast('紧急信息已保存')
      onClose()
    } catch {
      showToast('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    display: 'block',
  }

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#FF525215',
    color: '#FF5252',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: '0.8rem',
    fontWeight: 500,
  }

  const renderTagInput = (
    label: string,
    tags: string[],
    inputValue: string,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
    tagsSetter: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
  ) => (
    <div style={{ marginBottom: 12 }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}>
        {tags.map((tag) => (
          <span key={tag} style={chipStyle}>
            {tag}
            <button
              onClick={() => removeTag(tag, tagsSetter)}
              style={{ background: 'none', border: 'none', color: '#FF5252', fontSize: '1rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => inputSetter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag(inputValue, tagsSetter, inputSetter)
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button
          className="btn btn-outline"
          style={{ padding: '8px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          onClick={() => addTag(inputValue, tagsSetter, inputSetter)}
        >
          添加
        </button>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 16px',
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>编辑紧急信息</h3>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, lineHeight: 1 }}
              >
                x
              </button>
            </div>

            {/* Blood type */}
            <div style={sectionStyle}>
              <span style={labelStyle}>血型</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {BLOOD_TYPES.map((bt) => (
                  <button
                    key={bt}
                    className={`toggle-btn${bloodType === bt ? ' active' : ''}`}
                    onClick={() => setBloodType(bt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      ...(bloodType === bt ? { background: '#FF5252', color: 'white' } : {}),
                    }}
                  >
                    {BLOOD_TYPE_INFO[bt].label}
                  </button>
                ))}
              </div>
              <span style={labelStyle}>Rh 因子</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {RH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`toggle-btn${rhFactor === opt.value ? ' active' : ''}`}
                    onClick={() => setRhFactor(opt.value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: '0.85rem',
                      ...(rhFactor === opt.value ? { background: '#FF5252', color: 'white' } : {}),
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div style={sectionStyle}>
              {renderTagInput('药物过敏', drugAllergies, drugInput, setDrugInput, setDrugAllergies, '例如：青霉素')}
              {renderTagInput('食物过敏', foodAllergies, foodInput, setFoodInput, setFoodAllergies, '例如：花生')}
              {renderTagInput('其他过敏', otherAllergies, otherInput, setOtherInput, setOtherAllergies, '例如：花粉')}
            </div>

            {/* Medical conditions */}
            <div style={sectionStyle}>
              {renderTagInput('既往病史', medicalConditions, conditionInput, setConditionInput, setMedicalConditions, '例如：哮喘')}
            </div>

            {/* Emergency contacts */}
            <div style={sectionStyle}>
              <span style={labelStyle}>紧急联系人</span>
              {contacts.map((contact, idx) => (
                <div key={idx} style={{
                  background: 'var(--color-bg)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  position: 'relative',
                }}>
                  {contacts.length > 1 && (
                    <button
                      onClick={() => removeContact(idx)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'none',
                        border: 'none',
                        color: '#FF5252',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(idx, 'name', e.target.value)}
                      placeholder="姓名"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                    <select
                      value={contact.relationship}
                      onChange={(e) => updateContact(idx, 'relationship', e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                    placeholder="电话号码"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', marginBottom: 8 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(e) => updateContact(idx, 'isPrimary', e.target.checked)}
                    />
                    设为首要联系人
                  </label>
                </div>
              ))}
              <button
                className="btn btn-outline"
                onClick={addContact}
                style={{ width: '100%', fontSize: '0.85rem', marginTop: 4 }}
              >
                + 添加联系人
              </button>
            </div>

            {/* Hospital info */}
            <div style={sectionStyle}>
              <span style={labelStyle}>常去医院</span>
              <input
                type="text"
                value={preferredHospital}
                onChange={(e) => setPreferredHospital(e.target.value)}
                placeholder="医院名称"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', marginBottom: 8 }}
              />
              <input
                type="text"
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                placeholder="医院地址"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', marginBottom: 8 }}
              />
              <input
                type="tel"
                value={hospitalPhone}
                onChange={(e) => setHospitalPhone(e.target.value)}
                placeholder="医院电话"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Insurance */}
            <div style={sectionStyle}>
              <span style={labelStyle}>医保/保险信息</span>
              <input
                type="text"
                value={insuranceInfo}
                onChange={(e) => setInsuranceInfo(e.target.value)}
                placeholder="例如：城镇居民医保"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Note */}
            <div style={sectionStyle}>
              <span style={labelStyle}>备注</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="其他需要说明的信息"
                rows={2}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>

            {/* Save button */}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', marginTop: 4, marginBottom: 16 }}
            >
              {saving ? '保存中...' : '保存紧急信息'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
