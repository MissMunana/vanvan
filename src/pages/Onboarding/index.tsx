import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { useRewardStore } from '../../stores/rewardStore'
import { TASK_TEMPLATES, REWARD_TEMPLATES, AVATAR_OPTIONS } from '../../data/templates'
import { getAgeGroup, getAgeFromBirthday, formatAge } from '../../hooks/useAgeGroup'
import type { TaskCategory, RewardCategory } from '../../types'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  // Step 1: Child profile
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [birthday, setBirthday] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [pin, setPin] = useState('')

  // Step 2: Selected tasks
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())

  // Step 3: Selected rewards
  const [selectedRewards, setSelectedRewards] = useState<Set<number>>(new Set())

  const addChild = useAppStore((s) => s.addChild)
  const setParentPin = useAppStore((s) => s.setParentPin)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const addTasks = useTaskStore((s) => s.addTasks)
  const addRewards = useRewardStore((s) => s.addRewards)

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

  const handleComplete = () => {
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

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #FFF9EC 0%, #FFE8A0 100%)',
    }}>
      {/* Progress */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '20px 24px 0',
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= step ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>✨</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>欢迎使用小星星成长宝!</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>请告诉我孩子的信息</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>孩子的名字</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入名字"
                    style={{ fontSize: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>性别</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {([['male', '👦 男孩'], ['female', '👧 女孩']] as const).map(([v, l]) => (
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
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    max={new Date(Date.now() - 3 * 365.25 * 86400000).toISOString().split('T')[0]}
                    min={new Date(Date.now() - 12 * 365.25 * 86400000).toISOString().split('T')[0]}
                    style={{ fontSize: '1rem' }}
                  />
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
                          fontSize: '1.5rem',
                          border: `2px solid ${avatar === a ? 'var(--color-primary)' : 'transparent'}`,
                          background: avatar === a ? 'var(--color-primary-light)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>设置家长密码（4位数字）</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入4位数字密码"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
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
                    <span style={{ fontSize: '1.5rem' }}>{task.icon}</span>
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

          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎁</div>
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
                    <span style={{ fontSize: '1.5rem' }}>{reward.icon}</span>
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

          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                  style={{ fontSize: '5rem', marginBottom: 20 }}
                >
                  🚀
                </motion.div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>准备好了!</h2>
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
                    <p>✅ 庆祝孩子的每一次进步</p>
                    <p>✅ 及时兑现承诺的奖励</p>
                    <p>✅ 关注过程而非结果</p>
                    <p>✅ 建议60%以上奖励设为亲子时光</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Buttons */}
      <div style={{ padding: '16px 24px 32px', display: 'flex', gap: 12 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            上一步
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={step === 0 && (!name.trim() || !birthday || pin.length < 4)}
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="btn btn-primary"
            style={{ flex: 2 }}
          >
            开始使用 🌟
          </button>
        )}
      </div>
    </div>
  )
}
