import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from './components/Layout/BottomNav'
import { SideNav } from './components/Layout/SideNav'
import { useIsTablet } from './hooks/useMediaQuery'
import { useAppStore } from './stores/appStore'
import { useTaskStore } from './stores/taskStore'
import { useScreenTime } from './hooks/useScreenTime'
import ScreenTimeLock from './components/common/ScreenTimeLock'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Parent from './pages/Parent'
import Badges from './pages/Badges'
import Print from './pages/Print'
import Health from './pages/Health'
import Knowledge from './pages/Knowledge'
import InstallPrompt from './components/common/InstallPrompt'
import { Agentation } from 'agentation'

export default function App() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted)
  const refreshDailyStatus = useTaskStore((s) => s.refreshDailyStatus)
  const getCurrentChild = useAppStore((s) => s.getCurrentChild)
  const parentPin = useAppStore((s) => s.parentPin)
  const location = useLocation()

  const [screenLock, setScreenLock] = useState<{ show: boolean; type: 'limit' | 'night' }>({ show: false, type: 'limit' })

  useEffect(() => {
    refreshDailyStatus()
  }, [refreshDailyStatus])

  const child = getCurrentChild()
  const screenTimeConfig = child?.settings?.screenTime

  const onLimitReached = useCallback(() => {
    setScreenLock({ show: true, type: 'limit' })
  }, [])

  const onNightLock = useCallback(() => {
    setScreenLock({ show: true, type: 'night' })
  }, [])

  useScreenTime(screenTimeConfig, onLimitReached, onNightLock)

  const isTablet = useIsTablet()
  const hiddenNavRoutes = ['/print']
  const showNav = !hiddenNavRoutes.includes(location.pathname)

  if (!onboardingCompleted) {
    return <Onboarding />
  }

  return (
    <>
      {isTablet && showNav && <SideNav />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, minHeight: 0 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/health" element={<Health />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/parent" element={<Parent />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/print" element={<Print />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      {showNav && <BottomNav />}
      <InstallPrompt />
      <ScreenTimeLock
        show={screenLock.show}
        type={screenLock.type}
        parentPin={parentPin}
        onUnlock={() => setScreenLock({ show: false, type: 'limit' })}
      />
      {import.meta.env.DEV && <Agentation />}
    </>
  )
}
