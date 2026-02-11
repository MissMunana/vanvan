import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/common/Toast'
import PasskeyButton from './PasskeyButton'

type AuthMode = 'login' | 'register'

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyEmail, setPasskeyEmail] = useState('')
  const [showPasskey, setShowPasskey] = useState(false)

  const { login, register, loginWithPasskey } = useAuth()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!email || !password) {
      showToast('请填写邮箱和密码')
      return
    }

    if (mode === 'register') {
      if (password.length < 6) {
        showToast('密码至少需要6个字符')
        return
      }
      if (password !== confirmPassword) {
        showToast('两次密码不一致')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        showToast('登录成功')
      } else {
        await register(email, password)
        showToast('注册成功')
      }
    } catch (err: any) {
      const msg = err.message || '操作失败'
      if (msg.includes('already been registered') || msg.includes('already registered')) {
        showToast('该邮箱已注册，请直接登录')
      } else if (msg.includes('Invalid') || msg.includes('invalid')) {
        showToast('邮箱或密码错误')
      } else {
        showToast(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!passkeyEmail) {
      showToast('请输入邮箱')
      return
    }
    setLoading(true)
    try {
      await loginWithPasskey(passkeyEmail)
      showToast('Passkey 登录成功')
    } catch (err: any) {
      const msg = err.message || 'Passkey 登录失败'
      if (msg.includes('not found') || msg.includes('No passkeys')) {
        showToast('该邮箱未注册 Passkey')
      } else {
        showToast(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      flex: 1,
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      {/* Logo & Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
      >
        <div style={{ fontSize: 56, marginBottom: 'var(--space-2)' }}>⭐</div>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text)',
          margin: 0,
        }}>
          小星星成长宝
        </h1>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-1)',
        }}>
          培养好习惯，收获小星星
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <AnimatePresence mode="wait">
          {!showPasskey ? (
            <motion.div
              key="email-auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Mode Tabs */}
              <div style={{
                display: 'flex',
                gap: 'var(--space-1)',
                marginBottom: 'var(--space-6)',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 2,
              }}>
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      padding: 'var(--space-2) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: 'var(--text-base)',
                      fontWeight: mode === m ? 'var(--font-semibold)' : 'var(--font-normal)',
                      background: mode === m ? 'var(--color-card)' : 'transparent',
                      color: mode === m ? 'var(--color-text)' : 'var(--color-text-secondary)',
                      boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m === 'login' ? '登录' : '注册'}
                  </button>
                ))}
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-1)',
                  }}>邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-base)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-1)',
                  }}>密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? '至少6个字符' : '输入密码'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--text-base)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                {mode === 'register' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ marginBottom: 'var(--space-4)', overflow: 'hidden' }}
                  >
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-1)',
                    }}>确认密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-base)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    background: loading ? 'var(--color-border)' : 'var(--color-primary)',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
                </button>
              </form>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                margin: 'var(--space-5) 0',
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>或</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>

              {/* Passkey Login */}
              <button
                onClick={() => setShowPasskey(true)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  background: 'var(--color-card)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 20 }}>🔑</span>
                使用 Passkey 登录
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="passkey-auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button
                onClick={() => setShowPasskey(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                ← 返回邮箱登录
              </button>

              <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-2)',
              }}>
                🔑 Passkey 登录
              </h2>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--space-5)',
              }}>
                使用指纹、面容或安全密钥快速登录
              </p>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-1)',
                }}>邮箱</label>
                <input
                  type="email"
                  value={passkeyEmail}
                  onChange={(e) => setPasskeyEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email webauthn"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-base)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <PasskeyButton
                loading={loading}
                onLogin={handlePasskeyLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
