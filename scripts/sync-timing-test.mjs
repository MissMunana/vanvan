/**
 * 数据同步计时测试脚本
 * 模拟不同设备登录后的完整数据加载流程，测量各阶段耗时
 *
 * 用法: node scripts/sync-timing-test.mjs
 */

import { createClient } from '@supabase/supabase-js'

// ---- 配置 ----
const SUPABASE_URL = 'https://jpyzfrhkdwjvyynmzknz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXpmcmhrZHdqdnl5bm16a256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzg0NDUsImV4cCI6MjA4NjM1NDQ0NX0.4zhHbuvOI0Alq6fKuVBRgVBaal5lGomWrTHAVL3BaEo'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXpmcmhrZHdqdnl5bm16a256Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc3ODQ0NSwiZXhwIjoyMDg2MzU0NDQ1fQ.ZADdjxpv5JmgRb4WOFayrxZwOITIibcKVOFtljGiLZs'
const API_BASE = 'https://vanvan-three.vercel.app/api'

const TEST_EMAIL = `synctest-${Date.now()}@test.local`
const TEST_PASSWORD = 'test123456'

// ---- 计时工具 ----
const timings = []
async function timed(label, fn) {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    timings.push({ label, duration, status: 'ok' })
    return result
  } catch (err) {
    const duration = performance.now() - start
    timings.push({ label, duration, status: 'error', error: err.message })
    throw err
  }
}

