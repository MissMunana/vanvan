import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapGrowthRecord } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { recordId } = req.query;

  if (req.method === 'PUT') {
    const { date, ageInMonths, height, weight, headCircumference, bmi, heightPercentile, weightPercentile, bmiPercentile, note } = req.body;
    const updates = {};
    if (date !== undefined) updates.date = date;
    if (ageInMonths !== undefined) updates.age_in_months = ageInMonths;
    if (height !== undefined) updates.height = height;
    if (weight !== undefined) updates.weight = weight;
    if (headCircumference !== undefined) updates.head_circumference = headCircumference;
    if (bmi !== undefined) updates.bmi = bmi;
    if (heightPercentile !== undefined) updates.height_percentile = heightPercentile;
    if (weightPercentile !== undefined) updates.weight_percentile = weightPercentile;
    if (bmiPercentile !== undefined) updates.bmi_percentile = bmiPercentile;
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from('growth_records')
      .update(updates)
      .eq('record_id', recordId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapGrowthRecord(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('growth_records')
      .delete()
      .eq('record_id', recordId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
