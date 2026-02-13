import type { FirstAidGuide } from '../types'

export const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  common: { label: '常见', color: '#4CAF50' },
  urgent: { label: '紧急', color: '#FF9800' },
  emergency: { label: '危急', color: '#FF5252' },
}

export const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'wound_bleeding',
    title: '伤口出血',
    icon: '🩹',
    severity: 'common',
    steps: [
      { stepNumber: 1, title: '清洁双手', description: '用肥皂和清水洗手，或使用手套/干净布料', icon: '🧴' },
      { stepNumber: 2, title: '清洗伤口', description: '用流动清水冲洗伤口至少5分钟，去除异物', icon: '🚿' },
      { stepNumber: 3, title: '止血', description: '用干净纱布或布料按压伤口，持续5-10分钟不松手', icon: '🤚' },
      { stepNumber: 4, title: '消毒包扎', description: '涂抹碘伏消毒，贴上创可贴或用纱布包扎', icon: '🩹' },
    ],
    warnings: ['不要用嘴吹伤口', '不要涂牙膏、酱油等偏方'],
    whenToCallEmergency: ['出血超过10分钟仍无法止住', '伤口很深或很长（>2cm）', '伤口内有异物无法取出', '被动物咬伤'],
  },
  {
    id: 'burns',
    title: '烧烫伤',
    icon: '🔥',
    severity: 'urgent',
    steps: [
      { stepNumber: 1, title: '冲', description: '立即用流动冷水冲洗烫伤部位至少15-20分钟', icon: '🚿' },
      { stepNumber: 2, title: '脱', description: '在水中小心脱去覆盖在伤口上的衣物', icon: '👔' },
      { stepNumber: 3, title: '泡', description: '将烫伤部位泡在冷水中继续降温10-30分钟', icon: '🪣' },
      { stepNumber: 4, title: '盖', description: '用干净的纱布或保鲜膜轻轻覆盖伤口', icon: '🩻' },
      { stepNumber: 5, title: '送', description: '严重烫伤立即送医', icon: '🏥' },
    ],
    warnings: ['不要涂牙膏、酱油、面粉等', '不要弄破水泡', '不要用冰块直接接触伤口'],
    whenToCallEmergency: ['烫伤面积大于孩子手掌', '面部、关节、手脚或生殖器烫伤', '出现水泡', '电击伤或化学灼伤'],
  },
  {
    id: 'head_injury',
    title: '头部撞伤',
    icon: '🤕',
    severity: 'urgent',
    steps: [
      { stepNumber: 1, title: '保持冷静', description: '安抚孩子，观察意识状态', icon: '🫂' },
      { stepNumber: 2, title: '冷敷', description: '用冰袋或冷毛巾敷在撞伤处15-20分钟', icon: '🧊' },
      { stepNumber: 3, title: '观察72小时', description: '密切观察精神状态、呕吐、步态等变化', icon: '👀' },
      { stepNumber: 4, title: '记录症状', description: '记录撞伤时间、位置和之后出现的任何异常', icon: '📝' },
    ],
    warnings: ['撞伤后24小时内尽量不要让孩子入睡（或每2小时叫醒观察）', '不要给孩子服用阿司匹林'],
    whenToCallEmergency: ['失去意识（哪怕很短暂）', '持续呕吐', '瞳孔大小不等', '头部出血不止', '抽搐', '异常嗜睡叫不醒', '耳朵或鼻子流出透明液体'],
  },
  {
    id: 'foreign_body_ingestion',
    title: '异物吞入',
    icon: '⚠️',
    severity: 'emergency',
    steps: [
      { stepNumber: 1, title: '判断异物类型', description: '确认吞入什么物品、大小和时间', icon: '🔍' },
      { stepNumber: 2, title: '保持冷静', description: '不要强行催吐（可能造成二次伤害）', icon: '⛔' },
      { stepNumber: 3, title: '评估呼吸', description: '如果孩子能正常呼吸说话，说明未卡住气道', icon: '🫁' },
      { stepNumber: 4, title: '送医处理', description: '带上同类物品样本一起就医', icon: '🏥' },
    ],
    warnings: ['不要催吐（尖锐物或腐蚀性物品催吐会加重损伤）', '不要给孩子喝大量水或进食'],
    whenToCallEmergency: ['吞入纽扣电池（极度紧急！）', '吞入磁铁（2个以上）', '呼吸困难或窒息', '吞入尖锐物品', '腹痛加重或呕吐'],
  },
  {
    id: 'choking',
    title: '气道异物/窒息',
    icon: '😫',
    severity: 'emergency',
    ageNotes: {
      infant: '1岁以下：背部拍击法 + 胸部按压法',
      child: '1岁以上：海姆立克急救法（腹部冲击法）',
    },
    steps: [
      { stepNumber: 1, title: '判断是否窒息', description: '不能说话、不能咳嗽、面色发紫', icon: '🔴' },
      { stepNumber: 2, title: '1岁以下 - 背部拍击', description: '面朝下托在前臂上，用掌根拍击肩胛骨之间5次', icon: '👋' },
      { stepNumber: 3, title: '1岁以下 - 胸部按压', description: '翻转面朝上，用两指按压胸骨中线5次，交替进行', icon: '☝️' },
      { stepNumber: 4, title: '1岁以上 - 海姆立克法', description: '从背后环抱，双拳放在肚脐上方，快速向上向内冲击5次', icon: '🤜' },
    ],
    warnings: ['不要用手指盲目掏取异物', '不要拍打背部（仅1岁以下用背部拍击法）'],
    whenToCallEmergency: ['异物未排出且意识下降', '呼吸停止', '面色青紫不缓解'],
  },
  {
    id: 'febrile_seizure',
    title: '高热惊厥',
    icon: '🌡️',
    severity: 'emergency',
    steps: [
      { stepNumber: 1, title: '让孩子侧卧', description: '侧卧位防止误吸呕吐物，头偏向一侧', icon: '🔄' },
      { stepNumber: 2, title: '保护安全', description: '移开周围硬物，不要强行按住孩子', icon: '🛡️' },
      { stepNumber: 3, title: '记录时间', description: '记录抽搐开始时间和持续时长', icon: '⏱️' },
      { stepNumber: 4, title: '等待结束', description: '大多数惊厥在1-3分钟内自行停止', icon: '⏳' },
    ],
    warnings: ['不要往嘴里塞东西', '不要灌水或喂药', '不要强行按压或束缚', '不要掐人中'],
    whenToCallEmergency: ['抽搐超过5分钟未停止', '第一次发生高热惊厥', '抽搐停止后意识不恢复', '反复发作'],
  },
]
