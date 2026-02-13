import supabase from './_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from './_lib/auth-helpers.js';
import meHandler from './_family/me.js';
import membersIndex from './_family/members/index.js';
import memberRecord from './_family/members/[memberId].js';
import joinHandler from './_family/join.js';
import handoversIndex from './_family/handovers/index.js';
import handoverRecord from './_family/handovers/[logId].js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/family', '');
  const segments = path.split('/').filter(Boolean);

  // /api/family/me
  if (segments.length === 1 && segments[0] === 'me') {
    return meHandler(req, res);
  }

  // /api/family/join
  if (segments.length === 1 && segments[0] === 'join') {
    return joinHandler(req, res);
  }

  // /api/family/members
  if (segments.length === 1 && segments[0] === 'members') {
    return membersIndex(req, res);
  }

  // /api/family/members/:memberId
  if (segments.length === 2 && segments[0] === 'members') {
    req.query = { ...req.query, memberId: segments[1] };
    return memberRecord(req, res);
  }

  // /api/family/handovers
  if (segments.length === 1 && segments[0] === 'handovers') {
    return handoversIndex(req, res);
  }

  // /api/family/handovers/:logId
  if (segments.length === 2 && segments[0] === 'handovers') {
    req.query = { ...req.query, logId: segments[1] };
    return handoverRecord(req, res);
  }

  // /api/family — original family settings endpoints
  if (segments.length === 0) {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError) return unauthorized(res, authError);

    const { familyId, error: familyError } = await getFamilyId(user.id);
    if (familyError) return res.status(404).json({ error: familyError });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('family_id', familyId)
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({
        familyId: data.family_id,
        parentPin: data.parent_pin,
        onboardingCompleted: data.onboarding_completed,
        completionCount: data.completion_count,
      });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { parentPin, onboardingCompleted, completionCount } = body;
      const updates = { updated_at: new Date().toISOString() };
      if (parentPin !== undefined) updates.parent_pin = parentPin;
      if (onboardingCompleted !== undefined) updates.onboarding_completed = onboardingCompleted;
      if (completionCount !== undefined) updates.completion_count = completionCount;

      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('family_id', familyId)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({
        familyId: data.family_id,
        parentPin: data.parent_pin,
        onboardingCompleted: data.onboarding_completed,
        completionCount: data.completion_count,
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(404).json({ error: 'Not found' });
}
