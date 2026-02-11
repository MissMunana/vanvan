import { generateRegistrationOptions } from '@simplewebauthn/server';
import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, methodNotAllowed } from '../../_lib/auth-helpers.js';

const rpName = process.env.WEBAUTHN_RP_NAME || '小星星成长宝';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  // Get existing passkeys to exclude
  const { data: existingCreds } = await supabase
    .from('passkey_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id);

  const excludeCredentials = (existingCreds || []).map(cred => ({
    id: cred.credential_id,
    transports: cred.transports || [],
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge
  await supabase.from('webauthn_challenges').insert({
    user_id: user.id,
    challenge: options.challenge,
    type: 'registration',
  });

  return res.status(200).json(options);
}
