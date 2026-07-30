-- ============================================================
-- TrafficWatch AI — ⚠️ DEMO/SEED DATA — PART 3: Evidence, AI, ANPR
-- ============================================================
-- !! WARNING: THIS IS DEMO/SEED DATA ONLY !!
-- Evidence file URLs point to demo paths (no actual files exist).
-- AI analyses and ANPR scans are simulated results.
-- All citizen reports are fictional.
-- ============================================================

-- === EVIDENCE ===

INSERT INTO public.evidence (id, incident_id, type, description, file_url, mime_type, file_size, officer_id, captured_at, capture_lat, capture_lng, evidence_status)
SELECT gen_random_uuid(), i.id, 'photo', 'Speed radar reading - 95 km/h in 50 km/h zone', '/demo/evidence/speed-radar-1.jpg', 'image/jpeg', 512000, p.id, NOW() - interval '5 days', 6.3215, -10.8145, 'original'
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Speeding%UN Drive%' AND p.email = 'officer1@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.evidence (id, incident_id, type, description, file_url, mime_type, file_size, officer_id, captured_at, capture_lat, capture_lng, evidence_status)
SELECT gen_random_uuid(), i.id, 'photo', 'License plate photo - LR-1234', '/demo/evidence/plate-lr1234.jpg', 'image/jpeg', 384000, p.id, NOW() - interval '5 days', 6.3215, -10.8145, 'original'
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Speeding%UN Drive%' AND p.email = 'officer1@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.evidence (id, incident_id, type, description, file_url, mime_type, file_size, officer_id, captured_at, capture_lat, capture_lng, evidence_status)
SELECT gen_random_uuid(), i.id, 'video', 'Dashcam footage - red light violation at Broad Street', '/demo/evidence/dashcam-broad-st.mp4', 'video/mp4', 52428800, p.id, NOW() - interval '3 days', 6.3285, -10.8120, 'original'
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Red Light%Broad Street%' AND p.email = 'officer1@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.evidence (id, incident_id, type, description, file_url, mime_type, file_size, officer_id, captured_at, evidence_status)
SELECT gen_random_uuid(), i.id, 'photo', 'Scene photo - hit and run location, Ganta', '/demo/evidence/hit-run-scene.jpg', 'image/jpeg', 2048000, p.id, NOW() - interval '2 days', 'original'
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Hit and Run%Ganta%' AND p.email = 'investigator@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.evidence (id, incident_id, type, description, file_url, mime_type, file_size, officer_id, captured_at, capture_lat, capture_lng, evidence_status)
SELECT gen_random_uuid(), i.id, 'photo', 'Overloaded truck photo - Kakata checkpoint', '/demo/evidence/overloaded-truck.jpg', 'image/jpeg', 1536000, p.id, NOW() - interval '7 days', 6.5031, -10.3528, 'original'
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Overloaded%Kakata%' AND p.email = 'officer3@trafficwatch.gov.lr' LIMIT 1;

-- === AI ANALYSES ===

INSERT INTO public.ai_analyses (id, incident_id, provider_id, status, violation_type, confidence_score, detection_timestamp, vehicle_type, vehicle_color, license_plate, license_plate_confidence, detected_objects, violations, ai_summary, severity, recommended_review, is_confirmed)
SELECT gen_random_uuid(), i.id, 'vly', 'completed', 'Speeding', 95.5, NOW() - interval '4 days', 'Sedan', 'White', 'LR-1234', 98.2,
  '[{"type": "vehicle", "label": "car", "confidence": 0.98}, {"type": "license_plate", "label": "license_plate", "confidence": 0.97}]'::jsonb,
  '[{"type": "speeding", "confidence": 0.95, "detected_speed": 95, "speed_limit": 50}]'::jsonb,
  'AI analysis confirms speeding violation. License plate LR-1234 clearly readable.', 'serious', false, true
FROM public.incidents i WHERE i.title ILIKE '%Speeding%UN Drive%' LIMIT 1;

INSERT INTO public.ai_analyses (id, incident_id, provider_id, status, violation_type, confidence_score, detection_timestamp, vehicle_type, vehicle_color, license_plate, detected_objects, violations, ai_summary, severity, recommended_review, is_confirmed)
SELECT gen_random_uuid(), i.id, 'vly', 'completed', 'Red Light Violation', 92.0, NOW() - interval '2 days', 'SUV', 'Black', 'LR-5678',
  '[{"type": "vehicle", "label": "suv", "confidence": 0.94}, {"type": "traffic_light", "label": "traffic_light_red", "confidence": 0.96}]'::jsonb,
  '[{"type": "red_light", "confidence": 0.92, "detected_at": "2026-07-25T08:15:00Z"}]'::jsonb,
  'AI analysis suggests red light violation. Vehicle traversed intersection while traffic signal was red.', 'critical', true, false
FROM public.incidents i WHERE i.title ILIKE '%Red Light%Broad Street%' LIMIT 1;

INSERT INTO public.ai_analyses (id, incident_id, provider_id, status, violation_type, confidence_score, detection_timestamp, vehicle_type, vehicle_color, detected_objects, violations, ai_summary, severity, recommended_review)
SELECT gen_random_uuid(), i.id, 'vly', 'completed', 'Reckless Driving', 78.5, NOW() - interval '1 day', 'Sedan', 'Navy',
  '[{"type": "vehicle", "label": "car", "confidence": 0.91}, {"type": "person", "label": "pedestrian", "confidence": 0.85}]'::jsonb,
  '[{"type": "reckless_driving", "confidence": 0.78, "description": "Erratic lane changes observed"}]'::jsonb,
  'AI analysis detected erratic driving patterns. Recommend officer review.', 'critical', true
