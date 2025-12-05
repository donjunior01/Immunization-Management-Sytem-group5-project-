# Immunization Management System - Setup & Run Guide

## Overview
Complete Immunization Management System with Spring Boot backend and Angular frontend, featuring role-based dashboards for Health Workers, Facility Managers, and Government Officials.

## Technology Stack

### Backend
- Spring Boot 3.2.0
- Java 17
- PostgreSQL Database
- Spring Security + JWT Authentication
- Flyway Database Migrations
- Maven

### Frontend
- Angular 19.1.0
- Angular Material 19.2.19
- TypeScript 5.7
- RxJS 7.8
- Standalone Components

## Prerequisites

1. **Java Development Kit (JDK) 17 or higher**
   - Download from: https://adoptium.net/

2. **Node.js and npm**
   - Download from: https://nodejs.org/ (LTS version recommended)
   - Verify: `node -v` and `npm -v`

3. **PostgreSQL 12 or higher**
   - Download from: https://www.postgresql.org/download/
   - Username: root
   - Password: root

4. **Maven** (if not using mvnw)
   - Download from: https://maven.apache.org/download.cgi

## Database Setup

### Step 1: Create Database
```powershell
# Connect to PostgreSQL as root user
psql -U root -h localhost

# Create database
CREATE DATABASE immunizationdb;

# Exit psql
\q
```

### Step 2: Verify Database Configuration
The application is configured to connect to:
- Host: localhost
- Port: 5432
- Database: immunizationdb
- Username: root
- Password: root

Configuration is in: `immunizationdb-backend/src/main/resources/application.yml`

### Step 3: Database Migration
Flyway will automatically run migrations on application startup.
The migration includes:
- All tables creation
- Indexes and constraints
- 3 seeded users with BCrypt-encrypted passwords

## Backend Setup & Run

### Step 1: Navigate to Backend Directory
```powershell
cd immunizationdb-backend
```

### Step 2: Build the Project
```powershell
# Using Maven Wrapper (recommended)
./mvnw clean install

# OR using Maven directly
mvn clean install
```

### Step 3: Run the Application
```powershell
# Using Maven Wrapper
./mvnw spring-boot:run

# OR using Maven directly
mvn spring-boot:run

# OR run the JAR file
java -jar target/immunizationdb-backend-0.0.1-SNAPSHOT.jar
```

### Step 4: Verify Backend is Running
- Backend should start on: http://localhost:8080
- API base path: http://localhost:8080/api
- Health check: http://localhost:8080/api/actuator/health

## Frontend Setup & Run

### Step 1: Navigate to Frontend Directory
```powershell
cd immunizationdatabase-frontend
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Run Development Server
```powershell
npm start

# OR
ng serve
```

### Step 4: Access the Application
- Frontend runs on: http://localhost:4200
- Automatically opens in default browser

## Pre-configured Test Users

The database is seeded with 3 users (all have password: **Password123!**):

### 1. Health Worker
- **Username:** health_worker
- **Password:** Password123!
- **Role:** HEALTH_WORKER
- **Access:** Patient registration, vaccination recording, stock view
- **Dashboard:** http://localhost:4200/health-worker

### 2. Facility Manager
- **Username:** facility_manager
- **Password:** Password123!
- **Role:** FACILITY_MANAGER
- **Access:** Reports, coverage stats, campaign management, staff management
- **Dashboard:** http://localhost:4200/manager

### 3. Government Official
- **Username:** govt_official
- **Password:** Password123!
- **Role:** GOVERNMENT_OFFICIAL
- **Access:** Full system access, user management, national reports
- **Dashboard:** http://localhost:4200/admin

## Application Features by Role

### Health Worker Features
- ✅ Patient Registration
- ✅ Vaccination Recording (with automatic stock deduction)
- ✅ View Vaccine Stock
- ✅ Search Patients
- ✅ View Vaccination History
- ✅ Quick Access Dashboard

### Facility Manager Features
- ✅ All Health Worker features
- ✅ Vaccination Coverage Reports
- ✅ Campaign Management
- ✅ Defaulter List
- ✅ Facility Statistics
- ✅ Staff Management
- ✅ Inventory Management
- ✅ Export Reports

### Government Official Features
- ✅ All Manager features
- ✅ National Dashboard
- ✅ District Performance Overview
- ✅ User Management
- ✅ Facility Management
- ✅ System Settings
- ✅ National Reports
- ✅ Audit Logs
- ✅ Multi-view (National/District/Facility)

## API Endpoints Overview

### Authentication
- POST `/api/auth/login` - User login (returns JWT token)
- POST `/api/auth/register` - Register new user

### Patients
- POST `/api/patients` - Create patient
- GET `/api/patients/{id}` - Get patient by ID
- GET `/api/patients/facility/{facilityId}` - Get patients by facility
- GET `/api/patients/search` - Search patients
- DELETE `/api/patients/{id}` - Soft delete patient

### Inventory
- POST `/api/inventory/batches` - Create vaccine batch
- GET `/api/inventory/batches/facility/{facilityId}` - Get batches by facility
- GET `/api/inventory/batches/available/{facilityId}` - Get available batches
- GET `/api/inventory/batches/expiring-soon/{facilityId}` - Get expiring batches

### Vaccinations
- POST `/api/vaccinations` - Record vaccination
- GET `/api/vaccinations/patient/{patientId}` - Get patient vaccination history
- GET `/api/vaccinations/facility/{facilityId}` - Get facility vaccinations
- GET `/api/vaccinations/facility/{facilityId}/date-range` - Get vaccinations by date range

### Campaigns
- POST `/api/campaigns` - Create campaign
- GET `/api/campaigns/active` - Get active campaigns
- GET `/api/campaigns/facility/{facilityId}` - Get campaigns by facility
- PATCH `/api/campaigns/{campaignId}/status` - Update campaign status

### Reporting
- GET `/api/reports/dashboard/{facilityId}` - Get dashboard statistics

## Troubleshooting

### Backend Issues

**Problem:** Port 8080 already in use
```powershell
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Problem:** Database connection failed
- Verify PostgreSQL is running
- Check credentials in application.yml
- Ensure database 'immunizationdb' exists

