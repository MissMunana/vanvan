import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppIcon } from './AppIcon'

interface ScreenTimeLockProps {
  show: boolean
  type: 'limit' | 'night'
  parentPin: string
  onUnlock: () => void
}

export default function ScreenTimeLock({ show, type, parentPin, onUnlock }: ScreenTimeLockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (pin === parentPin) {
      setPin('')
      setError(false)
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            color: 'white',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ fontSize: 64, marginBottom: 20 }}
          >
            <AppIcon name={type === 'night' ? 'Moon' : 'Eye'} size={64} color="white" />
          </motion.div>

          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
            {type === 'night' ? '该休息啦！' : '休息一下吧！'}
          </div>
          <div style={{ fontSize: 15, opacity: 0.85, marginBottom: 32, textAlign: 'center', lineHeight: 1.6 }}>
            {type === 'night'
              ? '现在是休息时间，让眼睛好好休息一下吧'
              : '你已经使用了很长时间啦，记得休息一下眼睛哦！'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 'min(340px, 80vw)',
          }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8, textAlign: 'center' }}>
              家长密码解锁
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="请输入家长密码"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: error ? '2px solid #FF5252' : '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: 16,
                textAlign: 'center',
                letterSpacing: 8,
                outline: 'none',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#FF8A80', textAlign: 'center', marginTop: 6 }}>
                密码错误
              </div>
            )}
            <button
              onClick={handleSubmit}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              解锁
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
