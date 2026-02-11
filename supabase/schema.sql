-- ============================================================
-- 小星星成长宝 - Supabase Database Schema
-- ============================================================

-- 1. FAMILIES (top-level ownership, linked to auth.users)
CREATE TABLE families (
  family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_pin TEXT NOT NULL DEFAULT '1234',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  completion_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. PASSKEY CREDENTIALS (WebAuthn)
CREATE TABLE passkey_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT[],
  friendly_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX idx_passkey_user ON passkey_credentials(user_id);

-- 3. WEBAUTHN CHALLENGES (temporary, 5min TTL)
CREATE TABLE webauthn_challenges (
  challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_challenge_user ON webauthn_challenges(user_id);
CREATE INDEX idx_challenge_expires ON webauthn_challenges(expires_at);

-- 4. CHILDREN
CREATE TABLE children (
  child_id TEXT PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birthday TEXT NOT NULL,
  age INTEGER NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('3-5', '6-8', '9-12')),
  avatar TEXT NOT NULL DEFAULT '🐱',
  total_points INTEGER NOT NULL DEFAULT 0,
  theme_color TEXT,
  settings JSONB NOT NULL DEFAULT '{"soundEnabled":true,"vibrationEnabled":true,"screenTime":{"dailyLimitMinutes":30,"lockStartHour":22,"lockEndHour":6,"enabled":false}}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_children_family ON children(family_id);

-- 5. TASKS
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('life', 'study', 'manner', 'chore')),
  points INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '⭐',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'anytime')),
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  completed_today BOOLEAN NOT NULL DEFAULT false,
  stage TEXT NOT NULL DEFAULT 'start' CHECK (stage IN ('start', 'persist', 'stable', 'graduated')),
  total_completions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_child ON tasks(child_id);
CREATE INDEX idx_tasks_family ON tasks(family_id);

-- 6. POINT_LOGS
CREATE TABLE point_logs (
  log_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  task_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjust')),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  emotion TEXT,
  operator TEXT NOT NULL DEFAULT 'child' CHECK (operator IN ('child', 'parent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_point_logs_child ON point_logs(child_id);
CREATE INDEX idx_point_logs_family ON point_logs(family_id);

-- 7. REWARDS
CREATE TABLE rewards (
  reward_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('time', 'privilege', 'material')),
  points INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '🎁',
  description TEXT NOT NULL DEFAULT '',
  "limit" JSONB NOT NULL DEFAULT '{"type":"unlimited","count":0}',
  stock INTEGER NOT NULL DEFAULT -1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rewards_child ON rewards(child_id);
CREATE INDEX idx_rewards_family ON rewards(family_id);

-- 8. EXCHANGES
CREATE TABLE exchanges (
  exchange_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_icon TEXT NOT NULL,
  points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT
);
CREATE INDEX idx_exchanges_child ON exchanges(child_id);
CREATE INDEX idx_exchanges_family ON exchanges(family_id);

-- 9. UNLOCKED_BADGES
CREATE TABLE unlocked_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, badge_id)
);
CREATE INDEX idx_badges_child ON unlocked_badges(child_id);
CREATE INDEX idx_badges_family ON unlocked_badges(family_id);

-- 10. HEALTH RECORDS
CREATE TABLE growth_records (
  record_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  age_in_months INTEGER NOT NULL,
  height NUMERIC,
  weight NUMERIC,
  head_circumference NUMERIC,
  bmi NUMERIC,
  height_percentile NUMERIC,
  weight_percentile NUMERIC,
  bmi_percentile NUMERIC,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_growth_child ON growth_records(child_id);

CREATE TABLE temperature_records (
  record_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  temperature NUMERIC NOT NULL,
  measure_method TEXT NOT NULL CHECK (measure_method IN ('ear', 'forehead', 'armpit', 'rectal', 'oral')),
  measure_time TIMESTAMPTZ NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_temperature_child ON temperature_records(child_id);

CREATE TABLE medication_records (
  record_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL,
  generic_name TEXT NOT NULL DEFAULT '',
  dosage_form TEXT NOT NULL CHECK (dosage_form IN ('suspension_drops', 'suspension', 'granules', 'tablets', 'suppository')),
  single_dose NUMERIC NOT NULL,
  dose_unit TEXT NOT NULL DEFAULT 'ml',
  administration_time TIMESTAMPTZ NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('oral', 'topical', 'rectal')),
  reason TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_medication_child ON medication_records(child_id);

CREATE TABLE vaccination_records (
  record_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT NOT NULL CHECK (vaccine_type IN ('planned', 'optional')),
  dose_number INTEGER NOT NULL,
  total_doses INTEGER NOT NULL,
  date TEXT NOT NULL,
  batch_number TEXT NOT NULL DEFAULT '',
  site TEXT NOT NULL DEFAULT '',
  vaccinator TEXT NOT NULL DEFAULT '',
  reactions JSONB NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vaccination_child ON vaccination_records(child_id);

CREATE TABLE milestone_records (
  record_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved')),
  achieved_date TEXT,
  note TEXT NOT NULL DEFAULT '',
  photo_taken BOOLEAN DEFAULT false,
  photo_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, milestone_id)
);
CREATE INDEX idx_milestone_child ON milestone_records(child_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_records ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's family_id
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM families WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Families
CREATE POLICY families_select ON families FOR SELECT USING (user_id = auth.uid());
CREATE POLICY families_insert ON families FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY families_update ON families FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY families_delete ON families FOR DELETE USING (user_id = auth.uid());

-- Passkey credentials
CREATE POLICY passkey_select ON passkey_credentials FOR SELECT USING (user_id = auth.uid());
CREATE POLICY passkey_insert ON passkey_credentials FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY passkey_update ON passkey_credentials FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY passkey_delete ON passkey_credentials FOR DELETE USING (user_id = auth.uid());

-- Challenges
CREATE POLICY challenge_select ON webauthn_challenges FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY challenge_insert ON webauthn_challenges FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Family-scoped data tables
CREATE POLICY children_all ON children FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY tasks_all ON tasks FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY point_logs_all ON point_logs FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY rewards_all ON rewards FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY exchanges_all ON exchanges FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY badges_all ON unlocked_badges FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY growth_all ON growth_records FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY temperature_all ON temperature_records FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY medication_all ON medication_records FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY vaccination_all ON vaccination_records FOR ALL USING (family_id = get_my_family_id());
CREATE POLICY milestone_all ON milestone_records FOR ALL USING (family_id = get_my_family_id());

-- ============================================================
-- AUTO-CREATE FAMILY ON SIGNUP (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO families (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
