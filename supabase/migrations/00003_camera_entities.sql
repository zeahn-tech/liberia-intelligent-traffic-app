-- ============================================================
-- TrafficWatch AI — v21 Camera Entity Models
--
-- Adds dedicated tables for future live camera system integration:
--   camera_streams     — Stream configurations per camera
--   camera_detections  — Individual detection results
--   camera_violations  — Violation-specific camera detections
--   camera_evidence    — Evidence generated from camera detections
--
-- Depends on: traffic_cameras (existing), camera_events (existing)
-- ============================================================

-- ============================================================
-- 1. CAMERA STREAMS
-- Stream configuration for each camera.
-- A camera can have multiple streams (main, sub, backup).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.camera_streams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id         UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE,
  stream_name       TEXT NOT NULL DEFAULT 'main',
  stream_url        TEXT NOT NULL,
  stream_type       TEXT NOT NULL DEFAULT 'hls' CHECK (stream_type IN (
                      'rtsp', 'hls', 'webrtc', 'mpeg_dash', 'mjpeg', 'usb', 'file', 'drone', 'body_cam', 'mobile', 'unknown'
                    )),
  stream_profile    TEXT NOT NULL DEFAULT 'main' CHECK (stream_profile IN ('main', 'sub', 'backup', 'mobile', 'archive')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  username          TEXT,
  password_enc      TEXT,        -- encrypted, never plaintext
  auth_token        TEXT,
  transport         TEXT DEFAULT 'tcp' CHECK (transport IN ('tcp', 'udp', 'http')),
  quality           TEXT DEFAULT 'medium' CHECK (quality IN ('low', 'medium', 'high', 'ultra')),
  resolution        TEXT,        -- e.g. "1920x1080"
  max_fps           INTEGER,
  bitrate_kbps      INTEGER,
  record_enabled    BOOLEAN NOT NULL DEFAULT false,
  max_recording_sec INTEGER,
  health_status     TEXT DEFAULT 'unknown' CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'offline', 'error')),
  last_health_check TIMESTAMPTZ,
  last_connected_at TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_streams_camera ON public.camera_streams(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_type ON public.camera_streams(stream_type);
CREATE INDEX IF NOT EXISTS idx_camera_streams_active ON public.camera_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_camera_streams_health ON public.camera_streams(health_status);

ALTER TABLE public.camera_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read camera streams"
  ON public.camera_streams FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'system_auditor')
  );

CREATE POLICY "Administrators and commanders can manage camera streams"
  ON public.camera_streams FOR ALL
  USING (
    public.get_current_user_role() IN ('system_administrator', 'traffic_commander')
  );

-- ============================================================
-- 2. CAMERA DETECTIONS
-- Individual detection results from camera AI analysis.
-- Each detection is a single object/event identified in a frame.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.camera_detections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id         UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE,
  camera_event_id   UUID REFERENCES public.camera_events(id) ON DELETE SET NULL,
  stream_id         UUID REFERENCES public.camera_streams(id) ON DELETE SET NULL,
  detection_type    TEXT NOT NULL CHECK (detection_type IN (
                      'vehicle', 'license_plate', 'pedestrian', 'obstacle',
                      'accident', 'congestion', 'speed', 'red_light',
                      'illegal_turn', 'wrong_way', 'helmet', 'seatbelt',
                      'mobile_phone', 'lane_departure', 'fire', 'smoke',
                      'animal', 'unknown'
                    )),
  confidence         REAL NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1.0),
  bounding_box       JSONB,      -- { x, y, width, height } as percentages
  detected_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  frame_timestamp    TIMESTAMPTZ, -- timestamp within the video stream
  frame_number       INTEGER,
  snapshot_url       TEXT,        -- frame capture image
  attributes         JSONB NOT NULL DEFAULT '{}',  -- detection-specific attributes

  -- Vehicle-specific attributes
  vehicle_type       TEXT,
  vehicle_make       TEXT,
  vehicle_model      TEXT,
  vehicle_color      TEXT,
  vehicle_speed_kmh  REAL,
  license_plate_text TEXT,
  license_plate_conf REAL CHECK (license_plate_conf IS NULL OR (license_plate_conf >= 0 AND license_plate_conf <= 1.0)),

  -- Relationships
  incident_id        UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  anpr_scan_id       UUID REFERENCES public.anpr_scans(id) ON DELETE SET NULL,
  officer_reviewed   BOOLEAN NOT NULL DEFAULT false,
  reviewed_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  review_notes       TEXT,

  -- Metadata
  source             TEXT DEFAULT 'camera' CHECK (source IN ('camera', 'upload', 'body_cam', 'dashcam', 'drone', 'mobile', 'other')),
  ai_model_version   TEXT,
  processing_time_ms INTEGER,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_detections_camera ON public.camera_detections(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_detections_event ON public.camera_detections(camera_event_id);
CREATE INDEX IF NOT EXISTS idx_camera_detections_type ON public.camera_detections(detection_type);
CREATE INDEX IF NOT EXISTS idx_camera_detections_confidence ON public.camera_detections(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_camera_detections_plate ON public.camera_detections(license_plate_text);
CREATE INDEX IF NOT EXISTS idx_camera_detections_reviewed ON public.camera_detections(officer_reviewed);
CREATE INDEX IF NOT EXISTS idx_camera_detections_incident ON public.camera_detections(incident_id);
CREATE INDEX IF NOT EXISTS idx_camera_detections_detected ON public.camera_detections(detected_at DESC);

ALTER TABLE public.camera_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read camera detections"
  ON public.camera_detections FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'evidence_officer', 'system_auditor')
  );

