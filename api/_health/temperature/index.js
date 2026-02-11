import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapTemperatureRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, temperature, measureMethod, measureTime, symptoms, note } = req.body;
  if (!childId || !temperature) return res.status(400).json({ error: 'childId and temperature are required' });

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    temperature,
    measure_method: measureMethod || 'ear',
    measure_time: measureTime || new Date().toISOString(),
    symptoms: symptoms || [],
    note: note || '',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('temperature_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapTemperatureRecord(data));
}
