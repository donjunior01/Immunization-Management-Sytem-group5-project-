import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { StockService } from '../../../core/services/stock.service';
import { StockLevel } from '../../../core/models/stock.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-vaccinator-stock',
  standalone: true,
  imports: [CommonModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './vaccinator-stock.component.html',
  styleUrl: './vaccinator-stock.component.scss'
})
export class VaccinatorStockComponent implements OnInit {
  stockLevels: StockLevel[] = [];
  loading = false;
  errorMessage = '';

  private isLoadingData = false; // Prevent multiple simultaneous loads

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStockLevels();
  }

  loadStockLevels(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;

    this.stockService.getStockLevels(facilityId).subscribe({
      next: (levels) => {
        this.stockLevels = levels || [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load stock levels';
        this.stockLevels = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'GOOD': return 'status-good';
      case 'LOW': return 'status-low';
      case 'CRITICAL': return 'status-critical';
      case 'OUT': return 'status-critical';
      default: return '';
    }
  }
}

