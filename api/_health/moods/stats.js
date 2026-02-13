import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const childId = url.searchParams.get('childId') || req.query?.childId;
  if (!childId) return res.status(400).json({ error: 'childId required' });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoff = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(ninetyDaysAgo);

  const { data, error } = await supabase
    .from('mood_records')
    .select('date, mood_value')
    .eq('family_id', familyId)
    .eq('child_id', childId)
    .gte('date', cutoff)
    .order('date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const distribution = { joy: 0, sadness: 0, anger: 0, fear: 0, calm: 0 };
  (data || []).forEach((r) => {
    if (distribution[r.mood_value] !== undefined) distribution[r.mood_value]++;
  });

  return res.status(200).json({
    distribution,
    records: (data || []).map((r) => ({ date: r.date, moodValue: r.mood_value })),
    totalDays: (data || []).length,
  });
}
