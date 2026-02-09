import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/Layout/BottomNav'
import { useAppStore } from './stores/appStore'
import { useTaskStore } from './stores/taskStore'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Parent from './pages/Parent'
import InstallPrompt from './components/common/InstallPrompt'

export default function App() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted)
  const refreshDailyStatus = useTaskStore((s) => s.refreshDailyStatus)

  useEffect(() => {
    refreshDailyStatus()
  }, [refreshDailyStatus])

  if (!onboardingCompleted) {
    return <Onboarding />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </>
  )
}
