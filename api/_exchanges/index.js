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

    const cost = points || 0;

    // Use RPC for atomic point check and deduction to prevent race conditions
    if (cost > 0) {
      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_points_for_exchange', {
        p_child_id: childId,
        p_family_id: familyId,
        p_points: cost
      });

      if (deductError) {
        if (deductError.message.includes('insufficient')) {
          return res.status(400).json({ error: '积分不足' });
        }
        return res.status(500).json({ error: deductError.message });
      }

      if (!deductResult) {
        return res.status(400).json({ error: '积分不足' });
      }
    }

    const row = {
      exchange_id: generateId(),
      child_id: childId,
      family_id: familyId,
      reward_id: rewardId,
      reward_name: rewardName || '',
      reward_icon: rewardIcon || '🎁',
      points: cost,
      status: 'pending',
      requested_at: new Date().toISOString(),
      reviewed_at: null,
      reject_reason: null,
    };

    const { data, error } = await supabase.from('exchanges').insert(row).select().single();
    
    if (error) {
      // If insert fails, we should refund the points (but this is complex in serverless)
      // For now, log the error for manual intervention
      console.error('Exchange insert failed after point deduction:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).json(mapExchange(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
