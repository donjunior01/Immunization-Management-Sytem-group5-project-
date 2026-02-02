-- VaxTrack Database Setup Script
-- Run this script in PostgreSQL to set up the local development database

-- Create database (run this as postgres superuser)
CREATE DATABASE immunizationdb;

-- Create user and grant privileges
CREATE USER root WITH PASSWORD 'root';
GRANT ALL PRIVILEGES ON DATABASE immunizationdb TO root;

-- Connect to the immunizationdb database and grant schema privileges
\c immunizationdb;
GRANT ALL ON SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root;

-- Enable UUID extension (required for the application)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify setup
SELECT current_database(), current_user;

-- Show tables (will be empty initially - Flyway will create them)
\dt