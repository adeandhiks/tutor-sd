-- =============================================
-- CERDASIK - Visitor Tracking Tables
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tabel visitors: menyimpan setiap pengunjung unik
CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk query online users (heartbeat terbaru)
CREATE INDEX IF NOT EXISTS idx_visitors_heartbeat 
  ON visitors (last_heartbeat DESC);

-- 3. Function: mendapatkan statistik pengunjung
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS JSON AS $$
DECLARE
  total_visitors INTEGER;
  online_now INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_visitors FROM visitors;
  
  SELECT COUNT(*) INTO online_now FROM visitors 
    WHERE last_heartbeat > NOW() - INTERVAL '2 minutes';

  RETURN json_build_object(
    'totalVisitors', total_visitors,
    'onlineNow', online_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: register visit (upsert visitor)
CREATE OR REPLACE FUNCTION register_visit(p_visitor_id TEXT, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO visitors (visitor_id, user_agent)
  VALUES (p_visitor_id, p_user_agent)
  ON CONFLICT (visitor_id) DO UPDATE SET
    visit_count = visitors.visit_count + 1,
    last_heartbeat = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: heartbeat (update last seen)
CREATE OR REPLACE FUNCTION heartbeat(p_visitor_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE visitors SET last_heartbeat = NOW()
  WHERE visitor_id = p_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable RLS (Row Level Security)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- 7. Policy: allow API to read/write via service role
-- (Kita pakai service_role key di server, jadi RLS di-bypass)
-- Tapi tambahkan policy anon read untuk safety
CREATE POLICY "Allow read stats" ON visitors
  FOR SELECT TO anon USING (true);