**Problem:** Flyway migration failed
```powershell
# Clean and rebuild
./mvnw clean install -DskipTests
```

### Frontend Issues

**Problem:** Port 4200 already in use
```powershell
# Kill process on port 4200
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

**Problem:** Module not found errors
```powershell
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Problem:** CORS errors
- Verify backend is running
- Check backend CORS configuration allows http://localhost:4200

## Testing the Application

### 1. Login Test
1. Navigate to http://localhost:4200
2. Should redirect to /login
3. Enter username: `health_worker`, password: `Password123!`
4. Should redirect to Health Worker Dashboard

### 2. Patient Registration Test
1. Login as health_worker
2. Click "Register Patient" button
3. Fill in patient details
4. Submit form
5. Verify patient appears in recent patients list

### 3. Vaccination Recording Test
1. Login as health_worker
2. Click "Record Vaccination" button
3. Select patient and vaccine batch
4. Submit vaccination record
5. Verify stock is automatically deducted

### 4. Manager Dashboard Test
1. Login as facility_manager
2. View vaccination coverage charts
3. Check active campaigns
4. Export facility report

### 5. Admin Dashboard Test
1. Login as govt_official
2. View national statistics
3. Check district performance
4. Access user management

## Build for Production

### Backend
```powershell
cd immunizationdb-backend
./mvnw clean package -DskipTests
# JAR file: target/immunizationdb-backend-0.0.1-SNAPSHOT.jar
```

### Frontend
```powershell
cd immunizationdatabase-frontend
ng build --configuration production
# Output: dist/immunizationdatabase-frontend
```

## Project Structure

```
immunizationdb-backend/
├── src/main/java/com/immunizationdb/
│   ├── auth/          # Authentication & User management
│   ├── patient/       # Patient management
│   ├── inventory/     # Vaccine inventory management
│   ├── vaccination/   # Vaccination records
│   ├── campaign/      # Campaign management
│   ├── reporting/     # Dashboard & reports
│   └── sync/          # Offline sync queue
└── src/main/resources/
    ├── application.yml
    └── db/migration/
        └── V1__.sql   # Database schema & seed data

immunizationdatabase-frontend/
├── src/app/
│   ├── auth/          # Login component
│   ├── dashboards/    # Role-specific dashboards
│   │   ├── health-worker/
│   │   ├── manager/
│   │   └── admin/
│   ├── models/        # TypeScript interfaces
│   ├── services/      # API services
│   ├── guards/        # Route guards
│   └── shared/        # Shared components (loading, etc.)
└── src/styles.scss    # Global hospital theme styles
```

## Support & Documentation

- Backend API Documentation: http://localhost:8080/swagger-ui.html (if Swagger is configured)
- Database ERD: See V1__.sql migration file for schema
- Frontend Component Docs: Check individual component .ts files

## Security Notes

⚠️ **Important Security Considerations:**
- Default passwords should be changed in production
- JWT secret should be environment-specific
- Database credentials should use environment variables
- CORS should be restricted to specific domains in production
- BCrypt strength is set to 12 (suitable for production)

## Next Steps

1. ✅ Start PostgreSQL server
2. ✅ Create immunizationdb database
3. ✅ Start backend application (runs migrations automatically)
4. ✅ Start frontend application
5. ✅ Login with test users
6. ✅ Test core features
7. 🔄 Customize for your needs

## License

This project is for educational/demonstration purposes.
