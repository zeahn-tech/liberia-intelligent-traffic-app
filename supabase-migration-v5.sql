-- =====================================================
-- TrafficWatch AI - v5 Database Migration
-- Liberia Geographic Support
--
-- All 15 counties, districts, police regions, stations,
-- roads, and checkpoints stored in DB tables so the
-- system can be updated without rewriting the application.
-- =====================================================

-- =====================================================
-- 1. LIBERIA COUNTIES (All 15 counties)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.liberia_counties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  capital         TEXT NOT NULL,
  population      INTEGER,
  area_km2        INTEGER,
  center_lat      DOUBLE PRECISION,
  center_lng      DOUBLE PRECISION,
  police_region   TEXT NOT NULL,
  boundary_geojson JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counties_code ON public.liberia_counties(code);
CREATE INDEX IF NOT EXISTS idx_counties_region ON public.liberia_counties(police_region);

ALTER TABLE public.liberia_counties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read counties"
  ON public.liberia_counties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed all 15 counties
INSERT INTO public.liberia_counties (code, name, capital, population, area_km2, center_lat, center_lng, police_region) VALUES
  ('BM',  'Bomi',           'Tubmanburg',     82300,   1942,  6.7833, -10.7333, 'Western'),
  ('BG',  'Bong',           'Gbarnga',        333481,  8772,  6.9956, -9.4711,  'North Central'),
  ('GP',  'Gbarpolu',       'Bopolu',         83758,   9689,  7.0667, -10.4833, 'Western'),
  ('GB',  'Grand Bassa',    'Buchanan',       224839,  7946,  5.8809, -10.0504, 'South Central'),
  ('CM',  'Grand Cape Mount', 'Robertsport',  127076,  5162,  6.7500, -11.3667, 'Western'),
  ('GG',  'Grand Gedeh',    'Zwedru',         125258,  10484, 6.0667, -8.1333,  'Eastern'),
  ('GK',  'Grand Kru',      'Barclayville',   57106,   3895,  4.9333, -8.2333,  'South Eastern'),
  ('LF',  'Lofa',           'Voinjama',       276863,  9982,  8.0333, -9.7500,  'North Western'),
  ('MG',  'Margibi',        'Kakata',         199689,  2615,  6.5031, -10.3528, 'South Central'),
  ('MY',  'Maryland',       'Harper',         136404,  3863,  4.7667, -7.6667,  'South Eastern'),
  ('MO',  'Montserrado',    'Bensonville',    1542205, 1909,  6.3156, -10.8074, 'Montserrado'),
  ('NI',  'Nimba',          'Sanniquellie',   462026,  11551, 6.9667, -8.6333,  'North Central'),
  ('RI',  'River Cess',     'River Cess',     72594,   5594,  5.4667, -9.5833,  'South Central'),
  ('RG',  'River Gee',      'Fish Town',      66789,   5113,  5.2667, -7.8667,  'South Eastern'),
  ('SI',  'Sinoe',          'Greenville',     104932,  10137, 5.0167, -9.0333,  'South Eastern')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. DISTRICTS (Major districts within each county)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.liberia_districts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_code     TEXT NOT NULL REFERENCES public.liberia_counties(code),
  name            TEXT NOT NULL,
  center_lat      DOUBLE PRECISION,
  center_lng      DOUBLE PRECISION,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_districts_county ON public.liberia_districts(county_code);

ALTER TABLE public.liberia_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read districts"
  ON public.liberia_districts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed major districts
