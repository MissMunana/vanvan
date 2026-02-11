import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapGrowthRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, date, ageInMonths, height, weight, headCircumference, bmi, heightPercentile, weightPercentile, bmiPercentile, note } = req.body;
  if (!childId || !date) return res.status(400).json({ error: 'childId and date are required' });

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    date,
    age_in_months: ageInMonths || 0,
    height: height ?? null,
    weight: weight ?? null,
    head_circumference: headCircumference ?? null,
    bmi: bmi ?? null,
    height_percentile: heightPercentile ?? null,
    weight_percentile: weightPercentile ?? null,
    bmi_percentile: bmiPercentile ?? null,
    note: note || '',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('growth_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapGrowthRecord(data));
}
