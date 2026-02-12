import type { KnowledgeArticleSummary } from '../../types'
import { useKnowledgeStore } from '../../stores/knowledgeStore'
import ArticleCard from './ArticleCard'

interface ArticleListProps {
  articles: KnowledgeArticleSummary[]
}

export default function ArticleList({ articles }: ArticleListProps) {
  const bookmarkedIds = useKnowledgeStore((s) => s.bookmarkedIds)
  const toggleBookmark = useKnowledgeStore((s) => s.toggleBookmark)

  if (articles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📖</div>
        <div style={{ fontSize: '0.9rem' }}>暂无相关文章</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {articles.map((article) => (
        <ArticleCard
          key={article.articleId}
          article={article}
          isBookmarked={bookmarkedIds.has(article.articleId)}
          onToggleBookmark={() => toggleBookmark(article.articleId)}
        />
      ))}
    </div>
  )
}
