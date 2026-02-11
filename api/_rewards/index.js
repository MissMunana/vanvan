import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapReward, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId query param required' });

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapReward));
  }

  if (req.method === 'POST') {
    const { childId, name, category, points, icon, description, limit, stock, isActive } = req.body;
    if (!childId || !name) return res.status(400).json({ error: 'childId and name are required' });

    const row = {
      reward_id: generateId(),
      child_id: childId,
      family_id: familyId,
      name,
      category: category || 'time',
      points: points || 10,
      icon: icon || '🎁',
      description: description || '',
      limit: limit || { type: 'unlimited', count: 0 },
      stock: stock ?? -1,
      is_active: isActive !== false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('rewards').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapReward(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
