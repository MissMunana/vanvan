-- ============================================================
-- V3.0 家庭协作优化 - Database Migration
-- ============================================================
-- 1. family_members 表 (多看护人关联)
-- 2. family_invites 表 (邀请码)
-- 3. handover_logs 表 (交接日志)
-- 4. tasks 表扩展 (家庭任务)
-- 5. point_logs 表扩展 (操作人追踪)
-- 6. RLS 策略更新
-- ============================================================

-- ============================================================
-- 1. family_members: 多看护人关联表
-- ============================================================
CREATE TABLE family_members (
  member_id TEXT PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co_admin'
    CHECK (role IN ('admin', 'co_admin', 'observer')),
  display_name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '👤',
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX idx_fm_family ON family_members(family_id);
CREATE INDEX idx_fm_user ON family_members(user_id);

-- ============================================================
-- 2. family_invites: 邀请码表
-- ============================================================
CREATE TABLE family_invites (
  invite_id TEXT PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'co_admin'
    CHECK (role IN ('co_admin', 'observer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. handover_logs: 交接日志表
-- ============================================================
CREATE TABLE handover_logs (
  log_id TEXT PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  date TEXT NOT NULL,
  tasks_summary TEXT NOT NULL DEFAULT '',
  meals_summary TEXT NOT NULL DEFAULT '',
  sleep_summary TEXT NOT NULL DEFAULT '',
  health_summary TEXT NOT NULL DEFAULT '',
  special_notes TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_handover_family ON handover_logs(family_id);
CREATE INDEX idx_handover_child_date ON handover_logs(child_id, date);

-- ============================================================
-- 4. tasks 表扩展：家庭任务字段
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_family_task BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_parent_confirm BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_confirmed_by UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_confirmed_at TIMESTAMPTZ;

-- ============================================================
-- 5. point_logs 表扩展：操作人追踪
-- ============================================================
ALTER TABLE point_logs ADD COLUMN IF NOT EXISTS operator_user_id UUID;
ALTER TABLE point_logs ADD COLUMN IF NOT EXISTS operator_name TEXT NOT NULL DEFAULT '';

-- ============================================================
-- 6. 数据迁移：为所有现有用户创建 family_members 记录
-- ============================================================
INSERT INTO family_members (member_id, family_id, user_id, role, display_name)
SELECT
  encode(gen_random_bytes(8), 'hex'),
  f.family_id,
  f.user_id,
  'admin',
  COALESCE(u.raw_user_meta_data->>'name', u.email, 'Admin')
FROM families f
JOIN auth.users u ON u.id = f.user_id;

-- ============================================================
-- 7. 更新核心 RLS 函数：查询 family_members 而非 families
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 8. 更新 handle_new_user 触发器：同时插入 family_members
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
BEGIN
  INSERT INTO public.families (user_id) VALUES (NEW.id)
  RETURNING family_id INTO new_family_id;

  INSERT INTO public.family_members (member_id, family_id, user_id, role, display_name)
  VALUES (
    encode(gen_random_bytes(8), 'hex'),
    new_family_id,
    NEW.id,
    'admin',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 9. RLS 策略
-- ============================================================

-- family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY fm_select ON family_members FOR SELECT
  USING (family_id = get_my_family_id());
CREATE POLICY fm_insert ON family_members FOR INSERT
  WITH CHECK (family_id = get_my_family_id());
CREATE POLICY fm_update ON family_members FOR UPDATE
  USING (family_id = get_my_family_id());
CREATE POLICY fm_delete ON family_members FOR DELETE
  USING (family_id = get_my_family_id());

-- family_invites
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invite_select ON family_invites FOR SELECT
  USING (family_id = get_my_family_id());
CREATE POLICY invite_insert ON family_invites FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

-- handover_logs
ALTER TABLE handover_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY handover_all ON handover_logs FOR ALL
  USING (family_id = get_my_family_id());

-- families 表更新：成员也可查看所属 family
DROP POLICY IF EXISTS families_select ON families;
CREATE POLICY families_select ON families FOR SELECT
  USING (user_id = auth.uid() OR family_id = get_my_family_id());
