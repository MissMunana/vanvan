import { useEffect, useState, useCallback, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from './components/Layout/BottomNav'
import { SideNav } from './components/Layout/SideNav'
import { TopBar } from './components/Layout/TopBar'
import { useIsTablet } from './hooks/useMediaQuery'
import { useAppStore } from './stores/appStore'
import { useTaskStore } from './stores/taskStore'
import { useAuthStore } from './stores/authStore'
import { getToday } from './utils/generateId'
import { useScreenTime } from './hooks/useScreenTime'
import ScreenTimeLock from './components/common/ScreenTimeLock'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Parent from './pages/Parent'
import Badges from './pages/Badges'
import Print from './pages/Print'
import Health from './pages/Health'
import HealthReport from './pages/HealthReport'
import Knowledge from './pages/Knowledge'
import Emergency from './pages/Emergency'
import Emotion from './pages/Emotion'
import JoinFamily from './pages/Auth/JoinFamily'
import InstallPrompt from './components/common/InstallPrompt'
import { supabase } from './lib/supabase-browser'
import { Agentation } from 'agentation'

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isDataLoaded = useAuthStore((s) => s.isDataLoaded)
  const setDataLoaded = useAuthStore((s) => s.setDataLoaded)
  const initialize = useAuthStore((s) => s.initialize)
  const setSession = useAuthStore((s) => s.setSession)

  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted)
  const children = useAppStore((s) => s.children)
  const refreshDailyStatus = useTaskStore((s) => s.refreshDailyStatus)
  const getCurrentChild = useAppStore((s) => s.getCurrentChild)
  const parentPin = useAppStore((s) => s.parentPin)
  const location = useLocation()

  const fetchFamily = useAppStore((s) => s.fetchFamily)
  const fetchChildren = useAppStore((s) => s.fetchChildren)

  const [screenLock, setScreenLock] = useState<{ show: boolean; type: 'limit' | 'night' }>({ show: false, type: 'limit' })

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  // After auth, load only core data (family + children). Page-level data loaded by usePageData.
  useEffect(() => {
    if (isAuthenticated && !isDataLoaded) {
      const load = async () => {
        try {
          await Promise.all([fetchFamily(), fetchChildren()])
        } catch (err) {
          console.error('Core data load failed:', err)
        } finally {
          setDataLoaded(true)
        }
      }
      load()
    }
  }, [isAuthenticated, isDataLoaded, fetchFamily, fetchChildren, setDataLoaded])

  // Refresh daily status only when date changes (not on every mount)
  const lastCheckedDateRef = useRef<string | null>(null)
  useEffect(() => {
    const today = getToday()
    if (lastCheckedDateRef.current !== today) {
      lastCheckedDateRef.current = today
      refreshDailyStatus()
    }
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

  const currentChildId = useAppStore((s) => s.currentChildId)

  // Apply per-child theme color
  useEffect(() => {
    const c = children.find((ch) => ch.childId === currentChildId)
    if (c?.themeColor) {
      document.documentElement.style.setProperty('--color-child-accent', c.themeColor)
    } else {
      document.documentElement.style.removeProperty('--color-child-accent')
    }
  }, [currentChildId, children])

  const isTablet = useIsTablet()
  const hiddenNavRoutes = ['/print', '/health-report', '/emergency', '/emotion']
  const showNav = !hiddenNavRoutes.includes(location.pathname)
  const showTopBar = showNav && !['/parent'].includes(location.pathname)

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        width: '100%',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            加载中...
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated -> Auth page
  if (!isAuthenticated) {
    return <Auth />
  }

  // Wait for server data to load before deciding onboarding
  if (!isDataLoaded) {
    return (
      <div style={{
        minHeight: '100dvh',
        width: '100%',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            正在同步数据...
          </div>
        </div>
      </div>
    )
  }

  // Allow /join route before onboarding (invited users)
  if (location.pathname === '/join') {
    return <JoinFamily />
  }

  // Authenticated but no children -> Onboarding
  if (!onboardingCompleted || children.length === 0) {
    return <Onboarding />
  }

  return (
    <>
      {isTablet && showNav && <SideNav />}
      {showTopBar && <TopBar />}
      <div style={{ flex: 1, minWidth: 0, paddingTop: showTopBar ? 52 : 0 }}>
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
              <Route path="/health-report" element={<HealthReport />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/emotion" element={<Emotion />} />
              <Route path="/join" element={<JoinFamily />} />
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
