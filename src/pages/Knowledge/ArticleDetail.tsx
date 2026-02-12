import { useEffect } from 'react'
import { useKnowledgeStore } from '../../stores/knowledgeStore'
import { EVIDENCE_LEVEL_INFO } from '../../types'

interface ArticleDetailProps {
  articleId: string
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const articleDetail = useKnowledgeStore((s) => s.articleDetail)
  const fetchArticleDetail = useKnowledgeStore((s) => s.fetchArticleDetail)

  const article = articleDetail?.articleId === articleId ? articleDetail : null

  useEffect(() => {
    if (!article) fetchArticleDetail(articleId)
  }, [articleId])

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: 16, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        加载中...
      </div>
    )
  }

  const evidence = EVIDENCE_LEVEL_INFO[article.sourceLevel]

  return (
    <div>
      {/* Article content */}
      <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--color-text)', whiteSpace: 'pre-line' }}>
        {article.content}
      </div>

      {/* Source citation */}
      <div style={{
        marginTop: 16,
        background: '#2196F310',
        border: '1px solid #2196F330',
        borderRadius: 8,
        padding: 10,
        fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, color: '#2196F3', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>📋</span> 参考来源
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#FFB800' }}>{'⭐'.repeat(evidence.stars)}</span>
          <span style={{ fontWeight: 500 }}>{article.sourceName}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>({evidence.label})</span>
        </div>
        {article.sourceUrl && (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2196F3', fontSize: '0.75rem', textDecoration: 'underline', marginTop: 4, display: 'inline-block' }}
          >
            查看原文
          </a>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{
              background: 'var(--color-bg)',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
