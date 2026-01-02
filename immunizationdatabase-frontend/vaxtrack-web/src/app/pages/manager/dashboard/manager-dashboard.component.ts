import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PatientService } from '../../../core/services/patient.service';
import { StockService } from '../../../core/services/stock.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss'
})
export class ManagerDashboardComponent implements OnInit {
  loading = false;
  
  // Stats - all loaded from backend
  patientsThisMonth = 0;
  vaccinationsThisWeek = 0;
  coverageRate = 0;
  lowStockItems = 0;
  pendingSyncs = 0; // Will be 0 until backend API is available
  
  // Stock Status
  outOfStock: any[] = [];
  lowStock: any[] = [];
  expiringSoon: any[] = [];
  
  // Alerts - generated from stock data
  recentAlerts: any[] = [];
  
  // Defaulters - calculated from appointments
  totalDefaulters = 0;
  defaultersByDuration = {
    '1-4 weeks': 0,
    '1-3 months': 0,
    '3+ months': 0
  };
  
  // Staff Performance - loaded from backend
  staffPerformance: any[] = [];
  paginatedStaffPerformance: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Coverage Data - calculated from real data
  coverageByVaccine: any[] = [];

  private isLoadingData = false; // Prevent multiple simultaneous loads

  constructor(
    private patientService: PatientService,
    private stockService: StockService,
    private vaccinationService: VaccinationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    // Initialize pagination with empty data
    this.updatePagination();
  }

  loadDashboardData(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (!facilityId) {
      console.warn('No facility ID available');
      this.loading = false;
      this.isLoadingData = false;
      return;
    }

    let patientsLoaded = false;
    let vaccinationsLoaded = false;
    let stockLoaded = false;
    let expiringLoaded = false;
    let allPatientsLoaded = false;
    let allVaccinationsLoaded = false;
    let isComplete = false;

    const checkComplete = () => {
      if (patientsLoaded && vaccinationsLoaded && stockLoaded && expiringLoaded && allPatientsLoaded && allVaccinationsLoaded && !isComplete) {
        isComplete = true;
        // Calculate coverage rate and coverage by vaccine
        this.calculateCoverage();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    };

    // Load patients count for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    this.patientService.getPatientsCountByFacility(facilityId, startOfMonth, endOfMonth).subscribe({
      next: (count) => {
        this.patientsThisMonth = count;
        patientsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load patients count:', error);
        this.patientsThisMonth = 0;
        patientsLoaded = true;
        checkComplete();
      }
    });

    // Load vaccinations for this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeekStr = now.toISOString().split('T')[0];
    
    this.vaccinationService.getVaccinationsByDateRange(facilityId, startOfWeekStr, endOfWeekStr).subscribe({
      next: (vaccinations) => {
        this.vaccinationsThisWeek = vaccinations.length;
        vaccinationsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load vaccinations:', error);
        this.vaccinationsThisWeek = 0;
        vaccinationsLoaded = true;
        checkComplete();
      }
    });

    // Load stock levels
    this.stockService.getStockLevels(facilityId).subscribe({
      next: (levels) => {
        // Process stock levels
        this.outOfStock = levels.filter(l => l.status === 'CRITICAL' || l.totalQuantity === 0).map(l => ({
          name: l.vaccineName,
          daysOut: 0
        }));
        this.lowStock = levels.filter(l => l.status === 'LOW').map(l => ({
          name: l.vaccineName,
          currentStock: l.totalQuantity,
          reorderPoint: 50
        }));
        this.lowStockItems = this.lowStock.length;
        stockLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load stock data:', error);
        this.outOfStock = [];
        this.lowStock = [];
        this.lowStockItems = 0;
        stockLoaded = true;
        checkComplete();
      }
    });

    // Load expiring batches
    this.stockService.getExpiringBatches(facilityId, 30).subscribe({
      next: (batches) => {
        this.expiringSoon = batches.map(b => ({
          name: b.vaccineName,
          batch: b.batchNumber,
          expiryDate: b.expiryDate
        }));
        
        // Generate alerts from stock data
        this.generateAlerts();
        
        expiringLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load expiring batches:', error);
        this.expiringSoon = [];
        expiringLoaded = true;
        checkComplete();
      }
    });

    // Load all patients for coverage calculation
    this.patientService.getPatientsByFacility(facilityId).subscribe({
      next: (patients) => {
        (this as any).allPatients = patients;
        allPatientsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load all patients:', error);
        (this as any).allPatients = [];
        allPatientsLoaded = true;
        checkComplete();
      }
    });

    // Load all vaccinations for coverage calculation
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    this.vaccinationService.getVaccinationsByDateRange(facilityId, startOfYear, endOfYear).subscribe({
      next: (vaccinations) => {
        (this as any).allVaccinations = vaccinations;
        allVaccinationsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load all vaccinations:', error);
        (this as any).allVaccinations = [];
        allVaccinationsLoaded = true;
        checkComplete();
      }
    });

