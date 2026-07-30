-- ============================================================
-- TrafficWatch AI — Seed Data Part 4: Remaining Tables
-- ============================================================

-- === PREDICTIVE ANALYTICS (clearly labeled as estimates) ===

INSERT INTO public.prediction_results (model_id, category, title, summary, confidence_score, confidence_level, risk_severity, location_name, latitude, longitude, county, district, road_name, details_json, data_sources, model_version)
SELECT m.id, 'road_risk', 'High Risk - UN Drive, Monrovia', 'UN Drive segment shows elevated risk of speed-related violations. This prediction is an ESTIMATE based on analysis of available data.', 82.5, 'high', 'high', 'UN Drive, Monrovia', 6.3215, -10.8145, 'Montserrado', 'Greater Monrovia', 'UN Drive',
  '{"disclaimer": "This is an AI-generated estimate based on available historical data. Not a guarantee of future incidents.", "factors": ["high_volume", "speeding_trend", "pedestrian_activity"], "recommendation": "Increase patrol presence during peak hours 7-9 AM and 4-7 PM"}',
  ARRAY['incidents_90days', 'road_geometry', 'traffic_volume'], '1.0.0'
FROM public.prediction_models m WHERE m.name = 'Road Risk Analyzer' LIMIT 1;

INSERT INTO public.prediction_results (model_id, category, title, summary, confidence_score, confidence_level, risk_severity, location_name, latitude, longitude, county, details_json, data_sources, model_version)
SELECT m.id, 'hotspot_prediction', 'Emerging Hotspot - Red Light Area, Paynesville', 'Cluster of 5 incidents detected near the Red Light intersection in Paynesville over the past 7 days. This prediction is an ESTIMATE.', 78.3, 'moderate', 'high', 'Red Light, Paynesville, Monrovia', 6.2856, -10.7224, 'Montserrado',
  '{"disclaimer": "This is an AI-generated estimate based on available historical data.", "factors": ["cluster_5_incidents_7days", "red_light_violations", "peak_hours_1600_1900"], "recommendation": "Deploy traffic officer during peak evening hours"}',
  ARRAY['incidents_30days', 'locations', 'time_data'], '1.0.0'
FROM public.prediction_models m WHERE m.name = 'Hotspot Prediction Model' LIMIT 1;

INSERT INTO public.prediction_results (model_id, category, title, summary, confidence_score, confidence_level, risk_severity, location_name, latitude, longitude, county, details_json, data_sources, model_version)
SELECT m.id, 'accident_risk', 'Elevated Accident Risk - Ganta Highway', 'Segment between Kakata and Ganta shows elevated accident risk. This prediction is an ESTIMATE.', 76.8, 'moderate', 'high', 'Monrovia-Ganta Highway, Kakata to Ganta', 6.7500, -9.7200, 'Margibi',
  '{"disclaimer": "This is an AI-generated estimate based on available historical data.", "factors": ["road_condition_deterioration", "high_volume", "overtaking_incidents"], "recommendation": "Consider road safety audit and warning signage"}',
  ARRAY['accidents_12months', 'weather_data', 'road_conditions'], '1.0.0'
FROM public.prediction_models m WHERE m.name = 'Accident Risk Estimator' LIMIT 1;

-- === VIOLATION HOTSPOTS ===

INSERT INTO public.violation_hotspots (county, district, location_name, latitude, longitude, radius_meters, risk_level, predominant_violation_types, peak_times, peak_days, incident_count)
VALUES ('Montserrado', 'Greater Monrovia', 'UN Drive / Ministry Complex', 6.3215, -10.8145, 500, 'high', ARRAY['Speeding', 'Mobile Phone'], ARRAY['07:00-09:00', '16:00-19:00'], ARRAY['Monday', 'Friday'], 12);

INSERT INTO public.violation_hotspots (county, district, location_name, latitude, longitude, radius_meters, risk_level, predominant_violation_types, peak_times, peak_days, incident_count)
VALUES ('Montserrado', 'Greater Monrovia', 'Broad Street / Randall Street Intersection', 6.3285, -10.8120, 300, 'critical', ARRAY['Red Light Violation', 'Illegal Parking'], ARRAY['07:00-09:00', '12:00-14:00', '17:00-19:00'], ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 28);

