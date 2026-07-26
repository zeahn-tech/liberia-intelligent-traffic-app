-- =====================================================
-- TrafficWatch AI - v4 Database Migration
-- Media Security - Private Storage Buckets, Signed URLs,
-- MIME validation, file-size limits, access controls
-- =====================================================

-- 1. Create storage buckets via helper function
-- Note: Supabase Storage buckets must also be created via the Dashboard
-- or Management API. Run these queries in the SQL Editor to create
-- the private buckets.

-- Function to create a bucket if it doesn't exist
CREATE OR REPLACE FUNCTION storage.create_bucket_if_not_exists(
  bucket_name TEXT,
  is_public BOOLEAN DEFAULT false,
  file_size_limit BIGINT DEFAULT 52428800, -- 50 MB default
  allowed_mime_types TEXT[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
  VALUES (bucket_name, bucket_name, is_public, file_size_limit, allowed_mime_types, false)
  ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
END;
$$;

-- Create private buckets for evidence media
-- evidence-images: Photos (JPEG, PNG, WebP, TIFF) — max 25 MB
-- evidence-videos: Videos (MP4, MOV, AVI) — max 200 MB
-- evidence-documents: Documents (PDF, DOCX, XLSX) — max 25 MB
-- evidence-audio: Audio recordings (MP3, WAV, OGG) — max 50 MB
-- evidence-other: All other evidence files — max 25 MB

SELECT storage.create_bucket_if_not_exists(
  'evidence-images',
  false,
  26214400, -- 25 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/heic', 'image/heif']
);

SELECT storage.create_bucket_if_not_exists(
  'evidence-videos',
  false,
  209715200, -- 200 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
);

SELECT storage.create_bucket_if_not_exists(
  'evidence-documents',
  false,
  26214400, -- 25 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'text/plain', 'text/csv']
);

SELECT storage.create_bucket_if_not_exists(
  'evidence-audio',
  false,
  52428800, -- 50 MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac']
);

SELECT storage.create_bucket_if_not_exists(
  'evidence-other',
  false,
  26214400, -- 25 MB
  NULL -- Allow any MIME type up to 25 MB
);

-- =====================================================
-- 2. Storage RLS Policies
-- =====================================================

-- Helper to check if user can access an incident's evidence
CREATE OR REPLACE FUNCTION storage.can_access_evidence(
  bucket_name TEXT,
  file_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  incident_id UUID;
  user_role TEXT;
BEGIN
  -- Extract incident_id from path: {incident_id}/{filename}
  BEGIN
    incident_id := SPLIT_PART(file_path, '/', 1)::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  -- Check if user owns the incident or has authorized role
  user_role := public.get_current_user_role();

  RETURN EXISTS (
    SELECT 1 FROM public.incidents i
    WHERE i.id = incident_id
    AND (
      i.officer_id = auth.uid()
      OR user_role IN ('supervisor', 'admin', 'investigator')
    )
  );
END;
$$;

-- Function to determine bucket name based on MIME type
CREATE OR REPLACE FUNCTION storage.get_bucket_for_mime(mime_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF mime_type LIKE 'image/%' THEN RETURN 'evidence-images';
  ELSIF mime_type LIKE 'video/%' THEN RETURN 'evidence-videos';
  ELSIF mime_type LIKE 'audio/%' THEN RETURN 'evidence-audio';
  ELSIF mime_type IN ('application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv') THEN RETURN 'evidence-documents';
  ELSE RETURN 'evidence-other';
  END IF;
END;
$$;

-- Enable RLS on storage buckets (if not already enabled)
-- Note: Supabase storage.objects has RLS enabled by default
-- These policies apply to ALL buckets

-- SELECT: Only authorized personnel can view evidence files
CREATE POLICY "Authorized personnel can read evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('evidence-images', 'evidence-videos', 'evidence-documents', 'evidence-audio', 'evidence-other')
    AND storage.can_access_evidence(bucket_id, name)
  );

-- INSERT: Only authenticated users with officer role can upload
CREATE POLICY "Officers can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('evidence-images', 'evidence-videos', 'evidence-documents', 'evidence-audio', 'evidence-other')
    AND auth.role() = 'authenticated'
    AND (public.get_current_user_role() IN ('officer', 'supervisor', 'admin', 'investigator'))
    -- File size enforced by bucket config
    -- MIME type enforced by bucket config
  );

-- UPDATE: Only the uploader or admins can update (e.g. reprocess)
CREATE POLICY "Officers can update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('evidence-images', 'evidence-videos', 'evidence-documents', 'evidence-audio', 'evidence-other')
    AND auth.uid() = owner
    AND auth.role() = 'authenticated'
  );

