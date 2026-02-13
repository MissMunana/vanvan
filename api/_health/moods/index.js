import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapMoodRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const childId = url.searchParams.get('childId') || req.query?.childId;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const { data, error } = await supabase
      .from('mood_records')
      .select('*')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .order('date', { ascending: false })
      .limit(90);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapMoodRecord));
  }

  if (req.method === 'POST') {
    const { childId, date, moodValue, moodEmoji, moodLabel, subEmotion, reason, journalEntry, ageGroup } = req.body;
    if (!childId || !date || !moodValue || !moodEmoji || !moodLabel || !ageGroup) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const row = {
      record_id: generateId(),
      child_id: childId, family_id: familyId,
      date, mood_value: moodValue, mood_emoji: moodEmoji, mood_label: moodLabel,
      sub_emotion: subEmotion || null, reason: reason || null,
      journal_entry: journalEntry || null, age_group: ageGroup,
      created_at: new Date().toISOString(),
    };
    // Upsert: one mood per day per child
    const { data, error } = await supabase
      .from('mood_records')
      .upsert(row, { onConflict: 'child_id,date' })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapMoodRecord(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
