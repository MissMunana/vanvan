import { useState, useMemo, useEffect } from 'react'
import { useHealthStore } from '../../stores/healthStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import type { MedicineCabinetItem, StorageCondition } from '../../types'
import { STORAGE_CONDITION_INFO } from '../../types'
import { DRUG_REGISTRY, type DrugId } from '../../utils/dosageUtils'
import { OPENED_SHELF_LIFE, STORAGE_RECOMMENDATIONS, QUANTITY_UNITS } from '../../data/medicineCabinetData'

export default function MedicineCabinet() {
  const cabinetItems = useHealthStore((s) => s.cabinetItems)
  const fetchCabinetItems = useHealthStore((s) => s.fetchCabinetItems)
  const addCabinetItem = useHealthStore((s) => s.addCabinetItem)
  const updateCabinetItem = useHealthStore((s) => s.updateCabinetItem)
  const deleteCabinetItem = useHealthStore((s) => s.deleteCabinetItem)
  const getExpiringItems = useHealthStore((s) => s.getExpiringItems)
  const getOpenedExpiredItems = useHealthStore((s) => s.getOpenedExpiredItems)
  const { showToast } = useToast()

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<MedicineCabinetItem | null>(null)

  useEffect(() => {
    fetchCabinetItems().catch(() => {})
  }, [fetchCabinetItems])

  const expiringItems = useMemo(() => getExpiringItems(30), [cabinetItems, getExpiringItems])
  const openedExpiredItems = useMemo(() => getOpenedExpiredItems(), [cabinetItems, getOpenedExpiredItems])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Expiry alerts */}
      {(expiringItems.length > 0 || openedExpiredItems.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {openedExpiredItems.map((item) => (
            <div key={`opened-${item.itemId}`} className="alert alert-danger" style={{ marginBottom: 6, fontSize: '0.8rem' }}>
              ⚠️ <strong>{item.name}</strong> 开封后已超过保质期，请丢弃
            </div>
          ))}
          {expiringItems.filter((i) => !openedExpiredItems.find((o) => o.itemId === i.itemId)).map((item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysLeft <= 0
            return (
              <div key={`exp-${item.itemId}`} className={`alert ${isExpired ? 'alert-danger' : 'alert-warning'}`} style={{ marginBottom: 6, fontSize: '0.8rem' }}>
                {isExpired ? '❌' : '⏰'} <strong>{item.name}</strong> {isExpired ? '已过期' : `将在 ${daysLeft} 天后过期`}
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-header" style={{ margin: 0 }}>家庭药箱</div>
        <button
          className="btn btn-health"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          onClick={() => { setEditingItem(null); setShowAdd(true) }}
        >
          + 添加药品
        </button>
      </div>

      {/* Medicine list */}
      {cabinetItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cabinetItems.map((item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysLeft <= 0
            const isExpiring = daysLeft > 0 && daysLeft <= 30
            const drugInfo = item.genericName ? DRUG_REGISTRY[item.genericName as DrugId] : null

            return (
              <div key={item.itemId} className="card" style={{ padding: 12, borderLeft: `3px solid ${isExpired ? '#FF5252' : isExpiring ? '#FFB800' : drugInfo?.color || 'var(--color-health)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {drugInfo?.icon || '💊'} {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span>{item.quantity}{item.quantityUnit}</span>
                      <span>{STORAGE_CONDITION_INFO[item.storageCondition]?.icon} {STORAGE_CONDITION_INFO[item.storageCondition]?.label}</span>
                      <span style={{ color: isExpired ? '#FF5252' : isExpiring ? '#FFB800' : undefined, fontWeight: isExpired || isExpiring ? 600 : undefined }}>
                        {isExpired ? '已过期' : isExpiring ? `${daysLeft}天后过期` : `有效至 ${item.expiryDate}`}
                      </span>
                    </div>
                    {item.openedDate && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        开封于 {item.openedDate}{item.openedShelfLifeDays ? ` · ${item.openedShelfLifeDays}天内使用` : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => { setEditingItem(item); setShowAdd(true) }}
                      style={{ fontSize: '0.7rem', color: 'var(--color-health)', padding: '2px 6px' }}
                    >
                      编辑
                    </button>
                    <button
                      className="btn-delete"
                      style={{ fontSize: '0.7rem' }}
                      onClick={async () => {
                        if (window.confirm(`确定要删除「${item.name}」？`)) {
                          try { await deleteCabinetItem(item.itemId); showToast('已删除') } catch { showToast('删除失败') }
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">🗄️</div>
            <div className="empty-state-text">药箱空空如也</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>添加家中常备药品，管理有效期</div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      <CabinetFormModal
        open={showAdd}
        item={editingItem}
        onClose={() => { setShowAdd(false); setEditingItem(null) }}
        onSave={async (data) => {
          try {
            if (editingItem) {
              await updateCabinetItem(editingItem.itemId, data)
              showToast('药品已更新')
            } else {
              await addCabinetItem(data)
              showToast('药品已添加')
            }
            setShowAdd(false)
            setEditingItem(null)
          } catch {
            showToast('保存失败，请重试')
          }
        }}
      />
    </div>
  )
}

function CabinetFormModal({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean
  item: MedicineCabinetItem | null
  onClose: () => void
  onSave: (data: Omit<MedicineCabinetItem, 'itemId' | 'familyId' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [quantityUnit, setQuantityUnit] = useState('盒')
  const [expiryDate, setExpiryDate] = useState('')
  const [openedDate, setOpenedDate] = useState('')
  const [openedShelfLifeDays, setOpenedShelfLifeDays] = useState('')
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('room_temp')
  const [storageNote, setStorageNote] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [note, setNote] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name)
        setGenericName(item.genericName)
        setQuantity(String(item.quantity))
        setQuantityUnit(item.quantityUnit)
        setExpiryDate(item.expiryDate)
        setOpenedDate(item.openedDate || '')
        setOpenedShelfLifeDays(item.openedShelfLifeDays ? String(item.openedShelfLifeDays) : '')
        setStorageCondition(item.storageCondition)
        setStorageNote(item.storageNote)
        setPurchaseDate(item.purchaseDate || '')
        setBatchNumber(item.batchNumber)
        setNote(item.note)
      } else {
        setName(''); setGenericName(''); setQuantity('1'); setQuantityUnit('盒')
        setExpiryDate(''); setOpenedDate(''); setOpenedShelfLifeDays('')
        setStorageCondition('room_temp'); setStorageNote('')
        setPurchaseDate(''); setBatchNumber(''); setNote('')
      }
    }
  }, [open, item])

  // Auto-fill from drug registry
  const handleDrugSelect = (drugId: string) => {
    setGenericName(drugId)
    const drug = DRUG_REGISTRY[drugId as DrugId]
    if (drug) {
      setName(drug.chineseName)
      const shelfLife = OPENED_SHELF_LIFE[drugId]
      if (shelfLife) setOpenedShelfLifeDays(String(shelfLife.days))
      const storage = STORAGE_RECOMMENDATIONS[drugId]
      if (storage) {
        setStorageCondition(storage.condition)
        setStorageNote(storage.note)
      }
    }
  }

  const handleSubmit = () => {
    if (!name.trim() || !expiryDate) return
    onSave({
      name: name.trim(),
      genericName,
      quantity: parseFloat(quantity) || 0,
      quantityUnit,
      expiryDate,
      openedDate: openedDate || null,
      openedShelfLifeDays: openedShelfLifeDays ? parseInt(openedShelfLifeDays) : null,
      storageCondition,
      storageNote,
      purchaseDate: purchaseDate || null,
      batchNumber,
      note,
    })
  }

  const drugOptions = Object.values(DRUG_REGISTRY)

  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑药品' : '添加药品'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Quick drug select */}
        {!item && (
          <div>
            <label className="form-label">快捷选择（可选）</label>
            <select value={genericName} onChange={(e) => handleDrugSelect(e.target.value)}>
              <option value="">自定义药品</option>
              {drugOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.chineseName} ({d.brandNames[0]})</option>
              ))}
            </select>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="form-label">药品名称 *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：布洛芬混悬液" />
        </div>

        {/* Quantity */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">数量</label>
            <input type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" step="1" />
          </div>
          <div style={{ width: 80 }}>
            <label className="form-label">单位</label>
            <select value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)}>
              {QUANTITY_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Expiry date */}
        <div>
          <label className="form-label">有效期 *</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>

        {/* Opened date */}
        <div>
          <label className="form-label">开封日期（可选）</label>
          <input type="date" value={openedDate} onChange={(e) => setOpenedDate(e.target.value)} />
        </div>

        {/* Opened shelf life */}
        {openedDate && (
          <div>
            <label className="form-label">开封后保质天数</label>
            <input type="number" inputMode="numeric" value={openedShelfLifeDays} onChange={(e) => setOpenedShelfLifeDays(e.target.value)} placeholder="例如 14" min="1" />
            {genericName && OPENED_SHELF_LIFE[genericName] && (
              <div style={{ fontSize: '0.7rem', color: 'var(--color-health)', marginTop: 2 }}>
                💡 {OPENED_SHELF_LIFE[genericName].note}
              </div>
            )}
          </div>
        )}

        {/* Storage condition */}
        <div>
          <label className="form-label">存储条件</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(STORAGE_CONDITION_INFO) as StorageCondition[]).map((cond) => (
              <button
                key={cond}
                onClick={() => setStorageCondition(cond)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: storageCondition === cond ? '2px solid var(--color-health)' : '1px solid var(--color-border)',
                  background: storageCondition === cond ? 'var(--color-health-light)' : 'transparent',
                  fontSize: '0.78rem',
                }}
              >
                {STORAGE_CONDITION_INFO[cond].icon} {STORAGE_CONDITION_INFO[cond].label}
              </button>
            ))}
          </div>
          {storageNote && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              📦 {storageNote}
            </div>
          )}
        </div>

        {/* Purchase date & batch */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">购买日期</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">批号</label>
            <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="可选" />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="form-label">备注</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="可选" />
        </div>

        <button
          className="btn btn-health btn-block"
          onClick={handleSubmit}
          disabled={!name.trim() || !expiryDate}
        >
          {item ? '保存修改' : '添加到药箱'}
        </button>
      </div>
    </Modal>
  )
}
