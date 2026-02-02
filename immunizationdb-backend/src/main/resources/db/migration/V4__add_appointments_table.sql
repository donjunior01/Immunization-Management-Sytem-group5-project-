-- Create Appointments Table (if not exists)
CREATE TABLE IF NOT EXISTS appointments
(
    id              UUID                        NOT NULL,
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
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_by      BIGINT,
    updated_at      TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_appointments PRIMARY KEY (id)
);

-- Create indexes for appointments table (if not exists)
CREATE INDEX IF NOT EXISTS idx_appointment_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_facility ON appointments(facility_id);
CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointments(status);

