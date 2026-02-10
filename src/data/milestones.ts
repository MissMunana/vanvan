export type MilestoneCategory = 'gross_motor' | 'fine_motor' | 'language' | 'social'

export type MilestoneStatus = 'not_started' | 'in_progress' | 'achieved'

export interface MilestoneDefinition {
  id: string
  name: string
  category: MilestoneCategory
  startMonth: number
  endMonth: number
  description: string
  icon: string
}

export const MILESTONE_CATEGORY_INFO: Record<MilestoneCategory, { label: string; icon: string; color: string }> = {
  gross_motor: { label: '大运动', icon: 'PersonStanding', color: '#FF9800' },
  fine_motor: { label: '精细运动', icon: 'Hand', color: '#2196F3' },
  language: { label: '语言', icon: 'MessageCircle', color: '#4CAF50' },
  social: { label: '社交情感', icon: 'Heart', color: '#E91E63' },
}

export const MILESTONES: MilestoneDefinition[] = [
  // 大运动发育
  { id: 'gm_head', name: '抬头', category: 'gross_motor', startMonth: 2, endMonth: 4, description: '俯卧时能抬头45度以上，头部稳定', icon: 'Baby' },
  { id: 'gm_roll', name: '翻身', category: 'gross_motor', startMonth: 4, endMonth: 6, description: '能从仰卧翻到俯卧或从俯卧翻到仰卧', icon: 'RefreshCw' },
  { id: 'gm_sit', name: '独坐', category: 'gross_motor', startMonth: 6, endMonth: 8, description: '不需要支撑就能坐稳', icon: 'Armchair' },
  { id: 'gm_crawl', name: '爬行', category: 'gross_motor', startMonth: 7, endMonth: 10, description: '能用手和膝盖爬行移动', icon: 'Bug' },
  { id: 'gm_walk', name: '独走', category: 'gross_motor', startMonth: 10, endMonth: 15, description: '能不扶东西独立行走', icon: 'Footprints' },
  { id: 'gm_run', name: '跑跳', category: 'gross_motor', startMonth: 18, endMonth: 24, description: '能跑步，尝试双脚跳', icon: 'Zap' },
  { id: 'gm_stairs', name: '上下楼梯', category: 'gross_motor', startMonth: 24, endMonth: 36, description: '能扶着栏杆上下楼梯', icon: 'ArrowUpDown' },
  { id: 'gm_balance', name: '单脚站', category: 'gross_motor', startMonth: 36, endMonth: 48, description: '能单脚站立几秒钟', icon: 'Feather' },

  // 精细运动发育
  { id: 'fm_grasp', name: '抓握', category: 'fine_motor', startMonth: 3, endMonth: 5, description: '能有意识地抓住物品', icon: 'Grab' },
  { id: 'fm_transfer', name: '换手拿物', category: 'fine_motor', startMonth: 6, endMonth: 8, description: '能把物品从一只手换到另一只手', icon: 'Handshake' },
  { id: 'fm_pincer', name: '拇食指捏取', category: 'fine_motor', startMonth: 9, endMonth: 12, description: '能用拇指和食指捏起小物品', icon: 'Minimize2' },
  { id: 'fm_scribble', name: '涂鸦', category: 'fine_motor', startMonth: 12, endMonth: 18, description: '能拿笔在纸上涂鸦', icon: 'Pencil' },
  { id: 'fm_blocks', name: '搭积木', category: 'fine_motor', startMonth: 18, endMonth: 24, description: '能搭2-4块积木', icon: 'Blocks' },
  { id: 'fm_circle', name: '画圆形', category: 'fine_motor', startMonth: 30, endMonth: 36, description: '能画出近似圆形的图案', icon: 'Circle' },
  { id: 'fm_scissors', name: '使用剪刀', category: 'fine_motor', startMonth: 36, endMonth: 48, description: '能用儿童剪刀剪纸', icon: 'Scissors' },

  // 语言发育
  { id: 'lg_vowel', name: '发出元音', category: 'language', startMonth: 2, endMonth: 4, description: '能发出"啊""哦"等元音', icon: 'Volume2' },
  { id: 'lg_turn', name: '转头寻声', category: 'language', startMonth: 4, endMonth: 6, description: '听到声音会转头寻找声源', icon: 'Ear' },
  { id: 'lg_mama', name: '叫"爸爸妈妈"', category: 'language', startMonth: 8, endMonth: 12, description: '能有意识地叫爸爸妈妈', icon: 'Users' },
  { id: 'lg_10words', name: '说10个词', category: 'language', startMonth: 12, endMonth: 18, description: '能说出约10个有意义的词', icon: 'MessageSquare' },
  { id: 'lg_phrase', name: '两字短句', category: 'language', startMonth: 18, endMonth: 24, description: '能说出"妈妈抱""要喝水"等短句', icon: 'Quote' },
  { id: 'lg_sentence', name: '完整句子', category: 'language', startMonth: 24, endMonth: 36, description: '能说出3-5个词的完整句子', icon: 'Megaphone' },
  { id: 'lg_story', name: '讲简单故事', category: 'language', startMonth: 36, endMonth: 48, description: '能描述简单事件或讲短故事', icon: 'BookOpen' },

  // 社交情感发育
  { id: 'sc_smile', name: '社交性微笑', category: 'social', startMonth: 2, endMonth: 3, description: '能对人微笑回应', icon: 'Smile' },
  { id: 'sc_anxiety', name: '分离焦虑', category: 'social', startMonth: 6, endMonth: 12, description: '与主要照顾者分开时出现焦虑', icon: 'Frown' },
  { id: 'sc_imitate', name: '模仿行为', category: 'social', startMonth: 9, endMonth: 12, description: '模仿大人的动作和表情', icon: 'Copy' },
  { id: 'sc_parallel', name: '平行游戏', category: 'social', startMonth: 18, endMonth: 24, description: '在其他小朋友旁边各玩各的', icon: 'UsersRound' },
  { id: 'sc_cooperate', name: '合作游戏', category: 'social', startMonth: 36, endMonth: 48, description: '能和其他小朋友一起合作玩游戏', icon: 'Handshake' },
  { id: 'sc_empathy', name: '共情表达', category: 'social', startMonth: 48, endMonth: 60, description: '能感受他人情绪并表达关心', icon: 'HeartHandshake' },
]

export function getMilestonesForAge(ageMonths: number): MilestoneDefinition[] {
  return MILESTONES.filter(
    (m) => ageMonths >= m.startMonth - 2 && ageMonths <= m.endMonth + 6
  )
}

export function getUpcomingMilestones(ageMonths: number): MilestoneDefinition[] {
  return MILESTONES.filter(
    (m) => m.startMonth > ageMonths && m.startMonth <= ageMonths + 6
  )
}
