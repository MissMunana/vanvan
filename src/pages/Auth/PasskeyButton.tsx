interface PasskeyButtonProps {
  loading: boolean
  onLogin: () => void
}

export default function PasskeyButton({ loading, onLogin }: PasskeyButtonProps) {
  return (
    <button
      onClick={onLogin}
      disabled={loading}
      style={{
        width: '100%',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        background: loading ? 'var(--color-border)' : 'var(--color-primary)',
        color: '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 20 }}>🔑</span>
      {loading ? '验证中...' : '使用 Passkey 登录'}
    </button>
  )
}
