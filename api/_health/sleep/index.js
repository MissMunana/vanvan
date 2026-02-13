import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, validateChildOwnership } from '../../_lib/auth-helpers.js';
import { mapSleepRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, date, bedTime, sleepTime, wakeTime, getUpTime, durationMinutes, naps, totalNapMinutes, sleepQuality, note } = req.body;
  if (!childId || !date) return res.status(400).json({ error: 'childId and date are required' });

  if (!await validateChildOwnership(familyId, childId)) {
    return res.status(403).json({ error: 'Child does not belong to your family' });
  }

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    date,
    bed_time: bedTime || null,
    sleep_time: sleepTime || null,
    wake_time: wakeTime || null,
    get_up_time: getUpTime || null,
    duration_minutes: durationMinutes || null,
    naps: naps || [],
    total_nap_minutes: totalNapMinutes || 0,
    sleep_quality: sleepQuality || 'good',
    note: note || '',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('sleep_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapSleepRecord(data));
}
