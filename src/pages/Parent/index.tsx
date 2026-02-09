import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { usePointStore } from '../../stores/pointStore'
import { useRewardStore } from '../../stores/rewardStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { TASK_TEMPLATES, REWARD_TEMPLATES } from '../../data/templates'
import { CATEGORY_INFO, REWARD_CATEGORY_INFO } from '../../types'
import type { TaskCategory, RewardCategory } from '../../types'

type ParentTab = 'dashboard' | 'tasks' | 'rewards' | 'exchanges' | 'adjust'

export default function Parent() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const parentPin = useAppStore((s) => s.parentPin)
  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])

  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [activeTab, setActiveTab] = useState<ParentTab>('dashboard')

  const navigate = useNavigate()

  const handlePinSubmit = () => {
    if (pinInput === parentPin) {
      setAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  if (!authenticated) {
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
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>家长验证</h2>
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
            密码错误，请重试
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>返回</button>
          <button className="btn btn-primary" onClick={handlePinSubmit} disabled={pinInput.length < 4}>
            确认
          </button>
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
    { key: 'adjust', label: '调分', icon: '⚙️' },
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
              minWidth: 60,
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
      </div>
    </div>
  )
}

function Dashboard() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const logs = usePointStore((s) => s.logs)
  const exchanges = useExchangeStore((s) => s.exchanges)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

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

  if (!child) return null

  const handleSubmit = () => {
    if (!reason.trim()) {
      showToast('请填写原因')
      return
    }

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

        <button
          className={`btn btn-block ${mode === 'add' ? 'btn-primary' : 'btn-danger'}`}
          onClick={handleSubmit}
          disabled={!reason.trim()}
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
            }}
          >
            确定要扣分
          </button>
        </div>
      </Modal>
    </div>
  )
}
