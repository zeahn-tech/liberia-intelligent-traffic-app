-- =====================================================
-- TrafficWatch AI - v6 Database Migration
-- Predictive Analytics
--
-- Tables for prediction models, prediction results,
-- violation hotspots, and high-risk roads.
-- All predictions are clearly labeled as ESTIMATES
-- generated from available data.
-- =====================================================

-- =====================================================
-- 1. PREDICTION MODELS (registered models in the system)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_models (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  version           TEXT NOT NULL DEFAULT '1.0.0',
  category          TEXT NOT NULL CHECK (category IN (
    'road_risk', 'hotspot_prediction', 'accident_risk',
    'congestion_forecast', 'offender_risk', 'volume_forecast'
  )),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'training', 'deprecated', 'error')),
  accuracy          REAL NOT NULL DEFAULT 0.0 CHECK (accuracy >= 0 AND accuracy <= 100),
  parameters        JSONB NOT NULL DEFAULT '{}',
  data_requirements TEXT[] NOT NULL DEFAULT '{}',
  last_trained_at   TIMESTAMPTZ,
  next_training_due TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prediction_models_category ON public.prediction_models(category);
CREATE INDEX IF NOT EXISTS idx_prediction_models_status ON public.prediction_models(status);

ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read prediction models"
  ON public.prediction_models FOR SELECT
  USING (
    public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Only admins can manage prediction models"
  ON public.prediction_models FOR ALL
  USING (public.get_current_user_role() = 'admin');

-- =====================================================
-- 2. PREDICTION RESULTS (generated predictions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.prediction_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id          UUID REFERENCES public.prediction_models(id) ON DELETE SET NULL,
  category          TEXT NOT NULL CHECK (category IN (
    'road_risk', 'hotspot_prediction', 'accident_risk',
    'congestion_forecast', 'offender_risk', 'volume_forecast'
  )),
  title             TEXT NOT NULL,
  summary           TEXT NOT NULL DEFAULT '',
  confidence_score  REAL NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_level  TEXT NOT NULL DEFAULT 'moderate' CHECK (confidence_level IN (
    'very_low', 'low', 'moderate', 'high', 'very_high'
  )),
  risk_severity     TEXT CHECK (risk_severity IN ('low', 'medium', 'high', 'critical')),
  location_name     TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  county            TEXT,
  district          TEXT,
  road_name         TEXT,
  license_plate     TEXT,
  predicted_value   REAL,
  lower_bound       REAL,
  upper_bound       REAL,
  details_json      JSONB NOT NULL DEFAULT '{}',
  data_sources      TEXT[] NOT NULL DEFAULT '{}',
  model_version     TEXT NOT NULL DEFAULT '1.0.0',
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Every prediction result must have a clear disclaimer
  CONSTRAINT prediction_disclaimer CHECK (
    details_json ? 'disclaimer' AND details_json->>'disclaimer' LIKE '%estimate%'
  )
);

CREATE INDEX IF NOT EXISTS idx_prediction_results_category ON public.prediction_results(category);
CREATE INDEX IF NOT EXISTS idx_prediction_results_county ON public.prediction_results(county);
CREATE INDEX IF NOT EXISTS idx_prediction_results_road ON public.prediction_results(road_name);
CREATE INDEX IF NOT EXISTS idx_prediction_results_plate ON public.prediction_results(license_plate);
CREATE INDEX IF NOT EXISTS idx_prediction_results_expires ON public.prediction_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_prediction_results_created ON public.prediction_results(created_at DESC);

ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized personnel can read predictions"
  ON public.prediction_results FOR SELECT
  USING (
    public.get_current_user_role() IN ('supervisor', 'admin', 'investigator')
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "System can insert predictions"
  ON public.prediction_results FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 3. VIOLATION HOTSPOTS (persistent hotspot records)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.violation_hotspots (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county                      TEXT NOT NULL,
  district                    TEXT,
  location_name               TEXT NOT NULL,
  latitude                    DOUBLE PRECISION NOT NULL,
  longitude                   DOUBLE PRECISION NOT NULL,
  radius_meters               INTEGER NOT NULL DEFAULT 500,
  risk_level                  TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predominant_violation_types TEXT[] NOT NULL DEFAULT '{}',
  peak_times                  TEXT[] NOT NULL DEFAULT '{}',
  peak_days                   TEXT[] NOT NULL DEFAULT '{}',
  incident_count              INTEGER NOT NULL DEFAULT 0,
  last_updated                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspots_county ON public.violation_hotspots(county);
CREATE INDEX IF NOT EXISTS idx_hotspots_risk ON public.violation_hotspots(risk_level);

ALTER TABLE public.violation_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read hotspots"
  ON public.violation_hotspots FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. HIGH-RISK ROADS (persistent risk road records)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.risk_roads (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  road_name                   TEXT NOT NULL,
  county                      TEXT NOT NULL,
  district                    TEXT,
  risk_level                  TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score                  REAL NOT NULL DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 100),
  incident_count              INTEGER NOT NULL DEFAULT 0,
  predominant_violation_types TEXT[] NOT NULL DEFAULT '{}',
  factors                     TEXT[] NOT NULL DEFAULT '{}',
  recommendation              TEXT,
  last_updated                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_roads_county ON public.risk_roads(county);
CREATE INDEX IF NOT EXISTS idx_risk_roads_score ON public.risk_roads(risk_score DESC);

ALTER TABLE public.risk_roads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read risk roads"
  ON public.risk_roads FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. SEED DATA — Register default prediction models
-- =====================================================
INSERT INTO public.prediction_models (name, description, version, category, status, accuracy, parameters, data_requirements)
VALUES
  ('Road Risk Analyzer', 'Analyzes historical incident data to predict high-risk road segments and recommend patrol allocation.', '1.0.0', 'road_risk', 'active', 82.5,
   '{"lookback_days": 90, "min_incidents": 5, "weight_recent": 0.6, "weight_severity": 0.4}',
   ARRAY['incidents_90days', 'road_geometry', 'traffic_volume']),

  ('Hotspot Prediction Model', 'Identifies emerging violation hotspots by clustering recent incident locations and analyzing temporal patterns.', '1.0.0', 'hotspot_prediction', 'active', 78.3,
   '{"cluster_radius_m": 300, "min_cluster_size": 3, "time_window_hours": 168, "seasonal_weight": 0.3}',
   ARRAY['incidents_30days', 'locations', 'time_data']),

  ('Accident Risk Estimator', 'Assesses accident probability by combining road conditions, historical accident data, weather factors, and time patterns.', '1.0.0', 'accident_risk', 'active', 76.8,
   '{"lookback_months": 12, "weather_weight": 0.25, "time_weight": 0.35, "road_weight": 0.4}',
   ARRAY['accidents_12months', 'weather_data', 'road_conditions']),

  ('Congestion Forecaster', 'Predicts traffic congestion patterns using historical traffic counts, incident correlation, and time-based regression.', '1.0.0', 'congestion_forecast', 'training', 71.2,
   '{"lookback_days": 60, "peak_hours": ["0700-0900", "1600-1900"], "regression_order": 3}',
   ARRAY['traffic_counts', 'incident_timing', 'road_capacity']),

  ('Offender Risk Assessment', 'Evaluates repeat offender profiles to predict escalation risk and recommend intervention priority.', '1.0.0', 'offender_risk', 'active', 88.1,
   '{"escalation_window_days": 180, "min_violations": 3, "recency_weight": 0.5, "severity_weight": 0.5}',
   ARRAY['anpr_history_180days', 'incident_history', 'stolen_vehicle_db']),

  ('Volume Forecasting Engine', 'Forecasts incident volumes using time-series decomposition, trend analysis, and seasonal pattern recognition.', '1.0.0', 'volume_forecast', 'active', 80.4,
   '{"forecast_days": 30, "seasonal_period": 7, "confidence_level": 0.95, "trend_weight": 0.4}',
   ARRAY['incidents_12months', 'seasonal_calendar', 'special_events'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Get active predictions for a specific category
CREATE OR REPLACE FUNCTION public.get_active_predictions(
  p_category TEXT DEFAULT NULL
)
RETURNS SETOF public.prediction_results
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_category IS NULL THEN
    RETURN QUERY SELECT *
      FROM public.prediction_results
      WHERE expires_at > now()
      ORDER BY created_at DESC;
  ELSE
    RETURN QUERY SELECT *
      FROM public.prediction_results
      WHERE category = p_category
        AND expires_at > now()
      ORDER BY created_at DESC;
  END IF;
END;
$$;

-- Get prediction summary statistics
CREATE OR REPLACE FUNCTION public.get_prediction_summary()
RETURNS TABLE(
  total_active_predictions BIGINT,
  high_risk_alerts BIGINT,
  models_online BIGINT,
  models_training BIGINT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.prediction_results WHERE expires_at > now()) AS total_active_predictions,
    (SELECT COUNT(*) FROM public.prediction_results WHERE expires_at > now() AND risk_severity IN ('high', 'critical')) AS high_risk_alerts,
    (SELECT COUNT(*) FROM public.prediction_models WHERE status = 'active') AS models_online,
    (SELECT COUNT(*) FROM public.prediction_models WHERE status = 'training') AS models_training,
    now() AS last_updated;
END;
$$;

-- Get hotspots near a location
CREATE OR REPLACE FUNCTION public.get_hotspots_near(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS SETOF public.violation_hotspots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT *
    FROM public.violation_hotspots
    WHERE (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(latitude))
      )
    ) <= p_radius_km
    ORDER BY incident_count DESC;
END;
$$;

-- Clean up expired predictions (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_predictions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.prediction_results WHERE expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
