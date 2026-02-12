import type { SafetyChecklistItem, SafetyAgeGroup } from '../types'

export const SAFETY_CHECKLISTS: SafetyChecklistItem[] = [
  // 0-1岁
  { id: 'sc_01_01', ageGroup: '0-1', category: '睡眠安全', text: '婴儿床无多余软物（枕头、毯子、毛绒玩具）', priority: 'high' },
  { id: 'sc_01_02', ageGroup: '0-1', category: '睡眠安全', text: '婴儿仰睡，不使用睡眠定位器', priority: 'high' },
  { id: 'sc_01_03', ageGroup: '0-1', category: '防跌落', text: '换尿布台有安全带且不离开视线', priority: 'high' },
  { id: 'sc_01_04', ageGroup: '0-1', category: '防窒息', text: '小物件（硬币、纽扣等）放在孩子够不到的地方', priority: 'high' },
  { id: 'sc_01_05', ageGroup: '0-1', category: '防烫伤', text: '热水器温度设在48℃以下', priority: 'high' },
  { id: 'sc_01_06', ageGroup: '0-1', category: '洗浴安全', text: '洗澡时绝不离开孩子', priority: 'high' },
  { id: 'sc_01_07', ageGroup: '0-1', category: '乘车安全', text: '使用后向式安全座椅', priority: 'high' },
  { id: 'sc_01_08', ageGroup: '0-1', category: '家居安全', text: '电源插座安装保护盖', priority: 'medium' },

  // 1-3岁
  { id: 'sc_13_01', ageGroup: '1-3', category: '防跌落', text: '楼梯口安装安全门栏', priority: 'high' },
  { id: 'sc_13_02', ageGroup: '1-3', category: '防跌落', text: '窗户安装限位器或防护栏', priority: 'high' },
  { id: 'sc_13_03', ageGroup: '1-3', category: '防中毒', text: '药品和清洁剂放在高处上锁', priority: 'high' },
  { id: 'sc_13_04', ageGroup: '1-3', category: '防溺水', text: '水桶、浴缸不存水；马桶盖锁住', priority: 'high' },
  { id: 'sc_13_05', ageGroup: '1-3', category: '防烫伤', text: '厨房入口安装安全门栏', priority: 'high' },
  { id: 'sc_13_06', ageGroup: '1-3', category: '家具安全', text: '大型家具（书柜、电视柜）固定到墙上', priority: 'high' },
  { id: 'sc_13_07', ageGroup: '1-3', category: '防窒息', text: '不给孩子吃整颗葡萄、坚果、果冻等', priority: 'high' },
  { id: 'sc_13_08', ageGroup: '1-3', category: '乘车安全', text: '继续使用后向式安全座椅至体重/身高上限', priority: 'medium' },

  // 3-6岁
  { id: 'sc_36_01', ageGroup: '3-6', category: '交通安全', text: '教会孩子基本交通规则（红绿灯、斑马线）', priority: 'high' },
  { id: 'sc_36_02', ageGroup: '3-6', category: '水上安全', text: '开始学习游泳', priority: 'medium' },
  { id: 'sc_36_03', ageGroup: '3-6', category: '防走失', text: '孩子能说出自己的全名和家长电话', priority: 'high' },
  { id: 'sc_36_04', ageGroup: '3-6', category: '防走失', text: '教会孩子不跟陌生人走', priority: 'high' },
  { id: 'sc_36_05', ageGroup: '3-6', category: '运动安全', text: '骑车或滑板时佩戴头盔', priority: 'high' },
  { id: 'sc_36_06', ageGroup: '3-6', category: '防中毒', text: '教孩子认识常见危险标志', priority: 'medium' },
  { id: 'sc_36_07', ageGroup: '3-6', category: '身体安全', text: '教会孩子"身体安全"规则（隐私部位）', priority: 'high' },

  // 6-12岁
  { id: 'sc_612_01', ageGroup: '6-12', category: '网络安全', text: '设定上网时间和内容规则', priority: 'high' },
  { id: 'sc_612_02', ageGroup: '6-12', category: '独处安全', text: '独自在家时的安全规则已讲解', priority: 'high' },
  { id: 'sc_612_03', ageGroup: '6-12', category: '运动安全', text: '运动前热身，佩戴适当护具', priority: 'medium' },
  { id: 'sc_612_04', ageGroup: '6-12', category: '急救知识', text: '教会孩子拨打120急救电话', priority: 'high' },
  { id: 'sc_612_05', ageGroup: '6-12', category: '交通安全', text: '12岁以下不骑车上路', priority: 'high' },
  { id: 'sc_612_06', ageGroup: '6-12', category: '防霸凌', text: '教会孩子识别和应对校园霸凌', priority: 'high' },
  { id: 'sc_612_07', ageGroup: '6-12', category: '水上安全', text: '不在没有大人的情况下游泳', priority: 'high' },
]

export function getChecklistForAgeGroup(ageGroup: SafetyAgeGroup): SafetyChecklistItem[] {
  return SAFETY_CHECKLISTS.filter(item => item.ageGroup === ageGroup)
}

export function getChecklistCategories(ageGroup: SafetyAgeGroup): string[] {
  const items = getChecklistForAgeGroup(ageGroup)
  return [...new Set(items.map(i => i.category))]
}