CREATE POLICY "Authorized personnel can manage camera detections"
  ON public.camera_detections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Officers can update detections they review"
  ON public.camera_detections FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    (public.get_current_user_role() IN ('system_administrator', 'traffic_officer', 'police_supervisor', 'investigator'))
  );

-- ============================================================
-- 3. CAMERA VIOLATIONS
-- Violation-specific records derived from camera detections.
-- One detection can produce multiple violation records.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.camera_violations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id         UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE,
  camera_event_id   UUID REFERENCES public.camera_events(id) ON DELETE SET NULL,
  camera_detection_id UUID REFERENCES public.camera_detections(id) ON DELETE SET NULL,
  incident_id       UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  violation_type    TEXT NOT NULL,
  violation_code    TEXT,         -- e.g. "LR-TC-101"
  description       TEXT,

  -- Evidence references
  snapshot_url      TEXT,
  clip_url          TEXT,
  evidence_id       UUID REFERENCES public.evidence(id) ON DELETE SET NULL,

  -- Detection attributes
  confidence        REAL NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1.0),
  detected_speed_kmh REAL,
  speed_limit_kmh   REAL,
  location_lat      DOUBLE PRECISION,
  location_lng      DOUBLE PRECISION,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Video/timestamp within stream
  stream_id         UUID REFERENCES public.camera_streams(id) ON DELETE SET NULL,
  clip_start_sec    REAL,         -- seconds from start of clip
  clip_end_sec      REAL,
  frame_start       INTEGER,
  frame_end         INTEGER,

  -- Violation status
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending', 'confirmed', 'rejected', 'citation_issued', 'escalated', 'closed'
                    )),
  severity          TEXT CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  fine_amount       NUMERIC(10,2),
  points            INTEGER,

  -- Officer review
  officer_reviewed  BOOLEAN NOT NULL DEFAULT false,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  review_decision   TEXT CHECK (review_decision IN ('confirmed', 'rejected', 'modified', 'pending')),
  officer_notes     TEXT,

  -- Metadata
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_violations_camera ON public.camera_violations(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_violations_event ON public.camera_violations(camera_event_id);
CREATE INDEX IF NOT EXISTS idx_camera_violations_detection ON public.camera_violations(camera_detection_id);
CREATE INDEX IF NOT EXISTS idx_camera_violations_incident ON public.camera_violations(incident_id);
CREATE INDEX IF NOT EXISTS idx_camera_violations_type ON public.camera_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_camera_violations_status ON public.camera_violations(status);
CREATE INDEX IF NOT EXISTS idx_camera_violations_severity ON public.camera_violations(severity);
CREATE INDEX IF NOT EXISTS idx_camera_violations_detected ON public.camera_violations(detected_at DESC);

ALTER TABLE public.camera_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read camera violations"
  ON public.camera_violations FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'evidence_officer', 'system_auditor')
  );

CREATE POLICY "Officers and investigators can manage violations"
  ON public.camera_violations FOR ALL
  USING (
    public.get_current_user_role() IN ('system_administrator', 'traffic_officer', 'police_supervisor', 'investigator', 'traffic_commander')
  );

