-- ============================================================
-- TrafficWatch AI — Seed Data Part 1: Profiles + Vehicles
-- ============================================================
-- Run AFTER all migrations have been applied.
-- All IDs use gen_random_uuid(). FK refs use subqueries.
-- ============================================================

-- === OFFICER PROFILES ===

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'admin@trafficwatch.gov.lr', 'James Gbartea', 'system_administrator', 'ADM-001', 'National Police HQ', '+231-77-000-0001', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'commissioner@trafficwatch.gov.lr', 'Musu Kromah', 'national_commissioner', 'COM-001', 'National Police HQ', '+231-77-000-0002', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'commissioner@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'regional-west@trafficwatch.gov.lr', 'William Nyekan', 'regional_commander', 'RC-001', 'Tubmanburg Station', '+231-77-000-0003', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'regional-west@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'traffic-cmd@trafficwatch.gov.lr', 'Martha Toe', 'traffic_commander', 'TC-001', 'Monrovia Traffic Division', '+231-77-000-0004', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'traffic-cmd@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'supervisor@trafficwatch.gov.lr', 'Samuel Dorley', 'police_supervisor', 'SUP-001', 'Paynesville Station', '+231-77-000-0005', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'supervisor@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'officer1@trafficwatch.gov.lr', 'John Kollie', 'traffic_officer', 'OFC-001', 'Monrovia Traffic Division', '+231-77-000-0006', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'officer1@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'officer2@trafficwatch.gov.lr', 'Fatmata Kamara', 'traffic_officer', 'OFC-002', 'Paynesville Station', '+231-77-000-0007', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'officer2@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'officer3@trafficwatch.gov.lr', 'Emmanuel Turay', 'traffic_officer', 'OFC-003', 'Buchanan Station', '+231-77-000-0008', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'officer3@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'investigator@trafficwatch.gov.lr', 'Kadiatu Bangura', 'investigator', 'INV-001', 'National Investigation Bureau', '+231-77-000-0009', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'investigator@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'evidence@trafficwatch.gov.lr', 'Josephine Flomo', 'evidence_officer', 'EVI-001', 'National Police HQ', '+231-77-000-0010', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'evidence@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'auditor@trafficwatch.gov.lr', 'Abraham Sirleaf', 'system_auditor', 'AUD-001', 'National Audit Bureau', '+231-77-000-0011', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'auditor@trafficwatch.gov.lr');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'citizen1@example.com', 'Peter Sherman', 'citizen', 'CIT-001', '', '+231-77-000-0012', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'citizen1@example.com');

INSERT INTO public.profiles (id, email, full_name, role, badge_number, station, phone, is_active)
SELECT gen_random_uuid(), 'citizen2@example.com', 'Maria Johnson', 'citizen', 'CIT-002', '', '+231-77-000-0013', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'citizen2@example.com');

-- === VEHICLES ===

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-1234', 'Sedan', 'Toyota', 'Corolla', 2020, 'White', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-1234');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-5678', 'SUV', 'Honda', 'CR-V', 2022, 'Black', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-5678');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-9012', 'Truck', 'Isuzu', 'D-Max', 2021, 'Blue', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-9012');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-3456', 'Motorcycle', 'Honda', 'CB125', 2023, 'Red', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-3456');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-7890', 'Minibus', 'Toyota', 'Hiace', 2019, 'Silver', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-7890');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-2345', 'Sedan', 'Mercedes-Benz', 'C-Class', 2023, 'Navy', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-2345');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-6789', 'SUV', 'Toyota', 'Land Cruiser', 2024, 'White', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-6789');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen, is_wanted)
SELECT gen_random_uuid(), 'LR-WANTED', 'Sedan', 'Nissan', 'Altima', 2021, 'Silver', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-WANTED');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-1111', 'SUV', 'Ford', 'Ranger', 2022, 'Green', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-1111');

INSERT INTO public.vehicles (id, license_plate, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, is_stolen)
SELECT gen_random_uuid(), 'LR-2222', 'Sedan', 'BMW', '3 Series', 2023, 'Grey', false
WHERE NOT EXISTS (SELECT 1 FROM public.vehicles WHERE license_plate = 'LR-2222');
