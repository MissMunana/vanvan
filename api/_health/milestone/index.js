import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapMilestoneRecord, generateId, getToday } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, milestoneId, status, note, photoTaken, photoNote } = req.body;
  if (!childId || !milestoneId) return res.status(400).json({ error: 'childId and milestoneId are required' });

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from('milestone_records')
    .select('record_id')
    .eq('child_id', childId)
    .eq('milestone_id', milestoneId)
    .eq('family_id', familyId)
    .maybeSingle();

  if (existing) {
    const updates = { status: status || 'not_started' };
    if (status === 'achieved') updates.achieved_date = getToday();
    if (note !== undefined) updates.note = note;
    if (photoTaken !== undefined) updates.photo_taken = photoTaken;
    if (photoNote !== undefined) updates.photo_note = photoNote;

    const { data, error } = await supabase
      .from('milestone_records')
      .update(updates)
      .eq('record_id', existing.record_id)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapMilestoneRecord(data));
  }

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    milestone_id: milestoneId,
    status: status || 'not_started',
    achieved_date: status === 'achieved' ? getToday() : null,
    note: note || '',
    photo_taken: photoTaken || false,
    photo_note: photoNote || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('milestone_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapMilestoneRecord(data));
}
