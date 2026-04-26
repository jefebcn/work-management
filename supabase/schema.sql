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

-- ── macrothemes (added v2) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS macrothemes (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── profiles (added v2) ───────────────────────────────────────
-- Populated automatically on auth.users insert via trigger.

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS raw_materials_user_idx ON raw_materials(user_id);
CREATE INDEX IF NOT EXISTS packaging_user_idx     ON packaging(user_id);
CREATE INDEX IF NOT EXISTS formulas_user_idx      ON formulas(user_id);
CREATE INDEX IF NOT EXISTS macrothemes_user_idx   ON macrothemes(user_id);

-- Index on formula name for search (GIN on JSONB field)
CREATE INDEX IF NOT EXISTS formulas_name_idx
  ON formulas USING GIN ((data -> 'name') jsonb_path_ops);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Each user can only read/write their own rows.

ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging     ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE macrothemes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;

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

-- macrothemes
CREATE POLICY "Users manage own macrothemes"
  ON macrothemes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

CREATE TRIGGER macrothemes_updated_at
  BEFORE UPDATE ON macrothemes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── briefing_requests (added v3) ─────────────────────────────────
-- Token-based shareable links: lab creates → commercial fills → project auto-created

CREATE TABLE IF NOT EXISTS briefing_requests (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed'
  preset      JSONB       NOT NULL DEFAULT '{}',
  form_data   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS briefing_requests_user_idx   ON briefing_requests(user_id);
CREATE INDEX IF NOT EXISTS briefing_requests_status_idx ON briefing_requests(status);

CREATE TRIGGER briefing_requests_updated_at
  BEFORE UPDATE ON briefing_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE briefing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_briefing_requests"
  ON briefing_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anon_read_pending_briefing"
  ON briefing_requests FOR SELECT
  TO anon
  USING (status = 'pending');

CREATE POLICY "anon_submit_briefing"
  ON briefing_requests FOR UPDATE
  TO anon
  USING (status = 'pending')
  WITH CHECK (status = 'completed');

-- ── RPC: submit_briefing (bypasses RLS via SECURITY DEFINER) ──────
-- Used by the public form. Updates a pending briefing to 'completed'.
-- Returns true if a row was updated, false otherwise.

CREATE OR REPLACE FUNCTION submit_briefing(brief_id text, form jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE briefing_requests
  SET status     = 'completed',
      form_data  = form,
      updated_at = NOW()
  WHERE id = brief_id AND status = 'pending';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_briefing(text, jsonb) TO anon;
