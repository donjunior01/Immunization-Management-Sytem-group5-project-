import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { StockService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { StockLevel, ReceiveStockRequest, AdjustStockRequest, VaccineBatch } from '../../../core/models/stock.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { Vaccine } from '../../../core/models/vaccination.model';

@Component({
  selector: 'app-manager-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-stock.component.html',
  styleUrl: './manager-stock.component.scss'
})
export class ManagerStockComponent implements OnInit {
  stockLevels: StockLevel[] = [];
  filteredStockLevels: StockLevel[] = [];
  loading = false;
  filterStatus = 'all';
  lastUpdated = new Date();
  errorMessage = '';
  private isLoadingData = false;

  // Overview stats
  totalVaccineTypes = 0;
  lowStockItems = 0;
  expiringSoon = 0;
  outOfStock = 0;

  // Modal states
  showReceiveModal = false;
  showAdjustModal = false;
  showSuccessModal = false;
  showAdjustSuccessModal = false;
  showDetailModal = false;
  createdBatch: any = null;
  adjustedBatch: any = null;
  selectedStock: StockLevel | null = null;
  receiveForm: FormGroup;
  adjustForm: FormGroup;
  availableVaccines: Vaccine[] = [];
  availableBatches: VaccineBatch[] = [];
  selectedBatch: VaccineBatch | null = null;
  loadingBatches = false;

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private vaccinationService: VaccinationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.receiveForm = this.fb.group({
      vaccineId: ['', [Validators.required]],
      batchNumber: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expiryDate: ['', [Validators.required]],
      receivedDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      receivedFrom: ['', [Validators.required]],
      notes: ['']
    });

    this.adjustForm = this.fb.group({
      vaccineId: ['', [Validators.required]],
      batchNumber: ['', [Validators.required]],
      adjustmentType: ['SUBTRACT', [Validators.required]],
      quantityChange: ['', [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadStock();
    this.loadVaccines();
  }

  loadVaccines(): void {
    this.vaccinationService.getAllVaccines().subscribe({
      next: (vaccines) => {
        this.availableVaccines = vaccines;
      },
      error: (error) => {
        console.warn('Failed to load vaccines:', error);
        this.availableVaccines = [];
      }
    });
  }

  loadStock(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (!facilityId) {
      this.errorMessage = 'No facility ID available';
      this.loading = false;
      this.isLoadingData = false;
      return;
    }
    
    this.stockService.getStockLevels(facilityId).subscribe({
      next: (levels) => {
        this.stockLevels = levels;
        this.updateOverviewStats();
        this.applyFilter();
        this.lastUpdated = new Date();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load stock:', error);
        this.errorMessage = 'Failed to load stock levels';
        this.stockLevels = [];
        this.filteredStockLevels = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private updateOverviewStats(): void {
    this.totalVaccineTypes = this.stockLevels.length;
    this.lowStockItems = this.stockLevels.filter(l => l.status === 'LOW').length;
    this.outOfStock = this.stockLevels.filter(l => l.status === 'CRITICAL' || l.totalQuantity === 0).length;
    
    // Count expiring batches
    this.stockService.getExpiringBatches(this.authService.getCurrentUser()?.facilityId, 30).subscribe({
      next: (batches) => {
        const expiringVaccines = new Set(batches.map(b => b.vaccineName));
        this.expiringSoon = expiringVaccines.size;
        this.cdr.detectChanges();
      },
      error: () => {
        this.expiringSoon = 0;
      }
    });
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredStockLevels = this.stockLevels;
    } else {
      this.filteredStockLevels = this.stockLevels.filter(level => {
        switch (this.filterStatus) {
          case 'good':
            return level.status === 'GOOD';
          case 'low':
            return level.status === 'LOW';
          case 'out':
            return level.status === 'CRITICAL' || level.totalQuantity === 0;
          case 'expiring':
            // This would need additional filtering logic
            return false;
          default:
            return true;
        }
      });
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'GOOD': return '🟢';
      case 'LOW': return '🟡';
      case 'CRITICAL': return '🔴';
      case 'OUT': return '🔴';
      default: return '⚪';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'GOOD': return 'Good';
      case 'LOW': return 'Low';
      case 'CRITICAL': return 'Critical';
      case 'OUT': return 'Out of Stock';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'GOOD': return 'status-good';
      case 'LOW': return 'status-low';
      case 'CRITICAL': return 'status-out';
      case 'OUT': return 'status-out';
      default: return '';
    }
  }

  getOldestBatch(stock: StockLevel): string {
    if (!stock.batches || stock.batches.length === 0) return '-';
    const sorted = [...stock.batches].sort((a, b) => 
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    return sorted[0].batchNumber;
  }

  getOldestExpiry(stock: StockLevel): string | null {
    // First check if oldestExpiryDate is directly available from API
    if (stock.oldestExpiryDate) {
      return stock.oldestExpiryDate;
    }
    // Fallback to batches if available
    if (!stock.batches || stock.batches.length === 0) return null;
    const sorted = [...stock.batches].sort((a, b) => 
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
    return sorted[0].expiryDate || null;
  }

  // Modal Management
  openReceiveModal(): void {
    this.receiveForm.reset({
      receivedDate: new Date().toISOString().split('T')[0]
    });
    this.showReceiveModal = true;
  }

  closeReceiveModal(): void {
    this.showReceiveModal = false;
    this.receiveForm.reset();
  }

  openAdjustModal(): void {
    this.adjustForm.reset({
      adjustmentType: 'SUBTRACT'
    });
    this.availableBatches = [];
    this.selectedBatch = null;
    this.loadingBatches = false;
    // Disable batch dropdown initially
    this.adjustForm.get('batchNumber')?.disable();
    this.showAdjustModal = true;
  }

  closeAdjustModal(): void {
    this.showAdjustModal = false;
    this.adjustForm.reset();
    this.availableBatches = [];
    this.selectedBatch = null;
  }

  onVaccineChange(): void {
    const vaccineId = this.adjustForm.get('vaccineId')?.value;
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    const batchControl = this.adjustForm.get('batchNumber');
    
    if (vaccineId && facilityId) {
      // Try to find vaccine name from availableVaccines first, then stockLevels
      const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
      const stock = this.stockLevels.find(s => s.vaccineId === vaccineId);
      const vaccineName = vaccine?.name || stock?.vaccineName || vaccineId;
      
      console.log('Loading batches for vaccine:', { vaccineId, vaccineName, facilityId, availableVaccines: this.availableVaccines.length });
      
      // Disable batch dropdown while loading
      batchControl?.disable();
      this.loadingBatches = true;
      this.availableBatches = [];
      
      // Load batches from backend
      this.stockService.getBatchesByVaccine(vaccineName, facilityId).subscribe({
        next: (batches) => {
          console.log('Batches loaded:', batches);
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.availableBatches = batches.map(batch => ({
              id: batch.id,
              vaccineId: batch.vaccineId || vaccineId,
              vaccineName: batch.vaccineName || vaccineName,
              batchNumber: batch.batchNumber,
              quantity: batch.quantity || 0,
              expiryDate: batch.expiryDate,
              receivedDate: batch.receivedDate || batch.expiryDate,
              facilityId: batch.facilityId || facilityId || '',
              isDepleted: batch.isDepleted || false
            }));
            console.log('Mapped batches:', this.availableBatches);
            this.loadingBatches = false;
            // Enable batch dropdown if batches are available
            if (this.availableBatches.length > 0) {
              batchControl?.enable();
            } else {
              batchControl?.disable();
            }
            this.cdr.detectChanges();
          }, 0);
        },
        error: (error) => {
          console.error('Failed to load batches:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.availableBatches = [];
            this.loadingBatches = false;
            batchControl?.disable();
            this.errorMessage = 'Failed to load batches. Please try again.';
            this.cdr.detectChanges();
          }, 0);
        }
      });
    } else {
      this.availableBatches = [];
      this.loadingBatches = false;
      batchControl?.disable();
      if (!facilityId) {
        console.warn('No facility ID available');
      }
    }
    this.adjustForm.patchValue({ batchNumber: '' });
    this.selectedBatch = null;
  }

  onBatchChange(): void {
    const batchNumber = this.adjustForm.get('batchNumber')?.value;
    if (batchNumber) {
      this.selectedBatch = this.availableBatches.find(b => b.batchNumber === batchNumber) || null;
    } else {
      this.selectedBatch = null;
    }
  }

  onReceiveSubmit(): void {
    if (this.receiveForm.valid) {
      this.loading = true;
      const facilityId = this.authService.getCurrentUser()?.facilityId;
      const formValue = this.receiveForm.value;
      
      const receiveRequest: ReceiveStockRequest = {
        vaccineId: formValue.vaccineId,
        batchNumber: formValue.batchNumber,
        quantity: formValue.quantity,
        expiryDate: formValue.expiryDate,
        receivedDate: formValue.receivedDate,
        receivedFrom: formValue.receivedFrom
      };

      this.stockService.receiveStock(receiveRequest).subscribe({
        next: (response) => {
          this.loading = false;
          this.createdBatch = {
            batchNumber: formValue.batchNumber,
            vaccineId: formValue.vaccineId,
            quantity: formValue.quantity,
            expiryDate: formValue.expiryDate,
            receivedDate: formValue.receivedDate,
            vaccineName: this.availableVaccines.find(v => v.id === formValue.vaccineId)?.name || 'Unknown'
          };
          this.closeReceiveModal();
          this.showSuccessModal = true;
          this.loadStock();
        },
        error: (error) => {
          console.error('Failed to receive stock:', error);
          this.errorMessage = 'Failed to receive stock. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.receiveForm.markAllAsTouched();
    }
  }

  onAdjustSubmit(): void {
    if (this.adjustForm.valid) {
      const formValue = this.adjustForm.value;
      const quantityChange = formValue.adjustmentType === 'SUBTRACT' 
        ? -Math.abs(formValue.quantityChange) 
        : Math.abs(formValue.quantityChange);

      // Find the selected vaccine to get its name (backend expects vaccine name, not ID)
      const selectedVaccine = this.availableVaccines.find(v => v.id === formValue.vaccineId);
      if (!selectedVaccine) {
        this.errorMessage = 'Please select a valid vaccine.';
        return;
      }

      const adjustRequest: AdjustStockRequest = {
        vaccineId: selectedVaccine.name, // Backend expects vaccine name, not ID
        batchNumber: formValue.batchNumber,
        quantityChange: quantityChange,
        reason: formValue.reason,
        notes: formValue.notes
      };

      // Log user role before making request
      const currentUser = this.authService.getCurrentUser();
      console.log('Adjusting stock - User role:', currentUser?.role, 'Facility ID:', currentUser?.facilityId);
      // #region agent log
      try {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager-stock.component.ts:397',message:'Before adjustStock request',data:{userRole:currentUser?.role,facilityId:currentUser?.facilityId,userId:currentUser?.id,adjustRequest},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log:',e.message||'Connection refused')});
      } catch(e) {
        console.debug('[DebugLog] Failed to create log request:',e);
      }
      // #endregion
      
      this.loading = true;
      this.stockService.adjustStock(adjustRequest).subscribe({
        next: (response) => {
          this.loading = false;
          const stock = this.stockLevels.find(s => s.vaccineId === formValue.vaccineId);
          this.adjustedBatch = {
            batchNumber: formValue.batchNumber,
            vaccineId: formValue.vaccineId,
            vaccineName: stock?.vaccineName || 'Unknown',
            quantityChange: quantityChange,
            newQuantity: (this.selectedBatch?.quantity || 0) + quantityChange,
            reason: formValue.reason
          };
          this.closeAdjustModal();
          this.showAdjustSuccessModal = true;
          this.loadStock();
        },
        error: (error) => {
          console.error('Failed to adjust stock:', error);
          const user = this.authService.getCurrentUser();
          if (error.status === 403) {
            this.errorMessage = `Access denied. Your role (${user?.role || 'Unknown'}) may not have permission to adjust stock. Required roles: HEALTH_WORKER, FACILITY_MANAGER, or GOVERNMENT_OFFICIAL.`;
          } else {
            this.errorMessage = 'Failed to adjust stock. Please try again.';
          }
          this.loading = false;
        }
      });
    } else {
      this.adjustForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const form = this.showReceiveModal ? this.receiveForm : this.adjustForm;
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['min']) return 'Value must be at least 1';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const form = this.showReceiveModal ? this.receiveForm : this.adjustForm;
    const field = form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  viewStockDetails(stock: StockLevel): void {
    this.selectedStock = stock;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedStock = null;
  }

  getBatchPlaceholderText(): string {
    if (this.loadingBatches) {
      return 'Loading batches...';
    }
    if (this.availableBatches.length === 0 && this.adjustForm.get('vaccineId')?.value) {
      return 'No batches available';
    }
    return 'Select Batch';
  }
}

