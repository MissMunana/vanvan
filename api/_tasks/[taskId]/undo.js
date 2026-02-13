import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapTask, getYesterday } from '../../_lib/mappers.js';

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

    const newConsecutiveDays = Math.max(0, task.consecutive_days - 1);
    const newLastCompleted = newConsecutiveDays > 0 ? getYesterday() : null;

    // 2. Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        completed_today: false,
        consecutive_days: newConsecutiveDays,
        last_completed_date: newLastCompleted,
        total_completions: Math.max(0, (task.total_completions || 0) - 1),
      })
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Find and delete the most recent earn log for this task today
    const { data: recentLog } = await supabase
      .from('point_logs')
      .select('*')
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .eq('type', 'earn')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentLog) {
      // Subtract points atomically
      await supabase.rpc('increment_points', {
        target_child_id: task.child_id,
        target_family_id: familyId,
        delta: -recentLog.points,
      });

      // Delete the log
      await supabase
        .from('point_logs')
        .delete()
        .eq('log_id', recentLog.log_id)
        .eq('family_id', familyId);
    }

    return res.status(200).json(mapTask(updatedTask));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
