import { generateAuthenticationOptions } from '@simplewebauthn/server';
import supabase from '../../_lib/supabase-admin.js';
import { methodNotAllowed } from '../../_lib/auth-helpers.js';

const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Find user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    return res.status(500).json({ error: 'Server error' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get user's passkey credentials
  const { data: credentials } = await supabase
    .from('passkey_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id);

  if (!credentials || credentials.length === 0) {
    return res.status(404).json({ error: 'No passkeys registered for this user' });
  }

  const allowCredentials = credentials.map(cred => ({
    id: cred.credential_id,
    transports: cred.transports || [],
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });

  // Store challenge
  await supabase.from('webauthn_challenges').insert({
    user_id: user.id,
    challenge: options.challenge,
    type: 'authentication',
  });

  return res.status(200).json(options);
}
