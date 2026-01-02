-- Flyway Checksum Repair Script
-- Run this in your PostgreSQL database to fix the checksum mismatch

-- Connect to the database first:
-- \c immunizationdb

-- Repair the checksum for V1 migration
-- This updates the stored checksum to match the current file
UPDATE flyway_schema_history 
SET checksum = -444127507 
WHERE version = '1' AND checksum = -1075474798;

-- Verify the update
SELECT version, description, checksum, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank;

-- Run this in your PostgreSQL database to fix the checksum mismatch

-- Connect to the database first:
-- \c immunizationdb

-- Repair the checksum for V1 migration
-- This updates the stored checksum to match the current file
UPDATE flyway_schema_history 
SET checksum = -444127507 
WHERE version = '1' AND checksum = -1075474798;

-- Verify the update
SELECT version, description, checksum, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank;

-- Run this in your PostgreSQL database to fix the checksum mismatch

-- Connect to the database first:
-- \c immunizationdb

-- Repair the checksum for V1 migration
-- This updates the stored checksum to match the current file
UPDATE flyway_schema_history 
SET checksum = -444127507 
WHERE version = '1' AND checksum = -1075474798;

-- Verify the update
SELECT version, description, checksum, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank;






