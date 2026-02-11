import { verifyRegistrationResponse } from '@simplewebauthn/server';
import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized, methodNotAllowed } from '../../_lib/auth-helpers.js';

const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { credential, friendlyName } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Credential response is required' });
  }

  // Get stored challenge
  const { data: challengeRow, error: challengeError } = await supabase
    .from('webauthn_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'registration')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (challengeError || !challengeRow) {
    return res.status(400).json({ error: 'Challenge expired or not found' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    return res.status(400).json({ error: 'Verification failed: ' + err.message });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return res.status(400).json({ error: 'Verification failed' });
  }

  const { credential: regCred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  // Store credential
  const { error: insertError } = await supabase.from('passkey_credentials').insert({
    credential_id: regCred.id,
    user_id: user.id,
    public_key: Buffer.from(regCred.publicKey).toString('base64'),
    counter: regCred.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.response?.transports || [],
    friendly_name: friendlyName || 'Passkey',
  });

  if (insertError) {
    return res.status(500).json({ error: 'Failed to save credential' });
  }

  // Clean up challenge
  await supabase.from('webauthn_challenges').delete().eq('challenge_id', challengeRow.challenge_id);

  return res.status(200).json({ verified: true });
}
