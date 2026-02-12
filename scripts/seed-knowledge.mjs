#!/usr/bin/env node

/**
 * Seed knowledge_articles table in Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-knowledge.mjs
 *
 * Prerequisites:
 *   - Run the SQL in docs to create knowledge_articles and knowledge_bookmarks tables
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *     (or create a .env file in project root)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---- Load .env if present ----
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const envPath = resolve(__dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // no .env file, rely on environment variables
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-knowledge.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---- Article data (mirrors src/data/knowledgeArticles.ts) ----
const articles = [
  {
    article_id: 'ag-breastfeeding', category: 'age_guide', age_group: '0-1',
    title: '母乳与配方奶喂养指南', icon: '🍼',
    summary: 'WHO建议纯母乳喂养至少6个月，之后添加辅食同时继续母乳喂养至2岁或以上。了解母乳与配方奶的科学选择。',
    tags: ['母乳', '配方奶', '喂养', '新生儿'],
    source_name: '世界卫生组织 (WHO)', source_level: 'guideline',
    source_url: 'https://www.who.int/health-topics/breastfeeding',
    related_article_ids: ['ag-weaning'], sort_order: 1,
  },
  {
    article_id: 'ag-weaning', category: 'age_guide', age_group: '0-1',
    title: '辅食添加时间与方法', icon: '🥣',
    summary: '满6月龄（最早不早于4月龄）开始添加辅食。遵循从少到多、从稀到稠、从单一到多样的原则。',
    tags: ['辅食', '喂养', '过敏', '营养'],
    source_name: '中国营养学会《7-24月龄婴幼儿喂养指南》', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['ag-breastfeeding'], sort_order: 2,
  },
  {
    article_id: 'ag-terrible-twos', category: 'age_guide', age_group: '1-3',
    title: '"可怕的两岁"应对策略', icon: '😤',
    summary: '1.5-3岁是自我意识爆发期，孩子频繁说"不"和发脾气是正常发展现象。科学应对让这段时期变得不那么"可怕"。',
    tags: ['两岁', '情绪', '自主性', '行为管理'],
    source_name: '美国儿科学会 (AAP)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['bh-natural-consequences', 'bh-emotion-coaching'], sort_order: 3,
  },
  {
    article_id: 'ag-toilet-training', category: 'age_guide', age_group: '1-3',
    title: '如厕训练时机与方法', icon: '🚽',
    summary: '大多数孩子在18-24月龄出现如厕准备信号。过早训练反而延长过程。AAP建议以孩子为主导的如厕训练方法。',
    tags: ['如厕', '训练', '发育里程碑'],
    source_name: '美国儿科学会 (AAP)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['ag-terrible-twos'], sort_order: 4,
  },
  {
    article_id: 'ag-kindergarten', category: 'age_guide', age_group: '3-6',
    title: '幼儿园适应与分离焦虑', icon: '🏫',
    summary: '分离焦虑是3-6岁儿童入园的常见现象。多数孩子在2-4周内适应。科学的准备和告别仪式能有效缓解焦虑。',
    tags: ['幼儿园', '分离焦虑', '适应', '社交'],
    source_name: '美国儿科学会 (AAP)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['bh-emotion-coaching'], sort_order: 5,
  },
  {
    article_id: 'ag-study-habits', category: 'age_guide', age_group: '6-12',
    title: '学习习惯与自主性培养', icon: '📝',
    summary: '6-12岁是培养自主学习能力的关键期。研究表明，自主动机比外在奖惩更能持久地驱动学习行为。',
    tags: ['学习', '习惯', '自主性', '作业'],
    source_name: '自我决定理论 (Deci & Ryan)', source_level: 'rct',
    source_url: null,
    related_article_ids: ['bh-growth-mindset'], sort_order: 6,
  },
  {
    article_id: 'bh-natural-consequences', category: 'behavior', age_group: null,
    title: '自然后果与逻辑后果', icon: '🔄',
    summary: '让孩子体验行为的自然结果，比惩罚更有效。正面管教的核心方法之一，帮助孩子建立因果思维和责任感。',
    tags: ['正面管教', '后果', '责任感', '纪律'],
    source_name: 'Jane Nelsen《正面管教》', source_level: 'expert_consensus',
    source_url: null,
    related_article_ids: ['bh-kind-firm', 'ag-terrible-twos'], sort_order: 10,
  },
  {
    article_id: 'bh-kind-firm', category: 'behavior', age_group: null,
    title: '"和善而坚定"原则', icon: '💪',
    summary: '和善=尊重孩子，坚定=尊重规则。同时做到两者，既不溺爱也不独裁，是最有效的养育方式。',
    tags: ['正面管教', '养育风格', '界限', '规则'],
    source_name: 'Diana Baumrind 养育风格研究', source_level: 'systematic_review',
    source_url: null,
    related_article_ids: ['bh-natural-consequences', 'bh-emotion-coaching'], sort_order: 11,
  },
  {
    article_id: 'bh-growth-mindset', category: 'behavior', age_group: null,
    title: '鼓励 vs 表扬：培养成长型思维', icon: '🌱',
    summary: 'Carol Dweck的研究表明，表扬"聪明"会让孩子回避挑战，而表扬"努力"能培养成长型思维和抗挫力。',
    tags: ['成长型思维', '表扬', '鼓励', '抗挫力'],
    source_name: 'Carol Dweck 斯坦福大学研究', source_level: 'rct',
    source_url: null,
    related_article_ids: ['ag-study-habits'], sort_order: 12,
  },
  {
    article_id: 'bh-emotion-coaching', category: 'behavior', age_group: null,
    title: '情绪辅导五步法', icon: '💝',
    summary: 'John Gottman的情绪辅导法帮助孩子认识、接纳和管理情绪。研究表明接受过情绪辅导的孩子社交能力和学业表现更好。',
    tags: ['情绪', '辅导', '共情', '社交情感'],
    source_name: 'John Gottman《培养高情商的孩子》', source_level: 'rct',
    source_url: null,
    related_article_ids: ['bh-kind-firm', 'ag-terrible-twos'], sort_order: 13,
  },
  {
    article_id: 'ic-fever', category: 'illness_care', age_group: null,
    title: '发烧护理完全指南', icon: '🌡️',
    summary: '发烧是免疫系统对抗感染的正常反应。AAP建议：关注孩子精神状态比关注体温数字更重要。',
    tags: ['发烧', '退烧药', '护理', '就医指征'],
    source_name: '美国儿科学会 (AAP)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['mb-fever-brain', 'mb-sweat-fever'], sort_order: 20,
  },
  {
    article_id: 'ic-diarrhea', category: 'illness_care', age_group: null,
    title: '腹泻家庭护理指南', icon: '💧',
    summary: '儿童腹泻最大的风险是脱水。WHO推荐口服补液盐（ORS）预防和治疗脱水，大多数腹泻不需要抗生素。',
    tags: ['腹泻', '脱水', '补液', '口服补液盐'],
    source_name: '世界卫生组织 (WHO)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['ic-fever'], sort_order: 21,
  },
  {
    article_id: 'ic-cough', category: 'illness_care', age_group: null,
    title: '咳嗽护理与止咳药真相', icon: '😷',
    summary: 'AAP和FDA均不推荐4岁以下儿童使用OTC止咳药。蜂蜜（>1岁）被证实比止咳药更有效。',
    tags: ['咳嗽', '止咳药', '蜂蜜', '护理'],
    source_name: '美国儿科学会 (AAP) & FDA', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['mb-antibiotics-cold'], sort_order: 22,
  },
  {
    article_id: 'ic-allergy', category: 'illness_care', age_group: null,
    title: '儿童过敏管理指南', icon: '🤧',
    summary: '过敏性疾病（湿疹→食物过敏→鼻炎→哮喘）常按"过敏进行曲"发展。早期干预可阻断进程。',
    tags: ['过敏', '湿疹', '鼻炎', '食物过敏'],
    source_name: '中华医学会儿科学分会 & LEAP研究', source_level: 'systematic_review',
    source_url: null,
    related_article_ids: ['ag-weaning'], sort_order: 23,
  },
  {
    article_id: 'mb-sweat-fever', category: 'myth_busting', age_group: null,
    title: '捂汗能退烧吗？', icon: '🔥',
    summary: '不能！捂汗退烧是危险的民间偏方。捂汗会导致体温进一步升高，婴幼儿甚至可能引发"捂热综合征"危及生命。',
    tags: ['发烧', '捂汗', '辟谣', '退烧'],
    source_name: '中华医学会儿科学分会', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['ic-fever', 'mb-fever-brain'], sort_order: 30,
  },
  {
    article_id: 'mb-cooling-patch', category: 'myth_busting', age_group: null,
    title: '退热贴有用吗？', icon: '🩹',
    summary: '无用。退热贴只能降低额头皮肤表面温度约0.3°C，对核心体温无影响。多项研究证实其无退烧效果。',
    tags: ['退热贴', '发烧', '辟谣', '无效产品'],
    source_name: 'Tropical Medicine & International Health (2014)', source_level: 'rct',
    source_url: null,
    related_article_ids: ['ic-fever', 'mb-sweat-fever'], sort_order: 31,
  },
  {
    article_id: 'mb-fever-brain', category: 'myth_busting', age_group: null,
    title: '发烧会烧坏脑子吗？', icon: '🧠',
    summary: '不会！普通感染引起的发烧（<41°C）不会损伤大脑。"烧坏脑子"实际上是脑炎/脑膜炎本身的损害，不是体温的错。',
    tags: ['发烧', '脑损伤', '辟谣', '热性惊厥'],
    source_name: '美国儿科学会 (AAP)', source_level: 'guideline',
    source_url: null,
    related_article_ids: ['ic-fever', 'mb-sweat-fever'], sort_order: 32,
  },
  {
    article_id: 'mb-antibiotics-cold', category: 'myth_busting', age_group: null,
    title: '抗生素能治感冒吗？', icon: '💊',
    summary: '不能！感冒由病毒引起，抗生素只对细菌有效。滥用抗生素会导致耐药性，这是全球公共卫生威胁。',
    tags: ['抗生素', '感冒', '耐药性', '辟谣'],
    source_name: '世界卫生组织 (WHO)', source_level: 'systematic_review',
    source_url: null,
    related_article_ids: ['ic-fever', 'ic-cough'], sort_order: 33,
  },
]

// ---- We need to load the full content from the TS seed file ----
// Since this script uses snake_case for DB columns, we embed the content here too.
// (Content is loaded from the TypeScript source for maintainability)

import { KNOWLEDGE_ARTICLES } from '../src/data/knowledgeArticles.ts'

// Build a content map from the TS data
const contentMap = new Map()
for (const a of KNOWLEDGE_ARTICLES) {
  contentMap.set(a.articleId, a.content)
}

// Merge content into DB rows
const rows = articles.map((a) => ({
  ...a,
  content: contentMap.get(a.article_id) || '',
  is_published: true,
  view_count: 0,
}))

async function seed() {
  console.log(`Seeding ${rows.length} knowledge articles...`)

  // Upsert to handle re-runs gracefully
  const { data, error } = await supabase
    .from('knowledge_articles')
    .upsert(rows, { onConflict: 'article_id' })
    .select('article_id')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Successfully seeded ${data.length} articles:`)
  for (const row of data) {
    console.log(`  ✓ ${row.article_id}`)
  }
}

seed()
