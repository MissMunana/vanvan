import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapTask, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId query param required' });

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json((data || []).map(mapTask));
  }

  if (req.method === 'POST') {
    const { childId, name, category, points, icon, description, isActive, frequency } = req.body;
    if (!childId || !name) return res.status(400).json({ error: 'childId and name are required' });

    const row = {
      task_id: generateId(),
      child_id: childId,
      family_id: familyId,
      name,
      category: category || 'life',
      points: points || 5,
      icon: icon || '⭐',
      description: description || '',
      is_active: isActive !== false,
      frequency: frequency || 'daily',
      consecutive_days: 0,
      last_completed_date: null,
      completed_today: false,
      stage: 'start',
      total_completions: 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('tasks').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapTask(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
