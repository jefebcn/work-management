-- ============================================================
-- Galenic-OS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS raw_materials (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packaging (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formulas (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS raw_materials_user_idx ON raw_materials(user_id);
CREATE INDEX IF NOT EXISTS packaging_user_idx     ON packaging(user_id);
CREATE INDEX IF NOT EXISTS formulas_user_idx      ON formulas(user_id);

-- Index on formula name for search (GIN on JSONB field)
CREATE INDEX IF NOT EXISTS formulas_name_idx
  ON formulas USING GIN ((data -> 'name') jsonb_path_ops);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Each user can only read/write their own rows.

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging     ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas      ENABLE ROW LEVEL SECURITY;

-- raw_materials
CREATE POLICY "Users manage own raw_materials"
  ON raw_materials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- packaging
CREATE POLICY "Users manage own packaging"
  ON packaging FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- formulas
CREATE POLICY "Users manage own formulas"
  ON formulas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── HELPER: updated_at trigger ───────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER raw_materials_updated_at
  BEFORE UPDATE ON raw_materials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER packaging_updated_at
  BEFORE UPDATE ON packaging
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER formulas_updated_at
  BEFORE UPDATE ON formulas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
