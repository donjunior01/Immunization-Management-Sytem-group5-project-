import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface WastageRecord {
  id: number;
  batchNumber: string;
  vaccineName: string;
  quantityWasted: number;
  reason: 'Expired' | 'Broken Vial' | 'Open Vial Wastage' | 'Cold Chain Failure' | 'Contamination' | 'Recalled' | 'Other';
  reasonDetail?: string;
  dateReported: Date;
  reportedBy: string;
  facilityId: string;
  facilityName: string;
  estimatedValue: number;
  preventable: boolean;
  actionTaken?: string;
  status: 'Reported' | 'Under Investigation' | 'Resolved' | 'Closed';
}

interface WastageStats {
  totalWastage: number;
  totalValue: number;
  preventableWastage: number;
  preventablePercentage: number;
  wastageRate: number;
  mostCommonReason: string;
}

interface WastageByReason {
  reason: string;
  quantity: number;
  value: number;
  percentage: number;
}

interface TrendData {
  month: string;
  wastage: number;
  value: number;
}

@Component({
  selector: 'app-wastage-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule
  ],
  templateUrl: './wastage-management.component.html',
  styleUrl: './wastage-management.component.scss'
})
export class WastageManagementComponent implements OnInit, OnDestroy {
  wastageRecords: WastageRecord[] = [];
  filteredRecords: WastageRecord[] = [];
  wastageByReason: WastageByReason[] = [];
  trendData: TrendData[] = [];
  
  stats: WastageStats = {
    totalWastage: 0,
    totalValue: 0,
    preventableWastage: 0,
    preventablePercentage: 0,
    wastageRate: 0,
    mostCommonReason: ''
  };

  displayedColumns: string[] = ['batchNumber', 'vaccine', 'quantity', 'reason', 'date', 'value', 'preventable', 'status', 'actions'];
  
  filterForm: FormGroup;
  recordForm: FormGroup;
  investigationForm: FormGroup;

  showRecordDialog = false;
  showDetailDialog = false;
  showInvestigationDialog = false;
  selectedRecord: WastageRecord | null = null;
  isEditMode = false;

  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  reasonOptions = [
    'Expired',
    'Broken Vial',
    'Open Vial Wastage',
    'Cold Chain Failure',
    'Contamination',
    'Recalled',
    'Other'
  ];

  statusOptions = [
    'Reported',
    'Under Investigation',
    'Resolved',
    'Closed'
  ];

  facilities = [
    { id: 'FAC001', name: 'Central Hospital' },
    { id: 'FAC002', name: 'District Health Center' },
    { id: 'FAC003', name: 'Regional Medical Center' },
    { id: 'FAC004', name: 'Community Health Clinic' },
    { id: 'FAC005', name: 'Rural Health Post' }
  ];

