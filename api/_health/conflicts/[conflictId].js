import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapConflictRecord } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { conflictId } = req.query;

  if (req.method === 'PUT') {
    const { description, childFeeling, parentFeeling, agreements, status, note } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (description !== undefined) updates.description = description;
    if (childFeeling !== undefined) updates.child_feeling = childFeeling;
    if (parentFeeling !== undefined) updates.parent_feeling = parentFeeling;
    if (agreements !== undefined) updates.agreements = agreements;
    if (status !== undefined) updates.status = status;
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from('conflict_records')
      .update(updates)
      .eq('conflict_id', conflictId)
      .eq('family_id', familyId)
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapConflictRecord(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('conflict_records')
      .delete()
      .eq('conflict_id', conflictId)
      .eq('family_id', familyId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
