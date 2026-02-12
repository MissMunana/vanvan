import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapSleepRecord } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { recordId } = req.query;

  if (req.method === 'PUT') {
    const { bedTime, sleepTime, wakeTime, getUpTime, durationMinutes, naps, totalNapMinutes, sleepQuality, note } = req.body;
    const updates = {};
    if (bedTime !== undefined) updates.bed_time = bedTime;
    if (sleepTime !== undefined) updates.sleep_time = sleepTime;
    if (wakeTime !== undefined) updates.wake_time = wakeTime;
    if (getUpTime !== undefined) updates.get_up_time = getUpTime;
    if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;
    if (naps !== undefined) updates.naps = naps;
    if (totalNapMinutes !== undefined) updates.total_nap_minutes = totalNapMinutes;
    if (sleepQuality !== undefined) updates.sleep_quality = sleepQuality;
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from('sleep_records')
      .update(updates)
      .eq('record_id', recordId)
      .eq('family_id', familyId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapSleepRecord(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('sleep_records')
      .delete()
      .eq('record_id', recordId)
      .eq('family_id', familyId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
