import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, validateChildOwnership, unauthorized } from '../_lib/auth-helpers.js';
import { mapBadge } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId query param required' });

    const { data, error } = await supabase
      .from('unlocked_badges')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapBadge));
  }

  if (req.method === 'POST') {
    const { childId, badgeId } = req.body;
    if (!childId || !badgeId) return res.status(400).json({ error: 'childId and badgeId are required' });

    // Validate child ownership
    const isValid = await validateChildOwnership(familyId, childId);
    if (!isValid) {
      return res.status(403).json({ error: 'Child does not belong to this family' });
    }

    const { data, error } = await supabase
      .from('unlocked_badges')
      .upsert({
        child_id: childId,
        family_id: familyId,
        badge_id: badgeId,
        unlocked_at: new Date().toISOString(),
      }, { onConflict: 'child_id,badge_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapBadge(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
