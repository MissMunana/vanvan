import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId } = req.query;
  const { delta } = req.body;

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta must be a number' });
  }

  // Atomically increment points
  const { data: newTotal, error } = await supabase.rpc('increment_points', {
    target_child_id: childId,
    target_family_id: familyId,
    delta,
  });

  if (error) return res.status(500).json({ error: error.message });
  if (newTotal === null) return res.status(404).json({ error: 'Child not found' });

  return res.status(200).json({ totalPoints: newTotal });
}
