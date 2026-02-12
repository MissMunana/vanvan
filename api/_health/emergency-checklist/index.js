import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapSafetyChecklistProgress, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, checklistItemId, completed } = req.body;
  if (!childId || !checklistItemId) return res.status(400).json({ error: 'childId and checklistItemId are required' });

  const now = new Date().toISOString();
  const row = {
    id: generateId(),
    child_id: childId,
    family_id: familyId,
    checklist_item_id: checklistItemId,
    completed: !!completed,
    completed_at: completed ? now : null,
    created_at: now,
  };

  const { data, error } = await supabase
    .from('safety_checklist_progress')
    .upsert(row, { onConflict: 'child_id,checklist_item_id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(mapSafetyChecklistProgress(data));
}