// ---- API 请求封装 ----
async function api(path, token, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${path} failed: ${res.status} ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ---- 主测试流程 ----
async function main() {
  console.log('========================================')
  console.log('  小星星成长宝 - 数据同步计时测试')
  console.log('========================================\n')

  const totalStart = performance.now()

  // 步骤 1: 注册测试账号
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  let userId

  const regResult = await timed('1. 注册测试账号 (admin.createUser)', async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user.id
    return data
  })
  console.log(`  注册成功: ${TEST_EMAIL}`)

  // 步骤 2: 模拟客户端登录 (signInWithPassword)
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let session

  await timed('2. 客户端登录 (signInWithPassword)', async () => {
    const { data, error } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    if (error) throw error
    session = data.session
  })
  const token = session.access_token
  console.log(`  登录成功，获取 token`)

  // 步骤 3: 获取 session (模拟 getSession)
  await timed('3. 获取 Session (getSession)', async () => {
    const { data, error } = await anon.auth.getSession()
    if (error) throw error
    return data
  })

  // 步骤 4: 查询 familyId
  await timed('4. 查询 familyId (families表)', async () => {
    const { data } = await anon
      .from('families')
      .select('family_id')
      .eq('user_id', userId)
      .single()
    return data // 新账号可能为 null
  })

  // 步骤 5: 通过 Onboarding 创建样本数据
  let childId
  await timed('5. Onboarding 初始化 (创建家庭+孩子+任务+奖励)', async () => {
    const result = await api('/onboarding', token, {
      method: 'POST',
      body: JSON.stringify({
        child: {
          name: '测试小朋友',
          gender: 'female',
          birthday: '2021-06-15',
          avatar: 'girl-1',
        },
        parentPin: '1234',
        tasks: [
          { name: '刷牙', category: 'life', points: 5, icon: '🪥', description: '早晚刷牙', isActive: true, frequency: 'daily' },
          { name: '整理书包', category: 'chore', points: 3, icon: '🎒', description: '自己整理书包', isActive: true, frequency: 'daily' },
          { name: '读绘本', category: 'study', points: 5, icon: '📖', description: '阅读一本绘本', isActive: true, frequency: 'daily' },
        ],
        rewards: [
          { name: '看动画片', category: 'time', points: 10, icon: '📺', description: '看30分钟', limit: { type: 'daily', count: 1 }, stock: -1, isActive: true },
          { name: '小贴纸', category: 'material', points: 5, icon: '⭐', description: '获得一张贴纸', limit: { type: 'unlimited', count: 0 }, stock: -1, isActive: true },
        ],
      }),
    })
    childId = result.child.childId
    return result
  })
  console.log(`  Onboarding 完成，childId: ${childId}`)

  // ===== 模拟 "另一台设备" 的首次登录数据加载 =====
  console.log('\n--- 模拟另一台设备登录并加载数据 ---\n')

  // 创建全新的 Supabase 客户端（模拟新设备）
  const device2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let session2

  await timed('6. [设备2] 登录 (signInWithPassword)', async () => {
    const { data, error } = await device2.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    if (error) throw error
    session2 = data.session
  })
  const token2 = session2.access_token

  await timed('7. [设备2] getSession', async () => {
    const { data } = await device2.auth.getSession()
    return data
  })

  await timed('8. [设备2] 查询 familyId', async () => {
    const { data } = await device2
      .from('families')
      .select('family_id')
      .eq('user_id', userId)
      .single()
    return data
  })

  // loadCoreData: fetchFamily + fetchChildren 并行
  await timed('9. [设备2] loadCoreData (family + children 并行)', async () => {
    const [family, children] = await Promise.all([
      api('/family', token2),
      api('/children', token2),
    ])
    return { family, children }
  })

  // 单独测量 family 和 children
  await timed('9a. [设备2] fetchFamily 单独', () => api('/family', token2))
  await timed('9b. [设备2] fetchChildren 单独', () => api('/children', token2))

  // loadChildData: 6个接口并行
  await timed('10. [设备2] loadChildData (6接口并行)', async () => {
    const [tasks, rewards, exchanges, logs, badges, health] = await Promise.all([
      api(`/children/${childId}/tasks`, token2),
      api(`/children/${childId}/rewards`, token2),
      api(`/children/${childId}/exchanges`, token2),
      api(`/children/${childId}/point-logs?limit=200`, token2),
      api(`/children/${childId}/badges`, token2),
      // fetchAllHealth: 7个健康子接口并行
      Promise.all([
        api(`/children/${childId}/health/growth`, token2),
        api(`/children/${childId}/health/temperature`, token2),
        api(`/children/${childId}/health/medication`, token2),
        api(`/children/${childId}/health/vaccination`, token2),
        api(`/children/${childId}/health/milestone`, token2),
        api(`/children/${childId}/health/sleep`, token2),
        api(`/children/${childId}/emergency/profile`, token2),
      ]),
    ])
    return { tasks, rewards, exchanges, logs, badges, health }
  })

  // 单独测量各 child data 接口
  const childEndpoints = [
    ['10a. tasks', `/children/${childId}/tasks`],
    ['10b. rewards', `/children/${childId}/rewards`],
    ['10c. exchanges', `/children/${childId}/exchanges`],
    ['10d. point-logs', `/children/${childId}/point-logs?limit=200`],
    ['10e. badges', `/children/${childId}/badges`],
    ['10f. health/growth', `/children/${childId}/health/growth`],
    ['10g. health/temperature', `/children/${childId}/health/temperature`],
    ['10h. health/medication', `/children/${childId}/health/medication`],
    ['10i. health/vaccination', `/children/${childId}/health/vaccination`],
    ['10j. health/milestone', `/children/${childId}/health/milestone`],
    ['10k. health/sleep', `/children/${childId}/health/sleep`],
    ['10l. emergency/profile', `/children/${childId}/emergency/profile`],
  ]

  for (const [label, path] of childEndpoints) {
    await timed(`${label}`, () => api(path, token2))
  }

  // ===== 方案A: 端到端全量加载 (原方案) =====
  console.log('\n--- 方案A: 端到端全量加载 ---\n')

  const device3 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  await timed('11. [方案A] 端到端全量加载', async () => {
    const { data: authData } = await device3.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    const t = authData.session.access_token
    await device3.auth.getSession()
    await device3.from('families').select('family_id').eq('user_id', userId).single()

    // loadCoreData + loadChildData 全部加载
    const [, childrenData] = await Promise.all([
      api('/family', t),
      api('/children', t),
    ])
    const cid = childrenData[0]?.childId
    if (cid) {
      await Promise.all([
        api(`/children/${cid}/tasks`, t),
        api(`/children/${cid}/rewards`, t),
        api(`/children/${cid}/exchanges`, t),
        api(`/children/${cid}/point-logs?limit=200`, t),
        api(`/children/${cid}/badges`, t),
        Promise.all([
          api(`/children/${cid}/health/growth`, t),
          api(`/children/${cid}/health/temperature`, t),
          api(`/children/${cid}/health/medication`, t),
          api(`/children/${cid}/health/vaccination`, t),
          api(`/children/${cid}/health/milestone`, t),
          api(`/children/${cid}/health/sleep`, t),
          api(`/children/${cid}/emergency/profile`, t),
        ]),
      ])
    }
  })

  // ===== 方案B: 按页面懒加载 (新方案) =====
  console.log('\n--- 方案B: 按页面懒加载 ---\n')

  const device4 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // B-1: 登录 + Core Data only → 首屏可用
  await timed('12. [方案B] 登录 + CoreData → 首屏可用', async () => {
    const { data: authData } = await device4.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    const t = authData.session.access_token
    await device4.auth.getSession()
    await device4.from('families').select('family_id').eq('user_id', userId).single()
    await Promise.all([
      api('/family', t),
      api('/children', t),
    ])
  })

  const token4 = (await device4.auth.getSession()).data.session.access_token

  // B-2: 首页 (Home) 需要: tasks + logs + exchanges + badges
  await timed('13. [方案B] Home页数据 (tasks+logs+exchanges+badges)', async () => {
    await Promise.all([
      api(`/children/${childId}/tasks`, token4),
      api(`/children/${childId}/point-logs?limit=200`, token4),
      api(`/children/${childId}/exchanges`, token4),
      api(`/children/${childId}/badges`, token4),
    ])
  })

  // B-3: 商城页 (Shop) 需要: rewards (exchanges 已加载跳过)
  await timed('14. [方案B] Shop页数据 (rewards)', async () => {
    await api(`/children/${childId}/rewards`, token4)
  })

  // B-4: 健康页 (Health) 需要: health records
  await timed('15. [方案B] Health页数据 (6个健康接口并行)', async () => {
    await Promise.all([
      api(`/children/${childId}/health/growth`, token4),
      api(`/children/${childId}/health/temperature`, token4),
      api(`/children/${childId}/health/medication`, token4),
      api(`/children/${childId}/health/vaccination`, token4),
      api(`/children/${childId}/health/milestone`, token4),
      api(`/children/${childId}/health/sleep`, token4),
    ])
  })

  const totalDuration = performance.now() - totalStart

  // ===== 输出报告 =====
  console.log('\n========================================')
  console.log('           计时结果报告')
  console.log('========================================\n')

  const maxLabel = Math.max(...timings.map(t => t.label.length))
  for (const t of timings) {
    const bar = '█'.repeat(Math.round(t.duration / 50))
    const status = t.status === 'error' ? ' ❌' : ''
    console.log(`  ${t.label.padEnd(maxLabel)}  ${t.duration.toFixed(0).padStart(6)}ms  ${bar}${status}`)
  }

  console.log(`\n  ${'脚本总耗时'.padEnd(maxLabel)}  ${totalDuration.toFixed(0).padStart(6)}ms`)

  // 关键指标
  const step11 = timings.find(t => t.label.startsWith('11. '))
  const step12 = timings.find(t => t.label.startsWith('12. '))
  const step13 = timings.find(t => t.label.startsWith('13. '))
  const step14 = timings.find(t => t.label.startsWith('14. '))
  const step15 = timings.find(t => t.label.startsWith('15. '))

  console.log('\n========================================')
  console.log('           方案对比')
  console.log('========================================\n')

  if (step11) console.log(`  方案A 全量加载 (登录→全部数据就绪):  ${step11.duration.toFixed(0)}ms`)
  console.log('')
  if (step12) console.log(`  方案B 登录→首屏可用 (CoreData):     ${step12.duration.toFixed(0)}ms`)
  if (step12 && step13) console.log(`  方案B 登录→Home页可用:              ${(step12.duration + step13.duration).toFixed(0)}ms`)
  if (step12 && step13 && step14) console.log(`  方案B 登录→Home+Shop:               ${(step12.duration + step13.duration + step14.duration).toFixed(0)}ms`)
  if (step12 && step13 && step15) console.log(`  方案B 登录→Home+Health:             ${(step12.duration + step13.duration + step15.duration).toFixed(0)}ms`)
  console.log('')
  if (step11 && step12) {
    const saving = step11.duration - step12.duration
    console.log(`  首屏加速: ${saving.toFixed(0)}ms 更快 (${((saving / step11.duration) * 100).toFixed(0)}%)`)
  }

  console.log(`\n  设备: Node.js ${process.version} (${process.platform} ${process.arch})`)
  console.log(`  时间: ${new Date().toISOString()}`)
  console.log(`  测试账号: ${TEST_EMAIL}`)

  // ===== 清理测试账号 =====
  console.log('\n--- 清理测试数据 ---')
  try {
    await admin.auth.admin.deleteUser(userId)
    console.log('  测试账号已删除')
  } catch (err) {
    console.log(`  清理失败: ${err.message}`)
  }

  console.log('\n========================================')
  console.log('  测试完成')
  console.log('========================================\n')
}

main().catch(err => {
  console.error('测试失败:', err)
  process.exit(1)
})
