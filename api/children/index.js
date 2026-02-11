import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapChild, generateId } from '../_lib/mappers.js';

const THEME_COLORS = ['#FFB800', '#4ECDC4', '#FF6B6B', '#A8A8E6', '#95E1D3'];

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  screenTime: {
    dailyLimitMinutes: 30,
    lockStartHour: 22,
    lockEndHour: 6,
    enabled: false,
  },
};

function getAgeGroup(age) {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

function getAgeFromBirthday(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapChild));
  }

  if (req.method === 'POST') {
    const { name, gender, birthday, avatar } = req.body;
    if (!name || !birthday) {
      return res.status(400).json({ error: 'name and birthday are required' });
    }

    // Get existing child count for theme color assignment
    const { count } = await supabase
      .from('children')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId);

    const age = getAgeFromBirthday(birthday);
    const childId = generateId();

    const row = {
      child_id: childId,
      family_id: familyId,
      name,
      gender: gender || 'male',
      birthday,
      age,
      age_group: getAgeGroup(age),
      avatar: avatar || '🐱',
      total_points: 0,
      theme_color: THEME_COLORS[(count || 0) % THEME_COLORS.length],
      settings: DEFAULT_SETTINGS,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('children')
      .insert(row)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapChild(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
