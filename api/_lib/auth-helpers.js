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

export async function getFamilyMember(userId) {
  // Query families table since family_members table doesn't exist
  const { data, error } = await supabase
    .from('families')
    .select('family_id, user_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { member: null, error: 'Not a family member' };
  }

  return {
    member: {
      familyId: data.family_id,
      role: 'owner',
      memberId: data.user_id,
      displayName: 'Owner',
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

export async function validateChildOwnership(familyId, childId) {
  const { data, error } = await supabase
    .from('children')
    .select('child_id')
    .eq('child_id', childId)
    .eq('family_id', familyId)
    .single();

  return !error && !!data;
}

/**
 * 批量验证多个 childId 是否属于当前家庭
 * @param {string} familyId 
 * @param {string[]} childIds 
 * @returns {Promise<{valid: boolean, invalidIds: string[]}>}
 */
export async function validateChildrenOwnership(familyId, childIds) {
  if (!childIds || childIds.length === 0) {
    return { valid: true, invalidIds: [] };
  }
  
  const { data, error } = await supabase
    .from('children')
    .select('child_id')
    .eq('family_id', familyId)
    .in('child_id', childIds);

  if (error) {
    return { valid: false, invalidIds: childIds };
  }

  const validIds = new Set(data.map(c => c.child_id));
  const invalidIds = childIds.filter(id => !validIds.has(id));
  
  return { 
    valid: invalidIds.length === 0, 
    invalidIds 
  };
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