INSERT INTO public.liberia_districts (county_code, name, center_lat, center_lng) VALUES
  ('MO', 'Greater Monrovia',    6.3156, -10.8074),
  ('MO', 'Bushrod Island',       6.3500, -10.8000),
  ('MO', 'Paynesville',         6.2856, -10.7224),
  ('MO', 'Careysburg',          6.4167, -10.5500),
  ('MO', 'St. Paul River',      6.3833, -10.7500),
  ('MO', 'Todee',               6.4500, -10.6333),
  ('MO', 'Commonwealth',        6.2833, -10.7333),
  ('BG', 'Gbarnga Central',     6.9956, -9.4711),
  ('BG', 'Zota',                7.1667, -9.3333),
  ('BG', 'Jorquelleh',          7.0500, -9.5500),
  ('BG', 'Kokoyah',             6.9000, -9.5500),
  ('BG', 'Panta-Kpa',           7.0833, -9.2667),
  ('BG', 'Sanayea',             7.0333, -9.6833),
  ('NI', 'Sanniquellie-Mahn',   6.9667, -8.6333),
  ('NI', 'Gbehlageh',           7.2833, -8.8500),
  ('NI', 'Buchanan',            7.1833, -8.6833),
  ('NI', 'Yarpea',              6.8500, -8.8167),
  ('NI', 'Yarwein',             6.7500, -8.5500),
  ('NI', 'Leewehpea-Mahn',      6.9000, -8.7667),
  ('GB', 'Buchanan District',   5.8809, -10.0504),
  ('GB', 'Owensgrove',          5.9500, -10.1333),
  ('GB', 'St. John River',      5.8000, -10.0500),
  ('LF', 'Voinjama',            8.0333, -9.7500),
  ('LF', 'Zorzor',              7.7667, -9.6500),
  ('LF', 'Foya',                7.9000, -10.2000),
  ('LF', 'Salayea',             7.8333, -9.9000),
  ('MG', 'Kakata',              6.5031, -10.3528),
  ('MG', 'Mambah-Kaba',         6.4167, -10.5167),
  ('MG', 'Gibi',                6.5500, -10.2667)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. POLICE REGIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.police_regions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  headquarters    TEXT NOT NULL,
  commander       TEXT,
  contact_phone   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.police_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read police regions"
  ON public.police_regions FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.police_regions (name, headquarters) VALUES
  ('Montserrado',      'Monrovia'),
  ('Western',          'Tubmanburg'),
  ('North Central',    'Gbarnga'),
  ('North Western',    'Voinjama'),
  ('South Central',    'Buchanan'),
  ('Eastern',          'Zwedru'),
  ('South Eastern',    'Harper')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. POLICE STATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.police_stations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  county_code     TEXT NOT NULL REFERENCES public.liberia_counties(code),
  address         TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  phone           TEXT,
  type            TEXT NOT NULL DEFAULT 'station' CHECK (type IN ('station', 'substation', 'post', 'hq')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stations_county ON public.police_stations(county_code);

ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read police stations"
  ON public.police_stations FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.police_stations (name, county_code, latitude, longitude, type) VALUES
  ('Monrovia Central Police Station', 'MO', 6.3150, -10.8090, 'hq'),
  ('Paynesville Police Station',      'MO', 6.2856, -10.7224, 'station'),
  ('Ganta Police Station',            'NI', 7.0233, -9.0504,  'station'),
  ('Buchanan Police Station',         'GB', 5.8809, -10.0504, 'station'),
  ('Gbarnga Police Station',          'BG', 6.9956, -9.4711,  'station'),
  ('Voinjama Police Station',         'LF', 8.0333, -9.7500,  'station'),
  ('Harper Police Station',           'MY', 4.7667, -7.6667,  'station'),
  ('Zwedru Police Station',           'GG', 6.0667, -8.1333,  'station'),
  ('Bopolu Police Station',           'GP', 7.0667, -10.4833, 'station'),
  ('Robertsport Police Station',      'CM', 6.7500, -11.3667, 'station'),
  ('Tubmanburg Police Station',       'BM', 6.7833, -10.7333, 'station'),
  ('Kakata Police Station',           'MG', 6.5031, -10.3528, 'station'),
  ('Greenville Police Station',       'SI', 5.0167, -9.0333,  'station'),
  ('Barclayville Police Station',     'GK', 4.9333, -8.2333,  'station'),
  ('River Cess Police Station',       'RI', 5.4667, -9.5833,  'station'),
  ('Fish Town Police Station',        'RG', 5.2667, -7.8667,  'station')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. MAJOR ROADS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.major_roads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  road_number     TEXT,
  road_type       TEXT CHECK (road_type IN ('highway', 'primary', 'secondary', 'tertiary')),
  from_location   TEXT,
  to_location     TEXT,
  length_km       DOUBLE PRECISION,
  counties        TEXT[] NOT NULL DEFAULT '{}',
  route_geojson   JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roads_counties ON public.major_roads USING GIN (counties);

ALTER TABLE public.major_roads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read major roads"
  ON public.major_roads FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.major_roads (name, road_number, road_type, from_location, to_location, length_km, counties) VALUES
  ('Monrovia-Ganta Highway', 'A1', 'highway', 'Monrovia', 'Ganta', 280, ARRAY['MO', 'MG', 'BG', 'NI']),
  ('Monrovia-Buchanan Highway', 'A2', 'highway', 'Monrovia', 'Buchanan', 120, ARRAY['MO', 'MG', 'GB']),
  ('Ganta-Voinjama Road', 'B1', 'primary', 'Ganta', 'Voinjama', 180, ARRAY['NI', 'LF']),
  ('Monrovia-Robertsport Highway', 'A3', 'highway', 'Monrovia', 'Robertsport', 100, ARRAY['MO', 'CM']),
  ('Buchanan-Greenville Road', 'B2', 'primary', 'Buchanan', 'Greenville', 200, ARRAY['GB', 'SI', 'RI']),
  ('Greenville-Harper Road', 'B3', 'primary', 'Greenville', 'Harper', 150, ARRAY['SI', 'GK', 'RG', 'MY']),
  ('Ganta-Zwedru Road', 'B4', 'primary', 'Ganta', 'Zwedru', 160, ARRAY['NI', 'GG']),
  ('Tubmanburg-Bopolu Road', 'C1', 'secondary', 'Tubmanburg', 'Bopolu', 80, ARRAY['BM', 'GP']),
  ('Gbarnga-Voinjama Road', 'B5', 'primary', 'Gbarnga', 'Voinjama', 150, ARRAY['BG', 'LF']),
  ('Monrovia-Gbarnga Highway', 'A4', 'highway', 'Monrovia', 'Gbarnga', 200, ARRAY['MO', 'MG', 'BG']),
  ('UN Drive', NULL, 'secondary', 'Monrovia CBD', 'Congo Town', 15, ARRAY['MO']),
  ('Tubman Boulevard', NULL, 'primary', 'Monrovia', 'Paynesville', 12, ARRAY['MO']),
  ('Broad Street', NULL, 'secondary', 'Downtown', 'Water Street', 5, ARRAY['MO']),
  ('Benson Street', NULL, 'secondary', 'Broad St', 'Randall St', 3, ARRAY['MO'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. CHECKPOINTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  county_code     TEXT NOT NULL REFERENCES public.liberia_counties(code),
  road_name       TEXT,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  is_permanent    BOOLEAN NOT NULL DEFAULT true,
  hours           TEXT DEFAULT '24/7',
  unit            TEXT,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_county ON public.checkpoints(county_code);

ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read checkpoints"
  ON public.checkpoints FOR SELECT
  USING (auth.role() = 'authenticated');

INSERT INTO public.checkpoints (name, county_code, road_name, latitude, longitude, is_permanent, unit) VALUES
  ('UN Drive Checkpoint',     'MO', 'UN Drive',           6.3210, -10.8150, true, 'Traffic Division'),
  ('Broad Street Intersection', 'MO', 'Broad Street',     6.3280, -10.8120, true, 'Traffic Division'),
  ('Paynesville Market',      'MO', 'Tubman Boulevard',   6.2856, -10.7224, true, 'Highway Patrol'),
  ('Ganta Highway Gate',      'NI', 'Monrovia-Ganta Hwy', 7.0233, -9.0504,  true, 'Highway Patrol'),
  ('Buchanan Entrance',       'GB', 'Monrovia-Buchanan Hwy', 5.8809, -10.0504, true, 'Highway Patrol'),
  ('Gbarnga Junction',        'BG', 'Monrovia-Gbarnga Hwy', 6.9956, -9.4711, true, 'Traffic Division'),
  ('Kakata Junction',         'MG', 'A1 Highway',         6.5031, -10.3528, true, 'Highway Patrol'),
  ('Voinjama Entry',          'LF', 'Ganta-Voinjama Rd',  8.0333, -9.7500,  true, 'Highway Patrol'),
  ('Tubmanburg Gate',         'BM', 'Tubmanburg-Bopolu Rd', 6.7833, -10.7333, false, 'Local Patrol'),
  ('Robertsport Junction',    'CM', 'Monrovia-Robertsport Hwy', 6.7500, -11.3667, false, 'Local Patrol'),
  ('Zwedru Control',          'GG', 'Ganta-Zwedru Rd',    6.0667, -8.1333,  true, 'Border Patrol'),
  ('Harper Checkpoint',       'MY', 'Harper Road',         4.7667, -7.6667,  true, 'Border Patrol')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Add county/district columns to incidents table
-- =====================================================
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS county_code TEXT REFERENCES public.liberia_counties(code);
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.liberia_districts(id);
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS nearest_road TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS nearest_checkpoint_id UUID REFERENCES public.checkpoints(id);

CREATE INDEX IF NOT EXISTS idx_incidents_county ON public.incidents(county_code);
CREATE INDEX IF NOT EXISTS idx_incidents_district ON public.incidents(district_id);
CREATE INDEX IF NOT EXISTS idx_incidents_road ON public.incidents(nearest_road);

-- =====================================================
-- 8. Add county/district to evidence table
-- =====================================================
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS county_code TEXT REFERENCES public.liberia_counties(code);

-- =====================================================
-- 9. Helper function: get incidents by county
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_incidents_by_county(p_county_code TEXT)
RETURNS SETOF public.incidents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.incidents
  WHERE county_code = p_county_code
  ORDER BY created_at DESC;
END;
$$;

-- =====================================================
-- 10. Helper function: get counties with incident counts
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_county_incident_counts()
RETURNS TABLE(county_code TEXT, county_name TEXT, incident_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.code,
    lc.name,
    COUNT(i.id)::BIGINT AS incident_count
  FROM public.liberia_counties lc
  LEFT JOIN public.incidents i ON i.county_code = lc.code
  WHERE lc.is_active = true
  GROUP BY lc.code, lc.name
  ORDER BY lc.name;
END;
$$;
