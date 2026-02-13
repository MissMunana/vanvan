import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyMember, unauthorized, requireRole } from '../../_lib/auth-helpers.js';
import { mapFamilyMember, mapFamilyInvite, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { member, error: memberError } = await getFamilyMember(user.id);
  if (memberError) return res.status(404).json({ error: memberError });

  const { familyId, role } = member;

  // GET /family/members — list all members
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapFamilyMember));
  }

  // POST /family/members — create invite
  if (req.method === 'POST') {
    if (requireRole(res, role, ['admin'])) return;

    const { role: inviteRole } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!inviteRole || !['co_admin', 'observer'].includes(inviteRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be co_admin or observer' });
    }

    // Generate 6-char uppercase invite code
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const row = {
      invite_id: generateId(),
      family_id: familyId,
      invite_code: inviteCode,
      role: inviteRole,
      invited_by: user.id,
      expires_at: expiresAt,
    };

    const { data, error } = await supabase
      .from('family_invites')
      .insert(row)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapFamilyInvite(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
