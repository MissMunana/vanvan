import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useRewardStore } from '../../stores/rewardStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useBadgeStore } from '../../stores/badgeStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { TASK_TEMPLATES, REWARD_TEMPLATES, AVATAR_OPTIONS } from '../../data/templates'
import { CATEGORY_INFO, REWARD_CATEGORY_INFO } from '../../types'
import { formatAge, getAgeFromBirthday, getAgeGroup } from '../../hooks/useAgeGroup'
import type { TaskCategory, RewardCategory, Task, Reward } from '../../types'

type ParentTab = 'dashboard' | 'tasks' | 'rewards' | 'exchanges' | 'adjust' | 'settings'

export default function Parent() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const parentPin = useAppStore((s) => s.parentPin)
  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])

  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [activeTab, setActiveTab] = useState<ParentTab>('dashboard')

  const navigate = useNavigate()

  // PIN lockout countdown
  useEffect(() => {
    if (lockUntil <= Date.now()) return
    const timer = setInterval(() => {
      const remaining = lockUntil - Date.now()
      if (remaining <= 0) {
        setLockRemaining(0)
        clearInterval(timer)
      } else {
        setLockRemaining(remaining)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [lockUntil])

  const isLocked = lockRemaining > 0

  const handlePinSubmit = () => {
    if (isLocked) return
    if (pinInput === parentPin) {
      setAuthenticated(true)
      setPinError(false)
      setFailCount(0)
    } else {
      const newCount = failCount + 1
      setFailCount(newCount)
      setPinError(true)
      setPinInput('')
      if (newCount >= 3) {
        const until = Date.now() + 5 * 60 * 1000
        setLockUntil(until)
        setLockRemaining(until - Date.now())
      }
    }
  }

  if (!authenticated) {
    const lockSec = Math.ceil((lockRemaining % 60000) / 1000)
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--color-bg)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{isLocked ? '🔐' : '🔒'}</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>家长验证</h2>
        {isLocked ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: 8 }}>
              密码错误次数过多，已锁定
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {Math.floor(lockRemaining / 60000)}:{String(lockSec % 60).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              后可重试
            </div>
          </div>
        ) : (
          <>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, ''))
                setPinError(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              placeholder="请输入4位数字密码"
              style={{
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                maxWidth: 200,
                border: pinError ? '2px solid var(--color-danger)' : undefined,
              }}
            />
            {pinError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 8 }}>
                密码错误{failCount >= 2 ? `，再错${3 - failCount}次将锁定5分钟` : '，请重试'}
              </div>
            )}
          </>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>返回</button>
          {!isLocked && (
            <button className="btn btn-primary" onClick={handlePinSubmit} disabled={pinInput.length < 4}>
              确认
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!child) return null

  const tabs: { key: ParentTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: '总览', icon: '📊' },
    { key: 'tasks', label: '任务', icon: '📋' },
    { key: 'rewards', label: '奖励', icon: '🎁' },
    { key: 'exchanges', label: '审核', icon: '📬' },
    { key: 'adjust', label: '调分', icon: '✏️' },
    { key: 'settings', label: '设置', icon: '⚙️' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <button onClick={() => navigate('/')} style={{ fontSize: '1.2rem' }}>← 返回</button>
        <span style={{ fontWeight: 700 }}>家长控制台</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.7rem',
              fontWeight: activeTab === tab.key ? 700 : 400,
              minWidth: 52,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'rewards' && <RewardManager />}
        {activeTab === 'exchanges' && <ExchangeReview />}
        {activeTab === 'adjust' && <PointAdjust />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  )
}

