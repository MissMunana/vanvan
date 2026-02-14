import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapPointLog, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { childId, limit } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId query param required' });

    const { data, error } = await supabase
      .from('point_logs')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 200);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapPointLog));
  }

  if (req.method === 'POST') {
    const { childId, taskId, type, points, reason, emotion, operator } = req.body;
    if (!childId || !type || points === undefined || !reason) {
      return res.status(400).json({ error: 'childId, type, points, and reason are required' });
    }

    // Use RPC for atomic point update to prevent race conditions
    const { data: newTotalPoints, error: pointsError } = await supabase.rpc('add_points_atomic', {
      p_child_id: childId,
      p_family_id: familyId,
      p_points: points
    });

    if (pointsError) {
      return res.status(500).json({ error: pointsError.message });
    }

    const now = new Date().toISOString();
    const row = {
      log_id: generateId(),
      child_id: childId,
      family_id: familyId,
      task_id: taskId || null,
      type,
      points,
      reason,
      emotion: emotion || null,
      operator: operator || 'parent',
      created_at: now,
    };

    const { data: logData, error: logError } = await supabase
      .from('point_logs')
      .insert(row)
      .select()
      .single();

    if (logError) {
      // Log error but don't fail the request since points were already updated
      console.error('Failed to insert point log:', logError);
    }

    return res.status(201).json({
      log: logData ? mapPointLog(logData) : null,
      totalPoints: newTotalPoints,
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
