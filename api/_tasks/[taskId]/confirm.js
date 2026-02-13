import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyMember, unauthorized, requireRole } from '../../_lib/auth-helpers.js';
import { mapTask, mapPointLog, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { member, error: memberError } = await getFamilyMember(user.id);
  if (memberError) return res.status(404).json({ error: memberError });

  // Only admin and co_admin can confirm tasks
  if (requireRole(res, member.role, ['admin', 'co_admin'])) return;

  const { familyId } = member;
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
    if (!task.requires_parent_confirm) return res.status(400).json({ error: 'Task does not require confirmation' });
    if (task.parent_confirmed) return res.status(400).json({ error: 'Task already confirmed' });
    if (!task.completed_today) return res.status(400).json({ error: 'Task not completed yet' });

    // 2. Mark as confirmed — use conditional update to prevent race condition
    const now = new Date().toISOString();
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        parent_confirmed: true,
        parent_confirmed_by: user.id,
        parent_confirmed_at: now,
      })
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .eq('parent_confirmed', false) // Prevent double-confirm race condition
      .select()
      .single();

    if (updateError) {
      // If no rows matched, another request already confirmed this task
      return res.status(409).json({ error: 'Task was already confirmed by another request' });
    }

    // 3. Award points (same logic as complete.js but delayed)
    const earnedPoints = task.points;

    const logRow = {
      log_id: generateId(),
      child_id: task.child_id,
      family_id: familyId,
      task_id: taskId,
      type: 'earn',
      points: earnedPoints,
      reason: `家长确认任务: ${task.name}`,
      emotion: null,
      operator: 'parent',
      operator_user_id: user.id,
      operator_name: member.displayName || '',
      created_at: now,
    };

    const { data: logData, error: logError } = await supabase
      .from('point_logs')
      .insert(logRow)
      .select()
      .single();

    if (logError) throw logError;

    // 4. Update child total_points atomically via RPC
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('increment_points', {
        target_child_id: task.child_id,
        target_family_id: familyId,
        delta: earnedPoints,
      });

    if (rpcError) throw rpcError;
    const newTotalPoints = rpcResult;

    return res.status(200).json({
      task: mapTask(updatedTask),
      earnedPoints,
      pointLog: mapPointLog(logData),
      totalPoints: newTotalPoints,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