function Dashboard() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const logs = usePointStore((s) => s.logs)
  const exchanges = useExchangeStore((s) => s.exchanges)
  const navigate = useNavigate()

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const [showScreenTime, setShowScreenTime] = useState(false)
  const screenTime = child?.settings?.screenTime

  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString()
    const weekLogs = logs.filter((l) => l.childId === childId && l.createdAt >= weekStartStr)
    return {
      tasksCompleted: weekLogs.filter((l) => l.type === 'earn' && l.taskId).length,
      pointsEarned: weekLogs.filter((l) => l.type === 'earn' || (l.type === 'adjust' && l.points > 0)).reduce((sum, l) => sum + l.points, 0),
      pointsSpent: weekLogs.filter((l) => l.type === 'spend').reduce((sum, l) => sum + Math.abs(l.points), 0),
    }
  }, [logs, childId])

  const pendingCount = useMemo(() => exchanges.filter((e) => e.status === 'pending' && e.childId === childId).length, [exchanges, childId])

  if (!child) return null

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        padding: 20,
        color: 'white',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: '2rem' }}>{child.avatar}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{child.name}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>当前积分: {child.totalPoints}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {weeklyStats.tasksCompleted}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>本周完成任务</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {weeklyStats.pointsEarned}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>本周积分变化</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-info)' }}>
            {weeklyStats.pointsSpent}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>本周消费</div>
        </div>
        <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
          {pendingCount > 0 && (
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--color-danger)',
              color: 'white',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}>
              {pendingCount}
            </div>
          )}
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>待审核</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          className="btn btn-outline"
          style={{ flex: 1 }}
          onClick={() => navigate('/print')}
        >
          🖨️ 打印任务表
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1 }}
          onClick={() => setShowScreenTime(true)}
        >
          ⏱️ 屏幕时间
        </button>
      </div>

      {/* Screen time settings modal */}
      <Modal
        open={showScreenTime}
        onClose={() => setShowScreenTime(false)}
        title="屏幕时间管控"
      >
        {child && screenTime && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>启用屏幕时间限制</span>
              <button
                onClick={() => {
                  const updated = { ...child, settings: { ...child.settings, screenTime: { ...screenTime, enabled: !screenTime.enabled } } }
                  useAppStore.setState((state) => ({
                    children: state.children.map((c) => c.childId === child.childId ? updated : c),
                  }))
                }}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  background: screenTime.enabled ? 'var(--color-success)' : '#ccc',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: 3,
                  left: screenTime.enabled ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                每日使用上限（分钟）
              </label>
              <input
                type="number"
                value={screenTime.dailyLimitMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 30
                  const updated = { ...child, settings: { ...child.settings, screenTime: { ...screenTime, dailyLimitMinutes: val } } }
                  useAppStore.setState((state) => ({
                    children: state.children.map((c) => c.childId === child.childId ? updated : c),
                  }))
                }}
                min={5}
                max={120}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  锁定开始（时）
                </label>
                <input
                  type="number"
                  value={screenTime.lockStartHour}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 22
                    const updated = { ...child, settings: { ...child.settings, screenTime: { ...screenTime, lockStartHour: val } } }
                    useAppStore.setState((state) => ({
                      children: state.children.map((c) => c.childId === child.childId ? updated : c),
                    }))
                  }}
                  min={0}
                  max={23}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  锁定结束（时）
                </label>
                <input
                  type="number"
                  value={screenTime.lockEndHour}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 6
                    const updated = { ...child, settings: { ...child.settings, screenTime: { ...screenTime, lockEndHour: val } } }
                    useAppStore.setState((state) => ({
                      children: state.children.map((c) => c.childId === child.childId ? updated : c),
                    }))
                  }}
                  min={0}
                  max={23}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              启用后，每日使用达到上限会弹出休息提示，{screenTime.lockStartHour}:00-{screenTime.lockEndHour}:00自动锁定。需要家长密码解锁。
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TaskManager() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const storeTasks = useTaskStore((s) => s.tasks)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const allTasks = useMemo(() => storeTasks.filter((t) => t.childId === child?.childId), [storeTasks, child?.childId])
  const addTask = useTaskStore((s) => s.addTask)
  const addTasks = useTaskStore((s) => s.addTasks)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const { showToast } = useToast()

  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    name: '',
    category: 'life' as TaskCategory,
    points: 10,
    icon: '⭐',
    description: '',
  })

  if (!child) return null

  const handleAdd = () => {
    if (!newTask.name.trim()) return
    addTask({
      childId: child.childId,
      name: newTask.name,
      category: newTask.category,
      points: newTask.points,
      icon: newTask.icon,
      description: newTask.description,
      isActive: true,
      frequency: 'daily',
    })
    setShowAdd(false)
    setNewTask({ name: '', category: 'life', points: 10, icon: '⭐', description: '' })
    showToast('任务已添加')
  }

  const handleEditSave = () => {
    if (!editingTask || !editingTask.name.trim()) return
    updateTask(editingTask.taskId, {
      name: editingTask.name,
      category: editingTask.category,
      points: editingTask.points,
      icon: editingTask.icon,
      description: editingTask.description,
    })
    setEditingTask(null)
    showToast('任务已更新')
  }

  const handleImport = () => {
    const ageGroup = child.ageGroup
    const existingNames = new Set(allTasks.map((t) => t.name))
    const toImport = TASK_TEMPLATES
      .filter((t) => t.ageGroups.includes(ageGroup) && !existingNames.has(t.name))
      .map((t) => ({
        childId: child.childId,
        name: t.name,
        category: t.category,
        points: t.points,
        icon: t.icon,
        description: t.description,
        isActive: true,
        frequency: 'daily' as const,
      }))

    if (toImport.length === 0) {
      showToast('没有新的可导入任务')
    } else {
      addTasks(toImport)
      showToast(`已导入 ${toImport.length} 个任务`)
    }
    setShowImport(false)
  }

  const ICONS = ['⭐', '🦷', '📚', '😊', '🧹', '💪', '🎯', '🌟', '📝', '🎒', '🍚', '🧼', '👕', '🧸']

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ 新建任务</button>
        <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)}>📥 导入模板</button>
      </div>

      {allTasks.map((task) => (
        <div key={task.taskId} className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: '1.3rem' }}>{task.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{task.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {CATEGORY_INFO[task.category].label} · {task.points}分
              {task.consecutiveDays > 0 && ` · 连续${task.consecutiveDays}天`}
            </div>
          </div>
          <button
            onClick={() => setEditingTask({ ...task })}
            style={{ fontSize: '0.9rem', color: 'var(--color-primary)', padding: '4px 6px' }}
          >
            ✎
          </button>
          <button
            onClick={() => updateTask(task.taskId, { isActive: !task.isActive })}
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: 8,
              background: task.isActive ? 'var(--color-success)' : '#ccc',
              color: 'white',
            }}
          >
            {task.isActive ? '启用' : '停用'}
          </button>
          <button
            onClick={() => {
              deleteTask(task.taskId)
              showToast('已删除')
            }}
            style={{ fontSize: '1rem', color: 'var(--color-danger)' }}
          >
            ✕
          </button>
        </div>
      ))}

      {allTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
          还没有任务，点击上方按钮添加
        </div>
      )}

      {/* Add task modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新建任务">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>任务名称</label>
            <input value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} placeholder="如: 自己刷牙" />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>分类</label>
            <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}>
              {Object.entries(CATEGORY_INFO).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>积分: {newTask.points}</label>
            <input type="range" min={1} max={50} value={newTask.points} onChange={(e) => setNewTask({ ...newTask, points: Number(e.target.value) })} style={{ border: 'none', padding: 0, accentColor: 'var(--color-primary)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>图标</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICONS.map((icon) => (
                <button key={icon} onClick={() => setNewTask({ ...newTask, icon })} style={{
                  width: 40, height: 40, borderRadius: 8, fontSize: '1.2rem',
                  border: newTask.icon === icon ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: newTask.icon === icon ? 'var(--color-primary-light)' : 'white',
                }}>{icon}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={!newTask.name.trim()}>添加任务</button>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="导入任务模板">
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          将根据{child.name}的年龄（{child.ageGroup}岁组）导入推荐任务，已存在的任务不会重复导入。
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowImport(false)}>取消</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleImport}>确认导入</button>
        </div>
      </Modal>

      {/* Edit task modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="编辑任务">
        {editingTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>任务名称</label>
              <input value={editingTask.name} onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>分类</label>
              <select value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}>
                {Object.entries(CATEGORY_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>积分: {editingTask.points}</label>
              <input type="range" min={1} max={50} value={editingTask.points} onChange={(e) => setEditingTask({ ...editingTask, points: Number(e.target.value) })} style={{ border: 'none', padding: 0, accentColor: 'var(--color-primary)' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>图标</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map((icon) => (
                  <button key={icon} onClick={() => setEditingTask({ ...editingTask, icon })} style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: '1.2rem',
                    border: editingTask.icon === icon ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: editingTask.icon === icon ? 'var(--color-primary-light)' : 'white',
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={handleEditSave} disabled={!editingTask.name.trim()}>保存修改</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function RewardManager() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const storeRewards = useRewardStore((s) => s.rewards)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const allRewards = useMemo(() => storeRewards.filter((r) => r.childId === child?.childId), [storeRewards, child?.childId])
  const addReward = useRewardStore((s) => s.addReward)
  const addRewards = useRewardStore((s) => s.addRewards)
  const deleteReward = useRewardStore((s) => s.deleteReward)
  const updateReward = useRewardStore((s) => s.updateReward)
  const { showToast } = useToast()

  const [showAdd, setShowAdd] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [newReward, setNewReward] = useState({
    name: '',
    category: 'time' as RewardCategory,
    points: 20,
    icon: '🎁',
    description: '',
  })

  if (!child) return null

  const handleAdd = () => {
    if (!newReward.name.trim()) return
    addReward({
      childId: child.childId,
      name: newReward.name,
      category: newReward.category,
      points: newReward.points,
      icon: newReward.icon,
      description: newReward.description,
      limit: { type: 'unlimited', count: 0 },
      stock: -1,
      isActive: true,
    })
    setShowAdd(false)
    setNewReward({ name: '', category: 'time', points: 20, icon: '🎁', description: '' })
    showToast('奖励已添加')
  }

  const handleEditRewardSave = () => {
    if (!editingReward || !editingReward.name.trim()) return
    updateReward(editingReward.rewardId, {
      name: editingReward.name,
      category: editingReward.category,
      points: editingReward.points,
      icon: editingReward.icon,
      description: editingReward.description,
    })
    setEditingReward(null)
    showToast('奖励已更新')
  }

  const handleImportRewards = () => {
    const existingNames = new Set(allRewards.map((r) => r.name))
    const toImport = REWARD_TEMPLATES
      .filter((r) => !existingNames.has(r.name))
      .map((r) => ({
        childId: child.childId,
        name: r.name,
        category: r.category,
        points: r.points,
        icon: r.icon,
        description: r.description,
        limit: { type: 'unlimited' as const, count: 0 },
        stock: -1,
        isActive: true,
      }))

    if (toImport.length === 0) {
      showToast('没有新的可导入奖励')
    } else {
      addRewards(toImport)
      showToast(`已导入 ${toImport.length} 个奖励`)
    }
  }

  const ICONS = ['🎁', '📖', '🎲', '🌳', '🧁', '🎬', '🌙', '🍕', '📺', '✏️', '📕', '🧩', '👑', '💕']

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ 新建奖励</button>
        <button className="btn btn-outline btn-sm" onClick={handleImportRewards}>📥 导入推荐</button>
      </div>

      {allRewards.map((reward) => (
        <div key={reward.rewardId} className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: '1.3rem' }}>{reward.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{reward.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {REWARD_CATEGORY_INFO[reward.category].label} · {reward.points}分
            </div>
          </div>
          <button
            onClick={() => setEditingReward({ ...reward })}
            style={{ fontSize: '0.9rem', color: 'var(--color-primary)', padding: '4px 6px' }}
          >
            ✎
          </button>
          <button
            onClick={() => updateReward(reward.rewardId, { isActive: !reward.isActive })}
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: 8,
              background: reward.isActive ? 'var(--color-success)' : '#ccc',
              color: 'white',
            }}
          >
            {reward.isActive ? '上架' : '下架'}
          </button>
          <button
            onClick={() => { deleteReward(reward.rewardId); showToast('已删除') }}
            style={{ fontSize: '1rem', color: 'var(--color-danger)' }}
          >
            ✕
          </button>
        </div>
      ))}

      {allRewards.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
          还没有奖励，点击上方按钮添加
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新建奖励">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>奖励名称</label>
            <input value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} placeholder="如: 一起玩桌游" />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>分类</label>
            <select value={newReward.category} onChange={(e) => setNewReward({ ...newReward, category: e.target.value as RewardCategory })}>
              {Object.entries(REWARD_CATEGORY_INFO).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>所需积分: {newReward.points}</label>
            <input type="range" min={5} max={500} step={5} value={newReward.points} onChange={(e) => setNewReward({ ...newReward, points: Number(e.target.value) })} style={{ border: 'none', padding: 0, accentColor: 'var(--color-primary)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>图标</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICONS.map((icon) => (
                <button key={icon} onClick={() => setNewReward({ ...newReward, icon })} style={{
                  width: 40, height: 40, borderRadius: 8, fontSize: '1.2rem',
                  border: newReward.icon === icon ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: newReward.icon === icon ? 'var(--color-primary-light)' : 'white',
                }}>{icon}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>描述（选填）</label>
            <input value={newReward.description} onChange={(e) => setNewReward({ ...newReward, description: e.target.value })} placeholder="奖励说明" />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={!newReward.name.trim()}>添加奖励</button>
        </div>
      </Modal>

      {/* Edit reward modal */}
      <Modal open={!!editingReward} onClose={() => setEditingReward(null)} title="编辑奖励">
        {editingReward && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>奖励名称</label>
              <input value={editingReward.name} onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>分类</label>
              <select value={editingReward.category} onChange={(e) => setEditingReward({ ...editingReward, category: e.target.value as RewardCategory })}>
                {Object.entries(REWARD_CATEGORY_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>所需积分: {editingReward.points}</label>
              <input type="range" min={5} max={500} step={5} value={editingReward.points} onChange={(e) => setEditingReward({ ...editingReward, points: Number(e.target.value) })} style={{ border: 'none', padding: 0, accentColor: 'var(--color-primary)' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>图标</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map((icon) => (
                  <button key={icon} onClick={() => setEditingReward({ ...editingReward, icon })} style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: '1.2rem',
                    border: editingReward.icon === icon ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: editingReward.icon === icon ? 'var(--color-primary-light)' : 'white',
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>描述（选填）</label>
              <input value={editingReward.description} onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleEditRewardSave} disabled={!editingReward.name.trim()}>保存修改</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ExchangeReview() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const updatePoints = useAppStore((s) => s.updatePoints)
  const allExchanges = useExchangeStore((s) => s.exchanges)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const exchanges = useMemo(() => allExchanges.filter((e) => e.childId === (child?.childId || '')), [allExchanges, child?.childId])
  const reviewExchange = useExchangeStore((s) => s.reviewExchange)
  const addLog = usePointStore((s) => s.addLog)
  const { showToast } = useToast()

  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (!child) return null

  const handleApprove = (exchange: typeof exchanges[0]) => {
    updatePoints(child.childId, -exchange.points)
    reviewExchange(exchange.exchangeId, 'approved')
    addLog({
      childId: child.childId,
      taskId: null,
      type: 'spend',
      points: -exchange.points,
      reason: `兑换: ${exchange.rewardName}`,
      emotion: null,
      operator: 'parent',
    })
    showToast('已通过，积分已扣除')
  }

  const handleReject = (exchangeId: string) => {
    reviewExchange(exchangeId, 'rejected', rejectReason || '爸爸妈妈觉得可以再等等哦')
    setRejectModal(null)
    setRejectReason('')
    showToast('已拒绝')
  }

  const pending = exchanges.filter((e) => e.status === 'pending')
  const history = exchanges.filter((e) => e.status !== 'pending')

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>待审核 ({pending.length})</div>
          {pending.map((exchange) => (
            <div key={exchange.exchangeId} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>{exchange.rewardIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{exchange.rewardName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(exchange.requestedAt).toLocaleString('zh-CN')} · {exchange.points}积分
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleApprove(exchange)}
                >
                  ✓ 同意
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                  onClick={() => setRejectModal(exchange.exchangeId)}
                >
                  ✕ 拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
          暂无待审核的兑换申请
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>历史记录</div>
          {history.slice(0, 10).map((exchange) => (
            <div key={exchange.exchangeId} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: 0.8,
            }}>
              <span style={{ fontSize: '1.3rem' }}>{exchange.rewardIcon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exchange.rewardName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  {exchange.points}积分
                </div>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: exchange.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
                {exchange.status === 'approved' ? '已通过' : '已拒绝'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="拒绝原因"
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          温和地告诉孩子原因（选填）
        </p>
        <input
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="爸爸妈妈觉得可以再等等哦"
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>取消</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => rejectModal && handleReject(rejectModal)}>确认拒绝</button>
        </div>
      </Modal>
    </div>
  )
}

function PointAdjust() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const updatePoints = useAppStore((s) => s.updatePoints)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const addLog = usePointStore((s) => s.addLog)
  const { showToast } = useToast()

  const [mode, setMode] = useState<'add' | 'subtract'>('add')
  const [points, setPoints] = useState(10)
  const [reason, setReason] = useState('')
  const [showDeductWarning, setShowDeductWarning] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Deduction cooldown countdown
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const timer = setInterval(() => {
      const remaining = cooldownUntil - Date.now()
      if (remaining <= 0) {
        setCooldownRemaining(0)
        clearInterval(timer)
      } else {
        setCooldownRemaining(remaining)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownUntil])

  const isCoolingDown = cooldownRemaining > 0

  if (!child) return null

  const handleSubmit = () => {
    if (!reason.trim()) {
      showToast('请填写原因')
      return
    }

    if (mode === 'subtract' && isCoolingDown) return

    const delta = mode === 'add' ? points : -points
    const maxDeduct = Math.floor(child.totalPoints * 0.1)

    if (mode === 'subtract' && points > maxDeduct) {
      showToast(`单次扣分不能超过总积分的10%（最多${maxDeduct}分）`)
      return
    }

    updatePoints(child.childId, delta)
    addLog({
      childId: child.childId,
      taskId: null,
      type: 'adjust',
      points: delta,
      reason: `家长调整: ${reason}`,
      emotion: null,
      operator: 'parent',
    })
    showToast(`已${mode === 'add' ? '增加' : '减少'}${points}积分`)
    setReason('')
    setPoints(10)
    if (mode === 'subtract') {
      setMode('add')
    }
  }

  return (
    <div>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>当前积分</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{child.totalPoints}</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMode('add')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              fontWeight: 600,
              background: mode === 'add' ? 'var(--color-success)' : '#f0f0f0',
              color: mode === 'add' ? 'white' : 'var(--color-text)',
            }}
          >
            + 增加积分
          </button>
          <button
            onClick={() => {
              if (mode !== 'subtract') {
                setShowDeductWarning(true)
              }
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              fontWeight: 600,
              background: mode === 'subtract' ? 'var(--color-danger)' : '#f0f0f0',
              color: mode === 'subtract' ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            - 减少积分
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
            积分数量: {points}
          </label>
          <input
            type="range"
            min={1}
            max={mode === 'subtract' ? Math.max(1, Math.floor(child.totalPoints * 0.1)) : 100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            style={{ border: 'none', padding: 0, accentColor: mode === 'add' ? 'var(--color-success)' : 'var(--color-danger)' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>原因说明（必填）</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="如: 主动帮助了弟弟" />
        </div>

        {mode === 'subtract' && isCoolingDown && (
          <div style={{
            textAlign: 'center',
            padding: 12,
            marginBottom: 10,
            background: '#fff3e0',
            borderRadius: 10,
            fontSize: '0.85rem',
            color: 'var(--color-warning)',
          }}>
            冷静期倒计时：{Math.floor(cooldownRemaining / 60000)}:{String(Math.ceil((cooldownRemaining % 60000) / 1000) % 60).padStart(2, '0')}
            <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--color-text-secondary)' }}>
              请冷静思考是否真的需要扣分
            </div>
          </div>
        )}

        <button
          className={`btn btn-block ${mode === 'add' ? 'btn-primary' : 'btn-danger'}`}
          onClick={handleSubmit}
          disabled={!reason.trim() || (mode === 'subtract' && isCoolingDown)}
        >
          确认{mode === 'add' ? '增加' : '减少'} {points} 积分
        </button>
      </div>

      {/* Deduct warning modal */}
      <Modal
        open={showDeductWarning}
        onClose={() => setShowDeductWarning(false)}
        title="温馨提示"
      >
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, marginBottom: 20 }}>
          <p>💡 心理学研究表明，扣分可能导致孩子对整个系统产生抵触。</p>
          <p style={{ marginTop: 8 }}>建议尝试：</p>
          <p>1. 与孩子对话了解原因</p>
          <p>2. 共同制定改进计划</p>
          <p>3. 用鼓励替代惩罚</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDeductWarning(false)}>
            取消
          </button>
          <button
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={() => {
              setMode('subtract')
              setShowDeductWarning(false)
              const until = Date.now() + 10 * 60 * 1000
              setCooldownUntil(until)
              setCooldownRemaining(until - Date.now())
            }}
          >
            确定要扣分
          </button>
        </div>
      </Modal>
    </div>
  )
}

function Settings() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const parentPin = useAppStore((s) => s.parentPin)
  const setParentPin = useAppStore((s) => s.setParentPin)
  const updateChild = useAppStore((s) => s.updateChild)
  const deleteChildFromApp = useAppStore((s) => s.deleteChild)
  const addChild = useAppStore((s) => s.addChild)
  const logout = useAppStore((s) => s.logout)
  const resetData = useAppStore((s) => s.resetData)
  const setCurrentChild = useAppStore((s) => s.setCurrentChild)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])

  const [editingChild, setEditingChild] = useState<{ childId: string; name: string; gender: 'male' | 'female'; birthday: string; avatar: string } | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', gender: 'male' as 'male' | 'female', birthday: '', avatar: '🐱' })
  const [showPinChange, setShowPinChange] = useState(false)
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' })
  const [pinChangeError, setPinChangeError] = useState('')
  const [showDeleteChild, setShowDeleteChild] = useState<string | null>(null)
  const [deletePin, setDeletePin] = useState('')
  const [deletePinError, setDeletePinError] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false)
  const [destroyChecked, setDestroyChecked] = useState(false)
  const [ageGroupChangeConfirm, setAgeGroupChangeConfirm] = useState(false)

  const handleSaveChild = () => {
    if (!editingChild || !editingChild.name.trim()) return

    const currentChild = children.find((c) => c.childId === editingChild.childId)
    if (currentChild && editingChild.birthday && editingChild.birthday !== currentChild.birthday) {
      const { years: newYears } = getAgeFromBirthday(editingChild.birthday)
      const newAgeGroup = getAgeGroup(newYears)
      if (newAgeGroup !== currentChild.ageGroup && !ageGroupChangeConfirm) {
        setAgeGroupChangeConfirm(true)
        return
      }
    }

    updateChild(editingChild.childId, {
      name: editingChild.name,
      gender: editingChild.gender,
      birthday: editingChild.birthday,
      avatar: editingChild.avatar,
    })
    setEditingChild(null)
    setAgeGroupChangeConfirm(false)
    showToast('已更新')
  }

  const handleAddChild = () => {
    if (!newChild.name.trim() || !newChild.birthday) return
    const childId = addChild({
      name: newChild.name,
      gender: newChild.gender,
      birthday: newChild.birthday,
      avatar: newChild.avatar,
    })
    setCurrentChild(childId)
    setShowAddChild(false)
    setNewChild({ name: '', gender: 'male', birthday: '', avatar: '🐱' })
    showToast('孩子已添加')
  }

  const handleDeleteChild = () => {
    if (!showDeleteChild) return
    if (deletePin !== parentPin) {
      setDeletePinError(true)
      setDeletePin('')
      return
    }
    // Clean up related data in all stores
    useTaskStore.getState().deleteByChildId(showDeleteChild)
    usePointStore.getState().deleteByChildId(showDeleteChild)
    useRewardStore.getState().deleteByChildId(showDeleteChild)
    useExchangeStore.getState().deleteByChildId(showDeleteChild)
    useBadgeStore.getState().deleteByChildId(showDeleteChild)
    deleteChildFromApp(showDeleteChild)
    setShowDeleteChild(null)
    setDeletePin('')
    setDeletePinError(false)
    showToast('已删除')
    // If no children left, go back to onboarding
    if (children.length <= 1) {
      resetData()
      navigate('/')
    }
  }

  const handlePinChange = () => {
    if (pinForm.oldPin !== parentPin) {
      setPinChangeError('旧密码不正确')
      return
    }
    if (pinForm.newPin.length < 4) {
      setPinChangeError('新密码至少4位')
      return
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinChangeError('两次输入的新密码不一致')
      return
    }
    setParentPin(pinForm.newPin)
    setShowPinChange(false)
    setPinForm({ oldPin: '', newPin: '', confirmPin: '' })
    setPinChangeError('')
    showToast('密码已修改')
  }

  const handleSoundToggle = () => {
    if (!child) return
    const updated = { ...child, settings: { ...child.settings, soundEnabled: !child.settings.soundEnabled } }
    useAppStore.setState((state) => ({
      children: state.children.map((c) => c.childId === child.childId ? updated : c),
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDestroy = () => {
    resetData()
    navigate('/')
  }

  // Birthday range constraints (3-12 years old)
  const today = new Date()
  const maxBirthday = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  const minBirthday = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  const deletingChildName = showDeleteChild ? children.find((c) => c.childId === showDeleteChild)?.name : ''

  return (
    <div>
      {/* Children management */}
      <div style={{ fontWeight: 700, marginBottom: 12 }}>孩子管理</div>
      {children.map((c) => (
        <div key={c.childId} className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: '1.5rem' }}>{c.avatar}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {formatAge(c.birthday, c.age)} · {c.gender === 'male' ? '男孩' : '女孩'}
              {c.childId === currentChildId && ' · 当前'}
            </div>
          </div>
          {c.childId !== currentChildId && (
            <button
              onClick={() => setCurrentChild(c.childId)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              切换
            </button>
          )}
          <button
            onClick={() => setEditingChild({
              childId: c.childId,
              name: c.name,
              gender: c.gender,
              birthday: c.birthday || '',
              avatar: c.avatar,
            })}
            style={{ fontSize: '0.9rem', color: 'var(--color-primary)', padding: '4px 6px' }}
          >
            ✎
          </button>
          <button
            onClick={() => setShowDeleteChild(c.childId)}
            style={{ fontSize: '0.9rem', color: 'var(--color-danger)', padding: '4px 6px' }}
          >
            ✕
          </button>
        </div>
      ))}

      {children.length < 5 && (
        <button
          className="btn btn-outline btn-block"
          style={{ marginTop: 8, marginBottom: 20 }}
          onClick={() => setShowAddChild(true)}
        >
          + 添加新孩子
        </button>
      )}

      {/* Sound toggle */}
      {child && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 12, marginTop: 20 }}>偏好设置</div>
          <div className="card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: '1.3rem' }}>🔊</span>
            <span style={{ flex: 1, fontWeight: 600 }}>音效</span>
            <button
              onClick={handleSoundToggle}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: child.settings.soundEnabled ? 'var(--color-success)' : '#ccc',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: child.settings.soundEnabled ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </>
      )}

      {/* PIN change */}
      <div style={{ fontWeight: 700, marginBottom: 12, marginTop: 20 }}>安全设置</div>
      <button
        className="card"
        onClick={() => setShowPinChange(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🔑</span>
        <span style={{ flex: 1, fontWeight: 600 }}>修改家长密码</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
      </button>

      {/* About */}
      <div style={{ fontWeight: 700, marginBottom: 12, marginTop: 20 }}>关于</div>
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>小星星成长宝</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            版本: {typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'}
          </div>
        </div>
      </div>

      {/* Account management */}
      <div style={{ fontWeight: 700, marginBottom: 12, marginTop: 20 }}>账号管理</div>
      <button
        className="card"
        onClick={() => setShowLogoutConfirm(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>🚪</span>
        <span style={{ flex: 1, fontWeight: 600 }}>退出登录</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
      </button>
      <button
        className="card"
        onClick={() => { setShowDestroyConfirm(true); setDestroyChecked(false) }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>⚠️</span>
        <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-text-secondary)' }}>注销账号</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
      </button>

      {/* Edit child modal */}
      <Modal open={!!editingChild} onClose={() => { setEditingChild(null); setAgeGroupChangeConfirm(false) }} title="编辑孩子资料">
        {editingChild && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ageGroupChangeConfirm && (
              <div style={{
                background: '#fff3e0',
                padding: 12,
                borderRadius: 10,
                fontSize: '0.85rem',
                color: 'var(--color-warning)',
              }}>
                修改出生日期会影响年龄段设置和界面风格，确定修改吗？
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>名字</label>
              <input
                value={editingChild.name}
                onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                maxLength={10}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>性别</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditingChild({ ...editingChild, gender: g })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      fontWeight: 600,
                      border: editingChild.gender === g ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: editingChild.gender === g ? 'var(--color-primary-light)' : 'white',
                    }}
                  >
                    {g === 'male' ? '👦 男孩' : '👧 女孩'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>出生日期</label>
              <input
                type="date"
                value={editingChild.birthday}
                onChange={(e) => setEditingChild({ ...editingChild, birthday: e.target.value })}
                min={minBirthday}
                max={maxBirthday}
                style={{ width: '100%' }}
              />
              {editingChild.birthday && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {formatAge(editingChild.birthday)}
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>头像</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setEditingChild({ ...editingChild, avatar: a })}
                    style={{
                      width: 44, height: 44, borderRadius: 10, fontSize: '1.3rem',
                      border: editingChild.avatar === a ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: editingChild.avatar === a ? 'var(--color-primary-light)' : 'white',
                    }}
                  >{a}</button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={handleSaveChild}
              disabled={!editingChild.name.trim()}
            >
              {ageGroupChangeConfirm ? '确认修改' : '保存'}
            </button>
          </div>
        )}
      </Modal>

      {/* Add child modal */}
      <Modal open={showAddChild} onClose={() => setShowAddChild(false)} title="添加新孩子">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>名字</label>
            <input
              value={newChild.name}
              onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
              placeholder="宝贝的名字"
              maxLength={10}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>性别</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setNewChild({ ...newChild, gender: g })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    fontWeight: 600,
                    border: newChild.gender === g ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: newChild.gender === g ? 'var(--color-primary-light)' : 'white',
                  }}
                >
                  {g === 'male' ? '👦 男孩' : '👧 女孩'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>出生日期</label>
            <input
              type="date"
              value={newChild.birthday}
              onChange={(e) => setNewChild({ ...newChild, birthday: e.target.value })}
              min={minBirthday}
              max={maxBirthday}
              style={{ width: '100%' }}
            />
            {newChild.birthday && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {formatAge(newChild.birthday)}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>头像</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => setNewChild({ ...newChild, avatar: a })}
                  style={{
                    width: 44, height: 44, borderRadius: 10, fontSize: '1.3rem',
                    border: newChild.avatar === a ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: newChild.avatar === a ? 'var(--color-primary-light)' : 'white',
                  }}
                >{a}</button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={handleAddChild}
            disabled={!newChild.name.trim() || !newChild.birthday}
          >
            添加孩子
          </button>
        </div>
      </Modal>

      {/* Delete child modal */}
      <Modal
        open={!!showDeleteChild}
        onClose={() => { setShowDeleteChild(null); setDeletePin(''); setDeletePinError(false) }}
        title="删除孩子档案"
      >
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, marginBottom: 16 }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>此操作不可撤销！</p>
          <p>删除后，<strong>{deletingChildName}</strong>的所有数据（任务、积分、兑换记录）将无法恢复。</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>请输入家长密码确认</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={deletePin}
            onChange={(e) => { setDeletePin(e.target.value.replace(/\D/g, '')); setDeletePinError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleDeleteChild()}
            placeholder="输入4位密码"
            style={{
              textAlign: 'center',
              letterSpacing: '0.3em',
              border: deletePinError ? '2px solid var(--color-danger)' : undefined,
            }}
          />
          {deletePinError && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 4 }}>密码错误</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowDeleteChild(null); setDeletePin(''); setDeletePinError(false) }}>取消</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteChild} disabled={deletePin.length < 4}>确认删除</button>
        </div>
      </Modal>

      {/* PIN change modal */}
      <Modal open={showPinChange} onClose={() => { setShowPinChange(false); setPinChangeError(''); setPinForm({ oldPin: '', newPin: '', confirmPin: '' }) }} title="修改家长密码">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>当前密码</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinForm.oldPin}
              onChange={(e) => { setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '') }); setPinChangeError('') }}
              placeholder="输入当前4位密码"
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>新密码</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinForm.newPin}
              onChange={(e) => { setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') }); setPinChangeError('') }}
              placeholder="输入新的4位密码"
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>确认新密码</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinForm.confirmPin}
              onChange={(e) => { setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') }); setPinChangeError('') }}
              placeholder="再次输入新密码"
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
            />
          </div>
          {pinChangeError && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{pinChangeError}</div>
          )}
          <button
            className="btn btn-primary btn-block"
            onClick={handlePinChange}
            disabled={pinForm.oldPin.length < 4 || pinForm.newPin.length < 4 || pinForm.confirmPin.length < 4}
          >
            确认修改
          </button>
        </div>
      </Modal>

      {/* Logout confirm modal */}
      <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="退出登录">
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, marginBottom: 20 }}>
          <p>确定要退出登录吗？</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>退出后数据不会丢失，重新进入引导流程即可恢复使用。</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>取消</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleLogout}>确认退出</button>
        </div>
      </Modal>

      {/* Destroy account confirm modal */}
      <Modal open={showDestroyConfirm} onClose={() => setShowDestroyConfirm(false)} title="注销账号">
        <div style={{ fontSize: '0.9rem', lineHeight: 1.8, marginBottom: 16 }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>注销后，以下数据将被永久删除且无法恢复：</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li>所有孩子的任务、积分、兑换记录</li>
            <li>所有勋章和成长数据</li>
            <li>家长账号信息</li>
          </ul>
        </div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.85rem',
          marginBottom: 16,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={destroyChecked}
            onChange={(e) => setDestroyChecked(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--color-danger)' }}
          />
          我已了解注销后果
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDestroyConfirm(false)}>取消</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDestroy} disabled={!destroyChecked}>确认注销</button>
        </div>
      </Modal>
    </div>
  )
}
