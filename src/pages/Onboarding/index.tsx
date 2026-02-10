import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { useRewardStore } from '../../stores/rewardStore'
import { TASK_TEMPLATES, REWARD_TEMPLATES, AVATAR_OPTIONS } from '../../data/templates'
import { getAgeGroup, getAgeFromBirthday, formatAge } from '../../hooks/useAgeGroup'
import type { TaskCategory, RewardCategory } from '../../types'
import { AppIcon } from '../../components/common/AppIcon'

const PICKER_ITEM_H = 40
const PICKER_VISIBLE = 5

type Mode = 'welcome' | 'login' | 'register'

// Synchronously check localStorage for existing data (bypasses Zustand async hydration)
function checkLocalData(): { hasData: boolean; childId: string } {
  try {
    const stored = localStorage.getItem('star-app')
    if (!stored) return { hasData: false, childId: '' }
    const parsed = JSON.parse(stored)
    const children = parsed?.state?.children
    if (Array.isArray(children) && children.length > 0) {
      const currentId = parsed?.state?.currentChildId || children[0]?.childId || ''
      return { hasData: true, childId: currentId }
    }
  } catch { /* ignore */ }
  return { hasData: false, childId: '' }
}

export default function Onboarding() {
  const children = useAppStore((s) => s.children)
  const parentPin = useAppStore((s) => s.parentPin)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const setCurrentChild = useAppStore((s) => s.setCurrentChild)
  const addChild = useAppStore((s) => s.addChild)
  const setParentPin = useAppStore((s) => s.setParentPin)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const addTasks = useTaskStore((s) => s.addTasks)
  const addRewards = useRewardStore((s) => s.addRewards)
  const navigate = useNavigate()

  // Check both Zustand state and localStorage directly for existing data
  const localData = checkLocalData()
  const hasExistingData = children.length > 0 || localData.hasData

  // Auto-detect mode: if has data → login, if not → welcome
  const [mode, setMode] = useState<Mode>(() => hasExistingData ? 'login' : 'welcome')

  // Sync mode when hasExistingData changes (e.g., after Zustand hydration)
  useEffect(() => {
    if (hasExistingData && mode === 'welcome') {
      setMode('login')
    }
  }, [hasExistingData])

  // Login state - also use localStorage fallback for initial childId
  const [selectedChildId, setSelectedChildId] = useState(
    currentChildId || children[0]?.childId || localData.childId || ''
  )

  // Sync selected child after hydration
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(currentChildId || children[0]?.childId || '')
    }
  }, [children, currentChildId])
  const [loginPin, setLoginPin] = useState('')
  const [loginPinError, setLoginPinError] = useState(false)

  // Register state
  const [regStep, setRegStep] = useState(0) // 0=form, 1=tasks, 2=rewards, 3=ready
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [birthday, setBirthday] = useState('')
  const [avatar, setAvatar] = useState('Cat')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMismatch, setPinMismatch] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [selectedRewards, setSelectedRewards] = useState<Set<number>>(new Set())

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickYear, setPickYear] = useState(2020)
  const [pickMonth, setPickMonth] = useState(1)
  const [pickDay, setPickDay] = useState(1)
  const yearColRef = useRef<HTMLDivElement>(null)
  const monthColRef = useRef<HTMLDivElement>(null)
  const dayColRef = useRef<HTMLDivElement>(null)
  const scrollTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const currentYear = new Date().getFullYear()
  const pickerYears = Array.from({ length: 10 }, (_, i) => currentYear - 12 + i)
  const pickerMonths = Array.from({ length: 12 }, (_, i) => i + 1)
  const pickerDaysCount = new Date(pickYear, pickMonth, 0).getDate()
  const pickerDays = Array.from({ length: pickerDaysCount }, (_, i) => i + 1)

  const handleColScroll = (key: string, el: HTMLDivElement, values: number[], setter: (v: number) => void) => {
    clearTimeout(scrollTimers.current[key])
    scrollTimers.current[key] = setTimeout(() => {
      const idx = Math.round(el.scrollTop / PICKER_ITEM_H)
      const clamped = Math.max(0, Math.min(idx, values.length - 1))
      setter(values[clamped])
    }, 80)
  }

  const openDatePicker = () => {
    if (birthday) {
      const [y, m, d] = birthday.split('-').map(Number)
      setPickYear(y)
      setPickMonth(m)
      setPickDay(d)
    }
    setShowDatePicker(true)
  }

  const confirmBirthday = () => {
    const maxDay = new Date(pickYear, pickMonth, 0).getDate()
    const day = Math.min(pickDay, maxDay)
    setBirthday(`${pickYear}-${String(pickMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    setShowDatePicker(false)
  }

  useEffect(() => {
    if (!showDatePicker) return
    requestAnimationFrame(() => {
      yearColRef.current?.scrollTo({ top: (pickYear - pickerYears[0]) * PICKER_ITEM_H })
      monthColRef.current?.scrollTo({ top: (pickMonth - 1) * PICKER_ITEM_H })
      dayColRef.current?.scrollTo({ top: (pickDay - 1) * PICKER_ITEM_H })
    })
  }, [showDatePicker])

  useEffect(() => {
    if (pickDay > pickerDaysCount) setPickDay(pickerDaysCount)
  }, [pickerDaysCount])

  // Login handler
  const handleLogin = () => {
    if (loginPin !== parentPin) {
      setLoginPinError(true)
      setLoginPin('')
      return
    }
    if (selectedChildId) {
      setCurrentChild(selectedChildId)
    }
    completeOnboarding()
    navigate('/')
  }

  // Register: computed values
  const age = birthday ? getAgeFromBirthday(birthday).years : 0
  const ageGroup = getAgeGroup(age)
  const filteredTasks = TASK_TEMPLATES.filter((t) => t.ageGroups.includes(ageGroup))

  // Pre-select age-appropriate tasks
  useState(() => {
    const defaults = new Set<number>()
    filteredTasks.slice(0, 5).forEach((_, i) => defaults.add(i))
    setSelectedTasks(defaults)
    const defaultRewards = new Set<number>()
    REWARD_TEMPLATES.slice(0, 3).forEach((_, i) => defaultRewards.add(i))
    setSelectedRewards(defaultRewards)
  })

  const handleRegComplete = () => {
    const childId = addChild({ name, gender, birthday, avatar })
    setParentPin(pin || '1234')

    const tasksToAdd = filteredTasks
      .filter((_, i) => selectedTasks.has(i))
      .map((t) => ({
        childId,
        name: t.name,
        category: t.category as TaskCategory,
        points: t.points,
        icon: t.icon,
        description: t.description,
        isActive: true,
        frequency: 'daily' as const,
      }))
    addTasks(tasksToAdd)

    const rewardsToAdd = REWARD_TEMPLATES
      .filter((_, i) => selectedRewards.has(i))
      .map((r) => ({
        childId,
        name: r.name,
        category: r.category as RewardCategory,
        points: r.points,
        icon: r.icon,
        description: r.description,
        limit: { type: 'unlimited' as const, count: 0 },
        stock: -1,
        isActive: true,
      }))
    addRewards(rewardsToAdd)

    completeOnboarding()
    navigate('/')
  }

  const canProceedReg = () => {
    if (!name.trim() || !birthday || pin.length < 4) return false
    if (confirmPin !== pin) return false
    return true
  }

  const handleRegNext = () => {
    if (regStep === 0) {
      if (confirmPin !== pin) {
        setPinMismatch(true)
        return
      }
      setPinMismatch(false)
    }
    setRegStep(regStep + 1)
  }

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  }

  const bgStyle = {
    minHeight: '100dvh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    background: 'linear-gradient(180deg, #FFF9EC 0%, #FFE8A0 100%)',
  }

  // ============ WELCOME SCREEN ============
  if (mode === 'welcome') {
    return (
      <div style={{ ...bgStyle, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          style={{ textAlign: 'center', width: '100%', maxWidth: 'min(340px, calc(100vw - 48px))' }}
        >
          <div style={{ marginBottom: 16 }}><AppIcon name="Star" size={64} color="#FFB800" /></div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>小星星成长宝</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
            让好习惯变得有趣!
          </p>

          <button
            onClick={() => setMode('register')}
            className="btn btn-primary btn-block"
            style={{ fontSize: '1.05rem', padding: '14px', marginBottom: 12 }}
          >
            注册新账号
          </button>

          {hasExistingData && (
            <button
              onClick={() => setMode('login')}
              className="btn btn-outline btn-block"
              style={{ fontSize: '1.05rem', padding: '14px' }}
            >
              已有账号，登录
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  // ============ LOGIN SCREEN ============
  if (mode === 'login' && hasExistingData) {
    return (
      <div style={{ ...bgStyle, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          style={{ textAlign: 'center', width: '100%', maxWidth: 'min(340px, calc(100vw - 48px))' }}
        >
          <div style={{ marginBottom: 12 }}><AppIcon name="Star" size={52} color="#FFB800" /></div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>欢迎回来!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>选择孩子并输入密码登录</p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}>
            {children.map((c) => {
              const isSelected = c.childId === selectedChildId
              return (
                <button
                  key={c.childId}
                  onClick={() => setSelectedChildId(c.childId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: isSelected ? 'var(--color-primary-light)' : 'white',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '0.9rem',
                    boxShadow: isSelected ? '0 2px 12px rgba(255,184,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                    border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <AppIcon name={c.avatar} size={20} />
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                </button>
              )
            })}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--color-text-secondary)' }}>
              请输入密码
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={loginPin}
              onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, '')); setLoginPinError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && loginPin.length >= 4 && handleLogin()}
              placeholder="输入4位数字密码"
              style={{
                textAlign: 'center',
                letterSpacing: '0.5em',
                fontSize: '1.2rem',
                padding: '14px 16px',
                border: loginPinError ? '2px solid var(--color-danger)' : '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                background: 'white',
              }}
            />
            {loginPinError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 6 }}>
                密码错误，请重试
              </div>
            )}
          </div>

          <button
            onClick={handleLogin}
            className="btn btn-primary btn-block"
            disabled={loginPin.length < 4}
            style={{ fontSize: '1.05rem', padding: '14px' }}
          >
            登录
          </button>

          <button
            onClick={() => setMode('welcome')}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            返回
          </button>
        </motion.div>
      </div>
    )
  }

  // ============ REGISTER FLOW ============
  return (
    <div style={{ ...bgStyle, overflow: 'hidden', position: 'relative' }}>
      {/* Progress */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: 'calc(12px + env(safe-area-inset-top, 0px)) 24px 12px',
        background: 'linear-gradient(180deg, #FFF9EC, #FFF9EC 80%, transparent)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= regStep ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, padding: 24, overflowX: 'hidden', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {regStep === 0 && (
            <motion.div key="reg0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ marginBottom: 8 }}><AppIcon name="Sparkles" size={40} color="#FFB800" /></div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>注册新账号</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>填写孩子信息并设置密码</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>用户名（孩子姓名）</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入孩子的名字"
                    style={{ fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>性别</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {([['male', '男孩'], ['female', '女孩']] as const).map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => setGender(v)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 12,
                          border: `2px solid ${gender === v ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: gender === v ? 'var(--color-primary-light)' : 'white',
                          fontSize: '1rem',
                          fontWeight: gender === v ? 700 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    生日{birthday ? `（${formatAge(birthday)}）` : ''}
                  </label>
                  <button
                    onClick={openDatePicker}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--color-border)',
                      background: 'white',
                      fontSize: '1rem',
                      textAlign: 'center',
                      color: birthday ? 'var(--color-text)' : 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <AppIcon name="Cake" size={18} />
                      {birthday
                        ? `${Number(birthday.split('-')[0])}年${Number(birthday.split('-')[1])}月${Number(birthday.split('-')[2])}日`
                        : '点击选择生日'}
                    </span>
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>选择头像</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {AVATAR_OPTIONS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAvatar(a)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          border: `2px solid ${avatar === a ? 'var(--color-primary)' : 'transparent'}`,
                          background: avatar === a ? 'var(--color-primary-light)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon name={a} size={24} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>设置密码（4位数字）</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinMismatch(false) }}
                    placeholder="请输入4位数字密码"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>确认密码</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setPinMismatch(false) }}
                    placeholder="再次输入密码"
                    style={{
                      border: pinMismatch ? '2px solid var(--color-danger)' : undefined,
                    }}
                  />
                  {pinMismatch && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 4 }}>
                      两次密码不一致
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {regStep === 1 && (
            <motion.div key="reg1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}><AppIcon name="ClipboardList" size={36} color="var(--color-primary)" /></div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>选择习惯任务</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>根据{name}的年龄推荐了这些习惯</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredTasks.map((task, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const next = new Set(selectedTasks)
                      next.has(i) ? next.delete(i) : next.add(i)
                      setSelectedTasks(next)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `2px solid ${selectedTasks.has(i) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: selectedTasks.has(i) ? 'var(--color-primary-light)' : 'white',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <AppIcon name={task.icon} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{task.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{task.description}</div>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      fontSize: '0.9rem',
                    }}>
                      {task.points}分
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {regStep === 2 && (
            <motion.div key="reg2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}><AppIcon name="Gift" size={36} color="var(--color-primary)" /></div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>设置奖励</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>选择{name}喜欢的奖励</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {REWARD_TEMPLATES.map((reward, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const next = new Set(selectedRewards)
                      next.has(i) ? next.delete(i) : next.add(i)
                      setSelectedRewards(next)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `2px solid ${selectedRewards.has(i) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: selectedRewards.has(i) ? 'var(--color-primary-light)' : 'white',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <AppIcon name={reward.icon} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{reward.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{reward.description}</div>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      fontSize: '0.9rem',
                    }}>
                      {reward.points}分
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {regStep === 3 && (
            <motion.div key="reg3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                  style={{ marginBottom: 20 }}
                >
                  <AppIcon name="Rocket" size={64} color="var(--color-primary)" />
                </motion.div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>注册成功!</h2>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  {name}的成长之旅即将开始<br />
                  完成任务 → 获得积分 → 兑换奖励<br />
                  让好习惯变得有趣!
                </p>

                <div style={{
                  marginTop: 32,
                  padding: 20,
                  background: 'white',
                  borderRadius: 16,
                  textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>给家长的小贴士</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="CheckCircle" size={16} color="#4CAF50" /> 庆祝孩子的每一次进步</span></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="CheckCircle" size={16} color="#4CAF50" /> 及时兑现承诺的奖励</span></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="CheckCircle" size={16} color="#4CAF50" /> 关注过程而非结果</span></p>
                    <p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AppIcon name="CheckCircle" size={16} color="#4CAF50" /> 建议60%以上奖励设为亲子时光</span></p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Buttons */}
      <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 12 }}>
        {regStep === 0 ? (
          <button
            onClick={() => setMode(hasExistingData ? 'login' : 'welcome')}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            返回
          </button>
        ) : (
          <button
            onClick={() => setRegStep(regStep - 1)}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            上一步
          </button>
        )}
        {regStep < 3 ? (
          <button
            onClick={handleRegNext}
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={regStep === 0 && !canProceedReg()}
          >
            {regStep === 0 ? '注册' : '下一步'}
          </button>
        ) : (
          <button
            onClick={handleRegComplete}
            className="btn btn-primary"
            style={{ flex: 2 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>开始使用 <AppIcon name="Sparkles" size={18} /></span>
          </button>
        )}
      </div>

      {/* Birthday Picker Bottom Sheet */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDatePicker(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 1000,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '20px 20px 0 0',
                padding: '20px 16px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
                zIndex: 1001,
                maxWidth: 'var(--content-max-width)',
                margin: '0 auto',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div><AppIcon name="Cake" size={36} color="var(--color-primary)" /></div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4 }}>选择宝贝的生日</div>
              </div>

              {/* Column headers */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>年</div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>月</div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>日</div>
              </div>

              {/* Picker columns */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Year */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: PICKER_ITEM_H * 2,
                    left: 4, right: 4,
                    height: PICKER_ITEM_H,
                    background: 'var(--color-primary-light)',
                    borderRadius: 10,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div
                    ref={yearColRef}
                    onScroll={() => yearColRef.current && handleColScroll('year', yearColRef.current, pickerYears, setPickYear)}
                    style={{
                      height: PICKER_ITEM_H * PICKER_VISIBLE,
                      overflowY: 'auto',
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain',
                      position: 'relative',
                      zIndex: 1,
                      maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                    }}
                  >
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                    {pickerYears.map((y) => (
                      <div key={y} style={{
                        height: PICKER_ITEM_H,
                        scrollSnapAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: pickYear === y ? 700 : 400,
                        fontSize: '1rem',
                      }}>
                        {y}
                      </div>
                    ))}
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                  </div>
                </div>

                {/* Month */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: PICKER_ITEM_H * 2,
                    left: 4, right: 4,
                    height: PICKER_ITEM_H,
                    background: 'var(--color-primary-light)',
                    borderRadius: 10,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div
                    ref={monthColRef}
                    onScroll={() => monthColRef.current && handleColScroll('month', monthColRef.current, pickerMonths, setPickMonth)}
                    style={{
                      height: PICKER_ITEM_H * PICKER_VISIBLE,
                      overflowY: 'auto',
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain',
                      position: 'relative',
                      zIndex: 1,
                      maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                    }}
                  >
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                    {pickerMonths.map((m) => (
                      <div key={m} style={{
                        height: PICKER_ITEM_H,
                        scrollSnapAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: pickMonth === m ? 700 : 400,
                        fontSize: '1rem',
                      }}>
                        {m}月
                      </div>
                    ))}
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                  </div>
                </div>

                {/* Day */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    top: PICKER_ITEM_H * 2,
                    left: 4, right: 4,
                    height: PICKER_ITEM_H,
                    background: 'var(--color-primary-light)',
                    borderRadius: 10,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div
                    ref={dayColRef}
                    onScroll={() => dayColRef.current && handleColScroll('day', dayColRef.current, pickerDays, setPickDay)}
                    style={{
                      height: PICKER_ITEM_H * PICKER_VISIBLE,
                      overflowY: 'auto',
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain',
                      position: 'relative',
                      zIndex: 1,
                      maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
                    }}
                  >
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                    {pickerDays.map((d) => (
                      <div key={d} style={{
                        height: PICKER_ITEM_H,
                        scrollSnapAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: pickDay === d ? 700 : 400,
                        fontSize: '1rem',
                      }}>
                        {d}日
                      </div>
                    ))}
                    <div style={{ height: PICKER_ITEM_H * 2 }} />
                  </div>
                </div>
              </div>

              <button
                onClick={confirmBirthday}
                className="btn btn-primary btn-block"
                style={{ marginTop: 16 }}
              >
                确定
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
