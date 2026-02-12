import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useRewardStore } from '../../stores/rewardStore'
import { useExchangeStore } from '../../stores/exchangeStore'
import { useToast } from '../../components/common/Toast'
import { Modal } from '../../components/common/Modal'
import { REWARD_CATEGORY_INFO, type RewardCategory } from '../../types'
import type { Reward } from '../../types'
import { usePageData } from '../../hooks/usePageData'
import PageLoading from '../../components/common/PageLoading'
export default function Shop() {
  const { isLoading: pageLoading, error: pageError } = usePageData(['rewards', 'exchanges'])
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const storeRewards = useRewardStore((s) => s.rewards)
  const createExchange = useExchangeStore((s) => s.createExchange)
  const allExchanges = useExchangeStore((s) => s.exchanges)

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const rewardsByCategory = useMemo(() => {
    const activeRewards = storeRewards.filter((r) => r.childId === childId && r.isActive)
    const grouped: Record<RewardCategory, typeof activeRewards> = {
      time: [], privilege: [], material: [],
    }
    activeRewards.forEach((r) => { grouped[r.category].push(r) })
    return grouped
  }, [storeRewards, childId])

  const childExchanges = useMemo(() => allExchanges.filter((e) => e.childId === childId), [allExchanges, childId])
  const { showToast } = useToast()

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [activeCategory, setActiveCategory] = useState<RewardCategory | 'all'>('all')

  const allRewards = activeCategory === 'all'
    ? Object.values(rewardsByCategory).flat()
    : rewardsByCategory[activeCategory] || []

  if (!child) return null

  const handleExchange = async (reward: Reward) => {
    if (child.totalPoints < reward.points) {
      showToast(`还差${reward.points - child.totalPoints}分就够啦! 加油!`)
      setSelectedReward(null)
      return
    }

    try {
      await createExchange({
        childId: child.childId,
        rewardId: reward.rewardId,
        rewardName: reward.name,
        rewardIcon: reward.icon,
        points: reward.points,
      })
      showToast('兑换申请已提交，等待家长确认')
    } catch {
      showToast('提交失败，请重试')
    }
    setSelectedReward(null)
  }

  const pendingRewardIds = new Set(
    childExchanges.filter((e) => e.status === 'pending').map((e) => e.rewardId)
  )

  const categories = Object.entries(REWARD_CATEGORY_INFO) as [RewardCategory, { label: string; icon: string }][]

  return (
    <PageLoading isLoading={pageLoading} error={pageError}>
    <div className="page">
      <h2 className="page-title">积分商城</h2>

      {/* Current points */}
      <div style={{
        background: 'linear-gradient(135deg, #FFE082, #FFB800)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        color: 'white',
      }}>
        <span style={{ fontWeight: 600 }}>我的积分</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>⭐ {child.totalPoints}</span>
      </div>

      {/* Category filter */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        marginBottom: 16,
        paddingBottom: 4,
      }}>
        <button
          className={`chip-filter${activeCategory === 'all' ? ' active' : ''}`}
          onClick={() => setActiveCategory('all')}
          style={activeCategory === 'all' ? { background: 'var(--color-primary)' } : undefined}
        >
          全部
        </button>
        {categories.map(([key, info]) => (
          <button
            key={key}
            className={`chip-filter${activeCategory === key ? ' active' : ''}`}
            onClick={() => setActiveCategory(key)}
            style={activeCategory === key ? { background: 'var(--color-primary)' } : undefined}
          >
            {info.icon} {info.label}
          </button>
        ))}
      </div>

      {/* Rewards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'var(--grid-shop-cols)',
        gap: 12,
      }}>
        {allRewards.map((reward) => {
          const canAfford = child.totalPoints >= reward.points
          const isPending = pendingRewardIds.has(reward.rewardId)
          const progress = Math.min(1, child.totalPoints / reward.points)
          const almostThere = progress >= 0.8 && !canAfford

          return (
            <motion.button
              key={reward.rewardId}
              whileTap={{ scale: 0.97 }}
              onClick={() => !isPending && setSelectedReward(reward)}
              className="card"
              style={{
                textAlign: 'center',
                padding: '16px 12px',
                position: 'relative',
                overflow: 'hidden',
                border: almostThere ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              {almostThere && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  fontSize: '0.65rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}>
                  快够了!
                </div>
              )}
              {isPending && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  fontSize: '0.65rem',
                  background: 'var(--color-info)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}>
                  等待确认
                </div>
              )}
              <div style={{ marginBottom: 8 }}><span style={{ fontSize: '2.5rem' }}>{reward.icon}</span></div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>{reward.name}</div>

              {/* Progress bar */}
              <div className="progress-bar" style={{ height: 4, marginBottom: 6 }}>
                <div className="progress-bar-fill" style={{
                  width: `${progress * 100}%`,
                  background: canAfford ? 'var(--color-success)' : 'var(--color-primary)',
                }} />
              </div>

              <div style={{
                fontWeight: 700,
                color: canAfford ? 'var(--color-success)' : 'var(--color-primary)',
                fontSize: '0.9rem',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⭐ {reward.points}分</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {allRewards.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <div>还没有奖励哦</div>
          <div className="empty-state-text" style={{ marginTop: 4 }}>让家长在家长控制台添加奖励吧</div>
        </div>
      )}

      {/* Exchange confirmation modal */}
      <Modal
        open={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        title="确认兑换"
      >
        {selectedReward && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 12 }}><span style={{ fontSize: '3rem' }}>{selectedReward.icon}</span></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
              {selectedReward.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              {selectedReward.description}
            </div>

            <div style={{
              background: 'var(--color-primary-light)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>需要消耗</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>⭐ {selectedReward.points} 积分</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                当前积分: {child.totalPoints}
              </div>
            </div>

            {child.totalPoints >= selectedReward.points ? (
              <button
                className="btn btn-primary btn-block"
                onClick={() => handleExchange(selectedReward)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>我想要! 🌟</span>
              </button>
            ) : (
              <div>
                <div style={{
                  color: 'var(--color-warning)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: 12,
                }}>
                  还差{selectedReward.points - child.totalPoints}分就够啦! 加油!
                </div>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => setSelectedReward(null)}
                >
                  继续努力
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </PageLoading>
  )
}
