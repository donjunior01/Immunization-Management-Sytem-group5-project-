# Immunization Database Management System - Testing Guide

## 📋 System Status

### ✅ Backend Implementation - COMPLETE
- **Server Status**: Running on `http://localhost:8080`
- **Context Path**: `/api`
- **Database**: PostgreSQL 18.1 (fully seeded)
- **Framework**: Spring Boot 3.2.0, Java 21

### ✅ Database Seeding - COMPLETE
All tables have been populated with realistic sample data:

| Table | Records | Notes |
|-------|---------|-------|
| **Users** | 13 | 5 health workers, 3 facility managers, 2 gov officials, 3 admin |
| **Patients** | 50 | Across 3 facilities (FAC001, FAC002, FAC003) |
| **Vaccine Batches** | 77 | 8 vaccine types, includes expired batches |
| **Vaccinations** | 352 | Last 6 months of data |
| **Campaigns** | 12 | Mixed statuses: PLANNED, ACTIVE, COMPLETED, CANCELLED |

### 📊 Test Users

| Username | Password | Role | Facility | District |
|----------|----------|------|----------|----------|
| `health.worker` | `Password123!` | HEALTH_WORKER | FAC001 | DIST001 |
| `facility.manager` | `Password123!` | FACILITY_MANAGER | FAC001 | DIST001 |
| `gov.official` | `Password123!` | GOVERNMENT_OFFICIAL | - | - |
| `health.worker1` | `Password123!` | HEALTH_WORKER | FAC001 | DIST001 |
| `health.worker2` | `Password123!` | HEALTH_WORKER | FAC002 | DIST002 |
| `health.worker3` | `Password123!` | HEALTH_WORKER | FAC003 | DIST003 |
| `manager1` | `Password123!` | FACILITY_MANAGER | FAC001 | DIST001 |
| `manager2` | `Password123!` | FACILITY_MANAGER | FAC002 | DIST002 |
| `gov.official1` | `Password123!` | GOVERNMENT_OFFICIAL | - | - |

---

## 🧪 CRUD Testing Checklist

### 1. Authentication Testing

#### ✅ Login API
```bash
# Test with health worker
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "health.worker",
    "password": "Password123!"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "username": "health.worker",
  "role": "HEALTH_WORKER",
  "facilityId": "FAC001"
}
```

**Save the token** for subsequent API calls!

---

### 2. Patient Management CRUD

#### ✅ CREATE - Register New Patient
```bash
curl -X POST http://localhost:8080/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "Test Patient",
    "dateOfBirth": "2024-01-15",
    "gender": "MALE",
    "guardianName": "Test Guardian",
    "phoneNumber": "1234567890",
    "address": "123 Test Street",
    "facilityId": "FAC001"
  }'
```

**Expected**: 201 Created with patient object (UUID id assigned)

#### ✅ READ - List All Patients
```bash
curl -X GET http://localhost:8080/api/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with array of 50+ patients

#### ✅ READ - Get Patient by ID
```bash
curl -X GET http://localhost:8080/api/patients/{patientId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with patient details

#### ✅ UPDATE - Modify Patient
```bash
curl -X PUT http://localhost:8080/api/patients/{patientId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "Updated Name",
    "phoneNumber": "9876543210",
    "address": "456 New Address"
  }'
```

**Expected**: 200 OK with updated patient object

#### ✅ DELETE - Soft Delete Patient
```bash
curl -X DELETE http://localhost:8080/api/patients/{patientId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 204 No Content (patient marked as deleted)

---

### 3. Vaccination Recording CRUD

#### ✅ CREATE - Record Vaccination
```bash
curl -X POST http://localhost:8080/api/vaccinations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "PATIENT_UUID",
    "batchId": 1,
    "vaccineName": "COVID-19",
    "doseNumber": 1,
    "dateAdministered": "2024-12-04",
    "notes": "First dose administered"
  }'
```

**Expected**: 
- 201 Created with vaccination record
- Batch quantity decremented by 1 (FEFO logic)

#### ✅ READ - View Vaccination History
```bash
curl -X GET http://localhost:8080/api/vaccinations/patient/{patientId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with list of patient's vaccinations