  vaccines = [
    'BCG',
    'OPV',
    'DTP',
    'Measles',
    'Hepatitis B',
    'Pentavalent',
    'Rotavirus',
    'Pneumococcal',
    'HPV',
    'Yellow Fever'
  ];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      reason: [''],
      facilityId: [''],
      status: [''],
      preventable: [''],
      dateFrom: [null],
      dateTo: [null]
    });

    this.recordForm = this.fb.group({
      id: [null],
      batchNumber: ['', [Validators.required, Validators.minLength(3)]],
      vaccineName: ['', Validators.required],
      quantityWasted: [0, [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      reasonDetail: [''],
      dateReported: [new Date(), Validators.required],
      reportedBy: ['', Validators.required],
      facilityId: ['', Validators.required],
      estimatedValue: [0, [Validators.required, Validators.min(0)]],
      preventable: [false],
      actionTaken: [''],
      status: ['Reported']
    });

    this.investigationForm = this.fb.group({
      recordId: [null],
      findings: ['', Validators.required],
      preventable: [false],
      actionTaken: ['', Validators.required],
      recommendations: [''],
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    this.generateMockData();
    this.calculateStats();
    this.calculateWastageByReason();
    this.generateTrendData();
    this.applyFilters();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  generateMockData(): void {
    if (this.wastageRecords.length > 0) return;

    const reasons: Array<WastageRecord['reason']> = [
      'Expired', 'Broken Vial', 'Open Vial Wastage', 'Cold Chain Failure', 
      'Contamination', 'Recalled', 'Other'
    ];

    const statuses: Array<WastageRecord['status']> = [
      'Reported', 'Under Investigation', 'Resolved', 'Closed'
    ];

    const reporters = [
      'Dr. Sarah Johnson',
      'Nurse Mary Smith',
      'Dr. John Davis',
      'Nurse Lisa Wilson',
      'Dr. Michael Brown'
    ];

    const batchPrefixes = ['BCG', 'OPV', 'DTP', 'MES', 'HEP', 'PEN', 'ROT', 'PNE', 'HPV', 'YEL'];

    for (let i = 0; i < 50; i++) {
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const vaccine = this.vaccines[Math.floor(Math.random() * this.vaccines.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      const valuePerDose = Math.floor(Math.random() * 15) + 5;
      const facility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      
      const daysAgo = Math.floor(Math.random() * 180);
      const dateReported = new Date();
      dateReported.setDate(dateReported.getDate() - daysAgo);

      const preventable = reason === 'Expired' || reason === 'Open Vial Wastage' || 
                          reason === 'Cold Chain Failure' || reason === 'Contamination';

      let status = statuses[Math.floor(Math.random() * statuses.length)];
      if (daysAgo > 60) status = 'Closed';
      else if (daysAgo > 30) status = Math.random() > 0.5 ? 'Resolved' : 'Closed';

      this.wastageRecords.push({
        id: i + 1,
        batchNumber: `${batchPrefixes[Math.floor(Math.random() * batchPrefixes.length)]}-2024-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        vaccineName: vaccine,
        quantityWasted: quantity,
        reason: reason,
        reasonDetail: reason === 'Other' ? 'Miscellaneous wastage incident' : undefined,
        dateReported: dateReported,
        reportedBy: reporters[Math.floor(Math.random() * reporters.length)],
        facilityId: facility.id,
        facilityName: facility.name,
        estimatedValue: quantity * valuePerDose,
        preventable: preventable,
        actionTaken: status !== 'Reported' ? this.getActionTaken(reason) : undefined,
        status: status
      });
    }

    this.wastageRecords.sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime());
    this.saveToLocalStorage();
  }

  getActionTaken(reason: string): string {
    const actions: Record<string, string> = {
      'Expired': 'Implemented FEFO system and improved inventory tracking',
      'Broken Vial': 'Enhanced storage protocols and staff training on handling',
      'Open Vial Wastage': 'Improved session planning and patient scheduling',
      'Cold Chain Failure': 'Repaired cold storage equipment and added backup systems',
      'Contamination': 'Reviewed and updated sterilization procedures',
      'Recalled': 'Established rapid communication system with suppliers',
      'Other': 'Investigated root cause and implemented corrective measures'
    };
    return actions[reason] || 'Action taken and documented';
  }

  calculateStats(): void {
    const totalQuantity = this.wastageRecords.reduce((sum, r) => sum + r.quantityWasted, 0);
    const totalValue = this.wastageRecords.reduce((sum, r) => sum + r.estimatedValue, 0);
    const preventable = this.wastageRecords.filter(r => r.preventable);
    const preventableQuantity = preventable.reduce((sum, r) => sum + r.quantityWasted, 0);

    // Assuming total doses administered is 10x the wastage
    const totalDosesAdministered = totalQuantity * 10;
    const wastageRate = totalDosesAdministered > 0 ? (totalQuantity / (totalQuantity + totalDosesAdministered)) * 100 : 0;

    // Find most common reason
    const reasonCounts: Record<string, number> = {};
    this.wastageRecords.forEach(r => {
      reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
    });
    const mostCommon = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

    this.stats = {
      totalWastage: totalQuantity,
      totalValue: totalValue,
      preventableWastage: preventableQuantity,
      preventablePercentage: totalQuantity > 0 ? (preventableQuantity / totalQuantity) * 100 : 0,
      wastageRate: wastageRate,
      mostCommonReason: mostCommon ? mostCommon[0] : 'N/A'
    };
  }

  calculateWastageByReason(): void {
    const reasonMap = new Map<string, { quantity: number; value: number }>();
    
    this.wastageRecords.forEach(record => {
      const existing = reasonMap.get(record.reason) || { quantity: 0, value: 0 };
      reasonMap.set(record.reason, {
        quantity: existing.quantity + record.quantityWasted,
        value: existing.value + record.estimatedValue
      });
    });

    const totalQuantity = this.stats.totalWastage;
    this.wastageByReason = Array.from(reasonMap.entries()).map(([reason, data]) => ({
      reason,
      quantity: data.quantity,
      value: data.value,
      percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0
    })).sort((a, b) => b.quantity - a.quantity);
  }

  generateTrendData(): void {
    const monthlyData = new Map<string, { wastage: number; value: number }>();
    
    this.wastageRecords.forEach(record => {
      const monthKey = record.dateReported.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = monthlyData.get(monthKey) || { wastage: 0, value: 0 };
      monthlyData.set(monthKey, {
        wastage: existing.wastage + record.quantityWasted,
        value: existing.value + record.estimatedValue
      });
    });

    this.trendData = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        wastage: data.wastage,
        value: data.value
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredRecords = this.wastageRecords.filter(record => {
      const searchLower = filters.search?.toLowerCase() || '';
      const matchesSearch = !searchLower || 
        record.batchNumber.toLowerCase().includes(searchLower) ||
        record.vaccineName.toLowerCase().includes(searchLower) ||
        record.facilityName.toLowerCase().includes(searchLower) ||
        record.reportedBy.toLowerCase().includes(searchLower);

      const matchesReason = !filters.reason || record.reason === filters.reason;
      const matchesFacility = !filters.facilityId || record.facilityId === filters.facilityId;
      const matchesStatus = !filters.status || record.status === filters.status;
      const matchesPreventable = filters.preventable === '' || record.preventable === (filters.preventable === 'true');

      const matchesDateFrom = !filters.dateFrom || record.dateReported >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || record.dateReported <= new Date(filters.dateTo);

      return matchesSearch && matchesReason && matchesFacility && matchesStatus && 
             matchesPreventable && matchesDateFrom && matchesDateTo;
    });

    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      reason: '',
      facilityId: '',
      status: '',
      preventable: '',
      dateFrom: null,
      dateTo: null
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedRecords(): WastageRecord[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredRecords.slice(start, end);
  }

  openRecordDialog(record?: WastageRecord): void {
    this.isEditMode = !!record;
    this.selectedRecord = record || null;
    
    if (record) {
      this.recordForm.patchValue({
        ...record,
        facilityId: record.facilityId
      });
    } else {
      this.recordForm.reset({
        dateReported: new Date(),
        status: 'Reported',
        preventable: false,
        quantityWasted: 0,
        estimatedValue: 0
      });
    }
    
    this.showRecordDialog = true;
  }

  closeRecordDialog(): void {
    this.showRecordDialog = false;
    this.selectedRecord = null;
    this.recordForm.reset();
  }

  saveRecord(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const formValue = this.recordForm.value;
    const facility = this.facilities.find(f => f.id === formValue.facilityId);

    if (this.isEditMode && this.selectedRecord) {
      Object.assign(this.selectedRecord, {
        ...formValue,
        facilityName: facility?.name || this.selectedRecord.facilityName
      });
      this.notificationService.success('Wastage record updated successfully');
    } else {
      const newRecord: WastageRecord = {
        ...formValue,
        id: Math.max(0, ...this.wastageRecords.map(r => r.id)) + 1,
        facilityName: facility?.name || 'Unknown Facility',
        dateReported: new Date(formValue.dateReported)
      };
      this.wastageRecords.unshift(newRecord);
      this.notificationService.success('Wastage record created successfully');
    }

    this.saveToLocalStorage();
    this.calculateStats();
    this.calculateWastageByReason();
    this.generateTrendData();
    this.applyFilters();
    this.closeRecordDialog();
  }

  viewRecordDetails(record: WastageRecord): void {
    this.selectedRecord = record;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedRecord = null;
  }

  openInvestigationDialog(record: WastageRecord): void {
    this.selectedRecord = record;
    this.investigationForm.patchValue({
      recordId: record.id,
      preventable: record.preventable,
      actionTaken: record.actionTaken || '',
      status: record.status
    });
    this.showInvestigationDialog = true;
  }

  closeInvestigationDialog(): void {
    this.showInvestigationDialog = false;
    this.selectedRecord = null;
    this.investigationForm.reset();
  }

  saveInvestigation(): void {
    if (this.investigationForm.invalid) {
      this.investigationForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    if (!this.selectedRecord) return;

    const formValue = this.investigationForm.value;
    this.selectedRecord.preventable = formValue.preventable;
    this.selectedRecord.actionTaken = formValue.actionTaken;
    this.selectedRecord.status = formValue.status;
    this.selectedRecord.reasonDetail = formValue.findings + 
      (formValue.recommendations ? `\n\nRecommendations: ${formValue.recommendations}` : '');

    this.saveToLocalStorage();
    this.calculateStats();
    this.calculateWastageByReason();
    this.applyFilters();
    this.notificationService.success('Investigation completed successfully');
    this.closeInvestigationDialog();
  }

  deleteRecord(record: WastageRecord): void {
    if (confirm(`Are you sure you want to delete wastage record #${record.id}?`)) {
      this.wastageRecords = this.wastageRecords.filter(r => r.id !== record.id);
      this.saveToLocalStorage();
      this.calculateStats();
      this.calculateWastageByReason();
      this.generateTrendData();
      this.applyFilters();
      this.notificationService.success('Wastage record deleted successfully');
    }
  }

  exportRecords(format: 'csv' | 'json' | 'pdf'): void {
    if (format === 'csv') {
      const csv = this.convertToCSV(this.filteredRecords);
      this.downloadFile(csv, 'wastage-records.csv', 'text/csv');
      this.notificationService.success('Exported to CSV successfully');
    } else if (format === 'json') {
      const json = JSON.stringify(this.filteredRecords, null, 2);
      this.downloadFile(json, 'wastage-records.json', 'application/json');
      this.notificationService.success('Exported to JSON successfully');
    } else if (format === 'pdf') {
      this.notificationService.info('PDF export will be implemented with a reporting library');
    }
  }

  private convertToCSV(data: WastageRecord[]): string {
    const headers = ['ID', 'Batch Number', 'Vaccine', 'Quantity', 'Reason', 'Date', 'Reported By', 
                     'Facility', 'Value', 'Preventable', 'Status'];
    const rows = data.map(r => [
      r.id,
      r.batchNumber,
      r.vaccineName,
      r.quantityWasted,
      r.reason,
      this.formatDate(r.dateReported),
      r.reportedBy,
      r.facilityName,
      r.estimatedValue,
      r.preventable ? 'Yes' : 'No',
      r.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getReasonColor(reason: string): 'primary' | 'accent' | 'warn' | '' {
    const criticalReasons = ['Cold Chain Failure', 'Contamination', 'Recalled'];
    const warningReasons = ['Expired', 'Broken Vial'];
    
    if (criticalReasons.includes(reason)) return 'warn';
    if (warningReasons.includes(reason)) return 'accent';
    return 'primary';
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' | '' {
    switch (status) {
      case 'Closed': return 'primary';
      case 'Resolved': return 'accent';
      case 'Under Investigation': return 'accent';
      case 'Reported': return 'warn';
      default: return '';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('wastageRecords', JSON.stringify(this.wastageRecords));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('wastageRecords');
    if (stored) {
      this.wastageRecords = JSON.parse(stored).map((r: any) => ({
        ...r,
        dateReported: new Date(r.dateReported)
      }));
    }
  }
}
