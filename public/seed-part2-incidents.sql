-- ============================================================
-- TrafficWatch AI — Seed Data Part 2: Incidents, Persons, Witnesses
-- ============================================================
-- Run Part 1 first. Uses subqueries to find profile IDs by email.
-- ============================================================

DO LANGUAGE plpgsql $$
DECLARE
  v_officer1_id UUID;
  v_officer2_id UUID;
  v_officer3_id UUID;
  v_investigator_id UUID;
  v_supervisor_id UUID;
  v_speeding_id UUID;
  v_redlight_id UUID;
  v_illegal_parking_id UUID;
  v_reckless_id UUID;
  v_no_helmet_id UUID;
  v_overloaded_id UUID;
  v_mobile_phone_id UUID;
  v_inc1 UUID; v_inc2 UUID; v_inc3 UUID; v_inc4 UUID; v_inc5 UUID;
  v_inc6 UUID; v_inc7 UUID; v_inc8 UUID; v_inc9 UUID; v_inc10 UUID;
BEGIN
  SELECT id INTO v_officer1_id FROM public.profiles WHERE email = 'officer1@trafficwatch.gov.lr' LIMIT 1;
  SELECT id INTO v_officer2_id FROM public.profiles WHERE email = 'officer2@trafficwatch.gov.lr' LIMIT 1;
  SELECT id INTO v_officer3_id FROM public.profiles WHERE email = 'officer3@trafficwatch.gov.lr' LIMIT 1;
  SELECT id INTO v_investigator_id FROM public.profiles WHERE email = 'investigator@trafficwatch.gov.lr' LIMIT 1;
  SELECT id INTO v_supervisor_id FROM public.profiles WHERE email = 'supervisor@trafficwatch.gov.lr' LIMIT 1;

  SELECT id INTO v_speeding_id FROM public.violation_types WHERE code = 'SPEEDING' LIMIT 1;
  SELECT id INTO v_redlight_id FROM public.violation_types WHERE code = 'RED_LIGHT' LIMIT 1;
  SELECT id INTO v_illegal_parking_id FROM public.violation_types WHERE code = 'ILLEGAL_PARKING' LIMIT 1;
  SELECT id INTO v_reckless_id FROM public.violation_types WHERE code = 'RECKLESS_DRIVING' LIMIT 1;
  SELECT id INTO v_no_helmet_id FROM public.violation_types WHERE code = 'NO_HELMET' LIMIT 1;
  SELECT id INTO v_overloaded_id FROM public.violation_types WHERE code = 'OVERLOADED' LIMIT 1;
  SELECT id INTO v_mobile_phone_id FROM public.violation_types WHERE code = 'MOBILE_PHONE' LIMIT 1;

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer1_id, v_speeding_id, 'Speeding - UN Drive', 'Vehicle observed travelling at 95 km/h in a 50 km/h zone.', 6.3215, -10.8145, 'UN Drive, Monrovia', 'LR-1234', 'Sedan', 'White', 'serious', 'resolved')
  RETURNING id INTO v_inc1;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc1, 'incident_created', v_officer1_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc1, 'status_changed', v_officer1_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc1, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "resolved"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer1_id, v_redlight_id, 'Red Light Violation - Broad Street', 'Vehicle failed to stop at red traffic signal at Broad Street.', 6.3285, -10.8120, 'Broad St & Randall St, Monrovia', 'LR-5678', 'SUV', 'Black', 'critical', 'under_review')
  RETURNING id INTO v_inc2;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc2, 'incident_created', v_officer1_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc2, 'status_changed', v_officer1_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc2, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "under_review"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer2_id, v_illegal_parking_id, 'Illegal Parking - Waterside Market', 'Vehicle parked in no-parking zone at Waterside Market.', 6.3200, -10.8080, 'Waterside Market, Monrovia', 'LR-7890', 'Minibus', 'Silver', 'minor', 'closed')
  RETURNING id INTO v_inc3;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc3, 'incident_created', v_officer2_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc3, 'status_changed', v_officer2_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc3, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "closed"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status, officer_notes)
  VALUES (gen_random_uuid(), v_officer1_id, v_reckless_id, 'Reckless Driving - Tubman Boulevard', 'Driver swerving between lanes, cutting off multiple vehicles.', 6.2900, -10.7250, 'Tubman Boulevard, Monrovia', 'LR-2345', 'Sedan', 'Navy', 'critical', 'investigating')
  RETURNING id INTO v_inc4;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc4, 'incident_created', v_officer1_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc4, 'status_changed', v_officer1_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc4, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "investigating"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer2_id, v_no_helmet_id, 'Motorcycle Without Helmet - Paynesville', 'Motorcycle rider and passenger without helmets.', 6.2856, -10.7224, 'Red Light, Paynesville', 'LR-3456', 'Motorcycle', 'Red', 'moderate', 'resolved')
  RETURNING id INTO v_inc5;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc5, 'incident_created', v_officer2_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc5, 'status_changed', v_officer2_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc5, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "resolved"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer3_id, v_overloaded_id, 'Overloaded Truck - Buchanan Highway', 'Commercial truck stopped at Kakata carrying excess load.', 6.5031, -10.3528, 'Kakata Checkpoint, Margibi', 'LR-9012', 'Truck', 'Blue', 'serious', 'resolved')
  RETURNING id INTO v_inc6;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc6, 'incident_created', v_officer3_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc6, 'status_changed', v_officer3_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc6, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "resolved"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, vehicle_type, vehicle_color, severity, status)
  VALUES (gen_random_uuid(), v_officer1_id, v_mobile_phone_id, 'Mobile Phone Use While Driving', 'Driver holding mobile phone while driving on UN Drive.', 6.3220, -10.8130, 'UN Drive, Monrovia', 'LR-2222', 'Sedan', 'Grey', 'moderate', 'submitted')
  RETURNING id INTO v_inc7;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc7, 'incident_created', v_officer1_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc7, 'status_changed', v_officer1_id, '{"from": "draft", "to": "submitted"}');

  INSERT INTO public.incidents (id, officer_id, title, description, location_lat, location_lng, location_address, vehicle_plate, severity, status)
  VALUES (gen_random_uuid(), v_investigator_id, 'Hit and Run - Ganta Highway', 'Vehicle struck pedestrian near Ganta market and fled.', 7.0233, -9.0504, 'Ganta, Nimba County', 'LR-WANTED', 'critical', 'investigating')
  RETURNING id INTO v_inc8;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc8, 'incident_created', v_investigator_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc8, 'status_changed', v_investigator_id, '{"from": "draft", "to": "investigating"}');

  INSERT INTO public.incidents (id, officer_id, title, description, location_lat, location_lng, location_address, vehicle_plate, severity, status)
  VALUES (gen_random_uuid(), v_officer2_id, 'Seat Belt Violation - Broad Street', 'Driver and front passenger not wearing seat belts.', 6.3270, -10.8110, 'Broad Street, Monrovia', 'LR-1111', 'minor', 'closed')
  RETURNING id INTO v_inc9;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc9, 'incident_created', v_officer2_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc9, 'status_changed', v_officer2_id, '{"from": "draft", "to": "submitted"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc9, 'status_changed', v_supervisor_id, '{"from": "submitted", "to": "closed"}');

  INSERT INTO public.incidents (id, officer_id, violation_type_id, title, description, location_lat, location_lng, location_address, vehicle_plate, severity, status)
  VALUES (gen_random_uuid(), v_officer3_id, v_speeding_id, 'Speeding - Monrovia-Ganta Highway', 'Vehicle clocked at 120 km/h near Kakata.', 6.5100, -10.3400, 'Kakata, Margibi County', 'LR-6789', 'serious', 'submitted')
  RETURNING id INTO v_inc10;
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc10, 'incident_created', v_officer3_id, '{"status": "draft"}');
  INSERT INTO public.incident_logs (incident_id, action, performed_by, details) VALUES (v_inc10, 'status_changed', v_officer3_id, '{"from": "draft", "to": "submitted"}');
