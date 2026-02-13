import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapExchange, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId query param required' });

    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('requested_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapExchange));
  }

  if (req.method === 'POST') {
    const { childId, rewardId, rewardName, rewardIcon, points } = req.body;
    if (!childId || !rewardId) return res.status(400).json({ error: 'childId and rewardId are required' });

    // Validate child has enough points
    const cost = points || 0;
    if (cost > 0) {
      const { data: child } = await supabase
        .from('children')
        .select('total_points')
        .eq('child_id', childId)
        .eq('family_id', familyId)
        .single();
      if (!child) return res.status(404).json({ error: 'Child not found' });
      if (child.total_points < cost) {
        return res.status(400).json({ error: '积分不足', needed: cost, available: child.total_points });
      }
    }

    const row = {
      exchange_id: generateId(),
      child_id: childId,
      family_id: familyId,
      reward_id: rewardId,
      reward_name: rewardName || '',
      reward_icon: rewardIcon || '🎁',
      points: points || 0,
      status: 'pending',
      requested_at: new Date().toISOString(),
      reviewed_at: null,
      reject_reason: null,
    };

    const { data, error } = await supabase.from('exchanges').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapExchange(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
