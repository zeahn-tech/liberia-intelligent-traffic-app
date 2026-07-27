-- =====================================================
-- TrafficWatch AI - v14 Migration STEP 1
-- Create search_history table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query             TEXT NOT NULL,
  result_type       TEXT CHECK (result_type IN ('incident', 'evidence', 'anpr', 'citizen_report', 'person', 'vehicle')),
  result_id         TEXT,
  result_title      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search history"
  ON public.search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
