import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamilyStore } from '../../stores/familyStore'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/common/Toast'

export default function JoinFamily() {
  const navigate = useNavigate()
  const joinFamily = useFamilyStore((s) => s.joinFamily)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { showToast } = useToast()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      await joinFamily(code.trim())
      showToast('已成功加入家庭')
      // Reload to refresh family data
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || '邀请码无效或已过期')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--color-bg)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔑</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>请先登录</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
          需要登录账号后才能加入家庭
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/auth')}>
          去登录
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--color-bg)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>加入家庭</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 24, textAlign: 'center' }}>
        输入家庭管理员分享的6位邀请码
      </p>

      <input
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
          setError('')
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="XXXXXX"
        style={{
          textAlign: 'center',
          fontSize: '1.8rem',
          letterSpacing: '0.4em',
          maxWidth: 260,
          fontWeight: 700,
          textTransform: 'uppercase',
          border: error ? '2px solid var(--color-danger)' : undefined,
        }}
      />

      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          返回
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={code.length < 6 || loading}
        >
          {loading ? '加入中...' : '加入家庭'}
        </button>
      </div>
    </div>
  )
}
