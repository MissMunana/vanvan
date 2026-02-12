import { create } from 'zustand'
import type { KnowledgeArticle, KnowledgeArticleSummary, KnowledgeBookmark, KnowledgeCategory, KnowledgeAgeGroup } from '../types'
import { knowledgeApi } from '../lib/api'

interface KnowledgeStore {
  articles: KnowledgeArticleSummary[]
  articleDetail: KnowledgeArticle | null
  bookmarks: KnowledgeBookmark[]
  bookmarkedIds: Set<string>
  isLoading: boolean
  error: string | null

  activeCategory: KnowledgeCategory | 'all' | 'bookmarks'
  activeAgeGroup: KnowledgeAgeGroup | null
  searchQuery: string

  fetchArticles: () => Promise<void>
  fetchArticleDetail: (articleId: string) => Promise<void>
  fetchBookmarks: () => Promise<void>
  toggleBookmark: (articleId: string) => Promise<void>

  setActiveCategory: (category: KnowledgeCategory | 'all' | 'bookmarks') => void
  setActiveAgeGroup: (ageGroup: KnowledgeAgeGroup | null) => void
  setSearchQuery: (query: string) => void
  getFilteredArticles: () => KnowledgeArticleSummary[]
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  (set, get) => ({
    articles: [],
    articleDetail: null,
    bookmarks: [],
    bookmarkedIds: new Set(),
    isLoading: false,
    error: null,

    activeCategory: 'all',
    activeAgeGroup: null,
    searchQuery: '',

    fetchArticles: async () => {
      set({ isLoading: true, error: null })
      try {
        const data = await knowledgeApi.articles.list()
        set({ articles: data, isLoading: false })
      } catch (err: any) {
        set({ isLoading: false, error: err.message || '加载失败' })
      }
    },

    fetchArticleDetail: async (articleId) => {
      try {
        const article = await knowledgeApi.articles.get(articleId)
        set({ articleDetail: article })
      } catch {
        // fail silently, card will show summary only
      }
    },

    fetchBookmarks: async () => {
      try {
        const data = await knowledgeApi.bookmarks.list()
        set({ bookmarks: data, bookmarkedIds: new Set(data.map((b) => b.articleId)) })
      } catch {
        // non-critical
      }
    },

    toggleBookmark: async (articleId) => {
      const { bookmarkedIds, bookmarks } = get()
      const isBookmarked = bookmarkedIds.has(articleId)

      // Optimistic update
      const newIds = new Set(bookmarkedIds)
      if (isBookmarked) {
        newIds.delete(articleId)
      } else {
        newIds.add(articleId)
      }
      set({ bookmarkedIds: newIds })

      try {
        if (isBookmarked) {
          await knowledgeApi.bookmarks.remove(articleId)
          set({ bookmarks: bookmarks.filter((b) => b.articleId !== articleId) })
        } else {
          const bookmark = await knowledgeApi.bookmarks.create(articleId)
          set({ bookmarks: [...bookmarks, bookmark] })
        }
      } catch {
        // Revert on failure
        set({ bookmarkedIds })
      }
    },

    setActiveCategory: (category) => set({ activeCategory: category }),
    setActiveAgeGroup: (ageGroup) => set({ activeAgeGroup: ageGroup }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    getFilteredArticles: () => {
      const { articles, activeCategory, activeAgeGroup, searchQuery, bookmarkedIds } = get()
      let filtered = articles

      if (activeCategory === 'bookmarks') {
        filtered = filtered.filter((a) => bookmarkedIds.has(a.articleId))
      } else if (activeCategory !== 'all') {
        filtered = filtered.filter((a) => a.category === activeCategory)
      }

      if (activeAgeGroup) {
        filtered = filtered.filter((a) => a.ageGroup === activeAgeGroup || a.ageGroup === null)
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        filtered = filtered.filter((a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
        )
      }

      return filtered
    },
  })
)
