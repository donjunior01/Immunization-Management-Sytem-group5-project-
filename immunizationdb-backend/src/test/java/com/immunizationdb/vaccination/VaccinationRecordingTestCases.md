# Vaccination Recording Test Cases

## Overview
Comprehensive test cases for vaccination recording functionality covering all scenarios including happy path, error cases, and edge cases.

## Test Environment Setup
- Backend: Spring Boot application
- Database: PostgreSQL/H2 (for testing)
- Authentication: JWT-based authentication
- Test Framework: JUnit 5, Mockito, Spring Boot Test

---

## Test Case 1: Happy Path - Valid Vaccination Recording
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists in database (ID: valid-uuid)
- Vaccine exists (e.g., "Penta")
- Batch exists in stock with quantity > 0
- User is authenticated as HEALTH_WORKER
- Facility ID is valid

### Test Steps:
1. Send POST request to `/api/vaccinations` with valid payload:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 1,
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM",
     "notes": "No adverse events"
   }
   ```

### Expected Results:
- ✅ HTTP 201 Created
- ✅ Vaccination record created in database
- ✅ Stock quantity decremented by 1
- ✅ Next appointment created automatically (dose 2, 28 days later)
- ✅ Response includes vaccination details and next appointment info
- ✅ Appointment status is SCHEDULED

### Verification:
- Check vaccination table for new record
- Check vaccine_batches table - quantity decreased
- Check appointments table - new appointment created
- Verify appointment date = dateAdministered + 28 days

---

## Test Case 2: Invalid Patient ID (404 Error)
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Patient does NOT exist in database
- User is authenticated

### Test Steps:
1. Send POST request with non-existent patientId:
   ```json
   {
     "patientId": "non-existent-uuid",
     "vaccineName": "Penta",
     "doseNumber": 1,
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM"
   }
   ```

### Expected Results:
- ✅ HTTP 500 Internal Server Error (or 404)
- ✅ Error message: "Patient not found"
- ✅ No vaccination record created
- ✅ No stock decremented
- ✅ No appointment created

---

## Test Case 3: Invalid Dose Number (400 Error)
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Vaccine exists (e.g., "Penta" - max 3 doses)
- User is authenticated

### Test Steps:
1. Send POST request with invalid dose number:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 5,  // Invalid: Penta max is 3
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM"
   }
   ```

### Expected Results:
- ✅ HTTP 500 Internal Server Error
- ✅ Error message: "Invalid dose number. Penta has a maximum of 3 doses."
- ✅ No vaccination record created
- ✅ No stock decremented
- ✅ No appointment created

---

## Test Case 4: Batch Not in Stock (400 Error)
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Vaccine exists
- Batch exists but quantity = 0 or isDepleted = true
- User is authenticated

### Test Steps:
1. Send POST request with depleted batch:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 1,
     "batchId": 999,  // Depleted batch
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM"
   }
   ```

### Expected Results:
- ✅ HTTP 500 Internal Server Error
- ✅ Error message: "Failed to update inventory: [error details]"
- ✅ No vaccination record created
- ✅ No appointment created

---

## Test Case 5: Duplicate Dose Recording
**Priority:** Medium  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Patient already received Penta dose 1
- User is authenticated

### Test Steps:
1. Send POST request to record same dose again:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 1,  // Already administered
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM"
   }
   ```

### Expected Results:
- ✅ HTTP 500 Internal Server Error
- ✅ Error message: "This dose has already been administered to the patient"
- ✅ No duplicate vaccination record created
- ✅ No stock decremented

---

## Test Case 6: Adverse Event Recording
**Priority:** Medium  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Vaccine and batch available
- User is authenticated