INSERT INTO public.violation_hotspots (county, district, location_name, latitude, longitude, radius_meters, risk_level, predominant_violation_types, peak_times, peak_days, incident_count)
VALUES ('Margibi', 'Kakata', 'Kakata Checkpoint Junction', 6.5031, -10.3528, 400, 'high', ARRAY['Overloaded Vehicle', 'Speeding'], ARRAY['06:00-09:00', '15:00-18:00'], ARRAY['Monday', 'Saturday'], 15);

INSERT INTO public.violation_hotspots (county, district, location_name, latitude, longitude, radius_meters, risk_level, predominant_violation_types, peak_times, peak_days, incident_count)
VALUES ('Nimba', 'Sanniquellie-Mahn', 'Ganta Market Area', 7.0233, -9.0504, 350, 'high', ARRAY['Dangerous Overtaking', 'No Helmet', 'Overloaded'], ARRAY['07:00-10:00', '16:00-19:00'], ARRAY['Wednesday', 'Saturday'], 20);

-- === HIGH-RISK ROADS ===

INSERT INTO public.risk_roads (road_name, county, risk_level, risk_score, incident_count, predominant_violation_types, factors, recommendation)
VALUES ('UN Drive', 'Montserrado', 'high', 78.5, 45, ARRAY['Speeding', 'Mobile Phone', 'Reckless Driving'],
  ARRAY['High traffic volume', 'Pedestrian crossings', 'Peak hour congestion', 'Multiple intersections'],
  'Install additional speed bumps and pedestrian crossing signs. Increase patrol presence.');

INSERT INTO public.risk_roads (road_name, county, risk_level, risk_score, incident_count, predominant_violation_types, factors, recommendation)
VALUES ('Monrovia-Ganta Highway (A1)', 'Margibi', 'high', 72.0, 32, ARRAY['Speeding', 'Dangerous Overtaking', 'Overloaded Vehicle'],
  ARRAY['High speed traffic', 'Limited lighting', 'Heavy commercial vehicles', 'Multiple villages along route'],
  'Consider speed cameras at known hotspots. Regular patrols between Kakata and Ganta.');

INSERT INTO public.risk_roads (road_name, county, risk_level, risk_score, incident_count, predominant_violation_types, factors, recommendation)
VALUES ('Broad Street', 'Montserrado', 'critical', 85.0, 52, ARRAY['Red Light Violation', 'Illegal Parking', 'No Seat Belt'],
  ARRAY['Dense urban area', 'Multiple intersections', 'High pedestrian volume', 'Market areas', 'Limited enforcement'],
  'Recommend traffic light upgrades, dedicated crossing guards, and increased traffic officer presence.');

INSERT INTO public.risk_roads (road_name, county, risk_level, risk_score, incident_count, predominant_violation_types, factors, recommendation)
VALUES ('Tubman Boulevard', 'Montserrado', 'medium', 55.0, 18, ARRAY['Speeding', 'Reckless Driving'],
  ARRAY['Wide road encourages speeding', 'Nightlife areas', 'Multiple access roads'],
  'Consider median barriers and speed calming measures near the SKD junction area.');

-- === NOTIFICATIONS ===

INSERT INTO public.notifications (user_id, title, message, type, priority, is_read, metadata)
SELECT p.id, 'Welcome to TrafficWatch AI', 'Your account has been created. Please complete your profile and set your preferences.', 'system', 'normal', false, '{}'::jsonb
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE title = 'Welcome to TrafficWatch AI' AND user_id = p.id);

INSERT INTO public.notifications (user_id, title, message, type, priority, is_read, metadata)
SELECT p.id, 'Wanted Vehicle Alert', 'ALERT: Vehicle LR-WANTED (Nissan Altima, Silver) flagged as STOLEN. If sighted, DO NOT APPROACH. Contact investigators immediately.', 'wanted_vehicle', 'critical', false,
  '{"plate_number": "LR-WANTED", "vehicle": "Nissan Altima", "color": "Silver", "incident_type": "hit_and_run"}'::jsonb
FROM public.profiles p WHERE p.role IN ('system_administrator', 'traffic_officer', 'police_supervisor', 'traffic_commander', 'investigator');

INSERT INTO public.notifications (user_id, title, message, type, priority, is_read)
SELECT p.id, 'AI Analysis Completed', 'AI analysis has been completed for a speeding incident on UN Drive. High confidence - 95.5%.', 'ai_complete', 'high', false
FROM public.profiles p WHERE p.role IN ('system_administrator', 'traffic_officer', 'police_supervisor');

-- === NOTIFICATION PREFERENCES ===

