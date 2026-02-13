import { create } from 'zustand'
import type { TaskRecommendation, PointsSuggestion, KnowledgeRecommendation } from '../utils/recommendationEngine'
import { getTaskRecommendations, getPointsSuggestions, getKnowledgeRecommendations } from '../utils/recommendationEngine'
import { useAppStore } from './appStore'
import { useTaskStore } from './taskStore'
import { usePointStore } from './pointStore'
import { useRewardStore } from './rewardStore'
import { useExchangeStore } from './exchangeStore'
import { useHealthStore } from './healthStore'

interface RecommendationStore {
  taskRecommendations: TaskRecommendation[]
  pointsSuggestions: PointsSuggestion[]
  knowledgeRecommendations: KnowledgeRecommendation[]
  lastComputedAt: string | null

  refresh: (childId: string) => void

  dismissedTaskNames: Set<string>
  dismissTask: (templateName: string) => void

  dismissedSuggestionIds: Set<string>
  dismissSuggestion: (id: string) => void
}

export const useRecommendationStore = create<RecommendationStore>()((set, get) => ({
  taskRecommendations: [],
  pointsSuggestions: [],
  knowledgeRecommendations: [],
  lastComputedAt: null,

  refresh: (childId: string) => {
    const child = useAppStore.getState().children.find((c) => c.childId === childId)
    if (!child) return

    const tasks = useTaskStore.getState().tasks
    const logs = usePointStore.getState().logs
    const rewards = useRewardStore.getState().rewards
    const exchanges = useExchangeStore.getState().exchanges
    const healthState = useHealthStore.getState()

    const dismissed = get().dismissedTaskNames
    const dismissedSuggestions = get().dismissedSuggestionIds

    const taskRecs = getTaskRecommendations(child, tasks)
      .filter((r) => !dismissed.has(r.template.name))

    const pointsSugs = getPointsSuggestions(child, tasks, logs, exchanges, rewards)
      .filter((s) => !dismissedSuggestions.has(s.id))

    const knowledgeRecs = getKnowledgeRecommendations(
      child,
      tasks,
      healthState.temperatureRecords,
      healthState.sleepRecords
    )

    set({
      taskRecommendations: taskRecs,
      pointsSuggestions: pointsSugs,
      knowledgeRecommendations: knowledgeRecs,
      lastComputedAt: new Date().toISOString(),
    })
  },

  dismissedTaskNames: new Set(),
  dismissTask: (templateName: string) => {
    set((s) => {
      const next = new Set(s.dismissedTaskNames)
      next.add(templateName)
      return {
        dismissedTaskNames: next,
        taskRecommendations: s.taskRecommendations.filter((r) => r.template.name !== templateName),
      }
    })
  },

  dismissedSuggestionIds: new Set(),
  dismissSuggestion: (id: string) => {
    set((s) => {
      const next = new Set(s.dismissedSuggestionIds)
      next.add(id)
      return {
        dismissedSuggestionIds: next,
        pointsSuggestions: s.pointsSuggestions.filter((sg) => sg.id !== id),
      }
    })
  },
}))
