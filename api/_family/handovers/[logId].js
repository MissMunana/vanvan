import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyMember, unauthorized } from '../../_lib/auth-helpers.js';
import { mapHandoverLog } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { member, error: memberError } = await getFamilyMember(user.id);
  if (memberError) return res.status(404).json({ error: memberError });

  const { familyId } = member;
  const { logId } = req.query;

  // PUT /family/handovers/:logId — update
  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const updates = {};
    if (body.tasksSummary !== undefined) updates.tasks_summary = body.tasksSummary;
    if (body.mealsSummary !== undefined) updates.meals_summary = body.mealsSummary;
    if (body.sleepSummary !== undefined) updates.sleep_summary = body.sleepSummary;
    if (body.healthSummary !== undefined) updates.health_summary = body.healthSummary;
    if (body.specialNotes !== undefined) updates.special_notes = body.specialNotes;
    if (body.priority !== undefined) updates.priority = body.priority;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('handover_logs')
      .update(updates)
      .eq('log_id', logId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Log not found' });
    return res.status(200).json(mapHandoverLog(data));
  }

  // DELETE /family/handovers/:logId
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('handover_logs')
      .delete()
      .eq('log_id', logId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
