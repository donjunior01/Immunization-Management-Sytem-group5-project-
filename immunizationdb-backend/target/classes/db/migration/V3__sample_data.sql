-- V3__sample_data.sql
-- Sample data for all tables in the Immunization Management System

-- USERS
INSERT INTO users (username, password, email, full_name, role, facility_id, district_id, national_id, active, locked, failed_login_attempts, created_at, created_by, deleted, deleted_at)
VALUES
    ('health.worker', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'health.worker@immunization.com', 'Health Worker', 'HEALTH_WORKER', 'FAC001', NULL, NULL, true, false, 0, CURRENT_TIMESTAMP, NULL, false, NULL),
    ('facility.manager', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'facility.manager@immunization.com', 'Facility Manager', 'FACILITY_MANAGER', 'FAC001', 'DIST001', NULL, true, false, 0, CURRENT_TIMESTAMP, NULL, false, NULL),
    ('gov.official', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'gov.official@immunization.com', 'Government Official', 'GOVERNMENT_OFFICIAL', NULL, NULL, NULL, true, false, 0, CURRENT_TIMESTAMP, NULL, false, NULL),
    ('manager.fac002', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'manager.fac002@immunization.com', 'Manager FAC002', 'FACILITY_MANAGER', 'FAC002', 'DIST002', NULL, true, false, 0, CURRENT_TIMESTAMP, NULL, false, NULL),
    ('worker.fac002', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'worker.fac002@immunization.com', 'Health Worker FAC002', 'HEALTH_WORKER', 'FAC002', NULL, NULL, true, false, 0, CURRENT_TIMESTAMP, NULL, false, NULL)
ON CONFLICT (username) DO NOTHING;

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby John Doe', '2024-10-15', 'Male', 'Jane Doe', '0712345001', '123 Main Street, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby John Doe' AND date_of_birth='2024-10-15');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Mary Smith', '2024-09-20', 'Female', 'Sarah Smith', '0712345002', '456 Oak Avenue, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Mary Smith' AND date_of_birth='2024-09-20');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby David Johnson', '2024-08-10', 'Male', 'Lisa Johnson', '0712345003', '789 Pine Road, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby David Johnson' AND date_of_birth='2024-08-10');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Emma Wilson', '2024-07-05', 'Female', 'Robert Wilson', '0712345004', '321 Elm Street, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Emma Wilson' AND date_of_birth='2024-07-05');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby James Brown', '2024-11-01', 'Male', 'Patricia Brown', '0712345005', '654 Maple Drive, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby James Brown' AND date_of_birth='2024-11-01');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Sophia Davis', '2024-06-15', 'Female', 'Michael Davis', '0712345006', '987 Cedar Lane, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Sophia Davis' AND date_of_birth='2024-06-15');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Oliver Martinez', '2024-05-20', 'Male', 'Jennifer Martinez', '0712345007', '147 Birch Court, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Oliver Martinez' AND date_of_birth='2024-05-20');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Isabella Garcia', '2024-04-25', 'Female', 'William Garcia', '0712345008', '258 Spruce Way, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Isabella Garcia' AND date_of_birth='2024-04-25');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Liam Rodriguez', '2024-03-30', 'Male', 'Elizabeth Rodriguez', '0712345009', '369 Willow Path, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Liam Rodriguez' AND date_of_birth='2024-03-30');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Ava Lopez', '2024-02-14', 'Female', 'James Lopez', '0712345010', '741 Ash Boulevard, Nairobi', 'FAC001', false, NULL, CURRENT_TIMESTAMP, 1
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Ava Lopez' AND date_of_birth='2024-02-14');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Noah Anderson', '2024-09-05', 'Male', 'Mary Anderson', '0722345001', '111 River Road, Mombasa', 'FAC002', false, NULL, CURRENT_TIMESTAMP, 4
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Noah Anderson' AND date_of_birth='2024-09-05');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Mia Thomas', '2024-08-12', 'Female', 'David Thomas', '0722345002', '222 Lake Street, Mombasa', 'FAC002', false, NULL, CURRENT_TIMESTAMP, 4
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Mia Thomas' AND date_of_birth='2024-08-12');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Ethan Taylor', '2024-07-18', 'Male', 'Nancy Taylor', '0722345003', '333 Ocean Drive, Mombasa', 'FAC002', false, NULL, CURRENT_TIMESTAMP, 4
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Ethan Taylor' AND date_of_birth='2024-07-18');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Charlotte Moore', '2024-06-22', 'Female', 'Christopher Moore', '0722345004', '444 Beach Avenue, Mombasa', 'FAC002', false, NULL, CURRENT_TIMESTAMP, 4
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Charlotte Moore' AND date_of_birth='2024-06-22');

