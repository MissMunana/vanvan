import supabase from './supabase-admin.js';

export async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: 'Invalid or expired token' };
  }

  return { user: data.user, error: null };
}

export async function getFamilyId(userId) {
  const { data, error } = await supabase
    .from('families')
    .select('family_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { familyId: null, error: 'Family not found' };
  }

  return { familyId: data.family_id, error: null };
}

export function methodNotAllowed(res, allowed = 'POST') {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ error: `Method ${allowed} required` });
}

export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ error: message });
}
