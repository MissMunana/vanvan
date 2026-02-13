import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyMember, unauthorized } from '../../_lib/auth-helpers.js';
import { mapHandoverLog, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { member, error: memberError } = await getFamilyMember(user.id);
  if (memberError) return res.status(404).json({ error: memberError });

  const { familyId } = member;

  // GET /family/handovers?childId=xxx&startDate=xxx
  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const childId = url.searchParams.get('childId');
    const startDate = url.searchParams.get('startDate');

    let query = supabase
      .from('handover_logs')
      .select('*')
      .eq('family_id', familyId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (childId) query = query.eq('child_id', childId);
    if (startDate) query = query.gte('date', startDate);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapHandoverLog));
  }

  // POST /family/handovers — create handover log
  if (req.method === 'POST') {
    // All roles can create handover logs
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { childId, date, tasksSummary, mealsSummary, sleepSummary, healthSummary, specialNotes, priority } = body;

    if (!childId || !date) {
      return res.status(400).json({ error: 'childId and date are required' });
    }

    const row = {
      log_id: generateId(),
      family_id: familyId,
      child_id: childId,
      author_user_id: user.id,
      author_name: member.displayName || user.email || 'Unknown',
      date,
      tasks_summary: tasksSummary || '',
      meals_summary: mealsSummary || '',
      sleep_summary: sleepSummary || '',
      health_summary: healthSummary || '',
      special_notes: specialNotes || '',
      priority: priority || 'normal',
    };

    const { data, error } = await supabase
      .from('handover_logs')
      .insert(row)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapHandoverLog(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
