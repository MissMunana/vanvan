import type { KnowledgeArticle } from '../types'

/**
 * Seed data for the knowledge_articles table.
 * Run scripts/seed-knowledge.mjs to insert into Supabase.
 */
export const KNOWLEDGE_ARTICLES: Omit<KnowledgeArticle, 'viewCount' | 'createdAt' | 'updatedAt'>[] = [
  // ===== age_guide (6 articles) =====
  {
    articleId: 'ag-breastfeeding',
    category: 'age_guide',
    ageGroup: '0-1',
    title: '母乳与配方奶喂养指南',
    icon: '🍼',
    summary: 'WHO建议纯母乳喂养至少6个月，之后添加辅食同时继续母乳喂养至2岁或以上。了解母乳与配方奶的科学选择。',
    content: `母乳喂养的好处

母乳是婴儿最理想的食物，含有最适合婴儿的营养成分和免疫因子。

WHO建议：
• 出生后1小时内开始母乳喂养
• 前6个月纯母乳喂养（不需额外喝水）
• 6个月后添加辅食，继续母乳喂养至2岁或以上

母乳的独特优势：
1. 含有400+种营养成分，配方奶无法完全复制
2. 含免疫球蛋白（sIgA），保护婴儿肠道
3. 降低婴儿感染、过敏、肥胖的风险
4. 促进母婴情感联结

配方奶喂养注意事项：
• 选择适合月龄的配方奶粉
• 严格按比例冲调，不可过浓或过淡
• 冲调温度40-50°C，不用开水
• 冲好后1小时内喝完，未喝完须丢弃
• 奶瓶每次使用后清洗并消毒

混合喂养的原则：
先母乳后配方奶，按需喂养，不要用奶瓶替代亲喂。`,
    tags: ['母乳', '配方奶', '喂养', '新生儿'],
    sourceName: '世界卫生组织 (WHO)',
    sourceLevel: 'guideline',
    sourceUrl: 'https://www.who.int/health-topics/breastfeeding',
    relatedArticleIds: ['ag-weaning'],
    sortOrder: 1,
    isPublished: true,
  },
  {
    articleId: 'ag-weaning',
    category: 'age_guide',
    ageGroup: '0-1',
    title: '辅食添加时间与方法',
    icon: '🥣',
    summary: '满6月龄（最早不早于4月龄）开始添加辅食。遵循从少到多、从稀到稠、从单一到多样的原则。',
    content: `辅食添加的最佳时机

中国营养学会和AAP均建议：满6月龄开始添加辅食。

准备信号（需同时满足）：
1. 能独坐或在支撑下坐稳
2. 对食物表现出兴趣
3. 挺舌反射消失（不会用舌头把食物推出）
4. 体重达出生体重的2倍以上

辅食添加原则：
• 第一口辅食：强化铁米粉（婴儿6月龄后铁储备耗尽）
• 每次只添加一种新食物，观察2-3天有无过敏
• 从泥糊状（6月龄）→ 碎末状（8月龄）→ 小块状（10月龄）
• 1岁内不加盐、糖、蜂蜜

每日辅食安排（参考）：
6-7月龄：1-2次/天，每次2-3勺
8-9月龄：2-3次/天，逐渐增加量
10-12月龄：3次/天+1-2次点心

高致敏食物（鸡蛋、花生、鱼等）：
最新研究表明，早期引入（6月龄后）反而可降低过敏风险，不需刻意推迟。`,
    tags: ['辅食', '喂养', '过敏', '营养'],
    sourceName: '中国营养学会《7-24月龄婴幼儿喂养指南》',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['ag-breastfeeding'],
    sortOrder: 2,
    isPublished: true,
  },
  {
    articleId: 'ag-terrible-twos',
    category: 'age_guide',
    ageGroup: '1-3',
    title: '"可怕的两岁"应对策略',
    icon: '😤',
    summary: '1.5-3岁是自我意识爆发期，孩子频繁说"不"和发脾气是正常发展现象。科学应对让这段时期变得不那么"可怕"。',
    content: `为什么会有"可怕的两岁"？

这是儿童心理发展的正常阶段，标志着自我意识的觉醒。

发展特点：
• 开始意识到"我"是独立的个体
• 想要自主做决定（但能力跟不上）
• 语言表达跟不上情绪，容易崩溃
• 对"规则"和"界限"进行试探

科学应对策略：

1. 给选择权而非命令
✗ "快穿鞋！"
✓ "你想穿红鞋还是蓝鞋？"

2. 预告转换
✗ 突然说"走了！"
✓ "再玩5分钟我们就要回家了哦"

3. 共情先行
✗ "不许哭！"
✓ "你很生气对不对？因为不能再吃糖了。"

4. 设定清晰的界限
温和但坚定地执行规则，不随意妥协。
"我知道你很想要，但这不可以。我们可以做XX。"

5. 保持一致性
所有看护人执行同一套规则，避免混乱。

什么时候需要关注？
• 3岁后仍频繁严重发脾气（每天多次，持续>15分钟）
• 发脾气时会伤害自己或他人
• 语言发育明显落后`,
    tags: ['两岁', '情绪', '自主性', '行为管理'],
    sourceName: '美国儿科学会 (AAP)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['bh-natural-consequences', 'bh-emotion-coaching'],
    sortOrder: 3,
    isPublished: true,
  },
  {
    articleId: 'ag-toilet-training',
    category: 'age_guide',
    ageGroup: '1-3',
    title: '如厕训练时机与方法',
    icon: '🚽',
    summary: '大多数孩子在18-24月龄出现如厕准备信号。过早训练反而延长过程。AAP建议以孩子为主导的如厕训练方法。',
    content: `如厕训练的最佳时机

AAP强调：不要赶进度。平均完成年龄为2.5-3岁，男孩通常比女孩稍晚。

准备信号（至少满足多数）：
• 能自己走到马桶/坐便器旁
• 能保持2小时以上干燥
• 能理解简单指令
• 对穿内裤/用马桶感兴趣
• 能表达"想尿/想拉"的意思
• 不喜欢穿湿/脏的纸尿裤

训练步骤：

第1阶段：熟悉（1-2周）
让孩子认识坐便器，穿衣服坐一坐，讲如厕相关绘本。

第2阶段：尝试（2-4周）
每天固定时间让孩子坐坐便器（起床后、饭后、睡前），每次不超过5分钟，成功了大力表扬。

第3阶段：过渡
白天尝试穿内裤，每1-2小时提醒。事故发生时不要批评。

第4阶段：夜间
夜间干燥通常在白天训练成功后数月甚至数年才实现，5岁前尿床都属正常。

注意事项：
• 不惩罚、不嘲笑事故
• 在压力期（搬家、新生儿出生）暂停训练
• 如果一周内没有进展，暂停1-2个月再试`,
    tags: ['如厕', '训练', '发育里程碑'],
    sourceName: '美国儿科学会 (AAP)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['ag-terrible-twos'],
    sortOrder: 4,
    isPublished: true,
  },
  {
    articleId: 'ag-kindergarten',
    category: 'age_guide',
    ageGroup: '3-6',
    title: '幼儿园适应与分离焦虑',
    icon: '🏫',
    summary: '分离焦虑是3-6岁儿童入园的常见现象。多数孩子在2-4周内适应。科学的准备和告别仪式能有效缓解焦虑。',
    content: `入园分离焦虑的科学理解

分离焦虑是依恋关系健康的表现，说明孩子与你建立了安全依恋。

入园前准备（提前1-2个月）：
1. 带孩子参观幼儿园，熟悉环境
2. 阅读关于上幼儿园的绘本
3. 练习短时间分离（让祖辈/朋友看护1-2小时）
4. 调整作息与幼儿园一致
5. 练习基本自理（自己吃饭、上厕所、穿鞋）

入园初期应对：

告别仪式要固定且简短
✓ "妈妈亲你一下，说再见，下午来接你"
✗ 反复回头、不停说"妈妈也舍不得你"

不要偷偷溜走
孩子发现后信任感会下降，分离焦虑反而加重。

放学后的连接时间
预留15-30分钟专注陪伴，让孩子感受到"回来后的温暖"。

典型适应时间线：
• 第1周：强烈抗议（正常）
• 第2-3周：时哭时好
• 第4周起：基本适应

需要关注的信号：
• 入园1个月后仍持续严重抗拒
• 出现退行行为（已会自理又不会了）
• 睡眠和食欲严重受影响`,
    tags: ['幼儿园', '分离焦虑', '适应', '社交'],
    sourceName: '美国儿科学会 (AAP)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['bh-emotion-coaching'],
    sortOrder: 5,
    isPublished: true,
  },
  {
    articleId: 'ag-study-habits',
    category: 'age_guide',
    ageGroup: '6-12',
    title: '学习习惯与自主性培养',
    icon: '📝',
    summary: '6-12岁是培养自主学习能力的关键期。研究表明，自主动机比外在奖惩更能持久地驱动学习行为。',
    content: `培养自主学习的科学方法

自我决定理论（Self-Determination Theory）指出，人在满足自主性、胜任感和归属感三大需求时，内在动机最强。

建立学习常规：
• 固定的学习时间段（而非固定时长）
• 让孩子参与制定计划（自主性）
• 先完成最不喜欢的任务（避免拖延）
• 每学习25-30分钟休息5分钟

作业辅导原则：
1. 在旁边做自己的事（陪伴不是盯着）
2. 孩子求助时先问"你觉得可以怎么做？"
3. 不要直接给答案，引导思考过程
4. 允许犯错，错误是学习的一部分

培养元认知能力：
• 学前：今天要学什么？怎么安排？
• 学中：这里没懂，我需要帮助
• 学后：今天学到了什么？哪里可以改进？

关于成绩和排名：
• 关注进步而非绝对分数
• 和自己比而非和别人比
• 强调努力过程而非结果

警惕过度辅导：
研究显示，家长过多介入作业（检查每道题、全程陪写）反而降低孩子的自我效能感和学习兴趣。`,
    tags: ['学习', '习惯', '自主性', '作业'],
    sourceName: '自我决定理论 (Deci & Ryan)',
    sourceLevel: 'rct',
    sourceUrl: null,
    relatedArticleIds: ['bh-growth-mindset'],
    sortOrder: 6,
    isPublished: true,
  },

  // ===== behavior (4 articles) =====
  {
    articleId: 'bh-natural-consequences',
    category: 'behavior',
    ageGroup: null,
    title: '自然后果与逻辑后果',
    icon: '🔄',
    summary: '让孩子体验行为的自然结果，比惩罚更有效。正面管教的核心方法之一，帮助孩子建立因果思维和责任感。',
    content: `自然后果 vs 逻辑后果

正面管教（Positive Discipline）的核心理念：让孩子从经验中学习，而非从惩罚中学习。

自然后果：不人为干预，让事情自然发展
• 不穿外套 → 感到冷
• 不吃饭 → 饿了
• 不收拾玩具 → 找不到想玩的

适用条件：后果不危及安全、不影响他人

逻辑后果：与行为相关的、合理的人为后果
• 打翻牛奶 → 自己擦干净
• 不按时写作业 → 减少游戏时间
• 对朋友动手 → 暂时离开游戏

设计逻辑后果的4R原则：
1. Related（相关的）：后果与行为有关
2. Respectful（尊重的）：不羞辱孩子
3. Reasonable（合理的）：不过度严厉
4. Revealed（提前告知）：事先约定好规则

错误示范 vs 正确示范：
✗ "你不听话就不准吃饭！"（不相关、不尊重）
✓ "你把水洒了，我们一起擦干净吧。"（相关、尊重）

注意：
• 不在情绪激动时执行后果
• 后果执行后不再反复提起
• 确保孩子理解"为什么"`,
    tags: ['正面管教', '后果', '责任感', '纪律'],
    sourceName: 'Jane Nelsen《正面管教》',
    sourceLevel: 'expert_consensus',
    sourceUrl: null,
    relatedArticleIds: ['bh-kind-firm', 'ag-terrible-twos'],
    sortOrder: 10,
    isPublished: true,
  },
  {
    articleId: 'bh-kind-firm',
    category: 'behavior',
    ageGroup: null,
    title: '"和善而坚定"原则',
    icon: '💪',
    summary: '和善=尊重孩子，坚定=尊重规则。同时做到两者，既不溺爱也不独裁，是最有效的养育方式。',
    content: `和善而坚定（Kind and Firm）

Diana Baumrind的养育风格研究将家长分为四种类型：
• 权威型（和善+坚定）→ 最佳结果
• 专制型（不和善+坚定）→ 服从但焦虑
• 溺爱型（和善+不坚定）→ 缺乏自律
• 忽视型（不和善+不坚定）→ 最差结果

"和善"意味着：
• 承认孩子的感受："我知道你很失望"
• 用平和的语气说话
• 蹲下来与孩子平视
• 给孩子解释原因

"坚定"意味着：
• 不因哭闹而改变规则
• 言出必行
• 所有看护人标准一致
• 不开无意义的谈判

实践句式：
"我知道你[感受]，但是[规则]。你可以[替代选择]。"

例：
"我知道你很想再看一集动画片，但是我们约定好了只看两集。你可以选择画画或搭积木。"

常见误区：
• 和善≠没有界限
• 坚定≠冷漠无情
• 偶尔妥协不会前功尽弃
• 和善而坚定需要练习，不必完美`,
    tags: ['正面管教', '养育风格', '界限', '规则'],
    sourceName: 'Diana Baumrind 养育风格研究',
    sourceLevel: 'systematic_review',
    sourceUrl: null,
    relatedArticleIds: ['bh-natural-consequences', 'bh-emotion-coaching'],
    sortOrder: 11,
    isPublished: true,
  },
  {
    articleId: 'bh-growth-mindset',
    category: 'behavior',
    ageGroup: null,
    title: '鼓励 vs 表扬：培养成长型思维',
    icon: '🌱',
    summary: 'Carol Dweck的研究表明，表扬"聪明"会让孩子回避挑战，而表扬"努力"能培养成长型思维和抗挫力。',
    content: `成长型思维 vs 固定型思维

Carol Dweck在斯坦福大学的经典研究：

实验：让两组孩子做同样的测试
A组被表扬："你好聪明！"（固定型表扬）
B组被表扬："你很努力！"（成长型表扬）

结果：
• A组之后选择简单任务（害怕"显得不聪明"）
• B组更愿意挑战困难任务
• 遇到失败时，A组成绩大幅下降，B组表现更好

如何在日常中培养成长型思维：

从"表扬结果"变为"鼓励过程"
✗ "你真聪明！"
✓ "你花了很多时间练习，真的有进步！"

✗ "满分！你太棒了！"
✓ "你的复习方法很有效呢，具体是怎么做的？"

✗ "画得真好看！"
✓ "我注意到你在颜色搭配上花了很多心思。"

面对失败时：
✗ "没关系，你已经很聪明了"
✓ "暂时还没做到，你觉得可以怎么改进？"

关键词替换：
"我不会" → "我还没学会"
"太难了" → "这需要更多练习"
"我犯错了" → "我发现了一个可以改进的地方"`,
    tags: ['成长型思维', '表扬', '鼓励', '抗挫力'],
    sourceName: 'Carol Dweck 斯坦福大学研究',
    sourceLevel: 'rct',
    sourceUrl: null,
    relatedArticleIds: ['ag-study-habits'],
    sortOrder: 12,
    isPublished: true,
  },
  {
    articleId: 'bh-emotion-coaching',
    category: 'behavior',
    ageGroup: null,
    title: '情绪辅导五步法',
    icon: '💝',
    summary: 'John Gottman的情绪辅导法帮助孩子认识、接纳和管理情绪。研究表明接受过情绪辅导的孩子社交能力和学业表现更好。',
    content: `情绪辅导五步法

John Gottman 教授的研究发现，善于情绪辅导的家长培养出的孩子在学业、社交、健康方面都表现更好。

五个步骤：

第1步：觉察孩子的情绪
关注孩子的表情、语调、行为变化。在情绪刚出现时介入，比爆发后更有效。

第2步：将情绪时刻视为亲密和教导的机会
✗ "别哭了，这有什么好哭的"
✓ 把这当作帮助孩子成长的机会

第3步：倾听并认可情绪
蹲下来，看着孩子的眼睛：
"你现在很生气是吗？因为弟弟拿了你的玩具。"
不评判、不否定、不着急解决问题。

第4步：帮助孩子给情绪命名
"你现在的感觉叫做'失望'。"
研究表明，给情绪命名本身就能降低情绪的强度（UCLA脑成像研究证实）。

第5步：在设定界限的同时帮助孩子解决问题
"生气可以，但打人不可以。"
"你觉得除了打人，还可以怎么告诉弟弟你不开心？"

常见的"情绪否定"表现：
• "男孩子不许哭" → 否定情绪表达
• "这有什么可怕的" → 否定感受
• "你看别人都不哭" → 羞耻感
• "好了好了，给你买" → 用物质转移情绪

这些都会让孩子学到"我的情绪是不被接纳的"。`,
    tags: ['情绪', '辅导', '共情', '社交情感'],
    sourceName: 'John Gottman《培养高情商的孩子》',
    sourceLevel: 'rct',
    sourceUrl: null,
    relatedArticleIds: ['bh-kind-firm', 'ag-terrible-twos'],
    sortOrder: 13,
    isPublished: true,
  },

  // ===== illness_care (4 articles) =====
  {
    articleId: 'ic-fever',
    category: 'illness_care',
    ageGroup: null,
    title: '发烧护理完全指南',
    icon: '🌡️',
    summary: '发烧是免疫系统对抗感染的正常反应。AAP建议：关注孩子精神状态比关注体温数字更重要。',
    content: `发烧的科学认知

发烧的定义：
• 腋温 ≥37.3°C
• 耳温 ≥37.8°C
• 肛温 ≥38.0°C

重要事实：
发烧本身不是病，是免疫系统在工作。适度发烧有助于身体对抗感染。

退烧药使用指南（AAP标准）：
• 对乙酰氨基酚（泰诺林）：≥3月龄可用，每4-6小时一次
• 布洛芬（美林）：≥6月龄可用，每6-8小时一次
• 按体重计算剂量，不要按年龄
• 两种药可交替使用（间隔至少2小时）
• 退烧目的是让孩子舒适，不是让体温正常

物理降温：
✓ 温水擦浴（水温略低于体温）
✓ 少穿衣服，利于散热
✓ 充分补液（母乳/水/电解质水）
✗ 不要酒精擦浴
✗ 不要冰水/冷水擦浴
✗ 不要捂汗

必须立即就医的情况：
• <3月龄婴儿体温≥38°C
• 体温>40°C持续不退
• 精神萎靡、持续哭闹
• 出现抽搐
• 发烧>3天不退
• 出现皮疹`,
    tags: ['发烧', '退烧药', '护理', '就医指征'],
    sourceName: '美国儿科学会 (AAP)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['mb-fever-brain', 'mb-sweat-fever'],
    sortOrder: 20,
    isPublished: true,
  },
  {
    articleId: 'ic-diarrhea',
    category: 'illness_care',
    ageGroup: null,
    title: '腹泻家庭护理指南',
    icon: '💧',
    summary: '儿童腹泻最大的风险是脱水。WHO推荐口服补液盐（ORS）预防和治疗脱水，大多数腹泻不需要抗生素。',
    content: `儿童腹泻护理

腹泻定义：大便次数比平时明显增多，且性状变稀。

最重要的事：预防脱水！

脱水评估：
轻度：口唇稍干、尿量略减
中度：口唇干燥、眼窝凹陷、尿量明显减少、哭泣少泪
重度：精神萎靡、皮肤弹性差、无尿 → 立即就医

家庭护理要点：

1. 补液（最关键）
• 推荐口服补液盐III（ORS），按说明冲调
• 没有ORS时：少量多次喝水、米汤
• 母乳喂养的继续母乳（增加次数）
• 不要喝果汁、碳酸饮料（加重腹泻）

2. 饮食
• 能吃就吃，不需要禁食
• 选择容易消化的食物：米粥、面条、香蕉、烤面包
• 避免高糖、高脂、高纤维食物
• 乳糖不耐受明显的可暂换无乳糖配方

3. 观察
• 记录大便次数、量、性状
• 监测尿量（6小时内至少1次尿）
• 观察精神状态

需要就医：
• <6月龄婴儿腹泻
• 大便带血或黏液
• 出现中度以上脱水
• 高烧>39°C
• 腹泻超过7天
• 呕吐无法进食

不需要的药物：
• 大多数腹泻不需要抗生素
• 止泻药（如洛哌丁胺）不建议用于儿童`,
    tags: ['腹泻', '脱水', '补液', '口服补液盐'],
    sourceName: '世界卫生组织 (WHO)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['ic-fever'],
    sortOrder: 21,
    isPublished: true,
  },
  {
    articleId: 'ic-cough',
    category: 'illness_care',
    ageGroup: null,
    title: '咳嗽护理与止咳药真相',
    icon: '😷',
    summary: 'AAP和FDA均不推荐4岁以下儿童使用OTC止咳药。蜂蜜（>1岁）被证实比止咳药更有效。',
    content: `儿童咳嗽的科学护理

重要认知：
咳嗽是保护性反射，帮助清除呼吸道分泌物。不应该一味止咳。

关于止咳药的科学证据：
• FDA不推荐2岁以下使用任何OTC感冒止咳药
• AAP不推荐4岁以下使用
• 多项研究显示：OTC止咳药对儿童效果不优于安慰剂
• 但副作用风险真实存在

替代方法（有证据支持）：
1. 蜂蜜（>1岁）
   - 多项RCT证实效果优于止咳药水
   - 睡前半勺到一勺
   - 1岁以下禁用（肉毒杆菌风险）

2. 保持湿润
   - 增加液体摄入
   - 使用加湿器
   - 生理盐水喷鼻/洗鼻

3. 体位
   - 抬高床头
   - 不要平躺

不同咳嗽的辨别：
• 干咳+流涕+低热 → 普通感冒（5-7天自愈）
• 犬吠样咳嗽 → 可能喉炎（需就医）
• 阵发性剧烈咳嗽+鸡鸣声 → 可能百日咳（紧急就医）
• 夜间咳嗽+喘息 → 可能哮喘（需评估）
• 咳嗽>4周 → 慢性咳嗽（需就医排查）

必须就医：
• <3月龄咳嗽
• 呼吸急促或费力
• 嘴唇发紫
• 高烧>39°C伴咳嗽
• 咳血`,
    tags: ['咳嗽', '止咳药', '蜂蜜', '护理'],
    sourceName: '美国儿科学会 (AAP) & FDA',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['mb-antibiotics-cold'],
    sortOrder: 22,
    isPublished: true,
  },
  {
    articleId: 'ic-allergy',
    category: 'illness_care',
    ageGroup: null,
    title: '儿童过敏管理指南',
    icon: '🤧',
    summary: '过敏性疾病（湿疹→食物过敏→鼻炎→哮喘）常按"过敏进行曲"发展。早期干预可阻断进程。',
    content: `儿童过敏的科学管理

过敏进行曲（Allergic March）：
婴儿期湿疹 → 食物过敏 → 过敏性鼻炎 → 哮喘

食物过敏：
常见致敏食物：牛奶、鸡蛋、花生、坚果、小麦、大豆、鱼、虾蟹
最新指南（LEAP研究）：
• 早期引入（4-6月龄）花生等食物可降低过敏风险
• 不建议刻意回避致敏食物（除非已确诊过敏）

湿疹管理（核心：保湿）：
1. 每天至少2次涂抹保湿霜（无香料的）
2. 洗澡水温36-37°C，不超过10分钟
3. 洗完澡3分钟内涂保湿霜（锁住水分）
4. 穿纯棉衣物
5. 必要时在医生指导下使用激素药膏（短期合理使用是安全的）

过敏性鼻炎：
• 生理盐水洗鼻（安全有效的一线方法）
• 避免过敏原（尘螨、花粉、宠物毛发）
• 鼻用糖皮质激素喷雾（长期安全，不是"激素"）

关于"益生菌防过敏"：
• 目前证据不足以推荐常规使用
• 部分研究显示特定菌株可能有助于预防湿疹
• 不建议自行购买使用

何时就医：
• 严重过敏反应（呼吸困难、嘴唇肿胀、全身荨麻疹）→ 立即急诊
• 湿疹反复不愈或感染
• 鼻炎影响睡眠和生活质量`,
    tags: ['过敏', '湿疹', '鼻炎', '食物过敏'],
    sourceName: '中华医学会儿科学分会 & LEAP研究',
    sourceLevel: 'systematic_review',
    sourceUrl: null,
    relatedArticleIds: ['ag-weaning'],
    sortOrder: 23,
    isPublished: true,
  },

  // ===== myth_busting (4 articles) =====
  {
    articleId: 'mb-sweat-fever',
    category: 'myth_busting',
    ageGroup: null,
    title: '捂汗能退烧吗？',
    icon: '🔥',
    summary: '不能！捂汗退烧是危险的民间偏方。捂汗会导致体温进一步升高，婴幼儿甚至可能引发"捂热综合征"危及生命。',
    content: `谣言：发烧要多盖被子捂汗，出汗后烧就退了

真相：这是非常危险的做法！

科学解释：
发烧时身体产热增加，需要通过散热来调节体温。捂汗会：
• 阻碍散热，导致体温继续升高
• 增加代谢负担
• 加重脱水

婴幼儿尤其危险：
婴幼儿体温调节中枢不成熟，捂汗可导致"捂热综合征"：
• 体温急剧升高至41-43°C
• 可能导致多器官衰竭
• 每年都有因捂热导致的婴幼儿死亡案例

正确做法：
• 发烧时少穿一层衣服，有利于散热
• 室温保持24-26°C
• 充分补充水分
• 必要时使用退烧药

"出汗后退烧"的真相：
出汗是退烧的结果，不是原因。当免疫系统控制了感染，体温调定点下调，身体自然会通过出汗来散热降温。

所有权威机构（WHO/AAP/中华医学会）都明确反对捂汗退烧。`,
    tags: ['发烧', '捂汗', '辟谣', '退烧'],
    sourceName: '中华医学会儿科学分会',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['ic-fever', 'mb-fever-brain'],
    sortOrder: 30,
    isPublished: true,
  },
  {
    articleId: 'mb-cooling-patch',
    category: 'myth_busting',
    ageGroup: null,
    title: '退热贴有用吗？',
    icon: '🩹',
    summary: '无用。退热贴只能降低额头皮肤表面温度约0.3°C，对核心体温无影响。多项研究证实其无退烧效果。',
    content: `谣言：发烧要贴退热贴

真相：退热贴不能退烧，纯属心理安慰

科学证据：
2014年《Tropical Medicine & International Health》发表的研究：
• 退热贴组 vs 对照组核心体温无显著差异
• 退热贴只能让额头皮肤温度降低约0.3°C
• 对全身体温没有实际影响

为什么退热贴无效？
1. 发烧是全身性的，额头降温无法影响体温调定点
2. 退热贴面积太小（约50cm²），相比全身皮肤面积微不足道
3. 凝胶蒸发带走的热量极其有限

退热贴的潜在风险：
• 部分婴幼儿可能对凝胶成分过敏
• 睡觉时贴片可能脱落覆盖口鼻（窒息风险）
• 给家长虚假安全感，延误真正有效的退烧措施

真正有效的退烧方法：
1. 退烧药（对乙酰氨基酚/布洛芬）
2. 温水擦浴
3. 少穿衣物帮助散热
4. 充分补液

日本和中国是退热贴销量最大的市场，但日本儿科学会已明确表示退热贴不能退烧。`,
    tags: ['退热贴', '发烧', '辟谣', '无效产品'],
    sourceName: 'Tropical Medicine & International Health (2014)',
    sourceLevel: 'rct',
    sourceUrl: null,
    relatedArticleIds: ['ic-fever', 'mb-sweat-fever'],
    sortOrder: 31,
    isPublished: true,
  },
  {
    articleId: 'mb-fever-brain',
    category: 'myth_busting',
    ageGroup: null,
    title: '发烧会烧坏脑子吗？',
    icon: '🧠',
    summary: '不会！普通感染引起的发烧（<41°C）不会损伤大脑。"烧坏脑子"实际上是脑炎/脑膜炎本身的损害，不是体温的错。',
    content: `谣言：发烧不赶紧退烧会烧坏脑子

真相：普通发烧不会损伤大脑

科学解释：
• 人体有体温调节机制，感染导致的发烧很少超过41°C
• 大脑损伤需要核心体温持续超过42°C
• 普通感染（感冒、流感、手足口等）引起的发烧不会达到这个温度

"烧坏脑子"的真相：
人们观察到的"发烧后脑子出问题"的情况，实际上是：
• 脑炎（病毒感染大脑本身）→ 碰巧伴随发烧
• 脑膜炎（脑膜感染）→ 碰巧伴随发烧
是疾病本身损伤了大脑，不是发烧损伤了大脑

发烧抽搐（热性惊厥）：
• 6个月-5岁儿童约2-5%会发生
• 看起来吓人但通常不会造成脑损伤
• 多数持续<5分钟自行缓解
• 不会导致智力下降或癫痫（简单热性惊厥）
• 退烧药不能预防热性惊厥

正确观念：
发烧时关注孩子的精神状态，比盯着体温计上的数字更重要。
• 体温39°C但精神好、能玩 → 不必过度紧张
• 体温38°C但精神差、嗜睡 → 需要重视`,
    tags: ['发烧', '脑损伤', '辟谣', '热性惊厥'],
    sourceName: '美国儿科学会 (AAP)',
    sourceLevel: 'guideline',
    sourceUrl: null,
    relatedArticleIds: ['ic-fever', 'mb-sweat-fever'],
    sortOrder: 32,
    isPublished: true,
  },
  {
    articleId: 'mb-antibiotics-cold',
    category: 'myth_busting',
    ageGroup: null,
    title: '抗生素能治感冒吗？',
    icon: '💊',
    summary: '不能！感冒由病毒引起，抗生素只对细菌有效。滥用抗生素会导致耐药性，这是全球公共卫生威胁。',
    content: `谣言：感冒/流感要吃抗生素好得快

真相：感冒是病毒感染，抗生素对病毒无效

关键知识：
• 抗生素 = 杀细菌
• 感冒/流感 = 病毒感染
• 抗生素对病毒感染完全无效

为什么医生有时还会开抗生素？
• 不规范的处方行为（需要改善）
• 合并了细菌感染（如中耳炎、肺炎）
• 家长强烈要求（这是不应该的）

滥用抗生素的危害：
1. 产生耐药性（超级细菌）
   → WHO列为全球十大健康威胁之一
2. 破坏肠道菌群
   → 影响免疫、消化功能
3. 可能的药物副作用
   → 过敏、腹泻、肝肾损害

感冒的正确处理：
• 普通感冒5-7天自愈，不需要特效药
• 对症处理：发烧用退烧药、鼻塞用生理盐水
• 充分休息和补液
• 不需要抗病毒药（利巴韦林等也不推荐）

需要抗生素的情况（医生判断）：
• 化脓性扁桃体炎（链球菌）
• 中耳炎
• 细菌性肺炎
• 泌尿系感染

记住：
只有医生通过检查判断为细菌感染后才应使用抗生素，不要自行购买使用。`,
    tags: ['抗生素', '感冒', '耐药性', '辟谣'],
    sourceName: '世界卫生组织 (WHO)',
    sourceLevel: 'systematic_review',
    sourceUrl: null,
    relatedArticleIds: ['ic-fever', 'ic-cough'],
    sortOrder: 33,
    isPublished: true,
  },
]
