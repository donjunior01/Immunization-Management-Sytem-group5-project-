import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { StockService } from '../../../core/services/stock.service';
import { StockLevel } from '../../../core/models/stock.model';
import { FacilityService } from '../../../core/services/facility.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-district-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './district-stock.component.html',
  styleUrl: './district-stock.component.scss'
})
export class DistrictStockComponent implements OnInit {
  allStock: Map<string, StockLevel[]> = new Map(); // facilityId -> stock levels
  facilities: any[] = [];
  selectedFacilityId: string = 'all';
  loading = false;
  errorMessage = '';
  infoMessage = '';
  searchQuery = '';
  filterStatus = 'all';
  private isLoadingData = false;

  // Summary stats
  totalVaccineTypes = 0;
  totalQuantity = 0;
  lowStockCount = 0;
  expiringSoonCount = 0;

  get filteredStock(): StockLevel[] {
    let stock: StockLevel[] = [];
    
    if (this.selectedFacilityId === 'all') {
      // Aggregate all facilities' stock
      this.allStock.forEach((levels) => {
        stock = stock.concat(levels);
      });
    } else {
      stock = this.allStock.get(this.selectedFacilityId) || [];
    }

    // Apply filters
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      stock = stock.filter(s => 
        s.vaccineName.toLowerCase().includes(query) ||
        s.vaccineId.toLowerCase().includes(query)
      );
    }

    if (this.filterStatus !== 'all') {
      stock = stock.filter(s => s.status === this.filterStatus);
    }

    return stock;
  }

  constructor(
    private stockService: StockService,
    private facilityService: FacilityService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    // District dashboard plays admin role - load ALL facilitiesthis.facilityService.getAllFacilities(true).subscribe({
      next: (facilities) => {this.facilities = facilities.map(f => ({ id: f.id, name: f.name || f.id }));
        this.loadAllStock();
      },
      error: (error) => {console.error('Failed to load all facilities:', error);
        this.errorMessage = 'Failed to load facilities. Please try again.';
        this.facilities = [];
      }
    });
  }

  loadAllStock(): void {
    if (this.isLoadingData) return;
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    this.allStock.clear();

    if (this.facilities.length === 0) {
      this.loading = false;
      this.isLoadingData = false;
      return;
    }

    let loadedCount = 0;
    const totalFacilities = this.facilities.length;

    this.facilities.forEach(facility => {
      this.stockService.getStockLevels(facility.id).subscribe({
        next: (stockLevels) => {
          this.allStock.set(facility.id, stockLevels);
          loadedCount++;
          if (loadedCount === totalFacilities) {
            this.updateSummaryStats();
            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
              this.isLoadingData = false;
              this.cdr.detectChanges();
            });
          }
        },
        error: (error) => {
          console.warn(`Failed to load stock for facility ${facility.id}:`, error);
          this.allStock.set(facility.id, []);
          loadedCount++;
          if (loadedCount === totalFacilities) {
            this.updateSummaryStats();
            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
              this.isLoadingData = false;
              this.cdr.detectChanges();
            });
          }
        }
      });
    });
  }

  private updateSummaryStats(): void {
    this.totalVaccineTypes = this.filteredStock.length;
    this.totalQuantity = this.filteredStock.reduce((sum, s) => sum + (s.currentQuantity || 0), 0);
    this.lowStockCount = this.filteredStock.filter(s => s.status === 'LOW').length;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.expiringSoonCount = this.filteredStock.filter(s => {
      if (!s.oldestExpiryDate) return false;
      const expiry = new Date(s.oldestExpiryDate);
      return expiry > now && expiry <= thirtyDaysFromNow;
    }).length;
  }

  onFacilityChange(): void {
    this.updateSummaryStats();
  }

  onSearch(): void {
    this.updateSummaryStats();
  }

  onFilterChange(): void {
    this.updateSummaryStats();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'LOW': return 'status-low';
      case 'CRITICAL': return 'status-critical';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-good';
    }
  }

  getFacilityName(facilityId: string): string {
    const facility = this.facilities.find(f => f.id === facilityId);
    return facility ? facility.name : facilityId;
  }

  getFacilityNameFromStock(stock: StockLevel): string {
    // Find which facility this stock belongs to
    for (const [facilityId, stockLevels] of this.allStock.entries()) {
      if (stockLevels.some(s => s.vaccineId === stock.vaccineId)) {
        return this.getFacilityName(facilityId);
      }
    }
    return 'Unknown Facility';
  }

  getStockForFacility(facilityId: string): StockLevel[] {
    return this.allStock.get(facilityId) || [];
  }
}
