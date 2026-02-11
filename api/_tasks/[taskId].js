import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapTask } from '../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { taskId } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .single();

    if (error) return res.status(404).json({ error: 'Task not found' });
    return res.status(200).json(mapTask(data));
  }

  if (req.method === 'PUT') {
    const { name, category, points, icon, description, isActive, frequency } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (points !== undefined) updates.points = points;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;
    if (frequency !== undefined) updates.frequency = frequency;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('task_id', taskId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapTask(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('task_id', taskId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
