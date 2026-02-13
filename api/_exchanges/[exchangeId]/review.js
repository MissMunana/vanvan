import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapExchange, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { exchangeId } = req.query;
  const { status, rejectReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
  }

  try {
    // 1. Get the exchange
    const { data: exchange, error: getError } = await supabase
      .from('exchanges')
      .select('*')
      .eq('exchange_id', exchangeId)
      .eq('family_id', familyId)
      .single();

    if (getError || !exchange) return res.status(404).json({ error: 'Exchange not found' });
    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: 'Exchange already reviewed' });
    }

    const now = new Date().toISOString();

    // 2. Update exchange status
    const { data: updated, error: updateError } = await supabase
      .from('exchanges')
      .update({
        status,
        reviewed_at: now,
        reject_reason: status === 'rejected' ? (rejectReason || null) : null,
      })
      .eq('exchange_id', exchangeId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. If approved, deduct points atomically and create spend log
    if (status === 'approved') {
      await supabase.rpc('increment_points', {
        target_child_id: exchange.child_id,
        target_family_id: familyId,
        delta: -exchange.points,
      });

      // Create spend log
      await supabase.from('point_logs').insert({
        log_id: generateId(),
        child_id: exchange.child_id,
        family_id: familyId,
        task_id: null,
        type: 'spend',
        points: -exchange.points,
        reason: `兑换奖励: ${exchange.reward_name}`,
        emotion: null,
        operator: 'parent',
        created_at: now,
      });
    }

    return res.status(200).json(mapExchange(updated));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
