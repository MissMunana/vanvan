import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapMedicineCabinetItem, generateId } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('medicine_cabinet')
      .select('*')
      .eq('family_id', familyId)
      .order('expiry_date', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(mapMedicineCabinetItem));
  }

  if (req.method === 'POST') {
    const { name, genericName, quantity, quantityUnit, expiryDate, openedDate, openedShelfLifeDays, storageCondition, storageNote, purchaseDate, batchNumber, note } = req.body;
    if (!name || !expiryDate) return res.status(400).json({ error: 'name and expiryDate are required' });

    const row = {
      item_id: generateId(),
      family_id: familyId,
      name,
      generic_name: genericName || '',
      quantity: quantity ?? 0,
      quantity_unit: quantityUnit || '盒',
      expiry_date: expiryDate,
      opened_date: openedDate || null,
      opened_shelf_life_days: openedShelfLifeDays ?? null,
      storage_condition: storageCondition || 'room_temp',
      storage_note: storageNote || '',
      purchase_date: purchaseDate || null,
      batch_number: batchNumber || '',
      note: note || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('medicine_cabinet').insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapMedicineCabinetItem(data));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
