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

  // First get current points
  const { data: child, error: getError } = await supabase
    .from('children')
    .select('total_points')
    .eq('child_id', childId)
    .eq('family_id', familyId)
    .single();

  if (getError) return res.status(404).json({ error: 'Child not found' });

  const newPoints = Math.max(0, child.total_points + delta);

  const { data, error } = await supabase
    .from('children')
    .update({ total_points: newPoints })
    .eq('child_id', childId)
    .eq('family_id', familyId)
    .select('total_points')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ totalPoints: data.total_points });
}
