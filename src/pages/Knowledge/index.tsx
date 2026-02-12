import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeCategory, KnowledgeAgeGroup } from '../../types'
import { KNOWLEDGE_CATEGORY_INFO, KNOWLEDGE_AGE_GROUP_INFO } from '../../types'
import { useKnowledgeStore } from '../../stores/knowledgeStore'
import SubTabBar from '../../components/Layout/SubTabBar'
import SearchBar from './SearchBar'
import ArticleList from './ArticleList'

type KnowledgeTab = KnowledgeCategory | 'all' | 'bookmarks'

const TABS: { key: KnowledgeTab; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📚' },
  { key: 'age_guide', label: KNOWLEDGE_CATEGORY_INFO.age_guide.label, icon: KNOWLEDGE_CATEGORY_INFO.age_guide.icon },
  { key: 'behavior', label: KNOWLEDGE_CATEGORY_INFO.behavior.label, icon: KNOWLEDGE_CATEGORY_INFO.behavior.icon },
  { key: 'illness_care', label: KNOWLEDGE_CATEGORY_INFO.illness_care.label, icon: KNOWLEDGE_CATEGORY_INFO.illness_care.icon },
  { key: 'myth_busting', label: KNOWLEDGE_CATEGORY_INFO.myth_busting.label, icon: KNOWLEDGE_CATEGORY_INFO.myth_busting.icon },
  { key: 'bookmarks', label: '收藏', icon: '🔖' },
]

const TAB_INDEX: Record<KnowledgeTab, number> = {
  all: 0, age_guide: 1, behavior: 2, illness_care: 3, myth_busting: 4, bookmarks: 5,
}

const AGE_GROUPS: KnowledgeAgeGroup[] = ['0-1', '1-3', '3-6', '6-12']

export default function Knowledge() {
  const fetchArticles = useKnowledgeStore((s) => s.fetchArticles)
  const fetchBookmarks = useKnowledgeStore((s) => s.fetchBookmarks)
  const isLoading = useKnowledgeStore((s) => s.isLoading)
  const error = useKnowledgeStore((s) => s.error)
  const activeCategory = useKnowledgeStore((s) => s.activeCategory)
  const activeAgeGroup = useKnowledgeStore((s) => s.activeAgeGroup)
  const searchQuery = useKnowledgeStore((s) => s.searchQuery)
  const setActiveCategory = useKnowledgeStore((s) => s.setActiveCategory)
  const setActiveAgeGroup = useKnowledgeStore((s) => s.setActiveAgeGroup)
  const setSearchQuery = useKnowledgeStore((s) => s.setSearchQuery)
  const getFilteredArticles = useKnowledgeStore((s) => s.getFilteredArticles)

  const prevTabRef = useRef<number>(0)
  const direction = TAB_INDEX[activeCategory] >= prevTabRef.current ? 1 : -1

  useEffect(() => {
    fetchArticles()
    fetchBookmarks()
  }, [])

  const handleTabChange = (tab: KnowledgeTab) => {
    prevTabRef.current = TAB_INDEX[activeCategory]
    setActiveCategory(tab)
    // Reset age group when switching away from age_guide
    if (tab !== 'age_guide') {
      setActiveAgeGroup(null)
    }
  }

  const filteredArticles = getFilteredArticles()

  return (
    <div className="page">
      {/* Header */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 12px 0' }}>循证育儿知识库</h2>

      {/* Search */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Sub tabs */}
      <SubTabBar
        tabs={TABS}
        active={activeCategory}
        onChange={handleTabChange}
        color="#7C4DFF"
      />

      {/* Age group chips — only for age_guide tab */}
      <AnimatePresence>
        {activeCategory === 'age_guide' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              {AGE_GROUPS.map((ag) => {
                const info = KNOWLEDGE_AGE_GROUP_INFO[ag]
                const isActive = activeAgeGroup === ag
                return (
                  <button
                    key={ag}
                    onClick={() => setActiveAgeGroup(isActive ? null : ag)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: isActive ? '1.5px solid #7C4DFF' : '1.5px solid var(--color-border)',
                      background: isActive ? '#7C4DFF15' : 'var(--color-surface)',
                      color: isActive ? '#7C4DFF' : 'var(--color-text-secondary)',
                      fontSize: '1rem',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {info.label} {info.description}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div style={{ marginTop: 12 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: '1rem' }}>加载知识文章中...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#FF5252' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: '1rem' }}>{error}</div>
            <button
              onClick={() => fetchArticles()}
              style={{
                marginTop: 12,
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid #FF525240',
                background: 'none',
                color: '#FF5252',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeCategory + (activeAgeGroup || '')}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 30 }}
              transition={{ duration: 0.2 }}
            >
              <ArticleList articles={filteredArticles} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
