import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Star {
  id: number
  x: number
  delay: number
}

interface PointAnimationProps {
  trigger: number
  points?: number
}

export function PointAnimation({ trigger, points }: PointAnimationProps) {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const newStars = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      delay: i * 0.08,
    }))
    setStars(newStars)
    setTimeout(() => setStars([]), 1500)
  }, [trigger])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 300,
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9998,
    }}>
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 1, y: -20, x: star.x, scale: 1 }}
            animate={{
              opacity: [1, 1, 0],
              y: [window.innerHeight * 0.1, window.innerHeight * 0.45, window.innerHeight * 0.35],
              x: [star.x, star.x * 0.3, 0],
              scale: [1, 0.8, 0],
            }}
            transition={{
              duration: 1.2,
              delay: star.delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              fontSize: '1.5rem',
              left: '50%',
            }}
          >
            ⭐
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {trigger > 0 && points && (
          <motion.div
            key={`pts-${trigger}`}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1.3, 1, 0.8] }}
            transition={{ duration: 1.5, delay: 0.5 }}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#FFB800',
              textShadow: '0 2px 8px rgba(255,184,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            +{points}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
