-- V3.0 Migration: Medication Module Extension
-- 1. Extend dosage_form CHECK constraint on medication_records
-- 2. Create medicine_cabinet table

-- 1. Update dosage_form constraint
ALTER TABLE medication_records
  DROP CONSTRAINT IF EXISTS medication_records_dosage_form_check;
ALTER TABLE medication_records
  ADD CONSTRAINT medication_records_dosage_form_check
  CHECK (dosage_form IN (
    'suspension_drops', 'suspension', 'granules', 'tablets',
    'suppository', 'capsules', 'chewable_tablets', 'syrup', 'powder'
  ));

-- 2. Create medicine_cabinet table (family-scoped)
CREATE TABLE IF NOT EXISTS medicine_cabinet (
  item_id TEXT PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  quantity_unit TEXT NOT NULL DEFAULT '盒',
  expiry_date TEXT NOT NULL,
  opened_date TEXT,
  opened_shelf_life_days INTEGER,
  storage_condition TEXT NOT NULL DEFAULT 'room_temp'
    CHECK (storage_condition IN ('room_temp', 'refrigerate', 'cool_dark', 'other')),
  storage_note TEXT NOT NULL DEFAULT '',
  purchase_date TEXT,
  batch_number TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cabinet_family ON medicine_cabinet(family_id);

-- 3. RLS
ALTER TABLE medicine_cabinet ENABLE ROW LEVEL SECURITY;
CREATE POLICY cabinet_all ON medicine_cabinet FOR ALL
  USING (family_id = get_my_family_id());