END;
$$;

-- === INVOLVED PERSONS ===

INSERT INTO public.involved_persons (id, incident_id, full_name, id_type, id_number, phone, role, statement)
SELECT gen_random_uuid(), i.id, 'Thomas Kerkula', 'drivers_license', 'DL-2020-12345', '+231-77-100-0001', 'driver', 'I was driving at normal speed when the officer stopped me.'
FROM public.incidents i WHERE i.title ILIKE 'Speeding%UN Drive%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.involved_persons WHERE phone = '+231-77-100-0001');

INSERT INTO public.involved_persons (id, incident_id, full_name, id_type, id_number, phone, role, statement)
SELECT gen_random_uuid(), i.id, 'James Kollie Jr.', 'drivers_license', 'DL-2019-54321', '+231-77-100-0002', 'driver', 'The light was yellow when I crossed.'
FROM public.incidents i WHERE i.title ILIKE '%Red Light%Broad Street%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.involved_persons WHERE phone = '+231-77-100-0002');

INSERT INTO public.involved_persons (id, incident_id, full_name, id_type, id_number, phone, role, statement)
SELECT gen_random_uuid(), i.id, 'Amara Sheriff', 'national_id', 'NID-2018-98765', '+231-77-100-0003', 'driver', 'I was not driving recklessly. The officer was mistaken.'
FROM public.incidents i WHERE i.title ILIKE '%Reckless%Tubman%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.involved_persons WHERE phone = '+231-77-100-0003');

