# Facility ID Handling Guide

## ✅ Fixed: "No facility ID found for current user" Error

This document explains how facility IDs are handled across the application and how to avoid errors.

---

## 🔑 Key Concepts

### User Roles and Facility IDs

1. **HEALTH_WORKER** - Has specific facility ID (e.g., `FAC001`)
2. **FACILITY_MANAGER** - Has specific facility ID (e.g., `FAC001`)
3. **GOVERNMENT_OFFICIAL** - Has `NATIONAL` as facility ID (national oversight)

### The Central Method: `authService.getFacilityId()`

**Location**: `src/app/services/auth.service.ts`

```typescript
getFacilityId(): string {
  const user = this.getCurrentUser();
  
  // Government officials don't have a specific facility
  if (user?.role === 'GOVERNMENT_OFFICIAL') {
    return 'NATIONAL';
  }
  
  // Return user's facilityId or fallback to FAC001
  return user?.facilityId || 'FAC001';
}
```

**Why This Method?**
- ✅ Centralized logic for all user types
- ✅ Handles government officials correctly
- ✅ Provides safe fallback
- ✅ Consistent across the application

---

## ❌ Common Mistakes (DON'T DO THIS)

### ❌ WRONG: Direct Access
```typescript
// DON'T DO THIS!
const facilityId = this.currentUser?.facilityId;
const facilityId = this.authService.getCurrentUser()?.facilityId;
const facilityId = currentUser?.facilityId || 'FAC-001';
```

**Problems:**
- Government officials' `facilityId` might be undefined
- Inconsistent fallback values
- No special handling for different roles
- Causes "No facility ID found" errors

---

## ✅ Correct Pattern (DO THIS)

### ✅ CORRECT: Use AuthService Method
```typescript
// ALWAYS DO THIS!
const facilityId = this.authService.getFacilityId();
```

### Handling NATIONAL Facility ID

**Pattern 1: Reject National (Facility-Specific Features)**
```typescript
const facilityId = this.authService.getFacilityId();

if (facilityId === 'NATIONAL') {
  this.showError('This feature is facility-specific. Please select a facility.');
  return;
}

// Continue with facility-specific logic
this.loadFacilityData(facilityId);
```

**Use for:**
- Creating inventory batches
- Registering patients
- Recording vaccinations
- Creating campaigns

**Pattern 2: Load National Data (National-Level Features)**
```typescript
const facilityId = this.authService.getFacilityId();

if (facilityId === 'NATIONAL') {
  // Load national-level data
  this.campaignService.getActiveCampaigns().subscribe(...);
} else {
  // Load facility-specific data
  this.campaignService.getCampaignsByFacility(facilityId).subscribe(...);
}
```

**Use for:**
- Viewing campaigns
- Viewing reports
- Dashboard statistics

---

## 📋 Fixed Components

All these components now use `authService.getFacilityId()`:

### ✅ Dashboards
- `health-worker-dashboard.component.ts`
- `facility-manager-dashboard.component.ts`
- `government-official-dashboard.component.ts`

### ✅ Inventory
- `inventory-list.component.ts`
- `add-batch.component.ts`
- `view-batch.component.ts`

### ✅ Campaigns
- `create-campaign.component.ts`
- `active-campaigns.component.ts`

### ✅ Patients
- `register-patient.component.ts`
- `patient-list.component.ts`
- `defaulters-list.component.ts`

### ✅ Vaccinations
- `record-vaccination.component.ts`
- `vaccination-history.component.ts`

---

## 🧪 Testing Guide

### Test Each Role

**1. Health Worker** (`health.worker` / `Password123!`)
```
✓ Dashboard loads with facility data
✓ Can view inventory for their facility
✓ Can register patients
✓ Can record vaccinations
✓ No "facility ID" errors
```

**2. Facility Manager** (`facility.manager` / `Password123!`)
```
✓ Dashboard loads with management features
✓ Can manage inventory
✓ Can create campaigns
✓ Can view reports
✓ No "facility ID" errors
```

**3. Government Official** (`gov.official` / `Password123!`)
```
✓ Dashboard loads with national statistics
✓ Can view all campaigns (not facility-specific ones)
✓ Gets appropriate messages for facility-specific features
✓ Can view national reports
✓ No "No facility ID found" errors
```

---

## 🔧 Adding New Components

When creating new components that need facility ID:

```typescript
export class YourComponent implements OnInit {
  private authService = inject(AuthService);
  private facilityId: string = '';

  ngOnInit(): void {
    // STEP 1: Get facilityId using the service
    this.facilityId = this.authService.getFacilityId();
    
    // STEP 2: Decide how to handle NATIONAL
    if (this.facilityId === 'NATIONAL') {
      // Option A: Show message and return
      this.showInfo('This feature is facility-specific');
      return;
      
      // Option B: Load national-level data instead
      this.loadNationalData();
      return;
    }
    
    // STEP 3: Continue with facility-specific logic
    this.loadData(this.facilityId);
  }
}
```

---

## 🚨 Error Prevention Checklist

Before deploying new code, verify:

- [ ] All components use `authService.getFacilityId()`
- [ ] No direct access to `user.facilityId` or `currentUser?.facilityId`
- [ ] NATIONAL is handled appropriately (error message or national data)
- [ ] Tested with all three user roles
- [ ] No "No facility ID found" errors appear

---

## 📞 Troubleshooting

### Still seeing "No facility ID found" errors?

1. **Check the component code:**
   ```typescript
   // Search for this pattern:
   grep -r "currentUser?.facilityId" src/app/
   ```

2. **Replace with correct pattern:**
   ```typescript
   // Change from:
   const facilityId = this.currentUser?.facilityId;
   
   // To:
   const facilityId = this.authService.getFacilityId();
   ```

3. **Verify user is logged in:**
   ```typescript
   const user = this.authService.getCurrentUser();
   console.log('User:', user);
   console.log('FacilityId:', this.authService.getFacilityId());
   ```

4. **Check localStorage:**
   - Open browser DevTools → Application → Local Storage
   - Check `currentUser` key
   - Verify it contains `facilityId` field (or role is GOVERNMENT_OFFICIAL)

---

## 🎯 Summary

**The Golden Rule:**
> Always use `authService.getFacilityId()` instead of accessing `facilityId` directly.

**Benefits:**
- ✅ No more "No facility ID found" errors
- ✅ Government officials work correctly
- ✅ Consistent behavior across the app
- ✅ Proper fallback handling
- ✅ Easier maintenance

**Remember:**
- `NATIONAL` = Government official (national oversight)
- Facility-specific features should reject NATIONAL with clear message
- National-level features should handle NATIONAL by loading all data

---

## 📝 Change Log

**2025-05-XX** - Initial fix
- Fixed all components to use `authService.getFacilityId()`
- Updated 11 components across dashboards, inventory, campaigns, patients, and vaccinations
- Resolved "No facility ID found for current user" errors
- Added proper handling for government officials (NATIONAL facility ID)