INSERT INTO patients (id, full_name, date_of_birth, gender, guardian_name, phone_number, address, facility_id, deleted, deleted_at, created_at, created_by)
SELECT gen_random_uuid(), 'Baby Lucas Jackson', '2024-10-30', 'Male', 'Linda Jackson', '0722345005', '555 Harbor Way, Mombasa', 'FAC002', false, NULL, CURRENT_TIMESTAMP, 4
WHERE NOT EXISTS (SELECT 1 FROM patients WHERE full_name='Baby Lucas Jackson' AND date_of_birth='2024-10-30');

-- VACCINE_BATCHES
INSERT INTO vaccine_batches (batch_number, vaccine_name, manufacturer, quantity_received, quantity_remaining, expiry_date, receipt_date, facility_id, created_at, created_by)
VALUES
    ('BCG-2024-001', 'BCG', 'Serum Institute of India', 500, 450, '2025-12-31', '2024-01-15', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('OPV-2024-001', 'OPV', 'Bio-Manguinhos', 1000, 850, '2025-11-30', '2024-02-01', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('DTP-2024-001', 'DTP', 'Bharat Biotech', 750, 600, '2025-10-31', '2024-03-10', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('MEASLES-2024-001', 'Measles', 'Serum Institute of India', 600, 500, '2025-09-30', '2024-04-05', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('HEPATITIS-2024-001', 'Hepatitis B', 'GlaxoSmithKline', 800, 700, '2026-01-31', '2024-05-20', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('BCG-2024-002', 'BCG', 'Serum Institute of India', 300, 280, '2025-01-10', '2024-06-01', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('OPV-2024-002', 'OPV', 'Bio-Manguinhos', 400, 350, '2025-01-05', '2024-06-15', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('DTP-2024-002', 'DTP', 'Bharat Biotech', 200, 45, '2025-08-31', '2024-07-01', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('MEASLES-2024-002', 'Measles', 'Serum Institute of India', 150, 30, '2025-07-31', '2024-07-15', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('POLIO-2023-001', 'Polio', 'Sanofi Pasteur', 500, 50, '2024-11-30', '2023-11-01', 'FAC001', CURRENT_TIMESTAMP, 1),
    ('BCG-2024-FAC2-001', 'BCG', 'Serum Institute of India', 400, 380, '2025-12-31', '2024-02-01', 'FAC002', CURRENT_TIMESTAMP, 3),
    ('OPV-2024-FAC2-001', 'OPV', 'Bio-Manguinhos', 800, 720, '2025-11-30', '2024-02-15', 'FAC002', CURRENT_TIMESTAMP, 3),
    ('DTP-2024-FAC2-001', 'DTP', 'Bharat Biotech', 600, 550, '2025-10-31', '2024-03-01', 'FAC002', CURRENT_TIMESTAMP, 3),
    ('MEASLES-2024-FAC2-001', 'Measles', 'Serum Institute of India', 500, 450, '2025-09-30', '2024-03-15', 'FAC002', CURRENT_TIMESTAMP, 3),
    ('HEPATITIS-2024-FAC2-001', 'Hepatitis B', 'GlaxoSmithKline', 700, 650, '2026-02-28', '2024-04-01', 'FAC002', CURRENT_TIMESTAMP, 3)
ON CONFLICT (batch_number, facility_id) DO NOTHING;

-- VACCINATIONS
INSERT INTO vaccinations (patient_id, batch_id, nurse_id, vaccine_name, dose_number, date_administered, facility_id, notes, created_at)
SELECT p.id, 1, 1, 'BCG', 1, CURRENT_DATE - INTERVAL '5 days', 'FAC001', 'First dose administered successfully', CURRENT_TIMESTAMP FROM patients p WHERE p.facility_id = 'FAC001' LIMIT 5;
INSERT INTO vaccinations (patient_id, batch_id, nurse_id, vaccine_name, dose_number, date_administered, facility_id, notes, created_at)
SELECT p.id, 2, 1, 'OPV', 1, CURRENT_DATE - INTERVAL '3 days', 'FAC001', 'OPV dose 1 - no adverse reactions', CURRENT_TIMESTAMP FROM patients p WHERE p.facility_id = 'FAC001' LIMIT 4;
INSERT INTO vaccinations (patient_id, batch_id, nurse_id, vaccine_name, dose_number, date_administered, facility_id, notes, created_at)
SELECT p.id, 3, 1, 'DTP', 1, CURRENT_DATE - INTERVAL '1 day', 'FAC001', 'DTP vaccination completed', CURRENT_TIMESTAMP FROM patients p WHERE p.facility_id = 'FAC001' LIMIT 3;
INSERT INTO vaccinations (patient_id, batch_id, nurse_id, vaccine_name, dose_number, date_administered, facility_id, notes, created_at)
SELECT p.id, 11, 5, 'BCG', 1, CURRENT_DATE - INTERVAL '4 days', 'FAC002', 'BCG administered - birth dose', CURRENT_TIMESTAMP FROM patients p WHERE p.facility_id = 'FAC002' LIMIT 3;

-- CAMPAIGNS
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'BCG Newborn Campaign 2024', 'BCG vaccination for all newborns in the facility', 'BCG', '0-1 months', '2024-11-01', '2025-01-31', 500, 245, 'ACTIVE', 'FAC001', 'DIST001', NULL, CURRENT_TIMESTAMP, 2, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'BCG Newborn Campaign 2024');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'Measles Outbreak Response', 'Emergency measles vaccination campaign', 'Measles', '9-59 months', '2024-12-01', '2025-02-28', 1000, 387, 'ACTIVE', 'FAC001', 'DIST001', NULL, CURRENT_TIMESTAMP, 2, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'Measles Outbreak Response');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'DTP Catch-up Campaign', 'DTP vaccination for missed doses', 'DTP', '6-18 months', '2024-11-15', '2025-01-15', 750, 523, 'ACTIVE', 'FAC002', 'DIST002', NULL, CURRENT_TIMESTAMP, 4, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'DTP Catch-up Campaign');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'Polio National Immunization Day', 'National polio eradication campaign', 'OPV', '0-5 years', '2025-01-15', '2025-01-17', 5000, 0, 'PLANNED', NULL, NULL, NULL, CURRENT_TIMESTAMP, 3, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'Polio National Immunization Day');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'Hepatitis B Birth Dose', 'Hepatitis B vaccination at birth', 'Hepatitis B', '0-1 months', '2025-02-01', '2025-04-30', 800, 0, 'PLANNED', 'FAC001', 'DIST001', NULL, CURRENT_TIMESTAMP, 2, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'Hepatitis B Birth Dose');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'Q3 Routine Immunization', 'Quarterly routine immunization drive', 'Multiple', 'All ages', '2024-07-01', '2024-09-30', 2000, 1847, 'COMPLETED', 'FAC001', 'DIST001', NULL, CURRENT_TIMESTAMP - INTERVAL '90 days', 2, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'Q3 Routine Immunization');
INSERT INTO campaigns (name, description, vaccine_name, target_age_group, start_date, end_date, target_population, vaccinated_count, status, facility_id, district_id, national_id, created_at, created_by, updated_at)
SELECT 'Back-to-School Vaccination', 'School entry vaccination campaign', 'Multiple', '5-6 years', '2024-08-01', '2024-08-31', 1500, 1423, 'COMPLETED', 'FAC002', 'DIST002', NULL, CURRENT_TIMESTAMP - INTERVAL '60 days', 4, NULL WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE name = 'Back-to-School Vaccination');

-- OFFLINE_SYNC_QUEUE
INSERT INTO offline_sync_queue (user_id, entity_type, entity_id, operation_type, entity_data, sync_status, retry_count, error_message, created_at, synced_at)
VALUES
    (1, 'patient', '1', 'CREATE', '{"name": "Baby John Doe"}', 'PENDING', 0, NULL, CURRENT_TIMESTAMP, NULL),
    (2, 'vaccine_batch', '1', 'UPDATE', '{"batch_number": "BCG-2024-001"}', 'SUCCESS', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'campaign', '1', 'CREATE', '{"name": "BCG Newborn Campaign 2024"}', 'FAILED', 2, 'Network error', CURRENT_TIMESTAMP, NULL);

-- Update batch quantities to reflect vaccinations
UPDATE vaccine_batches SET quantity_remaining = quantity_remaining - 50 WHERE batch_number = 'BCG-2024-001' AND quantity_remaining >= 50;
UPDATE vaccine_batches SET quantity_remaining = quantity_remaining - 40 WHERE batch_number = 'OPV-2024-001' AND quantity_remaining >= 40;
UPDATE vaccine_batches SET quantity_remaining = quantity_remaining - 30 WHERE batch_number = 'DTP-2024-001' AND quantity_remaining >= 30;
UPDATE vaccine_batches SET quantity_remaining = quantity_remaining - 30 WHERE batch_number = 'BCG-2024-FAC2-001' AND quantity_remaining >= 30;
