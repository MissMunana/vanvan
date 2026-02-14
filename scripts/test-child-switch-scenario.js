#!/usr/bin/env node
/**
 * 模拟孩子切换场景测试
 * 验证切换孩子时任务状态的完整流程
 */

// ==================== 模拟服务器 ====================
function getServerToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
}

// 模拟数据库
const mockDB = {
  tasks: [
    { task_id: 'task_a1', child_id: 'child_a', name: '任务A1', last_completed_date: getServerToday(), completed_today: true },
    { task_id: 'task_a2', child_id: 'child_a', name: '任务A2', last_completed_date: null, completed_today: false },
    { task_id: 'task_b1', child_id: 'child_b', name: '任务B1', last_completed_date: getServerToday(), completed_today: true },
    { task_id: 'task_b2', child_id: 'child_b', name: '任务B2', last_completed_date: getServerToday(), completed_today: true },
  ]
}

// 模拟服务器的 mapTask
function serverMapTask(t) {
  const today = getServerToday()
  const completedToday = t.last_completed_date === today
  return {
    taskId: t.task_id,
    childId: t.child_id,
    name: t.name,
    completedToday: completedToday,
    lastCompletedDate: t.last_completed_date,
  }
}

// 模拟 API: 获取孩子的任务
function apiGetTasks(childId) {
  const tasks = mockDB.tasks
    .filter(t => t.child_id === childId)
    .map(serverMapTask)
  return Promise.resolve(tasks)
}

// ==================== 模拟客户端 Store ====================
class MockTaskStore {
  constructor() {
    this.tasks = []
    this._loadedChildIds = new Set()
    this.currentChildId = null
  }

  // 模拟 fetchTasks
  async fetchTasks(childId) {
    console.log(`  📡 API 调用: fetchTasks(${childId})`)
    const tasks = await apiGetTasks(childId)
    
    // 合并逻辑：保留其他孩子的任务，替换当前孩子的任务
    const otherTasks = this.tasks.filter((t) => t.childId !== childId)
    this.tasks = [...otherTasks, ...tasks]
    this._loadedChildIds.add(childId)
    
    console.log(`  ✅ 获取到 ${tasks.length} 个任务`)
    tasks.forEach(t => {
      console.log(`     - ${t.name}: completedToday=${t.completedToday}, lastCompletedDate=${t.lastCompletedDate}`)
    })
  }

  // 模拟 setCurrentChild
  setCurrentChild(childId) {
    console.log(`  🔄 切换当前孩子: ${this.currentChildId} → ${childId}`)
    this.currentChildId = childId
    // 注意：重置 loadedRef 的逻辑在 usePageData 中，这里简化为直接重新获取
  }

  // 获取当前孩子的已完成任务数
  getCompletedCount() {
    return this.tasks.filter(t => 
      t.childId === this.currentChildId && t.completedToday
    ).length
  }

  // 获取当前孩子的总任务数
  getTotalCount() {
    return this.tasks.filter(t => t.childId === this.currentChildId).length
  }
}

// ==================== 测试场景 ====================
async function runTests() {
  console.log("🧪 孩子切换场景测试")
  console.log("======================")
  console.log(`服务器当前日期: ${getServerToday()}`)
  console.log("")

  const store = new MockTaskStore()

  // 场景 1: 初始加载孩子 A
  console.log("【场景 1】初始加载孩子 A")
  store.setCurrentChild('child_a')
  await store.fetchTasks('child_a')
  const countA1 = store.getCompletedCount()
  console.log(`  📊 孩子 A 完成进度: ${countA1}/${store.getTotalCount()}`)
  console.assert(countA1 === 1, "孩子 A 应该有 1 个完成的任务")
  console.log("")

  // 场景 2: 切换到孩子 B
  console.log("【场景 2】切换到孩子 B")
  store.setCurrentChild('child_b')
  await store.fetchTasks('child_b')
  const countB = store.getCompletedCount()
  console.log(`  📊 孩子 B 完成进度: ${countB}/${store.getTotalCount()}`)
  console.assert(countB === 2, "孩子 B 应该有 2 个完成的任务")
  console.log("")

  // 场景 3: 切换回孩子 A（关键测试！）
  console.log("【场景 3】切换回孩子 A（关键测试！）")
  store.setCurrentChild('child_a')
  await store.fetchTasks('child_a')  // 重新获取 A 的任务
  const countA2 = store.getCompletedCount()
  console.log(`  📊 孩子 A 完成进度: ${countA2}/${store.getTotalCount()}`)
  console.log(`  🔍 期望: 1/2, 实际: ${countA2}/${store.getTotalCount()}`)
  
  if (countA2 === 1) {
    console.log("  ✅ 通过！任务状态保持一致")
  } else {
    console.log("  ❌ 失败！任务状态被重置了")
    console.log("  当前任务列表:", store.tasks.filter(t => t.childId === 'child_a'))
  }
  console.log("")

  // 场景 4: 快速多次切换
  console.log("【场景 4】快速多次切换 A → B → A")
  store.setCurrentChild('child_b')
  await store.fetchTasks('child_b')
  store.setCurrentChild('child_a')
  await store.fetchTasks('child_a')
  const countA3 = store.getCompletedCount()
  console.log(`  📊 孩子 A 完成进度: ${countA3}/${store.getTotalCount()}`)
  
  if (countA3 === 1) {
    console.log("  ✅ 通过！多次切换后状态仍保持一致")
  } else {
    console.log("  ❌ 失败！多次切换后状态错误")
  }
  console.log("")

  // 场景 5: 模拟数据库 completed_today 过期
  console.log("【场景 5】模拟数据库字段过期的情况")
  // 修改数据库，让 completed_today 过期（但 last_completed_date 正确）
  const taskA1 = mockDB.tasks.find(t => t.task_id === 'task_a1')
  taskA1.completed_today = false  // 模拟过期的数据库值
  // last_completed_date 保持为今天
  
  store.setCurrentChild('child_a')
  await store.fetchTasks('child_a')
  const countA4 = store.getCompletedCount()
  console.log(`  📊 孩子 A 完成进度: ${countA4}/${store.getTotalCount()}`)
  console.log(`  📝 注意：即使数据库 completed_today=false，服务器仍返回 completedToday=true`)
  
  if (countA4 === 1) {
    console.log("  ✅ 通过！服务器动态计算正确，不受过期字段影响")
  } else {
    console.log("  ❌ 失败！服务器计算错误")
  }

  console.log("")
  console.log("======================")
  console.log("测试完成！")
}

runTests().catch(console.error)
