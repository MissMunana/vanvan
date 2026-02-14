import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, validateChildrenOwnership, unauthorized } from '../_lib/auth-helpers.js';
import { mapReward, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { rewards } = req.body;
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return res.status(400).json({ error: 'rewards array is required' });
  }

  // Validate all childIds belong to this family
  const childIds = [...new Set(rewards.map(r => r.childId))];
  const { valid, invalidIds } = await validateChildrenOwnership(familyId, childIds);
  if (!valid) {
    return res.status(403).json({ 
      error: 'Some children do not belong to this family',
      invalidIds 
    });
  }

  const now = new Date().toISOString();
  const rows = rewards.map((r) => ({
    reward_id: generateId(),
    child_id: r.childId,
    family_id: familyId,
    name: r.name,
    category: r.category || 'time',
    points: r.points || 10,
    icon: r.icon || '🎁',
    description: r.description || '',
    limit: r.limit || { type: 'unlimited', count: 0 },
    stock: r.stock ?? -1,
    is_active: r.isActive !== false,
    created_at: now,
  }));

  const { data, error } = await supabase.from('rewards').insert(rows).select();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json((data || []).map(mapReward));
}
