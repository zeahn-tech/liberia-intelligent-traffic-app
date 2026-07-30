-- ============================================================
-- TrafficWatch AI — Demo/Seed Data
-- ============================================================
-- !! WARNING: THIS IS DEMO/SEED DATA ONLY !!
-- This file populates the database with sample data for
-- development, testing, and demonstration purposes.
--
-- Run this AFTER all migration files have been applied.
-- To run: Copy and paste into Supabase SQL Editor → Run
--
-- Created: July 2026
-- ============================================================

-- ============================================================
-- 1. POLICE REGIONS (4 regions covering all 15 counties)
-- ============================================================
INSERT INTO police_regions (id, name, headquarters, commander, contact_phone, is_active, created_at) VALUES
  ('reg-001', 'Region 1 — Western', 'Monrovia', 'Asst. Comm. James Gbartea', '+231-77-000-1001', true, '2024-01-01T00:00:00Z'),
  ('reg-002', 'Region 2 — North Central', 'Gbarnga', 'Asst. Comm. Musu Kromah', '+231-77-000-1002', true, '2024-01-01T00:00:00Z'),
  ('reg-003', 'Region 3 — South Eastern A', 'Zwedru', 'Asst. Comm. William Nyekan', '+231-77-000-1003', true, '2024-01-01T00:00:00Z'),
  ('reg-004', 'Region 4 — South Eastern B', 'Harper', 'Asst. Comm. Martha Toe', '+231-77-000-1004', true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. ALL 15 LIBERIA COUNTIES
-- ============================================================
INSERT INTO liberia_counties (id, code, name, capital, population, area_km2, center_lat, center_lng, police_region, boundary_geojson, is_active, created_at) VALUES
  ('cnty-bomi',     'BOMI',     'Bomi',         'Tubmanburg',    84594,   1955,   6.8505, -10.7843, 'Region 1 — Western', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-bong',     'BONG',     'Bong',         'Gbarnga',       333481,  8772,   6.9958, -9.4714,  'Region 2 — North Central', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-gbarpolu', 'GBARPOLU', 'Gbarpolu',     'Bopolu',        83758,   9689,   7.0500, -10.4300, 'Region 1 — Western', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-grand-bassa', 'GRAND_BASSA', 'Grand Bassa',  'Buchanan', 224839,  7925,   5.8800, -9.9800,  'Region 2 — North Central', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-grand-cape-mount', 'GRAND_CAPE_MOUNT', 'Grand Cape Mount', 'Robertsport', 127076, 5174, 6.7486, -11.3678, 'Region 1 — Western', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-grand-gedeh', 'GRAND_GEDEH', 'Grand Gedeh', 'Zwedru', 126146, 10548, 6.0700, -8.1300, 'Region 3 — South Eastern A', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-lofa',     'LOFA',     'Lofa',         'Voinjama',      276863,  9983,   8.4200, -10.1500, 'Region 2 — North Central', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-margibi',  'MARGIBI',  'Margibi',      'Kakata',        209923,  2616,   6.5200, -10.3500, 'Region 1 — Western', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-maryland', 'MARYLAND', 'Maryland',     'Harper',        136404,  2297,   4.7500, -7.7500,  'Region 4 — South Eastern B', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-montserrado', 'MONTSERRADO', 'Montserrado', 'Bensonville', 1142806, 1909,   6.3100, -10.7800, 'Region 1 — Western', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-nimba',    'NI MBA',    'Nimba',        'Sanniquellie',  462026,  11551,  6.9700, -8.7400,  'Region 3 — South Eastern A', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-river-cess', 'RIVER_CESS', 'River Cess', 'Cestos City',  72404,   5594,   5.4600, -9.5800,  'Region 4 — South Eastern B', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-river-gee', 'RIVER_GEE', 'River Gee',   'Fish Town',    66893,   5113,   5.1300, -7.8700,  'Region 4 — South Eastern B', NULL, true, '2024-01-01T00:00:00Z'),
  ('cnty-sinoe',    'SINOE',    'Sinoe',        'Greenville',    104932,  10137,  5.0300, -9.0300,  'Region 4 — South Eastern B', NULL, true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Fix Nimba code (typo above):
UPDATE liberia_counties SET code = 'NIMBA' WHERE id = 'cnty-nimba';

-- ============================================================
-- 3. SAMPLE DISTRICTS (3 per county = 45 districts)
-- ============================================================
INSERT INTO liberia_districts (id, county_code, name, center_lat, center_lng, is_active, created_at) VALUES
  -- Bomi
  ('dist-bomi-1', 'BOMI', 'Dewoin',        6.7800, -10.8200, true, '2024-01-01T00:00:00Z'),
  ('dist-bomi-2', 'BOMI', 'Klay',          6.9000, -10.7500, true, '2024-01-01T00:00:00Z'),
  ('dist-bomi-3', 'BOMI', 'Senjen',        6.8500, -10.7000, true, '2024-01-01T00:00:00Z'),
  -- Bong
  ('dist-bong-1', 'BONG', 'Fuamah',        7.0000, -9.5000,  true, '2024-01-01T00:00:00Z'),
  ('dist-bong-2', 'BONG', 'Jorquelleh',    6.8800, -9.4200,  true, '2024-01-01T00:00:00Z'),
  ('dist-bong-3', 'BONG', 'Zota',          7.1000, -9.3800,  true, '2024-01-01T00:00:00Z'),
  -- Gbarpolu
  ('dist-gbar-1', 'GBARPOLU', 'Belleh',     7.1000, -10.4800, true, '2024-01-01T00:00:00Z'),
  ('dist-gbar-2', 'GBARPOLU', 'Bopolu',     7.0500, -10.4300, true, '2024-01-01T00:00:00Z'),
  ('dist-gbar-3', 'GBARPOLU', 'Bokomu',     7.0000, -10.3500, true, '2024-01-01T00:00:00Z'),
  -- Grand Bassa
  ('dist-gbassa-1', 'GRAND_BASSA', 'District 1', 5.9200, -10.0500, true, '2024-01-01T00:00:00Z'),
  ('dist-gbassa-2', 'GRAND_BASSA', 'District 2', 5.8800, -9.9200,  true, '2024-01-01T00:00:00Z'),
  ('dist-gbassa-3', 'GRAND_BASSA', 'District 3', 5.8500, -9.8800,  true, '2024-01-01T00:00:00Z'),
  -- Grand Cape Mount
  ('dist-gcm-1', 'GRAND_CAPE_MOUNT', 'Commonwealth', 6.7800, -11.4000, true, '2024-01-01T00:00:00Z'),
  ('dist-gcm-2', 'GRAND_CAPE_MOUNT', 'Garwula',      6.7000, -11.3200, true, '2024-01-01T00:00:00Z'),
  ('dist-gcm-3', 'GRAND_CAPE_MOUNT', 'Porkpa',       6.6000, -11.2800, true, '2024-01-01T00:00:00Z'),
  -- Grand Gedeh
  ('dist-gdedeh-1', 'GRAND_GEDEH', 'Putu',      6.1000, -8.2000,  true, '2024-01-01T00:00:00Z'),
  ('dist-gdedeh-2', 'GRAND_GEDEH', 'Tchien',    6.0500, -8.1000,  true, '2024-01-01T00:00:00Z'),
  ('dist-gdedeh-3', 'GRAND_GEDEH', 'Gbarzon',   6.0000, -8.0500,  true, '2024-01-01T00:00:00Z'),
  -- Lofa
  ('dist-lofa-1', 'LOFA', 'Voinjama',    8.4500, -10.1800, true, '2024-01-01T00:00:00Z'),
  ('dist-lofa-2', 'LOFA', 'Foya',        8.3500, -10.1500, true, '2024-01-01T00:00:00Z'),
  ('dist-lofa-3', 'LOFA', 'Kolahun',     8.2500, -10.1000, true, '2024-01-01T00:00:00Z'),
  -- Margibi
  ('dist-marg-1', 'MARGIBI', 'Kakata',     6.5500, -10.3800, true, '2024-01-01T00:00:00Z'),
  ('dist-marg-2', 'MARGIBI', 'Mambah-Kaba', 6.5000, -10.3200, true, '2024-01-01T00:00:00Z'),
  ('dist-marg-3', 'MARGIBI', 'Gibibi',     6.4800, -10.2800, true, '2024-01-01T00:00:00Z'),
  -- Maryland
  ('dist-mary-1', 'MARYLAND', 'Barrobo',   4.8000, -7.8000,  true, '2024-01-01T00:00:00Z'),
  ('dist-mary-2', 'MARYLAND', 'Harper',    4.7500, -7.7500,  true, '2024-01-01T00:00:00Z'),
  ('dist-mary-3', 'MARYLAND', 'Karluway',  4.7000, -7.7000,  true, '2024-01-01T00:00:00Z'),
  -- Montserrado
  ('dist-mont-1', 'MONTSERRADO', 'Careysburg',   6.4000, -10.7000, true, '2024-01-01T00:00:00Z'),
  ('dist-mont-2', 'MONTSERRADO', 'Greater Monrovia', 6.3100, -10.7900, true, '2024-01-01T00:00:00Z'),
  ('dist-mont-3', 'MONTSERRADO', 'Todee',        6.2500, -10.6500, true, '2024-01-01T00:00:00Z'),
  -- Nimba
  ('dist-nimba-1', 'NIMBA', 'Sanniquellie-Mahn', 7.0000, -8.7800, true, '2024-01-01T00:00:00Z'),
  ('dist-nimba-2', 'NIMBA', 'Yarmein',           6.9500, -8.7000, true, '2024-01-01T00:00:00Z'),
  ('dist-nimba-3', 'NIMBA', 'Leewehpea-Mahn',    6.9000, -8.6500, true, '2024-01-01T00:00:00Z'),
  -- River Cess
  ('dist-rcess-1', 'RIVER_CESS', 'Central River Cess', 5.5000, -9.6200, true, '2024-01-01T00:00:00Z'),
  ('dist-rcess-2', 'RIVER_CESS', 'Jennie',             5.4500, -9.5500, true, '2024-01-01T00:00:00Z'),
  ('dist-rcess-3', 'RIVER_CESS', 'Timbo',              5.4000, -9.5000, true, '2024-01-01T00:00:00Z'),
  -- River Gee
  ('dist-rgee-1', 'RIVER_GEE', 'Chedepo',   5.1800, -7.9200, true, '2024-01-01T00:00:00Z'),
  ('dist-rgee-2', 'RIVER_GEE', 'Karforh',   5.1200, -7.8500, true, '2024-01-01T00:00:00Z'),
  ('dist-rgee-3', 'RIVER_GEE', 'Potupo',    5.0800, -7.8000, true, '2024-01-01T00:00:00Z'),
  -- Sinoe
  ('dist-sinoe-1', 'SINOE', 'Butaw',    5.1000, -9.1000, true, '2024-01-01T00:00:00Z'),
  ('dist-sinoe-2', 'SINOE', 'Greenville', 5.0300, -9.0300, true, '2024-01-01T00:00:00Z'),
  ('dist-sinoe-3', 'SINOE', 'Jaedae',   4.9500, -8.9500, true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. MAJOR ROADS
-- ============================================================
INSERT INTO major_roads (id, name, road_number, road_type, from_location, to_location, length_km, counties, is_active, created_at) VALUES
  ('road-001', 'Monrovia–Gbarnga Highway', 'A1', 'highway', 'Monrovia', 'Gbarnga', 175, ARRAY['MONTSERRADO','BONG'], true, '2024-01-01T00:00:00Z'),
  ('road-002', 'Gbarnga–Sanniquellie Highway', 'A2', 'highway', 'Gbarnga', 'Sanniquellie', 120, ARRAY['BONG','NIMBA'], true, '2024-01-01T00:00:00Z'),
  ('road-003', 'Monrovia–Buchanan Highway', 'B1', 'highway', 'Monrovia', 'Buchanan', 110, ARRAY['MONTSERRADO','MARGIBI','GRAND_BASSA'], true, '2024-01-01T00:00:00Z'),
  ('road-004', 'Monrovia–Robertsport Road', 'B2', 'primary', 'Monrovia', 'Robertsport', 90, ARRAY['MONTSERRADO','GRAND_CAPE_MOUNT'], true, '2024-01-01T00:00:00Z'),
  ('road-005', 'Buchanan–Cestos City Road', 'C1', 'secondary', 'Buchanan', 'Cestos City', 85, ARRAY['GRAND_BASSA','RIVER_CESS'], true, '2024-01-01T00:00:00Z'),
  ('road-006', 'Gbarnga–Voinjama Highway', 'A3', 'highway', 'Gbarnga', 'Voinjama', 200, ARRAY['BONG','LOFA'], true, '2024-01-01T00:00:00Z'),
  ('road-007', 'Cestos City–Greenville Road', 'C2', 'secondary', 'Cestos City', 'Greenville', 120, ARRAY['RIVER_CESS','SINOE'], true, '2024-01-01T00:00:00Z'),
  ('road-008', 'Sanniquellie–Zwedru Road', 'D1', 'primary', 'Sanniquellie', 'Zwedru', 130, ARRAY['NIMBA','GRAND_GEDEH'], true, '2024-01-01T00:00:00Z'),
  ('road-009', 'Greenville–Fish Town Road', 'D2', 'secondary', 'Greenville', 'Fish Town', 90, ARRAY['SINOE','RIVER_GEE'], true, '2024-01-01T00:00:00Z'),
  ('road-010', 'Zwedru–Harper Road', 'E1', 'primary', 'Zwedru', 'Harper', 160, ARRAY['GRAND_GEDEH','MARYLAND'], true, '2024-01-01T00:00:00Z'),
  ('road-011', 'Tubmanburg–Bopolu Road', 'B3', 'secondary', 'Tubmanburg', 'Bopolu', 45, ARRAY['BOMI','GBARPOLU'], true, '2024-01-01T00:00:00Z'),
  ('road-012', 'Monrovia–Kakata Highway', 'A1', 'highway', 'Monrovia', 'Kakata', 45, ARRAY['MONTSERRADO','MARGIBI'], true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. POLICE STATIONS (HQ + stations across counties)
-- ============================================================
INSERT INTO police_stations (id, name, county_code, address, latitude, longitude, phone, type, is_active, created_at) VALUES
  -- Montserrado
  ('ps-001', 'National Police HQ',     'MONTSERRADO', 'Capitol Hill, Monrovia',         6.3100, -10.7900, '+231-77-000-2001', 'hq', true, '2024-01-01T00:00:00Z'),
  ('ps-002', 'Monrovia Central Station','MONTSERRADO','Broad Street, Monrovia',         6.3150, -10.8000, '+231-77-000-2002', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-003', 'Bushrod Island Station',  'MONTSERRADO', 'Bushrod Island, Monrovia',       6.3500, -10.8200, '+231-77-000-2003', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-004', 'Paynesville Substation',  'MONTSERRADO', 'Paynesville, Monrovia',          6.2800, -10.7200, '+231-77-000-2004', 'substation', true, '2024-01-01T00:00:00Z'),
  ('ps-005', 'Sinkor Police Post',      'MONTSERRADO', 'Sinkor, Monrovia',               6.2900, -10.7600, '+231-77-000-2005', 'post', true, '2024-01-01T00:00:00Z'),
  -- Margibi
  ('ps-006', 'Kakata Police Station',   'MARGIBI', 'Kakata City',                       6.5200, -10.3500, '+231-77-000-2006', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-007', 'Harbel Substation',       'MARGIBI', 'Harbel, Firestone',                 6.4500, -10.3700, '+231-77-000-2007', 'substation', true, '2024-01-01T00:00:00Z'),
  -- Bong
  ('ps-008', 'Gbarnga Regional HQ',     'BONG',    'Gbarnga City',                      6.9958, -9.4714,  '+231-77-000-2008', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-009', 'Totota Substation',       'BONG',    'Totota Town',                       6.8500, -9.5500,  '+231-77-000-2009', 'substation', true, '2024-01-01T00:00:00Z'),
  -- Nimba
  ('ps-010', 'Sanniquellie Police Station', 'NIMBA', 'Sanniquellie',                    6.9700, -8.7400,  '+231-77-000-2010', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-011', 'Ganta Substation',         'NIMBA',   'Ganta Town',                       7.0500, -8.5800,  '+231-77-000-2011', 'substation', true, '2024-01-01T00:00:00Z'),
  -- Grand Bassa
  ('ps-012', 'Buchanan Police Station',  'GRAND_BASSA', 'Buchanan City',                 5.8800, -9.9800,  '+231-77-000-2012', 'station', true, '2024-01-01T00:00:00Z'),
  -- Grand Cape Mount
  ('ps-013', 'Robertsport Police Station','GRAND_CAPE_MOUNT', 'Robertsport City',        6.7486, -11.3678, '+231-77-000-2013', 'station', true, '2024-01-01T00:00:00Z'),
  -- Lofa
  ('ps-014', 'Voinjama Police Station',  'LOFA',   'Voinjama City',                     8.4200, -10.1500, '+231-77-000-2014', 'station', true, '2024-01-01T00:00:00Z'),
  ('ps-015', 'Foya Substation',          'LOFA',   'Foya Town',                         8.3500, -10.1500, '+231-77-000-2015', 'substation', true, '2024-01-01T00:00:00Z'),
  -- Grand Gedeh
  ('ps-016', 'Zwedru Police Station',    'GRAND_GEDEH', 'Zwedru City',                  6.0700, -8.1300,  '+231-77-000-2016', 'station', true, '2024-01-01T00:00:00Z'),
  -- Maryland
  ('ps-017', 'Harper Police Station',    'MARYLAND', 'Harper City',                     4.7500, -7.7500,  '+231-77-000-2017', 'station', true, '2024-01-01T00:00:00Z'),
  -- Sinoe
  ('ps-018', 'Greenville Police Station','SINOE',   'Greenville City',                  5.0300, -9.0300,  '+231-77-000-2018', 'station', true, '2024-01-01T00:00:00Z'),
  -- Bomi
  ('ps-019', 'Tubmanburg Police Station','BOMI',    'Tubmanburg City',                  6.8505, -10.7843, '+231-77-000-2019', 'station', true, '2024-01-01T00:00:00Z'),
  -- Gbarpolu
  ('ps-020', 'Bopolu Police Post',       'GBARPOLU', 'Bopolu City',                     7.0500, -10.4300, '+231-77-000-2020', 'post', true, '2024-01-01T00:00:00Z'),
  -- River Gee
  ('ps-021', 'Fish Town Police Station', 'RIVER_GEE', 'Fish Town',                      5.1300, -7.8700,  '+231-77-000-2021', 'station', true, '2024-01-01T00:00:00Z'),
  -- River Cess
  ('ps-022', 'Cestos City Police Post',  'RIVER_CESS', 'Cestos City',                   5.4600, -9.5800,  '+231-77-000-2022', 'post', true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. CHECKPOINTS
-- ============================================================
INSERT INTO checkpoints (id, name, county_code, road_name, latitude, longitude, is_permanent, hours, unit, phone, is_active, created_at) VALUES
  ('cp-001', 'Mount Barclay Checkpoint', 'MONTSERRADO', 'Monrovia–Gbarnga Highway', 6.3400, -10.6200, true, '24/7', 'Traffic Unit A', '+231-77-000-3001', true, '2024-01-01T00:00:00Z'),
  ('cp-002', 'Congo Town Checkpoint',   'MONTSERRADO', 'Monrovia–Buchanan Highway', 6.3000, -10.6800, true, '24/7', 'Traffic Unit B', '+231-77-000-3002', true, '2024-01-01T00:00:00Z'),
  ('cp-003', 'Kakata Entry Checkpoint', 'MARGIBI', 'Monrovia–Buchanan Highway',     6.5200, -10.3500, true, '06:00-22:00', 'Traffic Unit C', '+231-77-000-3003', true, '2024-01-01T00:00:00Z'),
  ('cp-004', 'Totota Checkpoint',       'BONG',    'Monrovia–Gbarnga Highway',      6.8500, -9.5500,  true, '24/7', 'Traffic Unit D', '+231-77-000-3004', true, '2024-01-01T00:00:00Z'),
  ('cp-005', 'Ganta Border Checkpoint', 'NIMBA',   'Ganta Road',                    7.0500, -8.5800,  true, '24/7', 'Border Patrol', '+231-77-000-3005', true, '2024-01-01T00:00:00Z'),
  ('cp-006', 'Buchanan Port Checkpoint','GRAND_BASSA', 'Buchanan Port Road',         5.8800, -9.9800,  true, '06:00-20:00', 'Port Security', '+231-77-000-3006', true, '2024-01-01T00:00:00Z'),
  ('cp-007', 'Bopolu Temporary CP',     'GBARPOLU', 'Tubmanburg–Bopolu Road',        7.0000, -10.4500, false, 'Variable', 'Patrol Unit', NULL, true, '2024-01-01T00:00:00Z'),
  ('cp-008', 'Voinjama Entry CP',       'LOFA',    'Gbarnga–Voinjama Highway',       8.4200, -10.1500, true, '06:00-22:00', 'Traffic Unit E', '+231-77-000-3008', true, '2024-01-01T00:00:00Z'),
  ('cp-009', 'Zwedru Junction CP',      'GRAND_GEDEH', 'Sanniquellie–Zwedru Road',   6.0700, -8.1300,  true, '06:00-22:00', 'Regional Patrol', '+231-77-000-3009', true, '2024-01-01T00:00:00Z'),
  ('cp-010', 'Harper Border CP',        'MARYLAND', 'Zwedru–Harper Road',            4.7500, -7.7500,  true, '24/7', 'Border Patrol', '+231-77-000-3010', true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. VIOLATION TYPES
-- ============================================================
INSERT INTO violation_types (id, code, name, description, fine_amount, penalty_points, severity, is_active, created_at) VALUES
  ('vt-001', 'SPEED',      'Speeding',                  'Exceeding posted speed limit',               5000.00,  3, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-002', 'RLIGHT',     'Running Red Light',         'Failing to stop at a red traffic signal',    8000.00,  4, 'serious',  true, '2024-01-01T00:00:00Z'),
  ('vt-003', 'ILLPARK',    'Illegal Parking',           'Parking in a prohibited area',              2500.00,  1, 'minor',    true, '2024-01-01T00:00:00Z'),
  ('vt-004', 'DRONGSIDE',  'Driving Against Traffic',    'Driving the wrong direction on a one-way', 10000.00,  5, 'critical', true, '2024-01-01T00:00:00Z'),
  ('vt-005', 'DANGOVER',   'Dangerous Overtaking',      'Overtaking in a dangerous manner',          7000.00,  4, 'serious',  true, '2024-01-01T00:00:00Z'),
  ('vt-006', 'RECKLESS',   'Reckless Driving',          'Operating a vehicle with willful disregard',15000.00,  6, 'critical', true, '2024-01-01T00:00:00Z'),
  ('vt-007', 'ILLUTURN',   'Illegal U-Turn',            'Making a U-turn where prohibited',          3000.00,  2, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-008', 'PHONE',      'Mobile Phone While Driving', 'Using a hand-held mobile device while driving', 6000.00, 3, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-009', 'NOSEBELT',   'No Seat Belt',              'Driver or passenger not wearing seat belt', 3000.00,  2, 'minor',    true, '2024-01-01T00:00:00Z'),
  ('vt-010', 'NOHELMET',   'No Helmet (Motorcycle)',     'Motorcycle rider without helmet',           3500.00,  2, 'minor',    true, '2024-01-01T00:00:00Z'),
  ('vt-011', 'OVERLOAD',   'Overloaded Vehicle',         'Vehicle exceeding weight or passenger limit', 8000.00, 3, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-012', 'BLOCKEMERG', 'Blocking Emergency Route',   'Blocking fire lane or ambulance route',    10000.00,  5, 'critical', true, '2024-01-01T00:00:00Z'),
  ('vt-013', 'NOLICENSE',  'No Valid License',           'Operating without valid driver license',    5000.00,  3, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-014', 'NOINSURANCE','No Insurance',              'Operating without valid insurance',         5000.00,  3, 'moderate', true, '2024-01-01T00:00:00Z'),
  ('vt-015', 'DUI',        'Driving Under Influence',    'Operating a vehicle under influence of alcohol or drugs', 25000.00, 6, 'critical', true, '2024-01-01T00:00:00Z'),
  ('vt-016', 'HITRUN',     'Hit and Run',               'Leaving the scene of an accident',         50000.00,  6, 'critical', true, '2024-01-01T00:00:00Z'),
  ('vt-017', 'NOEXPORT',   'Expired Registration',       'Operating with expired vehicle registration', 3000.00, 1, 'minor', true, '2024-01-01T00:00:00Z'),
  ('vt-018', 'NOMIRROR',   'No/Defective Mirror',       'Vehicle without required mirrors',          2000.00,  1, 'minor',    true, '2024-01-01T00:00:00Z'),
  ('vt-019', 'NOLIGHT',    'Defective Lights',           'Vehicle with defective head/taillights',    2000.00,  1, 'minor',    true, '2024-01-01T00:00:00Z'),
  ('vt-020', 'EXCESSLOAD', 'Excessive Load',             'Cargo exceeding vehicle dimensions',        6000.00,  3, 'moderate', true, '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. SAMPLE OFFICER PROFILES (Each row needs a real auth.uid)
--    NOTE: After running this, go to Authentication → Users
--    and manually assign roles matching these badge_numbers.
--    These are DEMO profiles — the actual auth.uid rows
--    are created when users sign up.
-- ============================================================
INSERT INTO profiles (id, email, full_name, role, badge_number, station, phone, is_active, department, division, created_at, updated_at) VALUES
  ('demo-admin-001',  'admin@trafficwatch.gov.lr',  'James T. Gbartea',   'system_administrator', 'ADM-001', 'National Police HQ', '+231-77-010-0001', true, 'Administration', 'IT & Systems', '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z'),
  ('demo-comm-001',   'commissioner@trafficwatch.gov.lr', 'Sarah K. Kollie', 'national_commissioner', 'COM-001', 'National Police HQ', '+231-77-010-0002', true, 'National Command', 'Office of the Commissioner', '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z'),
  ('demo-rcom-001',   'rcom.western@trafficwatch.gov.lr', 'John S. Mulbah', 'regional_commander', 'RCOM-001', 'National Police HQ', '+231-77-010-0003', true, 'Regional Command', 'Region 1 — Western', '2024-01-20T00:00:00Z', '2024-01-20T00:00:00Z'),
  ('demo-rcom-002',   'rcom.ncentral@trafficwatch.gov.lr', 'Amos K. Pewee', 'regional_commander', 'RCOM-002', 'Gbarnga Regional HQ', '+231-77-010-0004', true, 'Regional Command', 'Region 2 — North Central', '2024-01-20T00:00:00Z', '2024-01-20T00:00:00Z'),
  ('demo-tcom-001',   'tcom.monrovia@trafficwatch.gov.lr', 'Martha G. Suah', 'traffic_commander', 'TCOM-001', 'Monrovia Central Station', '+231-77-010-0005', true, 'Traffic Division', 'Monrovia Traffic Command', '2024-02-01T00:00:00Z', '2024-02-01T00:00:00Z'),
  ('demo-sup-001',    'sup.gbarnga@trafficwatch.gov.lr',  'Joseph N. Kerkula', 'police_supervisor', 'SUP-001', 'Gbarnga Regional HQ', '+231-77-010-0006', true, 'Operations', 'North Central Supervision', '2024-02-01T00:00:00Z', '2024-02-01T00:00:00Z'),
  ('demo-ofc-001',    'ofc.johnson@trafficwatch.gov.lr',  'Peter T. Johnson', 'traffic_officer', 'OFC-001', 'Monrovia Central Station', '+231-77-010-0007', true, 'Traffic Division', 'Patrol Unit A', '2024-02-15T00:00:00Z', '2024-02-15T00:00:00Z'),
  ('demo-ofc-002',    'ofc.flomo@trafficwatch.gov.lr',    'Alice K. Flomo',   'traffic_officer', 'OFC-002', 'Paynesville Substation', '+231-77-010-0008', true, 'Traffic Division', 'Patrol Unit B', '2024-02-15T00:00:00Z', '2024-02-15T00:00:00Z'),
  ('demo-ofc-003',    'ofc.tubman@trafficwatch.gov.lr',   'David S. Tubman',  'traffic_officer', 'OFC-003', 'Bushrod Island Station', '+231-77-010-0009', true, 'Traffic Division', 'Patrol Unit C', '2024-03-01T00:00:00Z', '2024-03-01T00:00:00Z'),
  ('demo-ofc-004',    'ofc.nyemah@trafficwatch.gov.lr',   'Grace P. Nyemah',  'traffic_officer', 'OFC-004', 'Kakata Police Station', '+231-77-010-0010', true, 'Traffic Division', 'Margibi Patrol', '2024-03-01T00:00:00Z', '2024-03-01T00:00:00Z'),
  ('demo-inv-001',    'inv.kollie@trafficwatch.gov.lr',   'Emmanuel Kollie',  'investigator',    'INV-001', 'National Police HQ', '+231-77-010-0011', true, 'CID', 'Traffic Investigations', '2024-02-01T00:00:00Z', '2024-02-01T00:00:00Z'),
  ('demo-evi-001',    'evid.leo@trafficwatch.gov.lr',     'Catherine Leo',    'evidence_officer', 'EVI-001', 'National Police HQ', '+231-77-010-0012', true, 'Evidence Division', 'Digital Evidence Center', '2024-02-01T00:00:00Z', '2024-02-01T00:00:00Z'),
  ('demo-aud-001',    'audit.kromah@trafficwatch.gov.lr', 'Musu V. Kromah',   'system_auditor',   'AUD-001', 'National Police HQ', '+231-77-010-0013', true, 'Internal Affairs', 'Audit Division', '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. SAMPLE VEHICLES
-- ============================================================
INSERT INTO vehicles (id, license_plate, normalized_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_color, vin, is_stolen, is_wanted) VALUES
  ('veh-001', 'A1234B',  'A1234B',  'sedan',    'Toyota',     'Camry 2020',       'White',   'JTDBE32KX03001234', false, false),
  ('veh-002', 'C5678D',  'C5678D',  'suv',      'Honda',      'CR-V 2021',        'Blue',    '5J6RE4H33AL012345', false, false),
  ('veh-003', 'E9012F',  'E9012F',  'sedan',    'Toyota',     'Corolla 2019',     'Silver',  '2T1BURHE0KC012346', false, false),
  ('veh-004', 'G3456H',  'G3456H',  'pickup',   'Ford',       'Ranger 2022',      'Red',     '1FTER4FH3LLA01234', false, false),
  ('veh-005', 'I7890J',  'I7890J',  'sedan',    'Nissan',     'Altima 2020',      'Black',   '1N4AL3AP9JC012345', false, false),
  ('veh-006', 'K1234L',  'K1234L',  'motorcycle','Yamaha',    'MT-07 2021',       'Gray',    'JYARN48E3CA012345', false, false),
  ('veh-007', 'M5678N',  'M5678N',  'suv',      'Toyota',     'Land Cruiser 2023','White',   'JTMHU01JX40012345', false, false),
  ('veh-008', 'O9012P',  'O9012P',  'bus',      'Toyota',     'Coaster 2020',     'White/Blue','JTGFK420000123456', false, false),
  ('veh-009', 'Q3456R',  'Q3456R',  'sedan',    'Mercedes',   'C300 2022',        'Black',   'WDDGF4HBXCR012345', false, false),
  ('veh-010', 'S7890T',  'S7890T',  'pickup',   'Toyota',     'Hilux 2021',       'Gray',    'MR0HA3CD401234567', false, false),
  ('veh-011', 'U1234V',  'U1234V',  'minivan',  'Toyota',     'Hiace 2020',       'White',   'JTHYE24M100123456', false, false),
  ('veh-012', 'W5678X',  'W5678X',  'sedan',    'Hyundai',    'Elantra 2021',     'Red',     'KMHDH4AE3EU012345', false, false),
  ('veh-013', 'Y9012Z',  'Y9012Z',  'suv',      'Mitsubishi', 'Montero 2019',     'Green',   'JMYLNV31W6J012345', false, false),
  ('veh-014', 'AA1234',  'AA1234',  'truck',    'Isuzu',      'NPR 2021',         'White',   'JALCAB310S7001234', false, false),
  ('veh-015', 'BB5678',  'BB5678',  'motorcycle','Honda',     'CB125 2022',       'Red/Black','LAL4CF168C3012345', false, false),
  -- Stolen vehicle (for demo of wanted alerts)
  ('veh-099', 'XX9999Y', 'XX9999Y', 'sedan',    'Toyota',     'Camry 2022',       'Black',   '4T1BD1FK5CU012345', true,  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. STOLEN VEHICLE RECORD (for wanted vehicle demo)
-- ============================================================
INSERT INTO stolen_vehicles (id, plate_number, make, model, color, year, vin, reported_at, reported_by, status, jurisdiction, case_number, owner_name, owner_contact, created_at, updated_at) VALUES
  ('sv-001', 'XX9999Y', 'Toyota', 'Camry', 'Black', 2022, '4T1BD1FK5CU012345', '2024-06-15T10:30:00Z', 'demo-ofc-001', 'active', 'Montserrado', 'STL-2024-001', 'James K. Sumo', '+231-77-050-0001', '2024-06-15T10:30:00Z', '2024-06-15T10:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. SAMPLE INCIDENTS (30 incidents across various counties)
-- ============================================================
INSERT INTO incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_plate_confirmed, vehicle_type, vehicle_color, severity, status, is_synced, officer_notes, county_code, created_at, updated_at) VALUES
  ('INC-2024-001', 'demo-ofc-001', 'vt-001', 'Speeding on Broad Street',        'Vehicle clocked at 85 km/h in a 40 km/h zone on Broad Street, Monrovia.',                        6.3150, -10.8000, 'Broad Street, Monrovia', 'A1234B', true, 'sedan', 'White', 'moderate', 'closed', true, 'Cited driver. Driver paid fine on the spot.', 'MONTSERRADO', '2024-07-15T08:30:00Z', '2024-07-15T09:00:00Z'),
  ('INC-2024-002', 'demo-ofc-002', 'vt-002', 'Red Light Violation at UN Drive', 'Vehicle ran red light at the UN Drive intersection, nearly causing collision.',                    6.3000, -10.7900, 'UN Drive, Monrovia',     'C5678D', true, 'suv',   'Blue',  'serious',  'closed', true, 'Witnesses confirmed. Issued citation.', 'MONTSERRADO', '2024-07-16T09:15:00Z', '2024-07-16T10:00:00Z'),
  ('INC-2024-003', 'demo-ofc-001', 'vt-003', 'Illegal Parking at Waterside Market','Vehicle parked in a no-parking zone at Waterside Market, obstructing pedestrian access.',        6.3200, -10.8100, 'Waterside Market, Monrovia', 'E9012F', false, 'sedan',  'Silver','minor',    'closed', true, 'Vehicle impounded. Released after payment.', 'MONTSERRADO','2024-07-17T11:00:00Z','2024-07-17T11:30:00Z'),
  ('INC-2024-004', 'demo-ofc-003', 'vt-001', 'Speeding on Bushrod Island',      'Motorcycle speeding on Bushrod Island Highway, weaving through traffic.',                         6.3500, -10.8200, 'Bushrod Island Highway', 'K1234L', true, 'motorcycle', 'Gray','moderate', 'closed', true, 'Motorcycle impounded. Rider cited.', 'MONTSERRADO',  '2024-07-18T14:00:00Z','2024-07-18T14:45:00Z'),
  ('INC-2024-005', 'demo-ofc-004', 'vt-009', 'No Seat Belt — Kakata Highway',    'Driver and passenger not wearing seat belts on Kakata Highway.',                                 6.5200, -10.3500, 'Kakata Highway, Margibi', 'G3456H', true, 'pickup', 'Red','minor', 'closed', true, 'Educational notice issued with warning.', 'MARGIBI',     '2024-07-19T07:30:00Z','2024-07-19T08:00:00Z'),
  ('INC-2024-006', 'demo-ofc-001', 'vt-006', 'Reckless Driving on Tubman Blvd', 'Driver observed swerving across lanes on Tubman Boulevard, endangering other motorists.',            6.3100, -10.7800, 'Tubman Blvd, Monrovia',   'Q3456R', true, 'sedan', 'Black','critical', 'investigating', true, 'Witness statements being collected.', 'MONTSERRADO','2024-07-20T16:45:00Z','2024-07-20T17:30:00Z'),
  ('INC-2024-007', 'demo-ofc-002', 'vt-008', 'Mobile Phone Use While Driving',  'Driver spotted using phone on video call while driving on the Somalia Drive Road.',                 6.3200, -10.7600, 'Somalia Drive, Monrovia', 'I7890J', true, 'sedan', 'Black','moderate','under_review', true, 'Video evidence captured by patrol camera.', 'MONTSERRADO','2024-07-21T10:00:00Z','2024-07-21T10:30:00Z'),
  ('INC-2024-008', 'demo-ofc-004', 'vt-010', 'Motorcycle Without Helmet',       'Motorcycle rider without helmet on Monrovia–Buchanan Highway, Kakata.',                             6.4800, -10.3800, 'Kakata Highway',         'BB5678', true, 'motorcycle', 'Red','minor', 'closed', true, 'Rider issued warning and purchased helmet.', 'MARGIBI','2024-07-22T09:15:00Z','2024-07-22T09:45:00Z'),
  ('INC-2024-009', 'demo-ofc-003', 'vt-011', 'Overloaded Vehicle — Bushrod Island', 'Cargo truck loaded beyond height and weight limits on Bushrod Island.',                          6.3600, -10.8300, 'Bushrod Island',         'AA1234', true, 'truck', 'White','moderate', 'assigned', true, 'Truck ordered to unload excess cargo.', 'MONTSERRADO','2024-07-23T11:30:00Z','2024-07-23T12:15:00Z'),
  ('INC-2024-010', 'demo-ofc-001', 'vt-015', 'DUI Suspect — Sinkor',             'Driver suspected of DUI after erratic driving on 15th Street, Sinkor. Breathalyzer administered.',   6.2900, -10.7600, '15th Street, Sinkor',    'S7890T', true, 'pickup', 'Gray','critical', 'investigating', true, 'Breathalyzer reading: 0.12%. Detained.', 'MONTSERRADO','2024-07-24T22:00:00Z','2024-07-24T23:30:00Z'),
  ('INC-2024-011', 'demo-ofc-002', 'vt-002', 'Red Light — Paynesville',          'SUV ran red light at the ELWA Junction, Paynesville.',                                            6.2800, -10.7200, 'ELWA Junction, Paynesville','M5678N', true, 'suv', 'White','serious', 'submitted', true, 'Camera footage captured.', 'MONTSERRADO','2024-07-25T08:00:00Z','2024-07-25T08:20:00Z'),
  ('INC-2024-012', 'demo-ofc-004', 'vt-001', 'Speeding — Harbel Area',           'Vehicle speeding on the Firestone Plantation road, Harbel.',                                      6.4500, -10.3700, 'Harbel, Firestone',      'Y9012Z', true, 'suv', 'Green','moderate', 'closed', true, '', 'MARGIBI','2024-07-26T07:15:00Z','2024-07-26T07:45:00Z'),
  ('INC-2024-013', 'demo-ofc-001', 'vt-007', 'Illegal U-Turn — CBD Monrovia',    'Vehicle made illegal U-turn on Randall Street, almost causing collision.',                         6.3100, -10.8000, 'Randall Street, Monrovia','U1234V', true, 'minivan', 'White','moderate', 'under_review', true, '', 'MONTSERRADO','2024-07-27T13:30:00Z','2024-07-27T14:00:00Z'),
  ('INC-2024-014', 'demo-ofc-003', 'vt-016', 'Hit and Run — Bushrod Island',     'Driver struck pedestrian and fled the scene on Bushrod Island Highway.',                           6.3400, -10.8400, 'Bushrod Island',         NULL,  false, NULL,        NULL,'critical', 'escalated', true, 'Victim hospitalized. CCT footage being reviewed. Suspect vehicle: white pickup.', 'MONTSERRADO','2024-07-28T19:00:00Z','2024-07-28T20:00:00Z'),
  ('INC-2024-015', 'demo-ofc-002', 'vt-005', 'Dangerous Overtaking — Tubmanburg Road','Bus overtook on a blind curve on Tubmanburg Road near Klay Junction.',                         6.8500, -10.7843, 'Klay Junction, Bomi',    'O9012P', true, 'bus', 'White/Blue','serious', 'assigned', true, '', 'BOMI','2024-07-29T10:30:00Z','2024-07-29T11:00:00Z'),
  ('INC-2024-016', 'demo-ofc-004', 'vt-013', 'Unlicensed Driver — Kakata',       'Driver unable to produce valid driver license during routine traffic stop.',                       6.5300, -10.3600, 'Kakata City Center',     'W5678X', true, 'sedan', 'Red','moderate', 'closed', true, 'Vehicle impounded. Driver summoned to court.', 'MARGIBI','2024-07-30T09:00:00Z','2024-07-30T09:30:00Z'),
  ('INC-2024-017', 'demo-ofc-001', 'vt-004', 'Wrong Way — One-Way Street',       'Vehicle drove the wrong way down a one-way street on Ashmun Street, Monrovia.',                     6.3150, -10.7950, 'Ashmun Street',          'C5678D', true, 'suv', 'Blue','critical', 'confirmed', true, 'Driver claimed unfamiliar with Monrovia streets.', 'MONTSERRADO','2024-08-01T11:00:00Z','2024-08-01T11:30:00Z'),
  ('INC-2024-018', 'demo-ofc-003', 'vt-012', 'Blocking Emergency Lane',           'Vehicle parked in ambulance access lane at JFK Medical Center.',                                  6.3000, -10.7800, 'JFK Medical Center',     'E9012F', true, 'sedan', 'Silver','critical', 'resolved', true, 'Vehicle towed at owner expense.', 'MONTSERRADO','2024-08-02T07:30:00Z','2024-08-02T08:00:00Z'),
  ('INC-2024-019', 'demo-ofc-001', 'vt-001', 'Speeding — Gbarnga Highway',       'Vehicle clocked at 120 km/h on the Monrovia–Gbarnga Highway near Totota.',                          6.8500, -9.5500,  'Totota, Bong',           'G3456H', true, 'pickup', 'Red','serious', 'assigned', true, 'Driver fined and license endorsed.', 'BONG','2024-08-03T14:00:00Z','2024-08-03T14:30:00Z'),
  ('INC-2024-020', 'demo-ofc-004', 'vt-014', 'No Insurance — Margibi',           'Vehicle operating without valid insurance on the Kakata–Monrovia Highway.',                         6.5000, -10.3400, 'Gibibi, Margibi',        'A1234B', true, 'sedan', 'White','moderate', 'closed', true, 'Driver cited and insurance obtained.', 'MARGIBI','2024-08-04T16:00:00Z','2024-08-04T16:30:00Z'),
  -- Additional incidents across different counties
  ('INC-2024-021', 'demo-ofc-002', 'vt-003', 'Illegal Parking — Buchanan Port',  'Multiple vehicles parked illegally outside Buchanan port entrance.',                               5.8800, -9.9800,  'Buchanan Port',          NULL, false, NULL, NULL, 'minor', 'submitted', true, '', 'GRAND_BASSA','2024-08-05T08:00:00Z','2024-08-05T08:30:00Z'),
  ('INC-2024-022', 'demo-ofc-001', 'vt-020', 'Excessive Load — Robertsport',     'Pickup truck carrying load exceeding bed dimensions on Robertsport Highway.',                       6.7486, -11.3678, 'Robertsport Highway',     'S7890T', true, 'pickup', 'Gray','moderate', 'under_review', true, '', 'GRAND_CAPE_MOUNT','2024-08-06T10:15:00Z','2024-08-06T11:00:00Z'),
  ('INC-2024-023', 'demo-ofc-003', 'vt-009', 'Seat Belt Violation — Voinjama',   'Multiple occupants without seat belts on Gbarnga–Voinjama Highway.',                               8.4200, -10.1500, 'Voinjama, Lofa',         'M5678N', true, 'suv', 'White','minor', 'resolved', true, 'Warning issued.', 'LOFA','2024-08-07T12:00:00Z','2024-08-07T12:30:00Z'),
  ('INC-2024-024', 'demo-ofc-004', 'vt-001', 'Speeding — Sanniquellie',          'Vehicle speeding through Sanniquellie market area.',                                               6.9700, -8.7400,  'Sanniquellie, Nimba',    'I7890J', true, 'sedan', 'Black','moderate', 'assigned', true, '', 'NIMBA','2024-08-08T09:30:00Z','2024-08-08T10:00:00Z'),
  ('INC-2024-025', 'demo-ofc-001', 'vt-019', 'Defective Lights — Zwedru',        'Truck operating without functioning taillights on Zwedru–Sanniquellie Road.',                       6.0700, -8.1300,  'Zwedru, Grand Gedeh',    'AA1234', true, 'truck', 'White','minor', 'closed', true, 'Repair order issued.', 'GRAND_GEDEH','2024-08-09T18:30:00Z','2024-08-09T19:00:00Z'),
  ('INC-2024-026', 'demo-ofc-002', 'vt-006', 'Reckless Driving — Harper',        'Vehicle driving erratically on Harper Beach Road, endangering pedestrians.',                        4.7500, -7.7500,  'Harper, Maryland',       'Q3456R', true, 'sedan', 'Black','critical', 'investigating', true, 'Multiple witness statements.', 'MARYLAND','2024-08-10T20:00:00Z','2024-08-10T20:45:00Z'),
  ('INC-2024-027', 'demo-ofc-003', 'vt-010', 'No Helmet — Greenville',           'Two motorcycle riders without helmets on Greenville main street.',                                 5.0300, -9.0300,  'Greenville, Sinoe',      'K1234L', true, 'motorcycle', 'Gray','minor', 'closed', true, 'Warnings issued to both riders.', 'SINOE','2024-08-11T14:30:00Z','2024-08-11T15:00:00Z'),
  ('INC-2024-028', 'demo-ofc-004', 'vt-011', 'Overloaded Vehicle — Fish Town',   'Passenger minivan carrying 18 persons where capacity is 12.',                                      5.1300, -7.8700,  'Fish Town, River Gee',    'U1234V', true, 'minivan', 'White','moderate', 'under_review', true, '', 'RIVER_GEE','2024-08-12T11:00:00Z','2024-08-12T11:30:00Z'),
  ('INC-2024-029', 'demo-ofc-001', 'vt-017', 'Expired Registration — Cestos City','Vehicle operating with registration expired 6 months on Cestos City main road.',                   5.4600, -9.5800,  'Cestos City',             'W5678X', true, 'sedan', 'Red','minor', 'resolved', true, 'Renewal notice issued.', 'RIVER_CESS','2024-08-13T09:00:00Z','2024-08-13T09:30:00Z'),
  ('INC-2024-030', 'demo-ofc-002', 'vt-008', 'Phone While Driving — Bopolu',     'Driver using mobile phone while driving on Bopolu–Tubmanburg Road.',                               7.0500, -10.4300, 'Bopolu, Gbarpolu',        'Y9012Z', true, 'suv', 'Green','moderate', 'closed', true, '', 'GBARPOLU','2024-08-14T16:00:00Z','2024-08-14T16:30:00Z'),
  -- Incident with stolen vehicle
  ('INC-2024-031', 'demo-ofc-001', 'vt-006', 'Stolen Vehicle Recovery Attempt',  'Traffic stop identified stolen vehicle XX9999Y on Tubman Blvd. Suspect fled on foot.',              6.3100, -10.7800, 'Tubman Blvd, Monrovia',  'XX9999Y', true, 'sedan', 'Black','critical', 'escalated', true, 'Stolen vehicle recovered. Suspect at large. Wanted alert triggered.', 'MONTSERRADO','2024-08-15T23:00:00Z','2024-08-15T23:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. INCIDENT VIOLATIONS (association records)
-- ============================================================
INSERT INTO incident_violations (id, incident_id, violation_type_id, severity, description, created_at) VALUES
  ('iv-001', 'INC-2024-001', 'vt-001', 'moderate', 'Speed: 85 km/h in 40 km/h zone',                    '2024-07-15T08:30:00Z'),
  ('iv-002', 'INC-2024-002', 'vt-002', 'serious',  'Red light violation at UN Drive',                    '2024-07-16T09:15:00Z'),
  ('iv-003', 'INC-2024-003', 'vt-003', 'minor',    'Illegal parking Waterside Market',                   '2024-07-17T11:00:00Z'),
  ('iv-004', 'INC-2024-004', 'vt-001', 'moderate', 'Motorcycle speeding on Bushrod Island',              '2024-07-18T14:00:00Z'),
  ('iv-005', 'INC-2024-005', 'vt-009', 'minor',    'No seat belt driver and passenger',                  '2024-07-19T07:30:00Z'),
  ('iv-006', 'INC-2024-006', 'vt-006', 'critical', 'Reckless driving, swerving across lanes',            '2024-07-20T16:45:00Z'),
  ('iv-007', 'INC-2024-007', 'vt-008', 'moderate', 'Mobile phone video call while driving',              '2024-07-21T10:00:00Z'),
  ('iv-008', 'INC-2024-008', 'vt-010', 'minor',    'Motorcycle rider without helmet',                    '2024-07-22T09:15:00Z'),
  ('iv-009', 'INC-2024-009', 'vt-011', 'moderate', 'Cargo truck overloaded',                             '2024-07-23T11:30:00Z'),
  ('iv-010', 'INC-2024-010', 'vt-015', 'critical', 'DUI: Breathalyzer 0.12%',                           '2024-07-24T22:00:00Z'),
  ('iv-011', 'INC-2024-011', 'vt-002', 'serious',  'Suv ran red light ELWA Junction',                    '2024-07-25T08:00:00Z'),
  ('iv-012', 'INC-2024-017', 'vt-004', 'critical', 'Wrong-way driving on one-way street',                '2024-08-01T11:00:00Z'),
  ('iv-013', 'INC-2024-018', 'vt-012', 'critical', 'Blocking ambulance access at JFK',                   '2024-08-02T07:30:00Z'),
  ('iv-014', 'INC-2024-019', 'vt-001', 'serious',  'Speed 120km/h on Gbarnga Highway',                   '2024-08-03T14:00:00Z'),
  ('iv-015', 'INC-2024-014', 'vt-016', 'critical', 'Hit and run pedestrian incident',                    '2024-07-28T19:00:00Z'),
  ('iv-016', 'INC-2024-026', 'vt-006', 'critical', 'Reckless driving near pedestrians',                  '2024-08-10T20:00:00Z'),
  ('iv-017', 'INC-2024-015', 'vt-005', 'serious',  'Dangerous overtaking on blind curve',                 '2024-07-29T10:30:00Z'),
  ('iv-018', 'INC-2024-031', 'vt-006', 'critical', 'Attempted recovery of stolen vehicle, suspect fled', '2024-08-15T23:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. INCIDENT ASSIGNMENTS
-- ============================================================
INSERT INTO incident_assignments (id, incident_id, assigned_to, assigned_by, role, notes, is_active, assigned_at) VALUES
  ('ia-001', 'INC-2024-006', 'demo-inv-001', 'demo-tcom-001', 'investigator', 'Review CCTV footage for vehicle identification', true, '2024-07-21T08:00:00Z'),
  ('ia-002', 'INC-2024-010', 'demo-inv-001', 'demo-tcom-001', 'investigator', 'Process DUI evidence and coordinate with prosecutor', true, '2024-07-25T09:00:00Z'),
  ('ia-003', 'INC-2024-014', 'demo-inv-001', 'demo-sup-001',  'investigator', 'Priority investigation — hit and run with injuries', true, '2024-07-29T08:00:00Z'),
  ('ia-004', 'INC-2024-026', 'demo-inv-001', 'demo-rcom-001', 'investigator', 'Coordinate with Maryland county office', true, '2024-08-11T09:00:00Z'),
  ('ia-005', 'INC-2024-019', 'demo-ofc-001', 'demo-sup-001',  'reviewer', 'Review dashboard camera evidence for speed verification', true, '2024-08-04T10:00:00Z'),
  ('ia-006', 'INC-2024-031', 'demo-inv-001', 'demo-tcom-001', 'investigator', 'Coordinate stolen vehicle recovery documentation and suspect search', true, '2024-08-16T07:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. INCIDENT LOGS (audit trail for key incidents)
-- ============================================================
INSERT INTO incident_logs (id, incident_id, action, performed_by, details, created_at) VALUES
  ('il-001', 'INC-2024-001', 'created',    'demo-ofc-001', '{"method":"manual","device":"mobile"}',         '2024-07-15T08:30:00Z'),
  ('il-002', 'INC-2024-001', 'status_change', 'demo-ofc-001', '{"from":"submitted","to":"closed"}',         '2024-07-15T09:00:00Z'),
  ('il-003', 'INC-2024-006', 'created',    'demo-ofc-001', '{"method":"manual","device":"mobile"}',         '2024-07-20T16:45:00Z'),
  ('il-004', 'INC-2024-006', 'assigned',   'demo-tcom-001', '{"to":"demo-inv-001","role":"investigator"}', '2024-07-21T08:00:00Z'),
  ('il-005', 'INC-2024-006', 'status_change', 'demo-tcom-001', '{"from":"submitted","to":"investigating"}', '2024-07-21T08:00:00Z'),
  ('il-006', 'INC-2024-010', 'created',    'demo-ofc-001', '{"method":"manual","device":"mobile"}',         '2024-07-24T22:00:00Z'),
  ('il-007', 'INC-2024-010', 'evidence_added', 'demo-ofc-001', '{"type":"photo","count":2}',                '2024-07-24T23:30:00Z'),
  ('il-008', 'INC-2024-014', 'created',    'demo-ofc-003', '{"method":"manual","device":"mobile"}',         '2024-07-28T19:00:00Z'),
  ('il-009', 'INC-2024-014', 'escalated',  'demo-sup-001', '{"reason":"Hit and run with injuries"}',        '2024-07-29T08:00:00Z'),
  ('il-010', 'INC-2024-031', 'created',    'demo-ofc-001', '{"method":"manual","device":"mobile"}',         '2024-08-15T23:00:00Z'),
  ('il-011', 'INC-2024-031', 'wanted_alert_triggered', 'demo-ofc-001', '{"plate":"XX9999Y","status":"active"}', '2024-08-15T23:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. SAMPLE EVIDENCE METADATA (no actual files — metadata only)
-- ============================================================
INSERT INTO evidence (id, incident_id, type, file_url, description, file_size, mime_type, is_offline_capture, ai_analysis_requested, ai_analysis_completed, officer_id, captured_at, capture_lat, capture_lng, device_info, sha256_hash, evidence_status, source, uploaded_at, updated_at) VALUES
  ('ev-001', 'INC-2024-001', 'photo',    NULL, 'Speed gun reading photo — Broad Street',         245760, 'image/jpeg', false, false, false, 'demo-ofc-001', '2024-07-15T08:30:00Z', 6.3150, -10.8000, 'iPhone 15 Pro — Speed Laser', 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'original', 'mobile_capture', '2024-07-15T08:35:00Z', '2024-07-15T08:35:00Z'),
  ('ev-002', 'INC-2024-002', 'photo',    NULL, 'Red light violation photo — UN Drive',           184320, 'image/jpeg', false, false, false, 'demo-ofc-002', '2024-07-16T09:15:00Z', 6.3000, -10.7900, 'Samsung Galaxy S24', 'b4c3d2e1f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'original', 'mobile_capture', '2024-07-16T09:20:00Z', '2024-07-16T09:20:00Z'),
  ('ev-003', 'INC-2024-006', 'video',    NULL, 'Dashcam footage — reckless driving Tubman Blvd',  5242880,'video/mp4', false, true,  true,  'demo-ofc-001', '2024-07-20T16:45:00Z', 6.3100, -10.7800, 'Dashcam VIOFO A129 Pro', 'c5d4e3f2a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'original', 'mobile_capture', '2024-07-20T16:50:00Z', '2024-07-20T16:50:00Z'),
  ('ev-004', 'INC-2024-007', 'video',    NULL, 'Patrol camera — phone use while driving',         3145728,'video/mp4', false, true,  true,  'demo-ofc-002', '2024-07-21T10:00:00Z', 6.3200, -10.7600, 'AXON Body 3 Camera', 'd6e5f4a3b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'original', 'body_camera', '2024-07-21T10:05:00Z', '2024-07-21T10:05:00Z'),
  ('ev-005', 'INC-2024-010', 'photo',    NULL, 'Breathalyzer reading — DUI suspect',              122880, 'image/jpeg', false, false, false, 'demo-ofc-001', '2024-07-24T22:30:00Z', 6.2900, -10.7600, 'iPhone 15 Pro', 'e7f6a5b4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'original', 'mobile_capture', '2024-07-24T22:35:00Z', '2024-07-24T22:35:00Z'),
  ('ev-006', 'INC-2024-010', 'photo',    NULL, 'DUI suspect vehicle photo',                       245760, 'image/jpeg', false, false, false, 'demo-ofc-001', '2024-07-24T22:35:00Z', 6.2900, -10.7600, 'iPhone 15 Pro', 'f8a7b6c5d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'original', 'mobile_capture', '2024-07-24T22:40:00Z', '2024-07-24T22:40:00Z'),
  ('ev-007', 'INC-2024-014', 'photo',    NULL, 'Hit and run scene photo — road markings',         307200, 'image/jpeg', false, false, false, 'demo-ofc-003', '2024-07-28T19:15:00Z', 6.3400, -10.8400, 'Body Camera', 'a9b8c7d6e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'original', 'body_camera', '2024-07-28T19:20:00Z', '2024-07-28T19:20:00Z'),
  ('ev-008', 'INC-2024-014', 'photo',    NULL, 'Victim vehicle damage photo',                     245760, 'image/jpeg', false, false, false, 'demo-ofc-003', '2024-07-28T19:20:00Z', 6.3400, -10.8400, 'Body Camera', 'b0c9d8e7f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'original', 'body_camera', '2024-07-28T19:25:00Z', '2024-07-28T19:25:00Z'),
  ('ev-009', 'INC-2024-031', 'photo',    NULL, 'Stolen vehicle photo — recovered',                204800, 'image/jpeg', false, false, false, 'demo-ofc-001', '2024-08-15T23:10:00Z', 6.3100, -10.7800, 'iPhone 15 Pro', 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', 'original', 'mobile_capture', '2024-08-15T23:15:00Z', '2024-08-15T23:15:00Z'),
  ('ev-010', 'INC-2024-019', 'photo',    NULL, 'Speed radar reading — Totota checkpoint',         184320, 'image/jpeg', false, false, false, 'demo-ofc-001', '2024-08-03T14:05:00Z', 6.8500, -9.5500,  'SpeedLaser Pro III', 'd2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1', 'original', 'mobile_capture', '2024-08-03T14:10:00Z', '2024-08-03T14:10:00Z'),
  ('ev-011', 'INC-2024-015', 'photo',    NULL, 'Bus overtaking on blind curve',                   307200, 'image/jpeg', false, true,  true,  'demo-ofc-002', '2024-07-29T10:35:00Z', 6.8500, -10.7843, 'Nikon D7500', 'e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', 'original', 'officer_camera', '2024-07-29T10:40:00Z', '2024-07-29T10:40:00Z'),
  ('ev-012', 'INC-2024-011', 'video',    NULL, 'Traffic light camera footage — ELWA Junction',    8388608,'video/mp4', false, true,  true,  NULL,          '2024-07-25T07:55:00Z', 6.2800, -10.7200, 'Traffic Camera TC-Elwa-01', 'f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', 'original', 'camera_footage', '2024-07-25T08:00:00Z', '2024-07-25T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. CHAIN OF CUSTODY EVENTS
-- ============================================================
INSERT INTO evidence_custody (id, evidence_id, action, performed_by, from_officer, to_officer, ip_address, user_agent, details, created_at) VALUES
  ('cst-001', 'ev-001', 'uploaded',    'demo-ofc-001', NULL, NULL, '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"source":"mobile_app"}', '2024-07-15T08:35:00Z'),
  ('cst-002', 'ev-003', 'uploaded',    'demo-ofc-001', NULL, NULL, '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"source":"mobile_app"}', '2024-07-20T16:50:00Z'),
  ('cst-003', 'ev-003', 'viewed',      'demo-tcom-001', NULL, NULL, '10.0.0.50', 'TrafficWatch Web/Chrome', '{}', '2024-07-21T08:05:00Z'),
  ('cst-004', 'ev-003', 'analyzed',    'demo-evi-001', NULL, 'demo-evi-001', NULL, NULL, '{"ai_analysis_id":"ai-001"}', '2024-07-21T08:30:00Z'),
  ('cst-005', 'ev-004', 'uploaded',    'demo-ofc-002', NULL, NULL, '192.168.1.101', 'TrafficWatch Mobile/2.0', '{"source":"body_camera"}', '2024-07-21T10:05:00Z'),
  ('cst-006', 'ev-005', 'uploaded',    'demo-ofc-001', NULL, NULL, '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"source":"mobile_app"}', '2024-07-24T22:40:00Z'),
  ('cst-007', 'ev-007', 'uploaded',    'demo-ofc-003', NULL, NULL, '192.168.1.102', 'TrafficWatch Mobile/2.0', '{"source":"body_camera"}', '2024-07-28T19:25:00Z'),
  ('cst-008', 'ev-007', 'transferred', 'demo-sup-001', 'demo-ofc-003', 'demo-inv-001', '10.0.0.51', 'TrafficWatch Web/Chrome', '{"reason":"Evidence transferred to investigating officer"}', '2024-07-29T08:10:00Z'),
  ('cst-009', 'ev-009', 'uploaded',    'demo-ofc-001', NULL, NULL, '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"source":"mobile_app"}', '2024-08-15T23:15:00Z'),
  ('cst-010', 'ev-009', 'viewed',      'demo-inv-001', NULL, NULL, '10.0.0.52', 'TrafficWatch Web/Firefox', '{}', '2024-08-16T07:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. SAMPLE AI ANALYSES
-- ============================================================
INSERT INTO ai_analyses (id, incident_id, evidence_id, provider_id, status, violation_type, confidence_score, detection_timestamp, vehicle_description, vehicle_type, vehicle_color, license_plate, license_plate_confidence, detected_objects, violations, ai_summary, severity, processing_time_ms, recommended_review, is_confirmed, reviewed_by, reviewed_at, officer_notes, created_at) VALUES
  ('ai-001', 'INC-2024-006', 'ev-003', 'vly', 'completed', 'reckless_driving', 0.87, '2024-07-21T08:30:00Z', 'Black Mercedes C300 sedan', 'sedan', 'Black', 'Q3456R', 0.92, '["car","person","traffic_light","road_marking"]', '[{"type":"lane_departure","confidence":0.91},{"type":"erratic_movement","confidence":0.84}]', 'AI analysis of dashcam footage shows vehicle repeatedly crossing lane markings and swerving through traffic. License plate Q3456R identified with high confidence.', 'serious', 12450, true, false, NULL, NULL, NULL, '2024-07-21T08:30:00Z'),
  ('ai-002', 'INC-2024-007', 'ev-004', 'vly', 'completed', 'mobile_phone_use',  0.93, '2024-07-21T10:30:00Z', 'Black Nissan Altima sedan', 'sedan', 'Black', 'I7890J', 0.95, '["car","person","mobile_phone","windshield"]', '[{"type":"phone_use","confidence":0.93},{"type":"device_type","value":"smartphone"}]', 'AI detected driver holding and operating a mobile phone while vehicle was in motion on Somalia Drive. License plate I7890J identified.', 'moderate', 8920,  false, true, 'demo-ofc-002', '2024-07-21T11:00:00Z', 'AI detection matches my observations. Confirmed.', '2024-07-21T10:30:00Z'),
  ('ai-003', 'INC-2024-015', 'ev-011', 'vly', 'completed', 'dangerous_overtaking', 0.82, '2024-07-29T11:00:00Z', 'White/Blue Toyota Coaster bus', 'bus', 'White/Blue', 'O9012P', 0.88, '["bus","car","road","curve_sign","trees"]', '[{"type":"overtake_on_curve","confidence":0.82},{"type":"blind_curve","confidence":0.90}]', 'AI analysis detected a bus overtaking on a blind curve on Tubmanburg Road near Klay Junction. High-risk maneuver captured.', 'serious', 15680, true, false, NULL, NULL, NULL, '2024-07-29T11:00:00Z'),
  ('ai-004', 'INC-2024-011', 'ev-012', 'vly', 'completed', 'red_light_violation', 0.96, '2024-07-25T08:10:00Z', 'White Toyota Land Cruiser SUV', 'suv', 'White', 'M5678N', 0.94, '["suv","traffic_light","intersection","pedestrians"]', '[{"type":"red_light_crossing","confidence":0.96},{"type":"speed_at_intersection":"42km/h"}]', 'Traffic camera footage confirmed white Toyota Land Cruiser crossing ELWA Junction intersection during red signal phase. High confidence detection.', 'serious', 11020, false, true, 'demo-ofc-002', '2024-07-25T09:00:00Z', 'Confirmed from traffic camera footage.', '2024-07-25T08:10:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. SAMPLE ANPR SCANS
-- ============================================================
INSERT INTO anpr_scans (id, incident_id, plate_text, normalized_plate, plate_confidence, officer_verified, officer_corrected_text, vehicle_type, vehicle_color, bounding_box, scanned_at, officer_id) VALUES
  ('anpr-001', 'INC-2024-001', 'A1234B', 'A1234B', 0.95, true, NULL, 'sedan', 'White', '{"x":120,"y":340,"w":180,"h":60}', '2024-07-15T08:30:00Z', 'demo-ofc-001'),
  ('anpr-002', 'INC-2024-002', 'C5678D', 'C5678D', 0.97, true, NULL, 'suv', 'Blue',  '{"x":200,"y":280,"w":190,"h":65}', '2024-07-16T09:15:00Z', 'demo-ofc-002'),
  ('anpr-003', 'INC-2024-006', 'Q3456R', 'Q3456R', 0.92, true, NULL, 'sedan', 'Black', '{"x":150,"y":310,"w":175,"h":58}', '2024-07-20T16:45:00Z', 'demo-ofc-001'),
  ('anpr-004', 'INC-2024-010', 'S7890T', 'S7890T', 0.89, true, NULL, 'pickup', 'Gray',  '{"x":180,"y":290,"w":185,"h":62}', '2024-07-24T22:30:00Z', 'demo-ofc-001'),
  ('anpr-005', 'INC-2024-011', 'M5678N', 'M5678N', 0.94, true, NULL, 'suv', 'White', '{"x":130,"y":325,"w":170,"h":55}', '2024-07-25T08:00:00Z', 'demo-ofc-002'),
  ('anpr-006', 'INC-2024-015', 'O9012P', 'O9012P', 0.88, true, NULL, 'bus', 'White/Blue','{"x":220,"y":260,"w":200,"h":70}', '2024-07-29T10:30:00Z', 'demo-ofc-002'),
  ('anpr-007', 'INC-2024-019', 'G3456H', 'G3456H', 0.96, true, NULL, 'pickup', 'Red',  '{"x":145,"y":335,"w":178,"h":60}', '2024-08-03T14:00:00Z', 'demo-ofc-001'),
  ('anpr-008', 'INC-2024-031', 'XX9999Y','XX9999Y',0.98, true, NULL, 'sedan', 'Black', '{"x":160,"y":305,"w":182,"h":61}', '2024-08-15T23:05:00Z', 'demo-ofc-001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 19. SAMPLE NOTIFICATIONS
-- ============================================================
INSERT INTO officer_notifications (id, user_id, type, title, message, priority, is_read, is_dismissed, reference_type, reference_id, action_url, created_at) VALUES
  ('ntf-001', 'demo-ofc-001', 'incident_created', 'Incident Created', 'Incident INC-2024-001 has been created successfully.', 'normal', true, false, 'incident', 'INC-2024-001', '/incidents/INC-2024-001', '2024-07-15T08:30:00Z'),
  ('ntf-002', 'demo-ofc-001', 'ai_complete', 'AI Analysis Complete', 'AI analysis has finished for incident INC-2024-006. Review recommended.', 'high', true, false, 'incident', 'INC-2024-006', '/incidents/INC-2024-006', '2024-07-21T08:30:00Z'),
  ('ntf-003', 'demo-ofc-002', 'ai_analysis', 'AI Detection: Phone Use', 'AI detected mobile phone use while driving in incident INC-2024-007. Please review.', 'normal', true, false, 'incident', 'INC-2024-007', '/incidents/INC-2024-007', '2024-07-21T10:30:00Z'),
  ('ntf-004', 'demo-tcom-001', 'incident_escalated', 'Incident Escalated', 'Incident INC-2024-014 (Hit and Run) has been escalated by Police Supervisor.', 'critical', true, false, 'incident', 'INC-2024-014', '/incidents/INC-2024-014', '2024-07-29T08:00:00Z'),
  ('ntf-005', 'demo-inv-001', 'assigned', 'Case Assigned', 'You have been assigned to investigate incident INC-2024-014 (Hit and Run, Bushrod Island).', 'high', false, false, 'incident', 'INC-2024-014', '/incidents/INC-2024-014', '2024-07-29T08:05:00Z'),
  ('ntf-006', 'demo-inv-001', 'assigned', 'Case Assigned', 'You have been assigned to investigate incident INC-2024-006 (Reckless Driving, Tubman Blvd).', 'high', false, false, 'incident', 'INC-2024-006', '/incidents/INC-2024-006', '2024-07-21T08:00:00Z'),
  ('ntf-007', 'demo-ofc-001', 'wanted_alert', 'WANTED VEHICLE ALERT', 'Stolen vehicle XX9999Y (Black Toyota Camry 2022) detected. Recovery in progress.', 'critical', true, false, 'vehicle', NULL, '/vehicles', '2024-08-15T23:05:00Z'),
  ('ntf-008', 'demo-tcom-001', 'wanted_alert', 'WANTED VEHICLE ALERT', 'Stolen vehicle XX9999Y recovered on Tubman Blvd. Suspect fled. Escalate investigation.', 'critical', true, false, 'incident', 'INC-2024-031', '/incidents/INC-2024-031', '2024-08-15T23:15:00Z'),
  ('ntf-009', 'demo-ofc-001', 'weekly_summary', 'Weekly Summary Available', 'Your weekly activity report for July 14-20 is now available.', 'low', false, false, 'report', NULL, '/analytics', '2024-07-21T06:00:00Z'),
  ('ntf-010', 'demo-ofc-002', 'weekly_summary', 'Weekly Summary Available', 'Your weekly activity report for July 21-27 is now available.', 'low', false, false, 'report', NULL, '/analytics', '2024-07-28T06:00:00Z'),
  ('ntf-011', 'demo-ofc-001', 'system', 'System Maintenance Notice', 'Scheduled maintenance: TrafficWatch AI will be offline 02:00-04:00 on 2024-08-20.', 'normal', false, false, 'system', NULL, '/settings', '2024-08-18T10:00:00Z'),
  ('ntf-012', 'demo-admin-001', 'system_alert', 'Storage Alert', 'Evidence storage bucket "evidence-images" is at 72% capacity.', 'high', true, false, 'system', NULL, '/settings', '2024-08-12T14:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 20. NOTIFICATION PREFERENCES
-- ============================================================
INSERT INTO notification_preferences (id, user_id, notification_type, channel_in_app, channel_push, channel_email, channel_sms, min_priority, updated_at, is_paused) VALUES
  ('np-001', 'demo-ofc-001', 'incident_update',    true, true,  false, false, 'normal', '2024-01-15T00:00:00Z', false),
  ('np-002', 'demo-ofc-001', 'ai_analysis',        true, true,  true,  false, 'normal', '2024-01-15T00:00:00Z', false),
  ('np-003', 'demo-ofc-001', 'wanted_alert',       true, true,  true,  true,  'low',   '2024-01-15T00:00:00Z', false),
  ('np-004', 'demo-ofc-001', 'assignment',         true, true,  false, false, 'normal', '2024-01-15T00:00:00Z', false),
  ('np-005', 'demo-ofc-002', 'incident_update',    true, true,  false, false, 'normal', '2024-02-15T00:00:00Z', false),
  ('np-006', 'demo-tcom-001', 'incident_escalated', true, true, true,  true,  'high',  '2024-02-01T00:00:00Z', false),
  ('np-007', 'demo-inv-001', 'assignment',         true, true,  true,  false, 'normal', '2024-02-01T00:00:00Z', false),
  ('np-008', 'demo-admin-001', 'system_alert',     true, true,  true,  true,  'high',  '2024-01-15T00:00:00Z', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 21. SYSTEM SETTINGS
-- ============================================================
INSERT INTO system_settings (key, value, category, updated_at) VALUES
  ('app_name',           '"TrafficWatch AI"',                   'general',     '2024-01-01T00:00:00Z'),
  ('app_version',        '"1.0.0-demo"',                       'general',     '2024-07-15T00:00:00Z'),
  ('evidence_retention_days', '365',                           'evidence',    '2024-01-01T00:00:00Z'),
  ('max_file_size_mb',   '50',                                 'upload',      '2024-01-01T00:00:00Z'),
  ('anpr_enabled',       'true',                               'ai',          '2024-01-01T00:00:00Z'),
  ('ai_provider',        '"vly"',                              'ai',          '2024-01-01T00:00:00Z'),
  ('auto_ai_analysis',   'true',                               'ai',          '2024-01-01T00:00:00Z'),
  ('maintenance_mode',   'false',                              'system',      '2024-01-01T00:00:00Z'),
  ('session_timeout_min', '120',                               'security',    '2024-01-01T00:00:00Z'),
  ('mfa_required',       'false',                              'security',    '2024-01-01T00:00:00Z'),
  ('password_min_length','8',                                  'security',    '2024-01-01T00:00:00Z'),
  ('default_page_size',  '20',                                 'ui',          '2024-01-01T00:00:00Z'),
  ('map_default_zoom',   '8',                                  'ui',          '2024-01-01T00:00:00Z'),
  ('map_center_lat',     '6.5',                                'ui',          '2024-01-01T00:00:00Z'),
  ('map_center_lng',     '-9.5',                               'ui',          '2024-01-01T00:00:00Z'),
  ('offline_sync_enabled','true',                              'offline',     '2024-01-01T00:00:00Z'),
  ('citizen_reports_enabled', 'true',                          'citizen',     '2024-01-01T00:00:00Z'),
  ('anonymous_reporting', 'true',                              'citizen',     '2024-01-01T00:00:00Z')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 22. PREDICTIVE ANALYTICS (clearly labeled as estimates)
-- ============================================================
INSERT INTO predictive_analytics (id, prediction_type, location_name, county_code, risk_level, confidence_score, predicted_date_from, predicted_date_to, factors_considered, generated_at, is_actionable) VALUES
  ('pred-001', 'hotspot', 'Tubman Blvd / 15th Street Intersection', 'MONTSERRADO', 'high', 0.82, '2024-08-20', '2024-09-20', '["high_traffic_volume","previous_accidents_3_in_30_days","pedestrian_density","school_zone"]', '2024-08-01T00:00:00Z', true),
  ('pred-002', 'hotspot', 'ELWA Junction, Paynesville',            'MONTSERRADO', 'high', 0.78, '2024-08-20', '2024-09-20', '["high_traffic_volume","red_light_violations","peak_hour_congestion","bus_stop_proximity"]', '2024-08-01T00:00:00Z', true),
  ('pred-003', 'violation', 'Bushrod Island Highway',              'MONTSERRADO', 'moderate', 0.71, '2024-08-25', '2024-09-25', '["heavy_truck_traffic","speeding_complaints","port_access_road"]', '2024-08-01T00:00:00Z', true),
  ('pred-004', 'hotspot', 'Kakata Junction, Highway A1',           'MARGIBI', 'moderate', 0.68, '2024-08-25', '2024-09-25', '["highway_intersection","speeding_data","limited_visibility"]', '2024-08-01T00:00:00Z', false),
  ('pred-005', 'accident_risk', 'Totota – Gbarnga Highway (km 85-95)', 'BONG', 'high', 0.75, '2024-08-20', '2024-09-20', '["sharp_curves","overtake_accidents","low_light","road_condition_reports"]', '2024-08-01T00:00:00Z', true),
  ('pred-006', 'congestion', 'Broad Street – Randall Street, CBD', 'MONTSERRADO', 'high', 0.85, '2024-08-20', '2024-09-20', '["market_day_congestion","limited_parking","pedestrian_density","commercial_loading"]', '2024-08-01T00:00:00Z', true),
  ('pred-007', 'hotspot', 'Ganta Border Crossing',                  'NIMBA', 'moderate', 0.62, '2024-09-01', '2024-10-01', '["cross_border_traffic","cargo_truck_volume","document_check_delays"]', '2024-08-01T00:00:00Z', false),
  ('pred-008', 'repeat_offender', 'Plate A1234B (White Toyota Camry)', 'MONTSERRADO', 'moderate', 0.65, NULL, NULL, '["previous_incidents_3","speeding_pattern","time_of_day_evening"]', '2024-08-01T00:00:00Z', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 23. SAMPLE CITIZEN REPORTS
-- ============================================================
INSERT INTO citizen_reports (id, citizen_id, report_type, violation_type, description, location_address, location_lat, location_lng, vehicle_plate, status, reference_number, reporter_name, reporter_contact, created_at) VALUES
  ('cr-001', NULL, 'traffic_violation', 'Speeding', 'White Toyota sedan speeding on Broad Street, almost hit a pedestrian.', 'Broad Street, Monrovia', 6.3150, -10.8000, 'A1234B', 'submitted', 'CR-2024-0001', 'John D. Smith', '+231-77-020-0001', '2024-07-15T12:00:00Z'),
  ('cr-002', NULL, 'accident', NULL, 'Minor collision at ELWA Junction between two cars. No injuries reported.', 'ELWA Junction, Paynesville', 6.2800, -10.7200, NULL, 'under_review', 'CR-2024-0002', 'Mary K. Brown', '+231-77-020-0002', '2024-07-20T15:30:00Z'),
  ('cr-003', NULL, 'traffic_violation', 'Reckless Driving', 'Blue SUV driving dangerously, weaving through traffic on Tubman Boulevard.', 'Tubman Blvd, Monrovia', 6.3100, -10.7800, 'C5678D', 'under_review', 'CR-2024-0003', 'Paul N. Tarpeh', '+231-77-020-0003', '2024-07-25T18:45:00Z'),
  ('cr-004', NULL, 'road_hazard', NULL, 'Large pothole on Kakata Highway near Harbel causing vehicles to swerve dangerously.', 'Kakata Highway, Harbel', 6.4500, -10.3700, NULL, 'resolved', 'CR-2024-0004', 'Alice F. Cooper', '+231-77-020-0004', '2024-08-01T09:00:00Z'),
  ('cr-005', NULL, 'traffic_violation', 'Illegal Parking', 'Multiple vehicles parked on sidewalk on Randall Street, blocking pedestrian access.', 'Randall Street, Monrovia', 6.3100, -10.8000, NULL, 'submitted', 'CR-2024-0005', 'Anonymous', NULL, '2024-08-05T11:15:00Z'),
  ('cr-006', NULL, 'accident', NULL, 'Motorcycle hit by pickup truck at Ganta market intersection. Rider injured.', 'Ganta Market, Nimba', 7.0500, -8.5800, 'G3456H', 'escalated', 'CR-2024-0006', 'Thomas K. Gbargar', '+231-77-020-0006', '2024-08-10T14:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 24. SAMPLE AUDIT LOGS
-- ============================================================
INSERT INTO audit_logs (id, action, performed_by, target_type, target_id, description, severity, ip_address, user_agent, metadata, created_at) VALUES
  ('aud-001', 'user.login',    'demo-ofc-001', 'user', 'demo-ofc-001', 'Officer login — Peter T. Johnson',              'info', '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"device":"iPhone 15 Pro"}', '2024-07-15T08:00:00Z'),
  ('aud-002', 'incident.create', 'demo-ofc-001', 'incident', 'INC-2024-001', 'Incident created: Speeding on Broad Street','info', '192.168.1.100', 'TrafficWatch Mobile/2.0', '{}', '2024-07-15T08:30:00Z'),
  ('aud-003', 'incident.status_change', 'demo-ofc-001', 'incident', 'INC-2024-001', 'Status changed from submitted to closed','info', '192.168.1.100', 'TrafficWatch Mobile/2.0', '{}', '2024-07-15T09:00:00Z'),
  ('aud-004', 'user.login',    'demo-tcom-001', 'user', 'demo-tcom-001', 'Commander login — Martha G. Suah',             'info', '10.0.0.50', 'TrafficWatch Web/Chrome', '{"device":"Windows Desktop"}', '2024-07-21T08:00:00Z'),
  ('aud-005', 'incident.assign', 'demo-tcom-001', 'incident', 'INC-2024-006', 'Assigned to investigator Emmanuel Kollie',    'warning', '10.0.0.50', 'TrafficWatch Web/Chrome', '{}', '2024-07-21T08:05:00Z'),
  ('aud-006', 'evidence.upload', 'demo-ofc-003', 'evidence', 'ev-007', 'Evidence uploaded for hit-and-run incident',   'info', '192.168.1.102', 'TrafficWatch Mobile/2.0', '{"type":"photo"}', '2024-07-28T19:25:00Z'),
  ('aud-007', 'incident.escalate', 'demo-sup-001', 'incident', 'INC-2024-014', 'Incident escalated by supervisor',           'critical', '10.0.0.51', 'TrafficWatch Web/Chrome', '{}', '2024-07-29T08:00:00Z'),
  ('aud-008', 'evidence.transfer', 'demo-sup-001', 'evidence', 'ev-007', 'Evidence transferred to investigating officer','warning', '10.0.0.51', 'TrafficWatch Web/Chrome', '{}', '2024-07-29T08:10:00Z'),
  ('aud-009', 'vehicle.stolen_alert', 'demo-ofc-001', 'vehicle', 'XX9999Y', 'Stolen vehicle detected during traffic stop',  'critical', '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"incident":"INC-2024-031"}', '2024-08-15T23:10:00Z'),
  ('aud-010', 'user.logout',  'demo-ofc-001', 'user', 'demo-ofc-001', 'Officer logout',                                'info', '192.168.1.100', 'TrafficWatch Mobile/2.0', '{"session_duration_sec":54200}', '2024-07-15T23:00:00Z'),
  ('aud-011', 'user.failed_login', 'ofc-unknown', 'user', NULL, 'Failed login attempt — unknown email',             'warning', '203.0.113.50', 'Mozilla/5.0', '{"reason":"invalid_credentials"}', '2024-07-22T03:15:00Z'),
  ('aud-012', 'user.password_change', 'demo-ofc-002', 'user', 'demo-ofc-002', 'Password changed by user',                 'warning', '192.168.1.101', 'TrafficWatch Mobile/2.0', '{}', '2024-07-30T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 25. STORAGE FILES (metadata for evidence — no actual files)
-- ============================================================
INSERT INTO storage_files (id, evidence_id, bucket_name, file_path, original_name, mime_type, file_size, sha256_hash, is_signed_url, signed_url, signed_url_expires_at, created_at) VALUES
  ('sf-001', 'ev-001', 'evidence-images', 'public/ev-001-speed-photo.jpeg', 'speed-reading-broad-st.jpeg', 'image/jpeg', 245760, 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', false, NULL, NULL, '2024-07-15T08:35:00Z'),
  ('sf-002', 'ev-003', 'evidence-videos', 'public/ev-003-dashcam-reckless.mp4', 'dashcam-tubman-blvd.mp4', 'video/mp4', 5242880, 'c5d4e3f2a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', false, NULL, NULL, '2024-07-20T16:50:00Z'),
  ('sf-003', 'ev-005', 'evidence-images', 'public/ev-005-breathalyzer.jpeg', 'breathalyzer-reading.jpeg', 'image/jpeg', 122880, 'e7f6a5b4c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', false, NULL, NULL, '2024-07-24T22:40:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 26. INVOLVED PERSONS (for key incidents)
-- ============================================================
INSERT INTO involved_persons (id, incident_id, full_name, id_type, id_number, address, phone, email, role, statement, created_at, updated_at) VALUES
  ('ip-001', 'INC-2024-006', 'James K. Paye', 'drivers_license', 'DL-2024-0482', '12 Snapper Street, Sinkor, Monrovia', '+231-77-030-0001', 'jpaye@email.com', 'driver', 'I was driving home from work. The other driver came out of nowhere.', '2024-07-20T17:00:00Z', '2024-07-20T17:00:00Z'),
  ('ip-002', 'INC-2024-010', 'Thomas W. Wesseh', 'drivers_license', 'DL-2020-1123', '45 Benson Street, Monrovia', '+231-77-030-0002', NULL, 'driver', NULL, '2024-07-24T23:00:00Z', '2024-07-24T23:00:00Z'),
  ('ip-003', 'INC-2024-014', 'Martha K. Nimely', 'national_id', 'NID-0087412', '22 Corinal Street, Bushrod Island', '+231-77-030-0003', NULL, 'pedestrian', 'I was crossing the road when a white pickup hit me from the side.', '2024-07-28T19:30:00Z', '2024-07-28T19:30:00Z'),
  ('ip-004', 'INC-2024-015', 'Joseph N. Gbollie', 'drivers_license', 'DL-2023-3321', '8 Tubmanburg Road, Bomi', '+231-77-030-0004', 'jgbollie@email.com', 'driver', 'The bus overtook me on a blind curve. I had to swerve off the road.', '2024-07-29T11:00:00Z', '2024-07-29T11:00:00Z'),
  ('ip-005', 'INC-2024-031', 'Amos K. Sumo', 'drivers_license', 'DL-2022-5671', 'Unknown', '+231-77-030-0005', NULL, 'driver', 'Suspect fled on foot before statement could be taken.', '2024-08-15T23:30:00Z', '2024-08-15T23:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 27. WITNESSES
-- ============================================================
INSERT INTO witnesses (id, incident_id, full_name, phone, email, address, statement, consent_given, created_at) VALUES
  ('wt-001', 'INC-2024-006', 'Sarah M. Kerkula', '+231-77-040-0001', 'skerkula@email.com', '15 UN Drive, Monrovia', 'I saw the black Mercedes swerving through traffic dangerously.', true, '2024-07-20T17:15:00Z'),
  ('wt-002', 'INC-2024-002', 'Robert T. Wilson', '+231-77-040-0002', 'rwilson@email.com', '30 Tubman Blvd, Monrovia', 'The blue SUV clearly ran the red light. I was waiting at the pedestrian crossing.', true, '2024-07-16T09:30:00Z'),
  ('wt-003', 'INC-2024-014', 'Catherine L. Doe', '+231-77-040-0003', NULL, '18 Bushrod Island Blvd', 'I saw the pickup hit the woman and keep driving. It happened very fast.', true, '2024-07-28T19:35:00Z'),
  ('wt-004', 'INC-2024-026', 'George K. Tar', '+231-77-040-0004', 'gtar@email.com', '5 Harper Beach Road', 'The car was driving very fast and all over the road. People had to jump out of the way.', true, '2024-08-10T20:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 28. EVIDENCE VERSIONS
-- ============================================================
INSERT INTO evidence_versions (id, evidence_id, version_number, file_url, file_size, mime_type, sha256_hash, processing_type, processing_params, created_by, created_at) VALUES
  ('evv-001', 'ev-003', 1, 's3://bucket/processed/ev-003-compressed.mp4', 2097152, 'video/mp4', 'd7e6f5a4b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', 'compressed', '{"codec":"h264","crf":23,"resolution":"1080p"}', 'demo-evi-001', '2024-07-21T09:00:00Z'),
  ('evv-002', 'ev-003', 2, 's3://bucket/processed/ev-003-frames.zip', 10485760, 'application/zip', 'e8f7a6b5c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5', 'ai_enhanced', '{"frame_interval":30,"total_frames":120,"detections":["car","lane_marking"]}', 'demo-evi-001', '2024-07-21T10:00:00Z'),
  ('evv-003', 'ev-012', 1, 's3://bucket/processed/ev-012-clip.mp4', 4194304, 'video/mp4', 'f9a8b7c6d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', 'cropped', '{"start_sec":5,"end_sec":15,"focus":"intersection"}', 'demo-evi-001', '2024-07-25T08:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE — SEED DATA LOADED
-- ============================================================
-- Summary of Demo Data Loaded:
--   - 4 Police Regions
--   - 15 Liberia Counties (all)
--   - 45 Districts (3 per county)
--   - 12 Major Roads
--   - 22 Police Stations
--   - 10 Checkpoints
--   - 20 Violation Types
--   - 13 Officer/User Profiles
--   - 16 Vehicles (1 stolen/wanted)
--   - 1 Stolen Vehicle Record
--   - 31 Incidents (including 1 stolen vehicle recovery)
--   - 18 Incident-Violation Associations
--   - 6 Incident Assignments
--   - 11 Incident Logs
--   - 12 Evidence Items (metadata)
--   - 10 Chain-of-Custody Events
--   - 4 AI Analyses
--   - 8 ANPR Scans
--   - 12 Notifications
--   - 8 Notification Preferences
--   - 18 System Settings
--   - 8 Predictive Analytics (labeled as estimates)
--   - 6 Citizen Reports
--   - 12 Audit Logs
--   - 3 Storage Files
--   - 5 Involved Persons
--   - 4 Witnesses
--   - 3 Evidence Versions
--
-- !! THIS IS DEMO / SEED DATA ONLY !!
-- DO NOT use in production without removing or replacing
-- with real data.
-- ============================================================
