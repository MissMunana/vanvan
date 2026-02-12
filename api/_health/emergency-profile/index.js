import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapEmergencyProfile, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const {
    childId, bloodType, rhFactor, drugAllergies, foodAllergies, otherAllergies,
    medicalConditions, emergencyContacts, preferredHospital, hospitalAddress,
    hospitalPhone, insuranceInfo, note,
  } = req.body;
  if (!childId) return res.status(400).json({ error: 'childId is required' });

  const now = new Date().toISOString();
  const row = {
    profile_id: generateId(),
    child_id: childId,
    family_id: familyId,
    blood_type: bloodType || 'unknown',
    rh_factor: rhFactor || 'positive',
    drug_allergies: drugAllergies || [],
    food_allergies: foodAllergies || [],
    other_allergies: otherAllergies || [],
    medical_conditions: medicalConditions || [],
    emergency_contacts: emergencyContacts || [],
    preferred_hospital: preferredHospital || '',
    hospital_address: hospitalAddress || '',
    hospital_phone: hospitalPhone || '',
    insurance_info: insuranceInfo || '',
    note: note || '',
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await supabase
    .from('emergency_profiles')
    .upsert(row, { onConflict: 'child_id' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(mapEmergencyProfile(data));
}
