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

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { inviteCode, confirmTransfer } = body;
  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code required' });
  }

  // Atomically claim the invite: find + mark as used in one operation
  const { data: invite, error: inviteError } = await supabase
    .from('family_invites')
    .update({ used_by: user.id })
    .eq('invite_code', inviteCode.toUpperCase())
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .select()
    .single();

  if (inviteError || !invite) {
    return res.status(400).json({ error: 'Invalid, expired, or already-used invite code' });
  }

  // Check if user already belongs to a family
  const { data: existingMember } = await supabase
    .from('family_members')
    .select('member_id, family_id, role')
    .eq('user_id', user.id)
    .single();

  if (existingMember && existingMember.family_id === invite.family_id) {
    return res.status(400).json({ error: 'Already a member of this family' });
  }

  // If user belongs to a different family, require explicit confirmation
  if (existingMember) {
    if (!confirmTransfer) {
      // Release the invite so it can be used again after confirmation
      await supabase
        .from('family_invites')
        .update({ used_by: null })
        .eq('invite_id', invite.invite_id);

      return res.status(409).json({
        error: 'CONFIRM_TRANSFER_REQUIRED',
        message: 'You already belong to a family. Joining a new family will remove you from the current one.',
        currentFamilyId: existingMember.family_id,
      });
    }

    // Check if user is the sole admin of their current family
    if (existingMember.role === 'admin') {
      const { data: otherAdmins } = await supabase
        .from('family_members')
        .select('member_id')
        .eq('family_id', existingMember.family_id)
        .eq('role', 'admin')
        .neq('user_id', user.id);

      if (!otherAdmins || otherAdmins.length === 0) {
        // Release the invite
        await supabase
          .from('family_invites')
          .update({ used_by: null })
          .eq('invite_id', invite.invite_id);

        return res.status(400).json({
          error: 'You are the only admin of your current family. Please promote another member to admin before leaving.',
        });
      }
    }

    // Re-claim the invite atomically for the confirmed transfer
    const { data: reclaimedInvite, error: reclaimError } = await supabase
      .from('family_invites')
      .update({ used_by: user.id })
      .eq('invite_id', invite.invite_id)
      .is('used_by', null)
      .select()
      .single();

    if (reclaimError || !reclaimedInvite) {
      return res.status(400).json({ error: 'Invite code was already used by someone else' });
    }

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
    return res.status(200).json(mapFamilyMember(updated));
  }

  // New member
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
  return res.status(200).json(mapFamilyMember(newMember));
}
