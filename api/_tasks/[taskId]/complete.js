import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapTask, mapPointLog, generateId, getToday, getYesterday } from '../../_lib/mappers.js';

// Habit stage logic (replicated from client taskStore.ts)
function getHabitStage(consecutiveDays) {
  if (consecutiveDays >= 66) return 'graduated';
  if (consecutiveDays >= 22) return 'stable';
  if (consecutiveDays >= 8) return 'persist';
  return 'start';
}

function getStageMultiplier(stage) {
  switch (stage) {
    case 'start': return 1.5;
    case 'persist': return 1.0;
    case 'stable': return 0.8;
    case 'graduated': return 0;
    default: return 1.0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { taskId } = req.query;

  try {
    // 1. Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .single();

    if (taskError || !task) return res.status(404).json({ error: 'Task not found' });
    if (task.completed_today) return res.status(400).json({ error: 'Task already completed today' });

    const today = getToday();
    const yesterday = getYesterday();

    // 2. Calculate streak
    const wasYesterday = task.last_completed_date === yesterday;
    const newConsecutiveDays = wasYesterday ? task.consecutive_days + 1 : 1;

    // 3. Calculate bonus points
    let bonusPoints = 0;
    if (newConsecutiveDays === 3) bonusPoints = 5;
    else if (newConsecutiveDays === 7) bonusPoints = 20;
    else if (newConsecutiveDays > 0 && newConsecutiveDays % 7 === 0) bonusPoints = 20;

    // 4. Calculate stage
    const oldStage = task.stage || 'start';
    const newStage = getHabitStage(newConsecutiveDays);
    const stageChanged = oldStage !== newStage;
    const graduated = newStage === 'graduated' && stageChanged;

    // 5. Calculate earned points
    const multiplier = getStageMultiplier(newStage);
    const earnedPoints = Math.round(task.points * multiplier);
    const totalEarned = earnedPoints + bonusPoints;

    // 6. Update the task
    const taskUpdate = {
      completed_today: true,
      last_completed_date: today,
      consecutive_days: newConsecutiveDays,
      stage: newStage,
      total_completions: (task.total_completions || 0) + 1,
    };

    // If task requires parent confirmation, reset confirmation status
    if (task.requires_parent_confirm) {
      taskUpdate.parent_confirmed = false;
      taskUpdate.parent_confirmed_by = null;
      taskUpdate.parent_confirmed_at = null;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(taskUpdate)
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If requires parent confirmation, don't award points yet
    if (task.requires_parent_confirm) {
      return res.status(200).json({
        task: mapTask(updatedTask),
        earnedPoints: 0,
        bonusPoints: 0,
        consecutiveDays: newConsecutiveDays,
        stageChanged,
        newStage,
        graduated,
        pointLog: null,
        totalPoints: null,
        awaitingConfirm: true,
      });
    }

    // 7. Create point log
    const logRow = {
      log_id: generateId(),
      child_id: task.child_id,
      family_id: familyId,
      task_id: taskId,
      type: 'earn',
      points: totalEarned,
      reason: `完成任务: ${task.name}${bonusPoints > 0 ? ` (连续${newConsecutiveDays}天奖励+${bonusPoints})` : ''}`,
      emotion: null,
      operator: 'child',
      created_at: new Date().toISOString(),
    };

    const { data: logData, error: logError } = await supabase
      .from('point_logs')
      .insert(logRow)
      .select()
      .single();

    if (logError) throw logError;

    // 8. Update child total_points atomically
    const { data: child } = await supabase
      .from('children')
      .select('total_points')
      .eq('child_id', task.child_id)
      .eq('family_id', familyId)
      .single();

    const newTotalPoints = (child?.total_points || 0) + totalEarned;
    await supabase
      .from('children')
      .update({ total_points: newTotalPoints })
      .eq('child_id', task.child_id)
      .eq('family_id', familyId);

    // 9. Increment family completion_count
    const { data: family } = await supabase
      .from('families')
      .select('completion_count')
      .eq('family_id', familyId)
      .single();

    await supabase
      .from('families')
      .update({ completion_count: (family?.completion_count || 0) + 1 })
      .eq('family_id', familyId);

    return res.status(200).json({
      task: mapTask(updatedTask),
      earnedPoints,
      bonusPoints,
      consecutiveDays: newConsecutiveDays,
      stageChanged,
      newStage,
      graduated,
      pointLog: mapPointLog(logData),
      totalPoints: newTotalPoints,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
