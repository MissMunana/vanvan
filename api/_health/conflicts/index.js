import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, validateChildOwnership } from '../../_lib/auth-helpers.js';
import { mapConflictRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const childId = url.searchParams.get('childId') || req.query?.childId;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const { data, error } = await supabase
      .from('conflict_records')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('date', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapConflictRecord));
  }

  if (req.method === 'POST') {
    const { childId, date, description, childFeeling, parentFeeling, agreements, note } = req.body;
    if (!childId || !date || !description || !childFeeling || !parentFeeling) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!await validateChildOwnership(familyId, childId)) {
      return res.status(403).json({ error: 'Child does not belong to your family' });
    }
    const now = new Date().toISOString();
    const row = {
      conflict_id: generateId(),
      child_id: childId, family_id: familyId,
      date, description, child_feeling: childFeeling, parent_feeling: parentFeeling,
      agreements: agreements || [], status: 'recorded', note: note || null,
      created_at: now, updated_at: now,
    };
    const { data, error } = await supabase.from('conflict_records').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapConflictRecord(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
