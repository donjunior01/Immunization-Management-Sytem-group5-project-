-- PostgreSQL Database Setup Script
-- Run this with: psql -U postgres -f setup-database.sql

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE immunizationdb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'immunizationdb')\gexec

-- Connect to the database
\c immunizationdb

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'root'
   ) THEN
      CREATE USER root WITH PASSWORD 'root';
   END IF;
END
$do$;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE immunizationdb TO root;
GRANT ALL ON SCHEMA public TO root;
ALTER DATABASE immunizationdb OWNER TO root;

-- Show confirmation
SELECT 'Database setup completed successfully!' as status;
