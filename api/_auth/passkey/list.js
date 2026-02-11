import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized, methodNotAllowed } from '../../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { data, error } = await supabase
    .from('passkey_credentials')
    .select('credential_id, friendly_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const passkeys = (data || []).map((row) => ({
    id: row.credential_id,
    name: row.friendly_name || '',
    createdAt: row.created_at,
  }));

  return res.status(200).json({ passkeys });
}