INSERT INTO public.notification_preferences (user_id, channels, notify_violations, notify_assignments, notify_evidence, notify_ai_results, notify_wanted_alerts, notify_system, quiet_hours_enabled)
SELECT p.id, ARRAY['in_app', 'push']::TEXT[], true, true, true, true, true, true, false
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.notification_preferences WHERE user_id = p.id);

-- === AUDIT LOGS ===

INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, details, ip_address)
SELECT 'account_created', p.id, 'profile', p.id::TEXT, ('{"method": "seed_data", "role": "' || p.role::TEXT || '"}'), '127.0.0.1'
FROM public.profiles p;

-- === OFFICER TASKS ===

INSERT INTO public.officer_tasks (officer_id, title, description, status, priority, task_type, related_incident_id)
SELECT p.id, 'Review AI Analysis - Speeding Incident', 'Please review the AI analysis results for the UN Drive speeding incident.', 'pending', 'high', 'ai_review', i.id
FROM public.profiles p, public.incidents i
WHERE p.email = 'officer1@trafficwatch.gov.lr' AND i.title ILIKE '%Speeding%UN Drive%';

INSERT INTO public.officer_tasks (officer_id, title, description, status, priority, task_type, related_incident_id)
SELECT p.id, 'Investigate Hit and Run - Ganta', 'Follow up on witness statements and review evidence from the hit and run incident in Ganta.', 'in_progress', 'critical', 'investigation', i.id
FROM public.profiles p, public.incidents i
WHERE p.email = 'investigator@trafficwatch.gov.lr' AND i.title ILIKE '%Hit and Run%Ganta%';

INSERT INTO public.officer_tasks (officer_id, title, description, status, priority, task_type)
SELECT p.id, 'Upload Dashcam Evidence', 'Your dashcam footage from the Broad Street red light incident needs to be uploaded.', 'pending', 'high', 'evidence_upload'
FROM public.profiles p WHERE p.email = 'officer1@trafficwatch.gov.lr';

-- === ROAD CONDITIONS ===

INSERT INTO public.road_conditions (condition_type, severity, description, location_lat, location_lng, location_from, location_to, reported_by_type, starts_at)
SELECT 'construction', 'moderate', 'Road construction on UN Drive near the Ministerial Complex. Lane closures in effect.', 6.3220, -10.8145, 'UN Drive near Ministry of Finance', 'UN Drive near Spriggs Payne Airport', 'system', NOW();

INSERT INTO public.road_conditions (condition_type, severity, description, location_lat, location_lng, reported_by_type, starts_at)
SELECT 'pothole', 'major', 'Large pothole on Tubman Boulevard near SKD junction. Multiple vehicles have reported damage.', 6.2900, -10.7250, 'citizen', NOW();

-- === EVIDENCE VERSIONS ===

INSERT INTO public.evidence_versions (id, evidence_id, version_number, file_url, file_size, mime_type, sha256_hash, processing_type, created_by)
SELECT gen_random_uuid(), e.id, 1, '/demo/evidence/processed/speed-radar-1.jpg', 256000, 'image/jpeg', 'sha256-demo-aaaa', 'compressed', p.id
FROM public.evidence e, public.profiles p
WHERE e.description ILIKE '%Speed radar reading%' AND p.email = 'officer1@trafficwatch.gov.lr';

-- === CHAIN OF CUSTODY ===

INSERT INTO public.evidence_custody (evidence_id, action, performed_by, details)
SELECT e.id, 'uploaded', p.id, '{"source": "officer_upload", "device": "body_camera"}'
FROM public.evidence e, public.profiles p
WHERE e.description ILIKE '%Speed radar%' AND p.email = 'officer1@trafficwatch.gov.lr';

INSERT INTO public.evidence_custody (evidence_id, action, performed_by, details)
SELECT e.id, 'uploaded', p.id, '{"source": "officer_upload", "device": "dashcam"}'
FROM public.evidence e, public.profiles p
WHERE e.description ILIKE '%Dashcam footage%' AND p.email = 'officer1@trafficwatch.gov.lr';

INSERT INTO public.evidence_custody (evidence_id, action, performed_by, details)
SELECT e.id, 'uploaded', p.id, '{"source": "officer_upload", "device": "mobile_phone"}'
FROM public.evidence e, public.profiles p
WHERE e.description ILIKE '%hit and run location%' AND p.email = 'investigator@trafficwatch.gov.lr';
