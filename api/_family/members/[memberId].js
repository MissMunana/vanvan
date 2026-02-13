import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyMember, unauthorized, requireRole } from '../../_lib/auth-helpers.js';
import { mapFamilyMember } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { member, error: memberError } = await getFamilyMember(user.id);
  if (memberError) return res.status(404).json({ error: memberError });

  const { familyId, role } = member;
  const { memberId } = req.query;

  // PUT /family/members/:memberId — update role
  if (req.method === 'PUT') {
    if (requireRole(res, role, ['admin'])) return;

    const { role: newRole } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!newRole || !['admin', 'co_admin', 'observer'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Cannot change own role
    if (memberId === member.memberId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const { data, error } = await supabase
      .from('family_members')
      .update({ role: newRole })
      .eq('member_id', memberId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Member not found' });
    return res.status(200).json(mapFamilyMember(data));
  }

  // DELETE /family/members/:memberId — remove member
  if (req.method === 'DELETE') {
    if (requireRole(res, role, ['admin'])) return;

    // Cannot remove yourself
    if (memberId === member.memberId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('member_id', memberId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