INSERT INTO public.involved_persons (id, incident_id, full_name, id_type, id_number, phone, role)
SELECT gen_random_uuid(), i.id, 'Musu Williams', 'national_id', 'NID-2021-45678', '+231-77-100-0004', 'pedestrian'
FROM public.incidents i WHERE i.title ILIKE '%Hit and Run%Ganta%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.involved_persons WHERE phone = '+231-77-100-0004');

-- === WITNESSES ===

INSERT INTO public.witnesses (id, incident_id, full_name, phone, statement, consent_given)
SELECT gen_random_uuid(), i.id, 'Josephine Brown', '+231-77-200-0001', 'I saw the silver car speed through the red light.', true
FROM public.incidents i WHERE i.title ILIKE '%Red Light%Broad Street%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.witnesses WHERE phone = '+231-77-200-0001');

INSERT INTO public.witnesses (id, incident_id, full_name, phone, statement, consent_given)
SELECT gen_random_uuid(), i.id, 'Mohamed Fofana', '+231-77-200-0002', 'The car was definitely speeding.', true
FROM public.incidents i WHERE i.title ILIKE '%Red Light%Broad Street%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.witnesses WHERE phone = '+231-77-200-0002');

INSERT INTO public.witnesses (id, incident_id, full_name, phone, statement, consent_given)
SELECT gen_random_uuid(), i.id, 'Sia Kabbah', '+231-77-200-0003', 'I heard the crash and saw the car speeding away.', true
FROM public.incidents i WHERE i.title ILIKE '%Hit and Run%Ganta%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.witnesses WHERE phone = '+231-77-200-0003');

INSERT INTO public.witnesses (id, incident_id, full_name, phone, statement, consent_given)
SELECT gen_random_uuid(), i.id, 'David Gbartea', '+231-77-200-0004', 'The driver was swerving all over the road.', false
FROM public.incidents i WHERE i.title ILIKE '%Reckless%Tubman%' LIMIT 1
WHERE NOT EXISTS (SELECT 1 FROM public.witnesses WHERE phone = '+231-77-200-0004');
