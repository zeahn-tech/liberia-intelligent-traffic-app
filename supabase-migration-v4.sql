-- =====================================================
-- TrafficWatch AI - v4 Database Migration
-- Media Security - Private Storage Buckets, Signed URLs,
-- MIME validation, file-size limits, access controls
--
-- HOW TO RUN:
-- 1. Paste this entire file into the Supabase SQL Editor and run it.
-- 2. Then create the 5 storage buckets manually in the
--    Supabase Storage Dashboard (instructions below).
-- =====================================================

-- =====================================================
-- PART 1: Create the storage_files tracking table
-- This lives in the public schema (no storage schema access needed)
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
-- PART 2: Storage RLS Policies
-- These are created via a SECURITY DEFINER function in the public schema
-- that directly manipulates storage.objects policies
-- =====================================================

-- Function to install storage RLS policies
CREATE OR REPLACE FUNCTION public.install_storage_rls_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SELECT: Only authorized personnel can view evidence files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authorized personnel can read evidence'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Authorized personnel can read evidence" ON storage.objects FOR SELECT USING (
        bucket_id = ANY (ARRAY[''evidence-images'', ''evidence-videos'', ''evidence-documents'', ''evidence-audio'', ''evidence-other''])
        AND (
          auth.role() = ''authenticated''
          AND EXISTS (
            SELECT 1 FROM public.incidents i
            WHERE i.id::TEXT = SPLIT_PART(storage.objects.name, ''/'', 1)
            AND (i.officer_id = auth.uid() OR public.get_current_user_role() IN (''supervisor'', ''admin'', ''investigator''))
          )
        )
      )'
    );
  END IF;

  -- INSERT: Only authenticated users with officer role can upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Officers can upload evidence'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Officers can upload evidence" ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = ANY (ARRAY[''evidence-images'', ''evidence-videos'', ''evidence-documents'', ''evidence-audio'', ''evidence-other''])
        AND auth.role() = ''authenticated''
        AND public.get_current_user_role() IN (''officer'', ''supervisor'', ''admin'', ''investigator'')
      )'
    );
  END IF;

  -- UPDATE: Only the uploader can update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Officers can update own uploads'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Officers can update own uploads" ON storage.objects FOR UPDATE USING (
        bucket_id = ANY (ARRAY[''evidence-images'', ''evidence-videos'', ''evidence-documents'', ''evidence-audio'', ''evidence-other''])
        AND auth.uid() = owner
        AND auth.role() = ''authenticated''
      )'
    );
  END IF;

  -- DELETE: Only admins can delete evidence
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Only admins can delete evidence'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Only admins can delete evidence" ON storage.objects FOR DELETE USING (
        bucket_id = ANY (ARRAY[''evidence-images'', ''evidence-videos'', ''evidence-documents'', ''evidence-audio'', ''evidence-other''])
        AND public.get_current_user_role() = ''admin''
      )'
    );
  END IF;
END;
$$;

-- Run the function to install RLS policies on storage.objects
SELECT public.install_storage_rls_policies();

-- =====================================================
-- PART 3: Helper function for bucket name by MIME type
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_bucket_for_mime(mime_type TEXT)
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

-- =====================================================
-- PART 4: MIME type validation function
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
-- PART 5: Evidence file path trigger
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

DROP TRIGGER IF EXISTS set_evidence_file_path_trigger ON public.evidence;
CREATE TRIGGER set_evidence_file_path_trigger
  BEFORE INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_evidence_file_path();

-- =====================================================
-- DONE! Now create the 5 storage buckets manually:
-- =====================================================
--
-- Go to: https://supabase.com/dashboard/project/yleytyqcrivnohpijtdp/storage/buckets
--
-- Create these 5 buckets (all PRIVATE, not public):
--
-- 1. BUCKET:  evidence-images
--    Public:   OFF
--    MIME:     image/jpeg, image/png, image/webp, image/tiff, image/heic, image/heif
--    Size:     26214400 (25 MB)
--
-- 2. BUCKET:  evidence-videos
--    Public:   OFF
--    MIME:     video/mp4, video/quicktime, video/x-msvideo, video/webm, video/x-matroska
--    Size:     209715200 (200 MB)
--
-- 3. BUCKET:  evidence-documents
--    Public:   OFF
--    MIME:     application/pdf, application/msword,
--              application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--              application/vnd.ms-excel,
--              application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--              text/plain, text/csv
--    Size:     26214400 (25 MB)
--
-- 4. BUCKET:  evidence-audio
--    Public:   OFF
--    MIME:     audio/mpeg, audio/wav, audio/ogg, audio/aac, audio/flac
--    Size:     52428800 (50 MB)
--
-- 5. BUCKET:  evidence-other
--    Public:   OFF
--    MIME:     (leave empty — accept any)
--    Size:     26214400 (25 MB)
-- =====================================================
