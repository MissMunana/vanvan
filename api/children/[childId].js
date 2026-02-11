import supabase from '../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../_lib/auth-helpers.js';
import { mapChild } from '../_lib/mappers.js';

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

  const { childId } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .single();

    if (error) return res.status(404).json({ error: 'Child not found' });
    return res.status(200).json(mapChild(data));
  }

  if (req.method === 'PUT') {
    const { name, gender, birthday, avatar, themeColor, settings } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (gender !== undefined) updates.gender = gender;
    if (birthday !== undefined) {
      updates.birthday = birthday;
      const age = getAgeFromBirthday(birthday);
      updates.age = age;
      updates.age_group = getAgeGroup(age);
    }
    if (avatar !== undefined) updates.avatar = avatar;
    if (themeColor !== undefined) updates.theme_color = themeColor;
    if (settings !== undefined) updates.settings = settings;

    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('child_id', childId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapChild(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('child_id', childId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
