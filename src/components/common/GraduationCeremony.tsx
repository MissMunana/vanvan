import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppIcon } from './AppIcon'

interface GraduationCeremonyProps {
  show: boolean
  taskName: string
  onClose: () => void
}

function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const colors = ['#FFB800', '#FF6B6B', '#4CAF50', '#2196F3', '#E91E63', '#FF9800']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = 6 + Math.random() * 8

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: x * (0.5 + Math.random()),
        y: y * (0.5 + Math.random()) - 100,
        scale: [1, 1.5, 0],
      }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        top: '50%',
        left: '50%',
      }}
    />
  )
}

export default function GraduationCeremony({ show, taskName, onClose }: GraduationCeremonyProps) {
  const [particles, setParticles] = useState<{ id: number; delay: number; x: number; y: number }[]>([])

  useEffect(() => {
    if (show) {
      const ps = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
      }))
      setParticles(ps)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            padding: 24,
          }}
        >
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} />
            ))}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.3 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 80,
              }}
            >
              <AppIcon name="Trophy" size={80} color="#FFB800" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ textAlign: 'center', color: 'white', marginTop: 16 }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              习惯毕业啦！
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
              恭喜你！<strong>「{taskName}」</strong>
              <br />
              已经成为你的一部分了！
            </div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 12 }}>
              连续坚持66天，你获得了「习惯大师」勋章！
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              marginTop: 32,
              padding: '12px 40px',
              borderRadius: 20,
              background: 'var(--color-primary)',
              color: 'white',
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            太棒了！
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
