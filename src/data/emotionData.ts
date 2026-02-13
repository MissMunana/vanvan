import type { MoodValue, EmotionAgeGroup } from '../types'

// ---- Mood option shared interface ----
export interface MoodOption {
  value: MoodValue
  emoji: string
  label: string
}

// ---- 3-5 yo: Animal metaphors (不问原因) ----
export const MOOD_OPTIONS_3_5: MoodOption[] = [
  { value: 'joy', emoji: '🐱', label: '开心猫咪' },
  { value: 'sadness', emoji: '😿', label: '哭哭小猫' },
  { value: 'anger', emoji: '🐯', label: '生气老虎' },
  { value: 'fear', emoji: '🐰', label: '害怕小兔' },
  { value: 'calm', emoji: '🐻', label: '平平的小熊' },
]

export const MASCOT_RESPONSES: Record<MoodValue, string> = {
  joy: '太棒了！开心猫咪今天真开心呀～ 🌟',
  sadness: '小猫咪不开心了呀，抱抱你～ 💙',
  anger: '老虎生气了！深呼吸，吸——呼—— 🌬️',
  fear: '小兔子害怕了，没关系，爸爸妈妈在你身边～ 🤗',
  calm: '小熊今天很平静呢，真好～ 🍃',
}

// ---- 6-8 yo: Emoji + optional reasons ----
export const MOOD_OPTIONS_6_8: MoodOption[] = [
  { value: 'joy', emoji: '😄', label: '很开心' },
  { value: 'joy', emoji: '🙂', label: '还不错' },
  { value: 'calm', emoji: '😐', label: '一般般' },
  { value: 'sadness', emoji: '😟', label: '有点不开心' },
  { value: 'sadness', emoji: '😢', label: '很难过' },
  { value: 'anger', emoji: '😠', label: '很生气' },
]

export const REASON_TAGS_6_8 = [
  '和朋友玩了', '学到新东西', '被表扬了', '考试/作业顺利',
  '和朋友吵架了', '被批评了', '作业太多', '没睡好',
  '和家人不开心', '身体不舒服',
]

// ---- 9-12 yo: Emotion families + sub-emotions ----
export interface SubEmotion {
  value: string
  label: string
}

export const EMOTION_FAMILIES: {
  value: MoodValue
  label: string
  emoji: string
  subEmotions: SubEmotion[]
}[] = [
  {
    value: 'joy', label: '快乐', emoji: '😊',
    subEmotions: [
      { value: 'happy', label: '开心' },
      { value: 'excited', label: '兴奋' },
      { value: 'content', label: '满足' },
      { value: 'proud', label: '自豪' },
      { value: 'grateful', label: '感激' },
      { value: 'relaxed', label: '放松' },
    ],
  },
  {
    value: 'sadness', label: '悲伤', emoji: '😢',
    subEmotions: [
      { value: 'sad', label: '难过' },
      { value: 'lonely', label: '孤独' },
      { value: 'disappointed', label: '失望' },
      { value: 'helpless', label: '无助' },
      { value: 'guilty', label: '内疚' },
    ],
  },
  {
    value: 'anger', label: '愤怒', emoji: '😤',
    subEmotions: [
      { value: 'angry', label: '生气' },
      { value: 'frustrated', label: '沮丧' },
      { value: 'annoyed', label: '烦躁' },
      { value: 'jealous', label: '嫉妒' },
      { value: 'resentful', label: '委屈' },
    ],
  },
  {
    value: 'fear', label: '恐惧', emoji: '😰',
    subEmotions: [
      { value: 'scared', label: '害怕' },
      { value: 'anxious', label: '焦虑' },
      { value: 'nervous', label: '紧张' },
      { value: 'worried', label: '担心' },
      { value: 'insecure', label: '不安' },
    ],
  },
  {
    value: 'calm', label: '平静', emoji: '😌',
    subEmotions: [
      { value: 'peaceful', label: '平和' },
      { value: 'bored', label: '无聊' },
      { value: 'confused', label: '困惑' },
      { value: 'tired', label: '疲惫' },
    ],
  },
]

// ---- Conflict debrief feeling options ----
export const FEELING_OPTIONS = [
  '生气', '伤心', '害怕', '失望', '委屈', '着急',
  '担心', '困惑', '后悔', '无奈', '疲惫',
]

// ---- Helper: get mood options by age group ----
export function getMoodOptionsByAge(ageGroup: EmotionAgeGroup): MoodOption[] {
  switch (ageGroup) {
    case '3-5': return MOOD_OPTIONS_3_5
    case '6-8': return MOOD_OPTIONS_6_8
    case '9-12': return MOOD_OPTIONS_6_8 // 9-12 uses emotion wheel, fallback to 6-8
  }
}

// ---- Helper: calculate child's emotion age group from birthday ----
export function getEmotionAgeGroup(birthday: string): EmotionAgeGroup {
  const birth = new Date(birthday)
  const now = new Date()
  const ageMs = now.getTime() - birth.getTime()
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000)

  if (ageYears < 6) return '3-5'
  if (ageYears < 9) return '6-8'
  return '9-12'
}
