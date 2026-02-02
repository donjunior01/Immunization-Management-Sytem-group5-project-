-- Add Foreign Key Constraints after all tables are created and populated

-- Add foreign key to dose_schedules
ALTER TABLE dose_schedules ADD CONSTRAINT IF NOT EXISTS fk_dose_vaccine
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE;

-- Add foreign key to stock_alerts
ALTER TABLE stock_alerts ADD CONSTRAINT IF NOT EXISTS fk_alert_batch
    FOREIGN KEY (batch_id) REFERENCES vaccine_batches(id) ON DELETE SET NULL;

-- Add foreign key to audit_logs
ALTER TABLE audit_logs ADD CONSTRAINT IF NOT EXISTS fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add Foreign Key Constraints to existing tables
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

ALTER TABLE campaigns ADD CONSTRAINT IF NOT EXISTS fk_campaigns_facility
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE;

ALTER TABLE campaigns ADD CONSTRAINT IF NOT EXISTS fk_campaigns_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;