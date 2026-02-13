import { useState, useEffect } from 'react'
import { useFamilyStore } from '../../stores/familyStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { FAMILY_ROLE_INFO } from '../../types'
import type { FamilyRole, FamilyMember } from '../../types'

export default function MemberManager() {
  const members = useFamilyStore((s) => s.members)
  const currentMember = useFamilyStore((s) => s.currentMember)
  const fetchMembers = useFamilyStore((s) => s.fetchMembers)
  const inviteMember = useFamilyStore((s) => s.inviteMember)
  const updateMemberRole = useFamilyStore((s) => s.updateMemberRole)
  const removeMember = useFamilyStore((s) => s.removeMember)
  const { showToast } = useToast()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState<FamilyRole>('co_admin')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [editRole, setEditRole] = useState<FamilyRole>('co_admin')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<FamilyMember | null>(null)

  useEffect(() => {
    fetchMembers().catch(() => {})
  }, [fetchMembers])

  const isAdmin = currentMember?.role === 'admin'

  const handleInvite = async () => {
    setInviteLoading(true)
    try {
      const invite = await inviteMember(inviteRole)
      setInviteCode(invite.inviteCode)
    } catch {
      showToast('生成邀请码失败')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingMember) return
    try {
      await updateMemberRole(editingMember.memberId, editRole)
      setEditingMember(null)
      showToast('角色已更新')
    } catch {
      showToast('更新失败')
    }
  }

  const handleRemove = async () => {
    if (!showRemoveConfirm) return
    try {
      await removeMember(showRemoveConfirm.memberId)
      setShowRemoveConfirm(null)
      showToast('已移除成员')
    } catch {
      showToast('移除失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>家庭成员</h3>
        {isAdmin && (
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => { setShowInvite(true); setInviteCode('') }}
          >
            + 邀请成员
          </button>
        )}
      </div>

      {/* Member list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {members.map((m) => {
          const roleInfo = FAMILY_ROLE_INFO[m.role]
          const isSelf = m.memberId === currentMember?.memberId
          return (
            <div
              key={m.memberId}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: isSelf ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '1.8rem' }}>{m.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {m.displayName || '未命名'}
                  {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 6 }}>（我）</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{
                    fontSize: '0.7rem',
                    background: m.role === 'admin' ? '#FFF3E0' : m.role === 'co_admin' ? '#E8F5E9' : '#F3E5F5',
                    color: m.role === 'admin' ? '#E65100' : m.role === 'co_admin' ? '#2E7D32' : '#7B1FA2',
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontWeight: 600,
                  }}>
                    {roleInfo.icon} {roleInfo.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(m.joinedAt).toLocaleDateString('zh-CN')} 加入
                  </span>
                </div>
              </div>
              {isAdmin && !isSelf && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setEditingMember(m); setEditRole(m.role) }}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(m)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 8, background: '#FFF0F0', border: '1px solid #FFCDD2', color: 'var(--color-danger)' }}
                  >
                    移除
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            暂无成员数据
          </div>
        )}
      </div>

      {/* Role description */}
      <div style={{ marginTop: 20, padding: 14, background: '#F5F5F5', borderRadius: 10, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>角色说明</div>
        {(['admin', 'co_admin', 'observer'] as FamilyRole[]).map((r) => (
          <div key={r} style={{ marginBottom: 4 }}>
            {FAMILY_ROLE_INFO[r].icon} <strong>{FAMILY_ROLE_INFO[r].label}</strong>：{FAMILY_ROLE_INFO[r].description}
          </div>
        ))}
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="邀请新成员">
        <div style={{ padding: 16 }}>
          {!inviteCode ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>选择角色</label>
                {(['co_admin', 'observer'] as FamilyRole[]).map((r) => (
                  <label
                    key={r}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      marginBottom: 6,
                      border: inviteRole === r ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: inviteRole === r ? 'var(--color-primary-light)' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="inviteRole"
                      checked={inviteRole === r}
                      onChange={() => setInviteRole(r)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{FAMILY_ROLE_INFO[r].icon} {FAMILY_ROLE_INFO[r].label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{FAMILY_ROLE_INFO[r].description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading ? '生成中...' : '生成邀请码'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                请将以下邀请码发送给对方
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: 8,
                padding: '16px 20px',
                background: '#F5F5F5',
                borderRadius: 12,
                fontFamily: 'monospace',
                marginBottom: 12,
              }}>
                {inviteCode}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                有效期 72 小时，仅可使用一次
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode).then(() => showToast('已复制'))
                }}
              >
                复制邀请码
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit role modal */}
      <Modal open={!!editingMember} onClose={() => setEditingMember(null)} title="修改角色">
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 12, fontSize: '0.85rem' }}>
            修改 <strong>{editingMember?.displayName}</strong> 的角色：
          </div>
          {(['co_admin', 'observer'] as FamilyRole[]).map((r) => (
            <label
              key={r}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 6,
                border: editRole === r ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: editRole === r ? 'var(--color-primary-light)' : 'white',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="editRole"
                checked={editRole === r}
                onChange={() => setEditRole(r)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{FAMILY_ROLE_INFO[r].icon} {FAMILY_ROLE_INFO[r].label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{FAMILY_ROLE_INFO[r].description}</div>
              </div>
            </label>
          ))}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleUpdateRole}>
            保存
          </button>
        </div>
      </Modal>

      {/* Remove confirm modal */}
      <Modal open={!!showRemoveConfirm} onClose={() => setShowRemoveConfirm(null)} title="确认移除">
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>
            确定要移除成员 <strong>{showRemoveConfirm?.displayName}</strong> 吗？移除后对方将无法访问家庭数据。
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => setShowRemoveConfirm(null)}>取消</button>
            <button
              className="btn"
              style={{ flex: 1, background: 'var(--color-danger)', color: 'white' }}
              onClick={handleRemove}
            >
              确认移除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
