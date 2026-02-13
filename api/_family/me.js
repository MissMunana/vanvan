import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized } from '../_lib/auth-helpers.js';
import { mapFamilyMember } from '../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method GET required' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Not a family member' });
  }

  return res.status(200).json(mapFamilyMember(data));
}
