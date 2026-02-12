import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EVIDENCE_LEVEL_INFO, KNOWLEDGE_CATEGORY_INFO } from '../../types'
import type { KnowledgeArticleSummary } from '../../types'
import ArticleDetail from './ArticleDetail'

interface ArticleCardProps {
  article: KnowledgeArticleSummary
  isBookmarked: boolean
  onToggleBookmark: () => void
}

export default function ArticleCard({ article, isBookmarked, onToggleBookmark }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const evidence = EVIDENCE_LEVEL_INFO[article.sourceLevel]
  const categoryInfo = KNOWLEDGE_CATEGORY_INFO[article.category]

  return (
    <motion.div
      layout
      style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        border: isExpanded ? '2px solid #7C4DFF40' : '2px solid transparent',
        transition: 'border-color 0.2s',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{article.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
            {article.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: '#7C4DFF15',
              color: '#7C4DFF',
              padding: '1px 8px',
              borderRadius: 10,
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              {categoryInfo.icon} {categoryInfo.label}
            </span>
            <span style={{ color: '#FFB800', fontSize: '0.8rem' }}>
              {'⭐'.repeat(evidence.stars)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {article.sourceName}
            </span>
          </div>
        </div>
        {/* Bookmark button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', padding: '2px', flexShrink: 0,
          }}
          aria-label={isBookmarked ? '取消收藏' : '收藏'}
        >
          {isBookmarked ? '🔖' : '📄'}
        </button>
      </div>

      {/* Summary */}
      <p style={{
        fontSize: '0.92rem',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.5,
        marginTop: 8,
        marginBottom: 0,
      }}>
        {article.summary}
      </p>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <ArticleDetail articleId={article.articleId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
