-- =====================================================
-- IMMUNIZATION MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Database: donjdb
-- Password: l22aan099LItiQNi
-- =====================================================

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users
(
    id                     BIGSERIAL PRIMARY KEY,
    username               VARCHAR(50)                             NOT NULL UNIQUE,
    password               VARCHAR(255)                            NOT NULL,
    email                  VARCHAR(255)                            NOT NULL,
    full_name              VARCHAR(255)                            NOT NULL,
    role                   VARCHAR(50)                             NOT NULL,
    facility_id            VARCHAR(50),
    district_id            VARCHAR(50),
    national_id            VARCHAR(50),
    active                 BOOLEAN                                 NOT NULL DEFAULT true,
    locked                 BOOLEAN                                 NOT NULL DEFAULT false,
    failed_login_attempts  INTEGER                                 NOT NULL DEFAULT 0,
    created_at             TIMESTAMP WITHOUT TIME ZONE             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by             BIGINT,
    deleted                BOOLEAN                                 NOT NULL DEFAULT false,
    deleted_at             TIMESTAMP WITHOUT TIME ZONE
);

-- =====================================================
-- 2. CREATE FACILITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS facilities
(
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL, -- 'HOSPITAL', 'HEALTH_CENTER', 'CLINIC'
    district_id     VARCHAR(50),
    county          VARCHAR(100),
    address         TEXT,
    phone_number    VARCHAR(20),
    email           VARCHAR(255),
    capacity        INTEGER,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITHOUT TIME ZONE
);