    // Load staff performance data
    this.loadStaffPerformance(facilityId, startOfWeekStr, endOfWeekStr);
  }

  private loadStaffPerformance(facilityId: string, startDate: string, endDate: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    
    // For now, create mock staff performance data based on vaccinations
    // In a real implementation, this would come from a staff performance API
    this.vaccinationService.getVaccinationsByDateRange(facilityId, startDate, endDate).subscribe({
      next: (vaccinations) => {
        // Group vaccinations by vaccinator
        const vaccinatorMap = new Map<string, { name: string; role: string; vaccinations: number; patients: Set<string> }>();
        
        vaccinations.forEach(v => {
          const vaccinatorId = v.administeredBy || 'unknown';
          const vaccinatorName = v.administeredByName || 'Unknown Staff';
          const role = 'VACCINATOR'; // Default role, could be enhanced to fetch from user service
          
          if (!vaccinatorMap.has(vaccinatorId)) {
            vaccinatorMap.set(vaccinatorId, {
              name: vaccinatorName,
              role: role,
              vaccinations: 0,
              patients: new Set()
            });
          }
          
          const staff = vaccinatorMap.get(vaccinatorId)!;
          staff.vaccinations++;
          if (v.patientId) {
            staff.patients.add(v.patientId);
          }
        });
        
        // Convert to array format
        this.staffPerformance = Array.from(vaccinatorMap.values()).map(staff => ({
          name: staff.name,
          role: this.formatRole(staff.role),
          vaccinations: staff.vaccinations,
          patients: staff.patients.size
        }));
        
        // If no staff found, add current user as default
        if (this.staffPerformance.length === 0 && currentUser) {
          this.staffPerformance = [{
            name: currentUser.fullName || currentUser.username,
            role: this.formatRole(currentUser.role),
            vaccinations: 0,
            patients: 0
          }];
        }
        
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Failed to load staff performance:', error);
        this.staffPerformance = [];
        this.updatePagination();
      }
    });
  }

  private formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'FACILITY_MANAGER': 'Facility Manager',
      'VACCINATOR': 'Vaccinator',
      'HEALTH_WORKER': 'Health Worker',
      'GOVERNMENT_OFFICIAL': 'Government Official'
    };
    return roleMap[role] || role;
  }

  private calculateCoverage(): void {
    const allPatients: any[] = (this as any).allPatients || [];
    const allVaccinations: any[] = (this as any).allVaccinations || [];
    
    // Calculate overall coverage rate
    const totalPatients = allPatients.length;
    const vaccinatedPatients = new Set(allVaccinations.map(v => v.patientId)).size;
    this.coverageRate = totalPatients > 0 ? Math.round((vaccinatedPatients / totalPatients) * 100) : 0;
    
    // Calculate coverage by vaccine
    const vaccineMap = new Map<string, { total: number; vaccinated: Set<string> }>();
    
    // Initialize vaccine map with all vaccines from vaccinations
    allVaccinations.forEach(v => {
      const vaccineName = v.vaccineName || 'Unknown';
      if (!vaccineMap.has(vaccineName)) {
        vaccineMap.set(vaccineName, { total: 0, vaccinated: new Set() });
      }
      vaccineMap.get(vaccineName)!.vaccinated.add(v.patientId);
    });
    
    // Count total patients eligible for each vaccine (simplified - assumes all patients are eligible)
    vaccineMap.forEach((value, key) => {
      value.total = totalPatients;
    });
    
    this.coverageByVaccine = Array.from(vaccineMap.entries()).map(([vaccine, data]) => ({
      vaccine,
      coverage: data.total > 0 ? Math.round((data.vaccinated.size / data.total) * 100) : 0,
      vaccinated: data.vaccinated.size,
      total: data.total
    })).sort((a, b) => b.coverage - a.coverage);
  }

  private generateAlerts(): void {
    this.recentAlerts = [];
    
    // Add out of stock alerts
    this.outOfStock.forEach(item => {
      this.recentAlerts.push({
        type: 'error',
        message: `${item.name} vaccine out of stock`,
        time: 'Just now'
      });
    });
    
    // Add low stock alerts
    this.lowStock.slice(0, 2).forEach(item => {
      this.recentAlerts.push({
        type: 'warning',
        message: `${item.name} stock below reorder point (${item.currentStock} doses)`,
        time: 'Just now'
      });
    });
    
    // Add expiring alerts
    this.expiringSoon.slice(0, 2).forEach(item => {
      this.recentAlerts.push({
        type: 'warning',
        message: `${item.name} batch ${item.batch} expiring soon`,
        time: 'Just now'
      });
    });
  }

  getCoverageStatusClass(coverage: number): string {
    if (coverage >= 90) return 'status-good';
    if (coverage >= 80) return 'status-warning';
    return 'status-error';
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.staffPerformance.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedStaffPerformance = this.staffPerformance.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.staffPerformance.length);
  }
}

