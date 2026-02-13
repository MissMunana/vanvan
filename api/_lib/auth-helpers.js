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
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { familyId: null, error: 'Family not found' };
  }

  return { familyId: data.family_id, error: null };
}

export async function getFamilyMember(userId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, role, member_id, display_name')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { member: null, error: 'Not a family member' };
  }

  return {
    member: {
      familyId: data.family_id,
      role: data.role,
      memberId: data.member_id,
      displayName: data.display_name,
    },
    error: null,
  };
}

export function requireRole(res, role, allowed) {
  if (!allowed.includes(role)) {
    res.status(403).json({ error: 'Permission denied' });
    return true;
  }
  return false;
}

export function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ error: message });
}

export function methodNotAllowed(res, allowed = 'POST') {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ error: `Method ${allowed} required` });
}

export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ error: message });
}
