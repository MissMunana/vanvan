import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import supabase from '../../_lib/supabase-admin.js';
import { methodNotAllowed } from '../../_lib/auth-helpers.js';

const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { email, credential } = req.body;
  if (!email || !credential) {
    return res.status(400).json({ error: 'Email and credential are required' });
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

  // Get stored challenge
  const { data: challengeRow, error: challengeError } = await supabase
    .from('webauthn_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'authentication')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (challengeError || !challengeRow) {
    return res.status(400).json({ error: 'Challenge expired or not found' });
  }

  // Get the stored credential
  const { data: storedCred } = await supabase
    .from('passkey_credentials')
    .select('*')
    .eq('credential_id', credential.id)
    .eq('user_id', user.id)
    .single();

  if (!storedCred) {
    return res.status(400).json({ error: 'Credential not found' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: storedCred.credential_id,
        publicKey: new Uint8Array(Buffer.from(storedCred.public_key, 'base64')),
        counter: storedCred.counter,
        transports: storedCred.transports || [],
      },
    });
  } catch (err) {
    return res.status(400).json({ error: 'Verification failed: ' + err.message });
  }

  if (!verification.verified) {
    return res.status(400).json({ error: 'Verification failed' });
  }

  // Update counter
  await supabase
    .from('passkey_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', storedCred.credential_id);

  // Clean up challenge
  await supabase.from('webauthn_challenges').delete().eq('challenge_id', challengeRow.challenge_id);

  // Generate a magic link token for the client to establish a Supabase session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  });

  if (linkError) {
    return res.status(500).json({ error: 'Failed to generate session' });
  }

  const tokenHash = linkData.properties?.hashed_token;

  return res.status(200).json({
    verified: true,
    token_hash: tokenHash,
    email: user.email,
  });
}