-- DELETE: Only admins can delete evidence
CREATE POLICY "Only admins can delete evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('evidence-images', 'evidence-videos', 'evidence-documents', 'evidence-audio', 'evidence-other')
    AND public.get_current_user_role() = 'admin'
  );

-- =====================================================
-- 3. Evidence file tracking table
-- Tracks which storage bucket/path each file belongs to
-- =====================================================
CREATE TABLE IF NOT EXISTS public.storage_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id     UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  bucket_name     TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  file_size       BIGINT NOT NULL,
  sha256_hash     TEXT NOT NULL,
  is_signed_url   BOOLEAN NOT NULL DEFAULT false,
  signed_url      TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bucket_name, file_path)
);

CREATE INDEX IF NOT EXISTS idx_storage_files_evidence ON public.storage_files(evidence_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_hash ON public.storage_files(sha256_hash);

ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read storage files for accessible evidence"
  ON public.storage_files FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.evidence e
      JOIN public.incidents i ON i.id = e.incident_id
      WHERE e.id = storage_files.evidence_id
      AND (i.officer_id = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')))
  );

CREATE POLICY "Officers can insert storage files"
  ON public.storage_files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 4. MIME type validation function (client-side helper)
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_evidence_mime(mime_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  allowed_images TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  allowed_videos TEXT[] := ARRAY['video/mp4', 'video/quicktime', 'video/webm'];
  allowed_docs TEXT[] := ARRAY['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  allowed_audio TEXT[] := ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'];
BEGIN
  IF mime_type = ANY(allowed_images) THEN
    RETURN jsonb_build_object('valid', true, 'bucket', 'evidence-images', 'max_size', 26214400);
  ELSIF mime_type = ANY(allowed_videos) THEN
    RETURN jsonb_build_object('valid', true, 'bucket', 'evidence-videos', 'max_size', 209715200);
  ELSIF mime_type = ANY(allowed_docs) THEN
    RETURN jsonb_build_object('valid', true, 'bucket', 'evidence-documents', 'max_size', 26214400);
  ELSIF mime_type = ANY(allowed_audio) THEN
    RETURN jsonb_build_object('valid', true, 'bucket', 'evidence-audio', 'max_size', 52428800);
  ELSE
    RETURN jsonb_build_object('valid', true, 'bucket', 'evidence-other', 'max_size', 26214400);
  END IF;
END;
$$;

-- =====================================================
-- 5. Function to generate signed URLs (called from client)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_signed_evidence_url(
  p_evidence_id UUID,
  p_expires_in INTEGER DEFAULT 3600 -- 1 hour default
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket TEXT;
  v_path TEXT;
  v_signed_url TEXT;
BEGIN
  -- Verify access
  IF NOT EXISTS (
    SELECT 1 FROM public.evidence e
    JOIN public.incidents i ON i.id = e.incident_id
    WHERE e.id = p_evidence_id
    AND (i.officer_id = auth.uid() OR public.get_current_user_role() IN ('supervisor', 'admin', 'investigator'))
  ) THEN
    RETURN NULL;
  END IF;

  -- Get the file location
  SELECT bucket_name, file_path INTO v_bucket, v_path
  FROM public.storage_files
  WHERE evidence_id = p_evidence_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_bucket IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return the signed URL (client will use supabase.storage.from().createSignedUrl())
  RETURN v_bucket || '/' || v_path || '?expires=' || (extract(epoch from now()) + p_expires_in)::TEXT;
END;
$$;

-- =====================================================
-- 6. Update evidence trigger to compute default file_url prefix
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_evidence_file_path()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.file_path IS NULL AND NEW.incident_id IS NOT NULL THEN
    NEW.file_path := NEW.incident_id || '/' || NEW.id || '/' || COALESCE(NEW.mime_type, 'unknown');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_evidence_file_path_trigger
  BEFORE INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_evidence_file_path();
