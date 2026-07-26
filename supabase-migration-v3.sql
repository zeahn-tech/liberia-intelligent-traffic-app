-- =====================================================
-- TrafficWatch AI - v3 Database Migration
-- Digital Evidence Management
-- Immutable original references, chain of custody, SHA-256
-- =====================================================

-- 1. Add new columns to evidence table
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS officer_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS capture_lat DOUBLE PRECISION;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS capture_lng DOUBLE PRECISION;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS sha256_hash TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS officer_notes TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'original' CHECK (evidence_status IN ('original', 'processed', 'reviewed', 'archived', 'expunged'));
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_url TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS original_file_hash TEXT;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_evidence_officer ON public.evidence(officer_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence(evidence_status);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON public.evidence(sha256_hash);

-- =====================================================
-- EVIDENCE CHAIN OF CUSTODY
-- Every transfer, access, or modification is logged
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evidence_custody (
  id              BIGSERIAL PRIMARY KEY,
  evidence_id     UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN (
    'uploaded', 'viewed', 'downloaded', 'analyzed', 'transferred',
    'reviewed', 'verified', 'exported', 'archived', 'restored',
    'expunged', 'hash_verified', 'officer_notes_added'
  )),
  performed_by    UUID NOT NULL REFERENCES public.profiles(id),
  from_officer    UUID REFERENCES public.profiles(id),
  to_officer      UUID REFERENCES public.profiles(id),
  ip_address      TEXT,
  user_agent      TEXT,
  details         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custody_evidence ON public.evidence_custody(evidence_id);
CREATE INDEX IF NOT EXISTS idx_custody_created ON public.evidence_custody(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custody_officer ON public.evidence_custody(performed_by);

ALTER TABLE public.evidence_custody ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read custody for accessible evidence"
  ON public.evidence_custody FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.evidence WHERE id = evidence_custody.evidence_id)
  );

CREATE POLICY "Authenticated users can insert custody events"
  ON public.evidence_custody FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- EVIDENCE VERSIONS (immutable originals + derived copies)
-- Original evidence is NEVER overwritten.
-- Processed/derived versions reference the original.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evidence_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id     UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL DEFAULT 1,
  file_url        TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  sha256_hash     TEXT NOT NULL,
  processing_type TEXT CHECK (processing_type IN (
    'original', 'resized', 'cropped', 'compressed', 'converted',
    'watermarked', 'redacted', 'ai_enhanced', 'export'
  )),
  processing_params JSONB DEFAULT '{}'::jsonb,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evidence_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_evidence ON public.evidence_versions(evidence_id);
CREATE INDEX IF NOT EXISTS idx_versions_hash ON public.evidence_versions(sha256_hash);

ALTER TABLE public.evidence_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read versions for accessible evidence"
  ON public.evidence_versions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.evidence WHERE id = evidence_versions.evidence_id)
  );

CREATE POLICY "Authenticated users can insert evidence versions"
  ON public.evidence_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGER for evidence updated_at
-- =====================================================
CREATE TRIGGER update_evidence_updated_at
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
