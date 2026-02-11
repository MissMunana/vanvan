import supabase from '../_lib/supabase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method POST required' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Create user via admin (auto-confirms email)
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(400).json({ error: createError.message });
  }

  // Generate a magic link token so the client can establish a session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError) {
    return res.status(500).json({ error: 'Failed to generate session link' });
  }

  // Extract token_hash from the link properties
  const tokenHash = linkData.properties?.hashed_token;

  return res.status(200).json({
    user: userData.user,
    token_hash: tokenHash,
    email,
  });
}