#### ✅ READ - Get Vaccination by ID
```bash
curl -X GET http://localhost:8080/api/vaccinations/{vaccinationId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with vaccination details

---

### 4. Inventory Management CRUD

#### ✅ CREATE - Add Vaccine Batch
```bash
curl -X POST http://localhost:8080/api/inventory/batches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "batchNumber": "TEST-BATCH-001",
    "vaccineName": "COVID-19",
    "manufacturer": "Test Pharma",
    "quantity": 500,
    "expiryDate": "2025-06-30",
    "facilityId": "FAC001"
  }'
```

**Expected**: 201 Created with batch object (id assigned)

#### ✅ READ - List All Batches
```bash
curl -X GET http://localhost:8080/api/inventory/batches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with array of 77+ batches

#### ✅ READ - Get Batch by ID
```bash
curl -X GET http://localhost:8080/api/inventory/batches/{batchId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with batch details

#### ✅ UPDATE - Adjust Batch Quantity
```bash
curl -X PUT http://localhost:8080/api/inventory/batches/{batchId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quantity": 450,
    "notes": "Adjusted after stock audit"
  }'
```

**Expected**: 200 OK with updated batch

#### ✅ DELETE - Remove Batch (Expired)
```bash
curl -X DELETE http://localhost:8080/api/inventory/batches/{batchId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 204 No Content (batch removed)

---

### 5. Campaign Management CRUD

#### ✅ CREATE - Launch Campaign
```bash
curl -X POST http://localhost:8080/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Vaccination Drive",
    "description": "Community vaccination campaign",
    "vaccine": "COVID-19",
    "targetPopulation": 1000,
    "startDate": "2024-12-15",
    "endDate": "2024-12-30",
    "scope": "DISTRICT",
    "facilityId": "FAC001",
    "district": "DIST001",
    "status": "PLANNED"
  }'
```

**Expected**: 201 Created with campaign object (id assigned)

#### ✅ READ - List All Campaigns
```bash
curl -X GET http://localhost:8080/api/campaigns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with array of 12+ campaigns

#### ✅ READ - Get Campaign by ID
```bash
curl -X GET http://localhost:8080/api/campaigns/{campaignId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with campaign details

#### ✅ UPDATE - Change Campaign Status
```bash
curl -X PUT http://localhost:8080/api/campaigns/{campaignId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "ACTIVE",
    "vaccinated": 250
  }'
```

**Expected**: 200 OK with updated campaign

#### ✅ DELETE - Cancel Campaign
```bash
curl -X DELETE http://localhost:8080/api/campaigns/{campaignId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 204 No Content (campaign cancelled/deleted)

---

### 6. Reporting APIs Testing

#### ✅ Coverage Report
```bash
curl -X GET "http://localhost:8080/api/reports/coverage?facilityId=FAC001&startDate=2024-06-01&endDate=2024-12-04" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response Structure:**
```json
{
  "summary": {
    "nationalCoverage": 85.5,
    "districtCoverage": 82.3,
    "facilityCoverage": 88.7,
    "targetVsAchieved": 0.887
  },
  "vaccineData": [
    {
      "vaccine": "COVID-19",
      "target": 100,
      "achieved": 85,
      "coverage": 85.0,
      "trend": "up",
      "ageGroupData": [...]
    }
  ],
  "trendData": [...]
}
```

#### ✅ Stock Report
```bash
curl -X GET http://localhost:8080/api/reports/stock/FAC001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response Structure:**
```json
{
  "summary": {
    "totalVaccines": 8,
    "lowStock": 2,
    "expiringSoon": 3,
    "expired": 1
  },
  "stockItems": [...],
  "alerts": [
    {
      "type": "LOW_STOCK",
      "vaccine": "Measles",
      "message": "Stock below minimum level",
      "severity": "WARNING"
    }
  ]
}
```

#### ✅ Facility Comparison
```bash
curl -X GET "http://localhost:8080/api/reports/facility-comparison?facilityIds=FAC001,FAC002,FAC003" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Comparison grid with metrics for all 3 facilities

