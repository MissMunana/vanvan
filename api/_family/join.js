import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, unauthorized } from '../_lib/auth-helpers.js';
import { mapFamilyMember, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method POST required' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { inviteCode } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code required' });
  }

  // Find valid invite
  const { data: invite, error: inviteError } = await supabase
    .from('family_invites')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return res.status(400).json({ error: 'Invalid or expired invite code' });
  }

  // Check if user already belongs to this family
  const { data: existingMember } = await supabase
    .from('family_members')
    .select('member_id, family_id')
    .eq('user_id', user.id)
    .single();

  if (existingMember && existingMember.family_id === invite.family_id) {
    return res.status(400).json({ error: 'Already a member of this family' });
  }

  // If user belongs to a different family, update their membership
  if (existingMember) {
    const { data: updated, error: updateError } = await supabase
      .from('family_members')
      .update({
        family_id: invite.family_id,
        role: invite.role,
        invited_by: invite.invited_by,
        joined_at: new Date().toISOString(),
      })
      .eq('member_id', existingMember.member_id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Mark invite as used
    await supabase
      .from('family_invites')
      .update({ used_by: user.id })
      .eq('invite_id', invite.invite_id);

    return res.status(200).json(mapFamilyMember(updated));
  }

  // New member (shouldn't happen normally due to handle_new_user trigger, but handle gracefully)
  const row = {
    member_id: generateId(),
    family_id: invite.family_id,
    user_id: user.id,
    role: invite.role,
    display_name: user.user_metadata?.name || user.email || 'User',
    invited_by: invite.invited_by,
  };

  const { data: newMember, error: insertError } = await supabase
    .from('family_members')
    .insert(row)
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  // Mark invite as used
  await supabase
    .from('family_invites')
    .update({ used_by: user.id })
    .eq('invite_id', invite.invite_id);

  return res.status(200).json(mapFamilyMember(newMember));
}
