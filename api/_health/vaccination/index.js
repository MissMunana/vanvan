import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, validateChildOwnership } from '../../_lib/auth-helpers.js';
import { mapVaccinationRecord, generateId, getToday } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, vaccineName, vaccineType, doseNumber, totalDoses, date, batchNumber, site, vaccinator, reactions, note } = req.body;
  if (!childId || !vaccineName) return res.status(400).json({ error: 'childId and vaccineName are required' });

  if (!await validateChildOwnership(familyId, childId)) {
    return res.status(403).json({ error: 'Child does not belong to your family' });
  }

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    vaccine_name: vaccineName,
    vaccine_type: vaccineType || 'planned',
    dose_number: doseNumber || 1,
    total_doses: totalDoses || 1,
    date: date || getToday(),
    batch_number: batchNumber || '',
    site: site || '',
    vaccinator: vaccinator || '',
    reactions: reactions || [],
    note: note || '',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('vaccination_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapVaccinationRecord(data));
}
