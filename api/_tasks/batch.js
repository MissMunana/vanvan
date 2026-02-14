import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, validateChildrenOwnership, unauthorized } from '../_lib/auth-helpers.js';
import { mapTask, generateId } from '../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { tasks } = req.body;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'tasks array is required' });
  }

  // Validate all childIds belong to this family
  const childIds = [...new Set(tasks.map(t => t.childId))];
  const { valid, invalidIds } = await validateChildrenOwnership(familyId, childIds);
  if (!valid) {
    return res.status(403).json({ 
      error: 'Some children do not belong to this family',
      invalidIds 
    });
  }

  const now = new Date().toISOString();
  const rows = tasks.map((t) => ({
    task_id: generateId(),
    child_id: t.childId,
    family_id: familyId,
    name: t.name,
    category: t.category || 'life',
    points: t.points || 5,
    icon: t.icon || '⭐',
    description: t.description || '',
    is_active: t.isActive !== false,
    frequency: t.frequency || 'daily',
    consecutive_days: 0,
    last_completed_date: null,
    completed_today: false,
    stage: 'start',
    total_completions: 0,
    created_at: now,
  }));

  const { data, error } = await supabase.from('tasks').insert(rows).select();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json((data || []).map(mapTask));
}