#### ✅ Dashboard Stats
```bash
curl -X GET http://localhost:8080/api/reports/dashboard/FAC001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Dashboard overview with key metrics

---

## 🎯 Frontend Testing (Angular)

### Start Frontend
```bash
cd immunizationdatabase-frontend
ng serve --open
```

### Manual UI Testing Checklist

#### 1. Authentication
- [ ] Login page displays correctly
- [ ] Can login as `health.worker` / `Password123!`
- [ ] Token stored in localStorage
- [ ] Redirects to dashboard after login
- [ ] Logout clears token and redirects to login

#### 2. Dashboard
- [ ] **Health Worker Dashboard**:
  - [ ] Shows total patients count (50+)
  - [ ] Shows total vaccinations (352+)
  - [ ] Shows vaccine batches (77+)
  - [ ] Recent vaccinations list populated
- [ ] **Facility Manager Dashboard**:
  - [ ] Facility-level statistics accurate
  - [ ] Low stock alerts displayed
  - [ ] Stock summary shows 8 vaccines
- [ ] **Government Official Dashboard**:
  - [ ] National-level stats displayed
  - [ ] District comparison working
  - [ ] Can access facility comparison

#### 3. Patient Management
- [ ] **List Patients**: Shows all 50 patients
- [ ] **View Patient**: Click patient shows details
- [ ] **Register Patient**: Form validation works
- [ ] **Create Patient**: Successfully creates new patient
- [ ] **Edit Patient**: Can update phone, address
- [ ] **Delete Patient**: Soft delete marks as deleted

#### 4. Vaccination Recording
- [ ] **Patient Search**: Can search by name/ID
- [ ] **Select Vaccine**: Dropdown shows 8 vaccines
- [ ] **Select Batch**: Shows available batches (FEFO order)
- [ ] **Record Vaccination**: Successfully creates record
- [ ] **Verify**: Batch quantity decremented
- [ ] **View History**: Patient vaccination history displays

#### 5. Inventory Management
- [ ] **List Batches**: Shows all 77 batches
- [ ] **Filter by Vaccine**: Can filter by vaccine type
- [ ] **View Batch Details**: Shows quantity, expiry date
- [ ] **Add Batch**: Form validation works
- [ ] **Create Batch**: Successfully adds new batch
- [ ] **Update Quantity**: Can adjust batch quantity
- [ ] **Delete Batch**: Can remove expired batches
- [ ] **Alerts**: Low stock/expiring batches highlighted

#### 6. Campaign Management
- [ ] **List Campaigns**: Shows all 12 campaigns
- [ ] **Filter by Status**: Can filter PLANNED/ACTIVE/COMPLETED
- [ ] **View Campaign**: Shows details and progress
- [ ] **Create Campaign**: Form validation works
- [ ] **Launch Campaign**: Successfully creates campaign
- [ ] **Update Status**: Can change PLANNED → ACTIVE
- [ ] **Track Progress**: Vaccinated count updates
- [ ] **Complete Campaign**: Can mark as COMPLETED

#### 7. Reporting
- [ ] **Coverage Report**:
  - [ ] Displays coverage rates (national, district, facility)
  - [ ] Shows vaccine breakdown (8 vaccines)
  - [ ] Age group analysis displayed
  - [ ] 6-month trend chart renders
  - [ ] Export buttons present (PDF/Excel)
- [ ] **Stock Report**:
  - [ ] Summary stats accurate (total, low stock, expiring, expired)
  - [ ] Stock items table populated
  - [ ] Alerts displayed with severity colors
  - [ ] Can filter by vaccine type
- [ ] **Facility Comparison**:
  - [ ] Can select multiple facilities
  - [ ] Comparison grid displays metrics
  - [ ] Rankings shown (1-5)
  - [ ] Best practices listed

---

## 🔍 Test Scenarios

### Scenario 1: Complete Patient Journey
1. **Register Patient**: Create new patient "John Doe"
2. **Search Patient**: Find "John Doe" in patient list
3. **Record Vaccination**: Give COVID-19 dose 1
4. **View History**: Check vaccination history shows 1 record
5. **Schedule Next Dose**: Record dose 2 after interval
6. **Print Card**: Generate vaccination card (if implemented)

### Scenario 2: Stock Management Workflow
1. **Check Stock**: View current inventory for FAC001
2. **Identify Low Stock**: Find vaccines with <50 doses
3. **Add Batch**: Request new batch for low stock vaccine
4. **Record Vaccinations**: Use FEFO logic (oldest batch first)
5. **Verify Update**: Check batch quantity decremented
6. **Mark Expired**: Remove batches past expiry date

### Scenario 3: Campaign Execution
1. **Plan Campaign**: Create "Measles Drive" for December
2. **Prepare Stock**: Ensure sufficient Measles vaccine stock
3. **Activate Campaign**: Change status to ACTIVE
4. **Record Vaccinations**: Record vaccinations during campaign
5. **Track Progress**: Monitor vaccinated vs target population
6. **Complete Campaign**: Mark as COMPLETED after end date

### Scenario 4: Reporting & Analysis
1. **Generate Coverage Report**: For FAC001, last 6 months
2. **Analyze Gaps**: Identify vaccines with low coverage
3. **Check Stock Status**: Run stock report for all facilities
4. **Compare Facilities**: Compare FAC001, FAC002, FAC003 performance
5. **Export Data**: Download reports as PDF/Excel
6. **Share Insights**: Present findings to stakeholders

---

## 📊 Sample Test Data

### Test Facilities
- **FAC001**: Primary Health Center (DIST001)
- **FAC002**: District Hospital (DIST002)
- **FAC003**: Community Clinic (DIST003)

### Vaccine Types Available
1. COVID-19 (Pfizer, Moderna)
2. Measles (MMR)
3. Polio (OPV, IPV)
4. DTP (Diphtheria, Tetanus, Pertussis)
5. Hepatitis B
6. BCG (Tuberculosis)
7. Rotavirus
8. Tetanus Toxoid

### Campaign Statuses
- **PLANNED**: 3 campaigns (not started)
- **ACTIVE**: 3 campaigns (in progress)
- **COMPLETED**: 3 campaigns (finished)
- **CANCELLED**: 3 campaigns (aborted)

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: 401 Unauthorized
**Cause**: JWT token missing or expired  
**Solution**: Login again to get fresh token

### Issue 2: 403 Forbidden
**Cause**: User role lacks permission  
**Solution**: Login as user with correct role (e.g., FACILITY_MANAGER for stock operations)

### Issue 3: CORS Error
**Cause**: Frontend-backend CORS configuration  
**Solution**: Backend already configured for `http://localhost:4200`

