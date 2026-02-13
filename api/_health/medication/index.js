import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized, validateChildOwnership } from '../../_lib/auth-helpers.js';
import { mapMedicationRecord, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { childId, drugName, genericName, dosageForm, singleDose, doseUnit, administrationTime, route, reason, note } = req.body;
  if (!childId || !drugName) return res.status(400).json({ error: 'childId and drugName are required' });

  if (!await validateChildOwnership(familyId, childId)) {
    return res.status(403).json({ error: 'Child does not belong to your family' });
  }

  const row = {
    record_id: generateId(),
    child_id: childId,
    family_id: familyId,
    drug_name: drugName,
    generic_name: genericName || '',
    dosage_form: dosageForm || 'suspension',
    single_dose: singleDose || 0,
    dose_unit: doseUnit || 'ml',
    administration_time: administrationTime || new Date().toISOString(),
    route: route || 'oral',
    reason: reason || '',
    note: note || '',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('medication_records').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(mapMedicationRecord(data));
}
