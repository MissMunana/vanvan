import supabase from './_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from './_lib/auth-helpers.js';

export default async function handler(req, res) {
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
    const { parentPin, onboardingCompleted, completionCount } = req.body;
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
