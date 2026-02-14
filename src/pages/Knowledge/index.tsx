import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { useRecommendationStore } from '../../stores/recommendationStore'
import { Modal } from '../../components/common/Modal'
import { KNOWLEDGE_CATEGORY_INFO, type LocalKnowledgeArticle, type LocalKnowledgeCategory } from '../../data/knowledgeArticles'

type FilterCategory = LocalKnowledgeCategory | 'all'

const CATEGORY_TABS: { key: FilterCategory; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📚' },
  ...Object.entries(KNOWLEDGE_CATEGORY_INFO).map(([key, info]) => ({
    key: key as LocalKnowledgeCategory,
    label: info.label,
    icon: info.icon,
  })),
]

export default function Knowledge() {
  const currentChildId = useAppStore((s) => s.currentChildId)
  const knowledgeRecommendations = useRecommendationStore((s) => s.knowledgeRecommendations)
  const refresh = useRecommendationStore((s) => s.refresh)

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all')
  const [selectedArticle, setSelectedArticle] = useState<LocalKnowledgeArticle | null>(null)

  useEffect(() => {
    if (currentChildId) {
      refresh(currentChildId)
    }
  }, [currentChildId, refresh])

  const featured = useMemo(() => {
    return knowledgeRecommendations.filter((r) => r.priority > 3).slice(0, 5)
  }, [knowledgeRecommendations])

  const allArticles = useMemo(() => {
    const articles = knowledgeRecommendations
    if (selectedCategory === 'all') return articles
    return articles.filter((r) => r.article.category === selectedCategory)
  }, [knowledgeRecommendations, selectedCategory])

  const nonFeaturedArticles = useMemo(() => {
    const featuredIds = new Set(featured.map((f) => f.article.articleId))
    return allArticles.filter((a) => !featuredIds.has(a.article.articleId))
  }, [allArticles, featured])

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>
        📖 知识库
      </h2>

      {/* Category filter tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 12,
        marginBottom: 16,
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: selectedCategory === tab.key
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-border)',
              background: selectedCategory === tab.key
                ? 'var(--color-primary-light)'
                : 'white',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === tab.key ? 700 : 400,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Featured articles */}
      {selectedCategory === 'all' && featured.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 10 }}>
            为你推荐
          </div>
          {featured.map((rec) => (
            <motion.div
              key={rec.article.articleId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedArticle(rec.article)}
              style={{
                background: 'var(--color-primary-light)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 10,
                cursor: 'pointer',
                border: '1px solid var(--color-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>{rec.article.icon}</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rec.article.title}</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: 4, fontWeight: 600 }}>
                {rec.reason}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                {rec.article.summary}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* All articles */}
      <div>
        {(selectedCategory !== 'all' || nonFeaturedArticles.length > 0) && (
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 10 }}>
            {selectedCategory === 'all' ? '全部文章' : KNOWLEDGE_CATEGORY_INFO[selectedCategory].label}
          </div>
        )}
        {nonFeaturedArticles.length === 0 && selectedCategory !== 'all' && allArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            暂无该分类的文章
          </div>
        ) : (
          nonFeaturedArticles.map((rec) => (
            <div
              key={rec.article.articleId}
              onClick={() => setSelectedArticle(rec.article)}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{rec.article.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.article.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {KNOWLEDGE_CATEGORY_INFO[rec.article.category].icon} {KNOWLEDGE_CATEGORY_INFO[rec.article.category].label}
                </div>
              </div>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>›</span>
            </div>
          ))
        )}
      </div>

      {/* Empty state */}
      {knowledgeRecommendations.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: '0.9rem' }}>请先添加孩子信息，获取个性化推荐内容</div>
        </div>
      )}

      {/* Article detail modal */}
      <AnimatePresence>
        {selectedArticle && (
          <Modal open={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle.title}>
            <div style={{ padding: 16, maxHeight: '70dvh', overflowY: 'auto' }}>
              {/* Category badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--color-primary-light)',
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                marginBottom: 16,
              }}>
                {KNOWLEDGE_CATEGORY_INFO[selectedArticle.category].icon}
                {KNOWLEDGE_CATEGORY_INFO[selectedArticle.category].label}
              </div>

              {/* Summary */}
              <div style={{
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: 16,
                fontStyle: 'italic',
              }}>
                {selectedArticle.summary}
              </div>

              {/* Content paragraphs */}
              {selectedArticle.content.map((paragraph, i) => (
                <p key={i} style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 12, color: 'var(--color-text)' }}>
                  {paragraph}
                </p>
              ))}

              {/* Tips */}
              {selectedArticle.tips.length > 0 && (
                <div style={{
                  background: 'var(--color-primary-light)',
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 16,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>
                    💡 实用建议
                  </div>
                  {selectedArticle.tips.map((tip, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', marginBottom: 6, lineHeight: 1.5, paddingLeft: 12 }}>
                      • {tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