FROM public.incidents i WHERE i.title ILIKE '%Reckless%Tubman%' LIMIT 1;

-- === ANPR SCANS ===

INSERT INTO public.anpr_scans (id, incident_id, plate_text, normalized_plate, plate_confidence, officer_verified, vehicle_type, vehicle_color, bounding_box, officer_id)
SELECT gen_random_uuid(), i.id, 'LR-1234', 'LR1234', 98.2, true, 'Sedan', 'White', '{"x": 0.42, "y": 0.55, "width": 0.16, "height": 0.04}'::jsonb, p.id
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Speeding%UN Drive%' AND p.email = 'officer1@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.anpr_scans (id, incident_id, plate_text, normalized_plate, plate_confidence, officer_verified, vehicle_type, vehicle_color, bounding_box, officer_id)
SELECT gen_random_uuid(), i.id, 'LR-5678', 'LR5678', 96.5, true, 'SUV', 'Black', '{"x": 0.38, "y": 0.48, "width": 0.14, "height": 0.04}'::jsonb, p.id
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Red Light%Broad Street%' AND p.email = 'officer1@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.anpr_scans (id, incident_id, plate_text, normalized_plate, plate_confidence, officer_verified, vehicle_type, vehicle_color, bounding_box, officer_id)
SELECT gen_random_uuid(), i.id, 'LR-WANTED', 'LRWANTED', 88.0, false, 'Sedan', 'Silver', '{"x": 0.35, "y": 0.52, "width": 0.15, "height": 0.04}'::jsonb, p.id
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Hit and Run%Ganta%' AND p.email = 'investigator@trafficwatch.gov.lr' LIMIT 1;

INSERT INTO public.anpr_scans (id, incident_id, plate_text, normalized_plate, plate_confidence, officer_verified, vehicle_type, vehicle_color, bounding_box, officer_id)
SELECT gen_random_uuid(), i.id, 'LR-9012', 'LR9012', 97.1, true, 'Truck', 'Blue', '{"x": 0.45, "y": 0.58, "width": 0.12, "height": 0.04}'::jsonb, p.id
FROM public.incidents i, public.profiles p
WHERE i.title ILIKE '%Overloaded%Kakata%' AND p.email = 'officer3@trafficwatch.gov.lr' LIMIT 1;

-- === STOLEN VEHICLE ===

INSERT INTO public.stolen_vehicles (id, plate_number, make, model, color, year, reported_by, status, jurisdiction, case_number, owner_name, owner_contact, notes)
SELECT gen_random_uuid(), 'LR-WANTED', 'Nissan', 'Altima', 'Silver', 2021, p.id, 'active', 'Montserrado County', 'POL-2024-SV-001', 'Ibrahim Kallon', '+231-77-300-0001', 'Vehicle reported stolen from parking lot near Waterside Market on July 20, 2026.'
FROM public.profiles p WHERE p.email = 'admin@trafficwatch.gov.lr' LIMIT 1;

-- === CITIZEN REPORTS ===

INSERT INTO public.citizen_reports (id, is_anonymous, report_type, violation_type, description, location_address, location_lat, location_lng, vehicle_plate, reporter_name, reporter_phone, status, reference_number)
SELECT gen_random_uuid(), false, 'traffic_violation', 'Speeding', 'I observed a white Toyota Corolla speeding dangerously on UN Drive around 2 PM today.', 'UN Drive, near Ministry of Foreign Affairs, Monrovia', 6.3215, -10.8145, 'LR-1234', 'Peter Sherman', '+231-77-000-0012', 'submitted', 'CR-2026-00001'
WHERE NOT EXISTS (SELECT 1 FROM public.citizen_reports WHERE reference_number = 'CR-2026-00001');

INSERT INTO public.citizen_reports (id, is_anonymous, report_type, violation_type, description, location_address, location_lat, location_lng, reporter_name, reporter_phone, status, reference_number)
SELECT gen_random_uuid(), false, 'traffic_violation', 'Red Light', 'A black SUV ran the red light at the Broad Street and Randall Street intersection around 8 AM this morning.', 'Broad Street and Randall Street, Monrovia', 6.3285, -10.8120, 'Maria Johnson', '+231-77-000-0013', 'under_review', 'CR-2026-00002'
WHERE NOT EXISTS (SELECT 1 FROM public.citizen_reports WHERE reference_number = 'CR-2026-00002');

INSERT INTO public.citizen_reports (id, is_anonymous, report_type, description, location_address, location_lat, location_lng, reporter_name, reporter_phone, status, reference_number)
SELECT gen_random_uuid(), true, 'road_hazard', 'There is a large pothole on Tubman Boulevard near the SKD junction that has caused multiple accidents.', 'Tubman Boulevard near SKD, Monrovia', 6.2900, -10.7250, 'Worried Citizen', '+231-77-000-0014', 'submitted', 'CR-2026-00003'
WHERE NOT EXISTS (SELECT 1 FROM public.citizen_reports WHERE reference_number = 'CR-2026-00003');

INSERT INTO public.citizen_reports (id, is_anonymous, report_type, violation_type, description, location_address, location_lat, location_lng, vehicle_plate, status, reference_number)
SELECT gen_random_uuid(), true, 'traffic_violation', 'Illegal Parking', 'A silver minibus has been parked on the sidewalk on Carey Street for three days.', 'Carey Street, Monrovia', 6.3240, -10.8090, 'LR-7890', 'submitted', 'CR-2026-00004'
WHERE NOT EXISTS (SELECT 1 FROM public.citizen_reports WHERE reference_number = 'CR-2026-00004');
