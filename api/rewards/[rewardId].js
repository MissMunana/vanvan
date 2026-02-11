import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapReward } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { rewardId } = req.query;

  if (req.method === 'PUT') {
    const { name, category, points, icon, description, limit, stock, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (points !== undefined) updates.points = points;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;
    if (limit !== undefined) updates.limit = limit;
    if (stock !== undefined) updates.stock = stock;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('rewards')
      .update(updates)
      .eq('reward_id', rewardId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapReward(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('reward_id', rewardId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
