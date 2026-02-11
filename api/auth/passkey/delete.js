import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized, methodNotAllowed } from '../../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { credentialId } = req.body || {};
  if (!credentialId) {
    return res.status(400).json({ error: 'credentialId is required' });
  }

  const { error } = await supabase
    .from('passkey_credentials')
    .delete()
    .eq('credential_id', credentialId)
    .eq('user_id', user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