### Test Steps:
1. Send POST request with adverse event notes:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 1,
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM",
     "notes": "Mild fever and redness at injection site"
   }
   ```

### Expected Results:
- ✅ HTTP 201 Created
- ✅ Vaccination record created with notes field populated
- ✅ Notes saved correctly in database
- ✅ Stock decremented
- ✅ Appointment created

---

## Test Case 7: Stock Decrement Verification
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Batch exists with quantity = 10
- Patient exists
- User is authenticated

### Test Steps:
1. Record vaccination
2. Check batch quantity before and after

### Expected Results:
- ✅ Batch quantity before: 10
- ✅ Batch quantity after: 9
- ✅ Quantity decremented by exactly 1
- ✅ Transaction is atomic (all or nothing)

---

## Test Case 8: Appointment Creation Verification
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Vaccine "Penta" with dose_interval_days = 28
- User is authenticated

### Test Steps:
1. Record Penta dose 1 on 2025-01-15
2. Check appointments table

### Expected Results:
- ✅ Appointment created automatically
- ✅ Appointment date = 2025-01-15 + 28 days = 2025-02-12
- ✅ Appointment status = SCHEDULED
- ✅ Appointment vaccineName = "Penta"
- ✅ Appointment doseNumber = 2
- ✅ Appointment patientId matches
- ✅ Appointment facilityId matches

---

## Test Case 9: No Next Dose (Final Dose)
**Priority:** Medium  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Patient received Penta dose 3 (final dose)
- User is authenticated

### Test Steps:
1. Record Penta dose 3:
   ```json
   {
     "patientId": "valid-patient-uuid",
     "vaccineName": "Penta",
     "doseNumber": 3,  // Final dose
     "batchId": 123,
     "dateAdministered": "2025-01-15",
     "facilityId": "FAC001",
     "administrationSite": "LEFT_ARM"
   }
   ```

### Expected Results:
- ✅ HTTP 201 Created
- ✅ Vaccination recorded successfully
- ✅ Stock decremented
- ✅ NO appointment created (no next dose)
- ✅ Log message: "No next dose for vaccine: Penta"

---

## Test Case 10: Missing Required Fields
**Priority:** High  
**Status:** ✅ Implemented

### Test Steps:
1. Send POST request with missing fields (one at a time):
   - Missing patientId
   - Missing vaccineName
   - Missing doseNumber
   - Missing batchId
   - Missing dateAdministered
   - Missing facilityId
   - Missing administrationSite

### Expected Results:
- ✅ HTTP 400 Bad Request
- ✅ Validation error message for each missing field
- ✅ No vaccination record created
- ✅ No stock decremented

---

## Test Case 11: Unauthorized Access (403 Error)
**Priority:** High  
**Status:** ✅ Implemented

### Preconditions:
- User is NOT authenticated OR has insufficient role

### Test Steps:
1. Send POST request without authentication token
2. Send POST request with invalid token
3. Send POST request with role that doesn't have permission

### Expected Results:
- ✅ HTTP 403 Forbidden
- ✅ Error message: "Access forbidden: Insufficient permissions"
- ✅ No vaccination record created

---

## Test Case 12: Different Vaccine Intervals
**Priority:** Medium  
**Status:** ✅ Implemented

### Test Cases:
1. **OPV (30 days interval):**
   - Record OPV dose 1 on 2025-01-15
   - Expected next appointment: 2025-02-14 (30 days)

2. **Measles (180 days interval):**
   - Record Measles dose 1 on 2025-01-15
   - Expected next appointment: 2025-07-14 (180 days)

3. **BCG (single dose, 0 days):**
   - Record BCG dose 1 on 2025-01-15
   - Expected: No appointment created (single dose vaccine)

### Expected Results:
- ✅ Each vaccine uses correct interval from database
- ✅ Appointments created with correct dates
- ✅ Single-dose vaccines don't create appointments

---

## Test Case 13: Concurrent Vaccination Recording
**Priority:** Low  
**Status:** ⚠️ To Be Implemented

### Preconditions:
- Same batch with quantity = 2
- Two concurrent requests

### Test Steps:
1. Send two POST requests simultaneously for same batch

### Expected Results:
- ✅ One succeeds, one fails (or both succeed if quantity allows)
- ✅ Stock correctly decremented
- ✅ No race conditions
- ✅ Database integrity maintained

---

## Test Case 14: Appointment Creation Failure (Non-Blocking)
**Priority:** Medium  
**Status:** ✅ Implemented

### Preconditions:
- Patient exists
- Vaccine exists
- Appointment service fails (simulated)

### Test Steps:
1. Record vaccination with appointment service error

### Expected Results:
- ✅ Vaccination still recorded successfully
- ✅ Stock still decremented
- ✅ Error logged but doesn't fail vaccination
- ✅ HTTP 201 Created (vaccination succeeds)

---

## Test Execution Summary

### Automated Test Coverage:
- Unit Tests: Service layer, validation logic
- Integration Tests: API endpoints, database operations
- End-to-End Tests: Full vaccination recording flow

### Test Tools:
- JUnit 5 for test framework
- Mockito for mocking dependencies
- Spring Boot Test for integration testing
- TestContainers for database testing (optional)
- Postman/Newman for API testing

### Test Data Management:
- Use @Sql annotations for test data setup
- Clean up test data after each test
- Use test-specific facility IDs and patient IDs

---

## Notes:
- All test cases should be documented in test management tool (Jira, TestRail, etc.)
- Test results should be tracked and reported
- Failed tests should trigger alerts
- Test coverage should be maintained at >80%