-- ============================================================
-- 4. CAMERA EVIDENCE
-- Evidence artifacts generated from camera detection events.
-- Each record links to the evidence system for chain of custody.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.camera_evidence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id         UUID NOT NULL REFERENCES public.traffic_cameras(id) ON DELETE CASCADE,
  camera_event_id   UUID REFERENCES public.camera_events(id) ON DELETE SET NULL,
  camera_detection_id UUID REFERENCES public.camera_detections(id) ON DELETE SET NULL,
  camera_violation_id UUID REFERENCES public.camera_violations(id) ON DELETE SET NULL,
  evidence_id       UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  incident_id       UUID REFERENCES public.incidents(id) ON DELETE SET NULL,

  -- Evidence content
  evidence_type     TEXT NOT NULL CHECK (evidence_type IN (
                      'snapshot', 'video_clip', 'timelapse', 'anpr_capture',
                      'speed_reading', 'red_light_capture', 'violation_sequence',
                      'ai_analysis_report', 'raw_frame', 'compilation'
                    )),
  file_url          TEXT NOT NULL,
  file_size         BIGINT,
  mime_type         TEXT,
  sha256_hash       TEXT,         -- cryptographic hash for integrity

  -- Evidence attributes
  captured_at       TIMESTAMPTZ NOT NULL DEFAULT now(),  -- when the camera captured it
  location_lat      DOUBLE PRECISION,
  location_lng      DOUBLE PRECISION,
  duration_seconds  REAL,         -- for video clips
  frame_count       INTEGER,      -- for snapshot sequences

  -- Graph metadata (bounding box annotations for evidence overlay)
  annotations       JSONB,        -- detection bounding boxes for overlay
  metadata          JSONB NOT NULL DEFAULT '{}',

  -- Links
  stream_id         UUID REFERENCES public.camera_streams(id) ON DELETE SET NULL,
  officer_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  officer_notes     TEXT,

  -- Status
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending', 'verified', 'flagged', 'archived', 'deleted'
                    )),
  is_original      BOOLEAN NOT NULL DEFAULT true,
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camera_evidence_camera ON public.camera_evidence(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_event ON public.camera_evidence(camera_event_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_detection ON public.camera_evidence(camera_detection_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_violation ON public.camera_evidence(camera_violation_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_evidence ON public.camera_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_incident ON public.camera_evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_type ON public.camera_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_status ON public.camera_evidence(status);
CREATE INDEX IF NOT EXISTS idx_camera_evidence_captured ON public.camera_evidence(captured_at DESC);

ALTER TABLE public.camera_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read camera evidence"
  ON public.camera_evidence FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    public.get_current_user_role() IN ('system_administrator', 'national_commissioner', 'regional_commander', 'traffic_commander', 'police_supervisor', 'traffic_officer', 'investigator', 'evidence_officer', 'system_auditor')
  );

CREATE POLICY "Authorized personnel can insert camera evidence"
  ON public.camera_evidence FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Evidence officers can manage camera evidence"
  ON public.camera_evidence FOR UPDATE
  USING (public.get_current_user_role() IN ('system_administrator', 'evidence_officer', 'investigator'));

-- ============================================================
-- 5. HELPER: Get stream health summary for a camera
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_camera_stream_health(p_camera_id UUID)
RETURNS TABLE(
  total_streams BIGINT,
  healthy_streams BIGINT,
  degraded_streams BIGINT,
  offline_streams BIGINT,
  primary_stream TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_streams,
    COUNT(*) FILTER (WHERE health_status = 'healthy')::BIGINT AS healthy_streams,
    COUNT(*) FILTER (WHERE health_status = 'degraded')::BIGINT AS degraded_streams,
    COUNT(*) FILTER (WHERE health_status IN ('offline', 'error'))::BIGINT AS offline_streams,
    (SELECT stream_url FROM public.camera_streams WHERE camera_id = p_camera_id AND is_primary = true LIMIT 1) AS primary_stream
  FROM public.camera_streams
  WHERE camera_id = p_camera_id;
END;
$$;

-- ============================================================
-- 6. HELPER: Get detection stats for a camera in a time range
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_camera_detection_stats(
  p_camera_id UUID,
  p_from TIMESTAMPTZ DEFAULT (now() - interval '24 hours'),
  p_to TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  total_detections BIGINT,
  vehicle_detections BIGINT,
  plate_detections BIGINT,
  violations_detected BIGINT,
  avg_confidence REAL,
  top_detection_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_detections,
    COUNT(*) FILTER (WHERE detection_type = 'vehicle')::BIGINT AS vehicle_detections,
    COUNT(*) FILTER (WHERE detection_type = 'license_plate')::BIGINT AS plate_detections,
    COUNT(*) FILTER (WHERE detection_type IN ('speed', 'red_light', 'illegal_turn', 'wrong_way', 'mobile_phone', 'helmet', 'seatbelt'))::BIGINT AS violations_detected,
    AVG(confidence)::REAL AS avg_confidence,
    (SELECT detection_type FROM public.camera_detections
     WHERE camera_id = p_camera_id AND detected_at BETWEEN p_from AND p_to
     GROUP BY detection_type ORDER BY COUNT(*) DESC LIMIT 1) AS top_detection_type
  FROM public.camera_detections
  WHERE camera_id = p_camera_id
    AND detected_at BETWEEN p_from AND p_to;
END;
$$;