-- =====================================================
-- 3. CREATE DISTRICTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS districts
(
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    county          VARCHAR(100) NOT NULL,
    population      INTEGER,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. CREATE PATIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patients
(
    id            UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(255)                NOT NULL,
    date_of_birth date                        NOT NULL,
    gender        VARCHAR(10)                 NOT NULL,
    guardian_name VARCHAR(255),
    phone_number  VARCHAR(20),
    national_id   VARCHAR(50),
    address       TEXT,
    facility_id   VARCHAR(50)                 NOT NULL,
    has_severe_adverse_events BOOLEAN         NOT NULL DEFAULT false,
    deleted       BOOLEAN                     NOT NULL DEFAULT false,
    deleted_at    TIMESTAMP WITHOUT TIME ZONE,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    BIGINT
);

-- =====================================================
-- 5. CREATE VACCINES MASTER TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vaccines
(
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL UNIQUE,
    full_name           VARCHAR(255),
    manufacturer        VARCHAR(100),
    description         TEXT,
    dosage_ml           DECIMAL(5,2),
    doses_required      INTEGER NOT NULL DEFAULT 1,
    dose_interval_days  INTEGER, -- Interval between doses
    minimum_age_days    INTEGER, -- Minimum age for first dose
    storage_temp_min    DECIMAL(5,2), -- Minimum storage temperature (Celsius)
    storage_temp_max    DECIMAL(5,2), -- Maximum storage temperature (Celsius)
    active              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. CREATE DOSE SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dose_schedules
(
    id              BIGSERIAL PRIMARY KEY,
    vaccine_id      BIGINT NOT NULL,
    dose_number     INTEGER NOT NULL,
    age_months      INTEGER NOT NULL, -- Recommended age in months
    description     VARCHAR(255),
    CONSTRAINT fk_dose_vaccine FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE,
    CONSTRAINT uk_vaccine_dose UNIQUE (vaccine_id, dose_number)
);

-- =====================================================
-- 7. CREATE VACCINE BATCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vaccine_batches
(
    id                 BIGSERIAL PRIMARY KEY,
    batch_number       VARCHAR(50)                             NOT NULL,
    vaccine_name       VARCHAR(100)                            NOT NULL,
    manufacturer       VARCHAR(100)                            NOT NULL,
    quantity_received  INTEGER                                 NOT NULL,
    quantity_remaining INTEGER                                 NOT NULL,
    expiry_date        date                                    NOT NULL,
    receipt_date       date                                    NOT NULL,
    facility_id        VARCHAR(50)                             NOT NULL,
    created_at         TIMESTAMP WITHOUT TIME ZONE             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT,
    CONSTRAINT uk_batch_facility UNIQUE (batch_number, facility_id)
);

-- =====================================================
-- 8. CREATE VACCINATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vaccinations
(
    id                BIGSERIAL PRIMARY KEY,
    patient_id        UUID                                    NOT NULL,
    batch_id          BIGINT                                  NOT NULL,
    nurse_id          BIGINT                                  NOT NULL,
    vaccine_name      VARCHAR(100)                            NOT NULL,
    dose_number       INTEGER                                 NOT NULL,
    date_administered date                                    NOT NULL,
    administration_site VARCHAR(50)                           NOT NULL DEFAULT 'LEFT_ARM',
    facility_id       VARCHAR(50)                             NOT NULL,
    notes             VARCHAR(500),
    created_at        TIMESTAMP WITHOUT TIME ZONE             NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. CREATE APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments
(
    id              UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID                        NOT NULL,
    facility_id     VARCHAR(50)                 NOT NULL,
    vaccine_name    VARCHAR(100)                NOT NULL,
    dose_number     INTEGER                     NOT NULL,
    appointment_date date                       NOT NULL,
    appointment_time TIME,
    status          VARCHAR(20)                 NOT NULL,
    notes           VARCHAR(500),
    sms_sent        BOOLEAN                     NOT NULL DEFAULT false,
    sms_sent_at     TIMESTAMP WITHOUT TIME ZONE,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT,
    updated_at      TIMESTAMP WITHOUT TIME ZONE
);

-- =====================================================
-- 10. CREATE CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns
(
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(200)                            NOT NULL,
    description        TEXT,
    vaccine_name       VARCHAR(100)                            NOT NULL,
    target_age_group   VARCHAR(100),
    start_date         date                                    NOT NULL,
    end_date           date                                    NOT NULL,
    target_population  INTEGER,
    vaccinated_count   INTEGER                                 DEFAULT 0,
    status             VARCHAR(20)                             NOT NULL,
    facility_id        VARCHAR(50),
    district_id        VARCHAR(50),
    national_id        VARCHAR(50),
    created_at         TIMESTAMP WITHOUT TIME ZONE             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT,
    updated_at         TIMESTAMP WITHOUT TIME ZONE
);

-- =====================================================
-- 11. CREATE ADVERSE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS adverse_events
(
    id              BIGSERIAL PRIMARY KEY,
    patient_id      UUID NOT NULL,
    vaccination_id  BIGINT,
    severity        VARCHAR(20) NOT NULL, -- 'MILD', 'MODERATE', 'SEVERE'
    description     TEXT NOT NULL,
    action_taken    TEXT,
    reported_by     BIGINT NOT NULL,
    reported_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. CREATE STOCK MOVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements
(
    id              BIGSERIAL PRIMARY KEY,
    facility_id     VARCHAR(50) NOT NULL,
    vaccine_id      VARCHAR(100) NOT NULL, -- Vaccine name or ID
    batch_number    VARCHAR(50) NOT NULL,
    movement_type   VARCHAR(20) NOT NULL, -- 'RECEIVED', 'USED', 'ADJUSTED', 'DAMAGED', 'EXPIRED'
    quantity        INTEGER NOT NULL,
    reason          TEXT,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. CREATE STOCK ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_alerts
(
    id              BIGSERIAL PRIMARY KEY,
    facility_id     VARCHAR(50) NOT NULL,
    batch_id        BIGINT,
    alert_type      VARCHAR(50) NOT NULL, -- 'LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'OUT_OF_STOCK'
    severity        VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    message         TEXT NOT NULL,
    is_resolved     BOOLEAN NOT NULL DEFAULT false,
    resolved_at     TIMESTAMP WITHOUT TIME ZONE,
    resolved_by     BIGINT,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 14. CREATE AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs
(
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL, -- 'USER', 'PATIENT', 'VACCINATION', 'BATCH', 'CAMPAIGN'
    entity_id       VARCHAR(100),
    old_value       TEXT,
    new_value       TEXT,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 15. CREATE OFFLINE SYNC QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS offline_sync_queue
(
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT                                  NOT NULL,
    entity_type     VARCHAR(50)                             NOT NULL,
    entity_id       VARCHAR(100)                            NOT NULL,
    operation_type  VARCHAR(20)                             NOT NULL,
    entity_data     TEXT,
    sync_status     VARCHAR(20)                             NOT NULL,
    retry_count     INTEGER                                 DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMP WITHOUT TIME ZONE             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at       TIMESTAMP WITHOUT TIME ZONE
);

-- =====================================================
-- 16. CREATE SMS LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_logs
(
    id              BIGSERIAL PRIMARY KEY,
    recipient_phone VARCHAR(20) NOT NULL,
    message         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL, -- 'SENT', 'FAILED', 'PENDING'
    error_message   TEXT,
    appointment_id  UUID,
    patient_id      UUID,
    sent_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 17. CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_facility_id ON users (facility_id);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_facility_patients ON patients (facility_id);
CREATE INDEX IF NOT EXISTS idx_patient_dob ON patients (date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patient_deleted ON patients (deleted);
CREATE INDEX IF NOT EXISTS idx_patients_severe_adverse_events ON patients(has_severe_adverse_events);

-- Vaccine batches indexes
CREATE INDEX IF NOT EXISTS idx_facility_batches ON vaccine_batches (facility_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_name ON vaccine_batches (vaccine_name);
CREATE INDEX IF NOT EXISTS idx_expiry_date ON vaccine_batches (expiry_date);

-- Vaccinations indexes
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations ON vaccinations (patient_id);
CREATE INDEX IF NOT EXISTS idx_batch_vaccinations ON vaccinations (batch_id);
CREATE INDEX IF NOT EXISTS idx_facility_vaccinations ON vaccinations (facility_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_date ON vaccinations (date_administered);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointment_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_facility ON appointments(facility_id);
CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointments(status);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaign_dates ON campaigns (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaign_facility ON campaigns (facility_id);

-- Facilities indexes
CREATE INDEX IF NOT EXISTS idx_facilities_district ON facilities(district_id);
CREATE INDEX IF NOT EXISTS idx_facilities_active ON facilities(active);

-- Districts indexes
CREATE INDEX IF NOT EXISTS idx_districts_county ON districts(county);

-- Vaccines indexes
CREATE INDEX IF NOT EXISTS idx_vaccines_active ON vaccines(active);

-- Stock alerts indexes
CREATE INDEX IF NOT EXISTS idx_stock_alerts_facility ON stock_alerts(facility_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON stock_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created ON stock_alerts(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_status ON offline_sync_queue (sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_user ON offline_sync_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_created ON offline_sync_queue (created_at);

-- Adverse events indexes
CREATE INDEX IF NOT EXISTS idx_adverse_event_patient ON adverse_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_adverse_event_vaccination ON adverse_events(vaccination_id);
CREATE INDEX IF NOT EXISTS idx_adverse_event_severity ON adverse_events(severity);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movement_facility ON stock_movements(facility_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_vaccine ON stock_movements(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movement_batch ON stock_movements(batch_number);
CREATE INDEX IF NOT EXISTS idx_stock_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movement_created_at ON stock_movements(created_at);

-- SMS logs indexes
CREATE INDEX IF NOT EXISTS idx_sms_log_recipient ON sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_log_appointment ON sms_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_patient ON sms_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_at ON sms_logs(sent_at);

-- =====================================================
-- 18. CREATE FOREIGN KEY CONSTRAINTS
-- =====================================================

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_facility 
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE patients ADD CONSTRAINT IF NOT EXISTS fk_patients_facility 
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE;

ALTER TABLE vaccine_batches ADD CONSTRAINT IF NOT EXISTS fk_batches_facility 
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE;

ALTER TABLE vaccinations ADD CONSTRAINT IF NOT EXISTS fk_vaccinations_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE vaccinations ADD CONSTRAINT IF NOT EXISTS fk_vaccinations_batch 
    FOREIGN KEY (batch_id) REFERENCES vaccine_batches(id) ON DELETE RESTRICT;

ALTER TABLE vaccinations ADD CONSTRAINT IF NOT EXISTS fk_vaccinations_nurse 
    FOREIGN KEY (nurse_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS fk_appointment_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE campaigns ADD CONSTRAINT IF NOT EXISTS fk_campaigns_facility 
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE;

ALTER TABLE campaigns ADD CONSTRAINT IF NOT EXISTS fk_campaigns_creator 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE adverse_events ADD CONSTRAINT IF NOT EXISTS fk_adverse_event_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE adverse_events ADD CONSTRAINT IF NOT EXISTS fk_adverse_event_vaccination 
    FOREIGN KEY (vaccination_id) REFERENCES vaccinations(id) ON DELETE SET NULL;

ALTER TABLE adverse_events ADD CONSTRAINT IF NOT EXISTS fk_adverse_event_reporter 
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE stock_movements ADD CONSTRAINT IF NOT EXISTS fk_stock_movement_user 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE stock_alerts ADD CONSTRAINT IF NOT EXISTS fk_alert_batch 
    FOREIGN KEY (batch_id) REFERENCES vaccine_batches(id) ON DELETE SET NULL;

ALTER TABLE audit_logs ADD CONSTRAINT IF NOT EXISTS fk_audit_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sms_logs ADD CONSTRAINT IF NOT EXISTS fk_sms_log_appointment 
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

ALTER TABLE sms_logs ADD CONSTRAINT IF NOT EXISTS fk_sms_log_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

-- =====================================================
-- 19. INSERT SAMPLE DATA (OPTIONAL - COMMENT OUT IF NOT NEEDED)
-- =====================================================

-- Insert Sample Districts
INSERT INTO districts (id, name, county, population) VALUES
('DIST001', 'Nairobi Central', 'Nairobi', 500000),
('DIST002', 'Mombasa Island', 'Mombasa', 300000),
('DIST003', 'Kisumu Central', 'Kisumu', 250000),
('DIST004', 'Nakuru Town', 'Nakuru', 350000),
('DIST005', 'Eldoret West', 'Uasin Gishu', 280000)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Facilities
INSERT INTO facilities (id, name, type, district_id, county, address, phone_number, email, capacity, active) VALUES
('FAC001', 'Nairobi Central Health Center', 'HEALTH_CENTER', 'DIST001', 'Nairobi', 'Kenyatta Avenue, Nairobi', '+254712345001', 'nairobi.central@health.ke', 200, true),
('FAC002', 'Mombasa Coast Hospital', 'HOSPITAL', 'DIST002', 'Mombasa', 'Moi Avenue, Mombasa', '+254712345002', 'mombasa.coast@health.ke', 500, true),
('FAC003', 'Kisumu Lake View Clinic', 'CLINIC', 'DIST003', 'Kisumu', 'Oginga Odinga Road, Kisumu', '+254712345003', 'kisumu.lakeview@health.ke', 100, true),
('FAC004', 'Nakuru Rift Valley Health Center', 'HEALTH_CENTER', 'DIST004', 'Nakuru', 'Kenyatta Avenue, Nakuru', '+254712345004', 'nakuru.riftvalley@health.ke', 150, true),
('FAC005', 'Eldoret West Hospital', 'HOSPITAL', 'DIST005', 'Uasin Gishu', 'Uganda Road, Eldoret', '+254712345005', 'eldoret.west@health.ke', 400, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Standard Vaccines
INSERT INTO vaccines (name, full_name, manufacturer, description, dosage_ml, doses_required, dose_interval_days, minimum_age_days, storage_temp_min, storage_temp_max) VALUES
('BCG', 'Bacillus Calmette-Guérin', 'Serum Institute of India', 'Tuberculosis vaccine', 0.05, 1, 0, 0, 2, 8),
('OPV', 'Oral Polio Vaccine', 'Bio-Manguinhos', 'Polio vaccine (oral)', 2.00, 4, 30, 0, 2, 8),
('DTP', 'Diphtheria, Tetanus, Pertussis', 'Bharat Biotech', 'Combined vaccine for diphtheria, tetanus, and pertussis', 0.5, 3, 30, 42, 2, 8),
('Measles', 'Measles Vaccine', 'Serum Institute of India', 'Measles protection vaccine', 0.5, 2, 180, 270, 2, 8),
('Hepatitis B', 'Hepatitis B Vaccine', 'GlaxoSmithKline', 'Hepatitis B protection', 0.5, 3, 30, 0, 2, 8),
('Rotavirus', 'Rotavirus Vaccine', 'GlaxoSmithKline', 'Protects against rotavirus gastroenteritis', 1.0, 2, 30, 42, 2, 8),
('Pneumococcal', 'Pneumococcal Conjugate Vaccine (PCV)', 'Pfizer', 'Protects against pneumococcal disease', 0.5, 3, 30, 42, 2, 8),
('Yellow Fever', 'Yellow Fever Vaccine', 'Sanofi Pasteur', 'Yellow fever protection', 0.5, 1, 0, 270, 2, 8)
ON CONFLICT (name) DO NOTHING;

-- Insert Dose Schedules
INSERT INTO dose_schedules (vaccine_id, dose_number, age_months, description) VALUES
-- BCG (single dose at birth)
((SELECT id FROM vaccines WHERE name = 'BCG'), 1, 0, 'At birth'),
-- OPV (4 doses)
((SELECT id FROM vaccines WHERE name = 'OPV'), 1, 0, 'At birth'),
((SELECT id FROM vaccines WHERE name = 'OPV'), 2, 1, '6 weeks'),
((SELECT id FROM vaccines WHERE name = 'OPV'), 3, 2, '10 weeks'),
((SELECT id FROM vaccines WHERE name = 'OPV'), 4, 3, '14 weeks'),
-- DTP (3 doses)
((SELECT id FROM vaccines WHERE name = 'DTP'), 1, 1, '6 weeks'),
((SELECT id FROM vaccines WHERE name = 'DTP'), 2, 2, '10 weeks'),
((SELECT id FROM vaccines WHERE name = 'DTP'), 3, 3, '14 weeks'),
-- Measles (2 doses)
((SELECT id FROM vaccines WHERE name = 'Measles'), 1, 9, '9 months'),
((SELECT id FROM vaccines WHERE name = 'Measles'), 2, 18, '18 months'),
-- Hepatitis B (3 doses)
((SELECT id FROM vaccines WHERE name = 'Hepatitis B'), 1, 0, 'At birth'),
((SELECT id FROM vaccines WHERE name = 'Hepatitis B'), 2, 1, '6 weeks'),
((SELECT id FROM vaccines WHERE name = 'Hepatitis B'), 3, 2, '14 weeks'),
-- Rotavirus (2 doses)
((SELECT id FROM vaccines WHERE name = 'Rotavirus'), 1, 1, '6 weeks'),
((SELECT id FROM vaccines WHERE name = 'Rotavirus'), 2, 2, '10 weeks'),
-- Pneumococcal (3 doses)
((SELECT id FROM vaccines WHERE name = 'Pneumococcal'), 1, 1, '6 weeks'),
((SELECT id FROM vaccines WHERE name = 'Pneumococcal'), 2, 2, '10 weeks'),
((SELECT id FROM vaccines WHERE name = 'Pneumococcal'), 3, 3, '14 weeks'),
-- Yellow Fever (single dose at 9 months)
((SELECT id FROM vaccines WHERE name = 'Yellow Fever'), 1, 9, '9 months')
ON CONFLICT (vaccine_id, dose_number) DO NOTHING;

-- Insert Default Users (passwords are BCrypt hashed with strength 12)
-- Password for all users: "Password123!" (BCrypt hashed)
INSERT INTO users (username, password, email, full_name, role, facility_id, district_id, active, locked, failed_login_attempts, created_at, deleted)
VALUES 
    ('health.worker', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'health.worker@immunization.com', 'Health Worker', 'HEALTH_WORKER', 'FAC001', NULL, true, false, 0, CURRENT_TIMESTAMP, false),
    ('facility.manager', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'facility.manager@immunization.com', 'Facility Manager', 'FACILITY_MANAGER', 'FAC001', 'DIST001', true, false, 0, CURRENT_TIMESTAMP, false),
    ('gov.official', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'gov.official@immunization.com', 'Government Official', 'GOVERNMENT_OFFICIAL', NULL, NULL, true, false, 0, CURRENT_TIMESTAMP, false),
    ('manager.fac002', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'manager.fac002@immunization.com', 'Manager FAC002', 'FACILITY_MANAGER', 'FAC002', 'DIST002', true, false, 0, CURRENT_TIMESTAMP, false),
    ('worker.fac002', '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi', 'worker.fac002@immunization.com', 'Health Worker FAC002', 'HEALTH_WORKER', 'FAC002', NULL, true, false, 0, CURRENT_TIMESTAMP, false)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

