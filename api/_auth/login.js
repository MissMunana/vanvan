// Email/password login is handled client-side via supabase.auth.signInWithPassword()
// This endpoint exists only as a fallback for server-side session creation
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method POST required' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.status(200).json({
    session: data.session,
    user: data.user,
  });
}