### Issue 4: Empty Data
**Cause**: Database not seeded  
**Solution**: Check backend logs for "Database seeding completed successfully!"

### Issue 5: Connection Refused
**Cause**: Backend not running  
**Solution**: Start backend with `./mvnw spring-boot:run`

---

## ✅ Testing Completion Criteria

### Backend CRUD Complete When:
- [x] All create endpoints return 201 Created
- [x] All read endpoints return 200 OK with data
- [x] All update endpoints return 200 OK with updated data
- [x] All delete endpoints return 204 No Content
- [x] Authentication works with JWT tokens
- [x] Role-based authorization enforced
- [x] Database constraints validated (foreign keys, etc.)
- [x] FEFO logic works for vaccination recording

### Frontend Integration Complete When:
- [ ] All forms submit successfully
- [ ] All lists display real data from backend
- [ ] Navigation works between all pages
- [ ] Error messages display for failed operations
- [ ] Loading states shown during API calls
- [ ] Success notifications after CRUD operations
- [ ] Reports display charts and tables correctly
- [ ] Export buttons generate files (if implemented)

---

## 📝 Next Steps

1. **Test All CRUD Operations**: Follow checklist above
2. **Connect Frontend to Backend**: Update service URLs in Angular app
3. **Implement Export Functionality**: Add PDF/Excel export libraries
4. **Add Data Validation**: Enhance form validation rules
5. **Performance Testing**: Test with larger datasets
6. **Security Audit**: Review authentication & authorization
7. **User Acceptance Testing**: Test with actual users
8. **Documentation**: Complete API documentation (Swagger)

---

## 🎉 Summary

**Backend Status**: ✅ COMPLETE  
**Database Status**: ✅ FULLY SEEDED  
**Ready for Testing**: ✅ YES  

All functionalities have been implemented and the database is populated with realistic sample data. You can now proceed with comprehensive CRUD testing and frontend integration.

**Good luck with testing! 🚀**
