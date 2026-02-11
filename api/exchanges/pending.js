import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapExchange } from '../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { data, error } = await supabase
    .from('exchanges')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json((data || []).map(mapExchange));
}
