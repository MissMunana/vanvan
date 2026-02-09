import type { TaskCategory, RewardCategory } from '../types'

export interface TaskTemplate {
  name: string
  category: TaskCategory
  points: number
  icon: string
  description: string
  ageGroups: ('3-5' | '6-8' | '9-12')[]
}

export interface RewardTemplate {
  name: string
  category: RewardCategory
  points: number
  icon: string
  description: string
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // 生活习惯 - 学龄前
  { name: '自己刷牙', category: 'life', points: 10, icon: '😁', description: '早晚各刷一次牙', ageGroups: ['3-5', '6-8'] },
  { name: '自己穿衣服', category: 'life', points: 10, icon: '🎀', description: '自己穿好衣服', ageGroups: ['3-5'] },
  { name: '收拾玩具', category: 'life', points: 15, icon: '🧸', description: '玩完后把玩具放回原处', ageGroups: ['3-5', '6-8'] },
  { name: '洗手', category: 'life', points: 5, icon: '🫧', description: '饭前便后洗手', ageGroups: ['3-5'] },
  { name: '自己吃饭', category: 'life', points: 10, icon: '🍙', description: '自己吃完饭不挑食', ageGroups: ['3-5'] },
  { name: '整理床铺', category: 'life', points: 10, icon: '🌤️', description: '起床后整理自己的床', ageGroups: ['6-8', '9-12'] },

  // 学习习惯
  { name: '按时完成作业', category: 'study', points: 20, icon: '📒', description: '按时完成当天作业', ageGroups: ['6-8', '9-12'] },
  { name: '主动阅读30分钟', category: 'study', points: 15, icon: '🦉', description: '每天阅读30分钟', ageGroups: ['6-8', '9-12'] },
  { name: '整理书包', category: 'study', points: 10, icon: '🎒', description: '睡前整理好第二天的书包', ageGroups: ['6-8', '9-12'] },
  { name: '听故事', category: 'study', points: 10, icon: '🧚', description: '认真听完一个故事', ageGroups: ['3-5'] },
  { name: '分享学习心得', category: 'study', points: 10, icon: '💡', description: '和家人分享今天学到的东西', ageGroups: ['6-8', '9-12'] },

  // 礼貌行为
  { name: '有礼貌说"谢谢"', category: 'manner', points: 5, icon: '💖', description: '得到帮助时说谢谢', ageGroups: ['3-5', '6-8'] },
  { name: '主动打招呼', category: 'manner', points: 5, icon: '🤗', description: '见到长辈主动问好', ageGroups: ['3-5', '6-8', '9-12'] },
  { name: '分享玩具', category: 'manner', points: 10, icon: '💝', description: '和小朋友分享玩具', ageGroups: ['3-5', '6-8'] },
  { name: '耐心等待', category: 'manner', points: 10, icon: '🐢', description: '排队或等待时保持耐心', ageGroups: ['3-5', '6-8'] },

  // 家务帮助
  { name: '帮忙扔垃圾', category: 'chore', points: 10, icon: '🌱', description: '帮忙把垃圾扔到垃圾桶', ageGroups: ['3-5', '6-8'] },
  { name: '帮忙做家务', category: 'chore', points: 15, icon: '✨', description: '帮忙扫地、擦桌子等', ageGroups: ['6-8', '9-12'] },
  { name: '帮忙摆碗筷', category: 'chore', points: 10, icon: '🥣', description: '吃饭前帮忙摆碗筷', ageGroups: ['6-8', '9-12'] },
  { name: '自己洗袜子', category: 'chore', points: 15, icon: '🧺', description: '自己洗当天的小衣物', ageGroups: ['9-12'] },
]

export const REWARD_TEMPLATES: RewardTemplate[] = [
  // 亲子时光类
  { name: '爸爸妈妈讲睡前故事', category: 'time', points: 10, icon: '🏰', description: '听一个睡前故事' },
  { name: '一起玩桌游30分钟', category: 'time', points: 20, icon: '🎲', description: '和家人一起玩桌游' },
  { name: '周末去公园玩', category: 'time', points: 50, icon: '🎡', description: '周末去公园玩耍' },
  { name: '一起做烘焙', category: 'time', points: 100, icon: '🧁', description: '和家人一起做蛋糕或饼干' },
  { name: '一起看电影', category: 'time', points: 40, icon: '🍿', description: '和家人一起看一部电影' },

  // 小特权类
  { name: '晚睡15分钟', category: 'privilege', points: 15, icon: '💫', description: '今晚可以晚睡15分钟' },
  { name: '选择今天吃什么', category: 'privilege', points: 20, icon: '🍦', description: '决定今天吃什么' },
  { name: '多看30分钟动画片', category: 'privilege', points: 30, icon: '🎠', description: '多看30分钟喜欢的动画' },

  // 实物类
  { name: '小文具', category: 'material', points: 50, icon: '🖍️', description: '一支好看的笔或文具' },
  { name: '绘本书', category: 'material', points: 100, icon: '🎨', description: '选一本喜欢的绘本' },
  { name: '中等玩具', category: 'material', points: 200, icon: '🧩', description: '一个中等大小的玩具' },
]

export const AVATAR_OPTIONS = [
  '🐭', '🐮', '🐯', '🐰', '🐲',
  '🐍', '🐴', '🐑', '🐵', '🐔',
  '🐶', '🐷', '🐱', '🐻', '🐼',
  '🦊', '🦁', '🐸', '🐧', '🐥',
  '🦄', '🌟',
]
