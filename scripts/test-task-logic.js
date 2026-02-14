#!/usr/bin/env node
/**
 * 任务完成状态逻辑测试
 * 验证服务器端动态计算 completedToday 的逻辑是否正确
 */

// 模拟服务器的 getToday 函数
function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
}

// 模拟 mapTask 函数
function mapTask(t) {
  const today = getToday()
  const completedToday = t.last_completed_date === today
  
  return {
    taskId: t.task_id,
    childId: t.child_id,
    name: t.name,
    completedToday: completedToday,
    lastCompletedDate: t.last_completed_date,
  }
}

// 测试用例
const testCases = [
  {
    name: "今天完成的任务",
    input: {
      task_id: "task_1",
      child_id: "child_1",
      name: "测试任务1",
      last_completed_date: getToday(), // 今天
      completed_today: true, // 数据库中的值（可能过期）
    },
    expected: { completedToday: true }
  },
  {
    name: "昨天完成的任务（数据库 completed_today 过期）",
    input: {
      task_id: "task_2",
      child_id: "child_1",
      name: "测试任务2",
      last_completed_date: "2026-02-12", // 昨天
      completed_today: true, // 数据库显示完成，但实际应该是昨天完成的
    },
    expected: { completedToday: false }
  },
  {
    name: "从未完成的任务",
    input: {
      task_id: "task_3",
      child_id: "child_1",
      name: "测试任务3",
      last_completed_date: null,
      completed_today: false,
    },
    expected: { completedToday: false }
  },
  {
    name: "多天前完成的任务",
    input: {
      task_id: "task_4",
      child_id: "child_2",
      name: "测试任务4",
      last_completed_date: "2026-02-10", // 几天前
      completed_today: false,
    },
    expected: { completedToday: false }
  }
]

// 运行测试
console.log("🧪 任务完成状态逻辑测试")
console.log("========================")
console.log(`当前 Shanghai 日期: ${getToday()}`)
console.log("")

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = mapTask(test.input)
  const success = result.completedToday === test.expected.completedToday
  
  if (success) {
    console.log(`✅ 测试 ${index + 1}: ${test.name} - 通过`)
    passed++
  } else {
    console.log(`❌ 测试 ${index + 1}: ${test.name} - 失败`)
    console.log(`   期望: completedToday=${test.expected.completedToday}`)
    console.log(`   实际: completedToday=${result.completedToday}`)
    console.log(`   lastCompletedDate: ${result.lastCompletedDate}`)
    failed++
  }
})

console.log("")
console.log("========================")
console.log(`测试结果: ${passed} 通过, ${failed} 失败`)

if (failed > 0) {
  process.exit(1)
}
