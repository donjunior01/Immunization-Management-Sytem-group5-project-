# Backend Requirements for Government Official Dashboard

## ✅ Frontend Status: COMPLETE
The frontend government official dashboard is fully functional with mock data fallback. All 403 errors are being handled gracefully.

## 🔴 Required Backend Implementation

### 1. Add National Statistics Endpoint ⚠️ **CRITICAL**

**Required Endpoint:**
```java
GET /api/reporting/national-stats
Authorization: Bearer JWT (GOVERNMENT_OFFICIAL role)
```

**Expected Response Structure:**
```json
{
  "totalFacilities": 15,
  "totalVaccineTypes": 8,
  "totalDosesAvailable": 285000,
  "totalPatientsRegistered": 125000,
  "totalVaccinationsAdministered": 168500,
  "activeCampaigns": 12,
  "lowStockAlerts": 8,
  "expiringBatches": 5,
  "coverageRate": 76.5,
  "facilitiesWithAlerts": 4,
  "recentActivities": [
    {
      "id": 1,
      "type": "vaccination",
      "description": "100 patients vaccinated at FAC001",
      "timestamp": "2024-12-04T10:30:00",
      "facilityId": "FAC001",
      "facilityName": "Primary Health Center"
    }
  ]
}
```

**Implementation Location:**
- **File**: `ReportingController.java`
- **Method to Add**:
  ```java
  @GetMapping("/national-stats")
  @PreAuthorize("hasRole('GOVERNMENT_OFFICIAL')")
  public ResponseEntity<NationalStatisticsResponse> getNationalStatistics() {
      NationalStatisticsResponse stats = reportingService.getNationalStatistics();
      return ResponseEntity.ok(stats);
  }
  ```

### 2. Verify Security Configuration

**Check File**: `SecurityConfig.java` or equivalent

**Required Permissions:**
- `GET /api/reporting/national-stats` → GOVERNMENT_OFFICIAL
- `GET /api/campaigns/active` → HEALTH_WORKER, FACILITY_MANAGER, GOVERNMENT_OFFICIAL ✅ (Already set)
- `GET /api/reports/dashboard/*` → HEALTH_WORKER, FACILITY_MANAGER, GOVERNMENT_OFFICIAL ✅ (Already set)

### 3. Update CampaignService

**Issue**: Government officials should see ALL campaigns across ALL facilities.

**Current Behavior**: `/api/campaigns/active` returns 403

**Required Fix**:
```java
// CampaignService.java
public List<CampaignResponse> getActiveCampaigns(String facilityId) {
    // If user is GOVERNMENT_OFFICIAL, return all active campaigns
    if (facilityId == null || "NATIONAL".equals(facilityId)) {
        return campaignRepository.findByStatus(CampaignStatus.ACTIVE)
            .stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    // Otherwise, return facility-specific campaigns
    return campaignRepository.findByFacilityIdAndStatus(facilityId, CampaignStatus.ACTIVE)
        .stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
}
```

### 4. Handle 'NATIONAL' Facility ID

Government officials will send `facilityId: "NATIONAL"` for endpoints that require facility ID.

**Files to Update:**
- `ReportingService.java` → getDashboardStats(), getStockReport()
- `CampaignService.java` → getActiveCampaigns()
- `InventoryService.java` → getAvailableBatches()

**Logic**: When `facilityId == "NATIONAL"`, aggregate data from ALL facilities.

---

## 📊 Sample Data for National Statistics

Use this structure for the `NationalStatisticsResponse` DTO:

```java
package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NationalStatisticsResponse {
    private Integer totalFacilities;
    private Integer totalVaccineTypes;
    private Integer totalDosesAvailable;
    private Integer totalPatientsRegistered;
    private Integer totalVaccinationsAdministered;
    private Integer activeCampaigns;
    private Integer lowStockAlerts;
    private Integer expiringBatches;
    private Double coverageRate;
    private Integer facilitiesWithAlerts;
    private List<RecentActivity> recentActivities;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RecentActivity {
    private Long id;
    private String type; // "vaccination", "campaign", "stock_alert", "batch_expiry"
    private String description;
    private LocalDateTime timestamp;
    private String facilityId;
    private String facilityName;
}
```

---

## 🧪 Testing Commands

Once backend is updated, test with:

```bash
# 1. Login as government official
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gov.official",
    "password": "Password123!"
  }'

# 2. Test national stats endpoint (NEW)
curl -X GET http://localhost:8080/api/reporting/national-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with national statistics

# 3. Test active campaigns
curl -X GET http://localhost:8080/api/campaigns/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with array of all active campaigns

# 4. Test dashboard stats with NATIONAL
curl -X GET http://localhost:8080/api/reports/dashboard/NATIONAL \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with aggregated national stats
```

---

## ✅ Expected Outcomes

After backend implementation:

1. ✅ Government official dashboard loads real data (no mock fallback)
2. ✅ No 403 errors in browser console
3. ✅ National statistics display accurately
4. ✅ Active campaigns list shows all campaigns across facilities
5. ✅ Stock data shows national aggregates
6. ✅ "Create Campaign" and "Register Batch" work with facilityId='NATIONAL'

---

## 🚀 Priority Order

1. **HIGH**: Add `/api/reporting/national-stats` endpoint
2. **HIGH**: Update CampaignService to handle 'NATIONAL' facilityId
3. **MEDIUM**: Update ReportingService to aggregate national data
4. **LOW**: Add audit logging for government official actions

---

## 📝 Notes

- Frontend is **100% ready** and displays mock data until backend is updated
- All 403 errors are **handled gracefully** with informative console logs
- No frontend changes needed once backend is ready
- Security is working correctly (authentication + authorization)
- Just need to add missing endpoint and handle 'NATIONAL' facilityId

---

## 🔍 Verification Steps

After backend deployment:

1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + Shift + R)
3. Login as `gov.official` / `Password123!`
4. Check console logs - should see:
   - `FacilityId: NATIONAL` ✅
   - `National statistics loaded: [data]` ✅
   - NO 403 errors ✅
5. Verify dashboard displays real data (not "Sample Campaign")

---

**Current Status**: Frontend ✅ Complete | Backend ⚠️ Needs 3 updates above
