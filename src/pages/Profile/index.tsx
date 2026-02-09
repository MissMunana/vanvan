import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { usePointStore } from '../../stores/pointStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { Modal } from '../../components/common/Modal'

export default function Profile() {
  const child = useAppStore((s) => s.getCurrentChild())
  const weeklyStats = usePointStore((s) => s.getWeeklyStats(child?.childId || ''))
  const recentLogs = usePointStore((s) => s.getChildLogs(child?.childId || '', 20))
  const exchanges = useExchangeStore((s) => s.getChildExchanges(child?.childId || ''))
  const navigate = useNavigate()

  const [showHistory, setShowHistory] = useState(false)

  if (!child) return null

  const approvedExchanges = exchanges.filter((e) => e.status === 'approved').length

  return (
    <div className="page">
      {/* Profile header */}
      <div style={{
        textAlign: 'center',
        padding: '20px 0',
        marginBottom: 20,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 12px',
          boxShadow: '0 4px 16px rgba(255,184,0,0.2)',
        }}>
          {child.avatar}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{child.name}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          {child.age}岁 · {child.gender === 'male' ? '男孩' : '女孩'}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {child.totalPoints}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            当前积分
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {weeklyStats.tasksCompleted}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            本周完成
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-info)' }}>
            {approvedExchanges}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            已兑换
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => setShowHistory(true)}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>📊</span>
          <span style={{ flex: 1, fontWeight: 600 }}>积分历史</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>

        <button
          onClick={() => navigate('/parent')}
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>👨‍👩‍👧</span>
          <span style={{ flex: 1, fontWeight: 600 }}>家长控制台</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </button>
      </div>

      {/* Points history modal */}
      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="积分历史"
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {recentLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
              还没有积分记录
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.logId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(log.createdAt).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.emotion && ` · ${log.emotion}`}
                  </div>
                </div>
                <span style={{
                  fontWeight: 700,
                  color: log.points > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {log.points > 0 ? '+' : ''}{log.points}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
