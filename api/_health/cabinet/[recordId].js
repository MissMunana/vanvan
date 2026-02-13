import supabase from '../../_lib/supabase-admin.js';
import { getAuthenticatedUser, getFamilyId, unauthorized } from '../../_lib/auth-helpers.js';
import { mapMedicineCabinetItem } from '../../_lib/mappers.js';

export default async function handler(req, res) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return unauthorized(res, authError);

  const { familyId, error: familyError } = await getFamilyId(user.id);
  if (familyError) return res.status(404).json({ error: familyError });

  const { recordId } = req.query;

  if (req.method === 'PUT') {
    const { name, genericName, quantity, quantityUnit, expiryDate, openedDate, openedShelfLifeDays, storageCondition, storageNote, purchaseDate, batchNumber, note } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (genericName !== undefined) updates.generic_name = genericName;
    if (quantity !== undefined) updates.quantity = quantity;
    if (quantityUnit !== undefined) updates.quantity_unit = quantityUnit;
    if (expiryDate !== undefined) updates.expiry_date = expiryDate;
    if (openedDate !== undefined) updates.opened_date = openedDate;
    if (openedShelfLifeDays !== undefined) updates.opened_shelf_life_days = openedShelfLifeDays;
    if (storageCondition !== undefined) updates.storage_condition = storageCondition;
    if (storageNote !== undefined) updates.storage_note = storageNote;
    if (purchaseDate !== undefined) updates.purchase_date = purchaseDate;
    if (batchNumber !== undefined) updates.batch_number = batchNumber;
    if (note !== undefined) updates.note = note;

    const { data, error } = await supabase
      .from('medicine_cabinet')
      .update(updates)
      .eq('item_id', recordId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapMedicineCabinetItem(data));
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('medicine_cabinet')
      .delete()
      .eq('item_id', recordId)
      .eq('family_id', familyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
