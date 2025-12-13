import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface VaccineBatch {
  id: number;
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate: string;
  receiptDate: string;
  facilityId: string;
  status: 'GOOD' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  daysUntilExpiry: number;
  utilizationPercent: number;
}

interface InventoryKPI {
  totalBatches: number;
  activeVaccines: number;
  lowStockAlerts: number;
  expiringSoon: number;
  totalDoses: number;
  utilizationRate: number;
}

interface VaccineCategory {
  name: string;
  batches: number;
  totalDoses: number;
  availableDoses: number;
  stockLevel: 'GOOD' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  utilizationPercent: number;
}

interface StockAlert {
  id: number;
  type: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED' | 'REORDER';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  vaccineName: string;
  batchNumber: string;
  message: string;
  daysRemaining?: number;
  quantityRemaining?: number;
}

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.scss'
})
export class InventoryDashboardComponent implements OnInit {
  kpis: InventoryKPI = {
    totalBatches: 0,
    activeVaccines: 0,
    lowStockAlerts: 0,
    expiringSoon: 0,
    totalDoses: 0,
    utilizationRate: 0
  };

  batches: VaccineBatch[] = [];
  filteredBatches: VaccineBatch[] = [];
  vaccineCategories: VaccineCategory[] = [];
  stockAlerts: StockAlert[] = [];

  // Filters
  searchTerm: string = '';
  selectedVaccine: string = 'all';
  selectedStatus: string = 'all';

  vaccineOptions = ['all', 'BCG', 'OPV', 'DTP', 'Measles', 'Hepatitis B', 'Polio'];
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'GOOD', label: 'Good Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
    { value: 'EXPIRED', label: 'Expired' }
  ];

  // Table columns
  displayedColumns: string[] = ['batch', 'vaccine', 'stock', 'utilization', 'expiry', 'status', 'actions'];

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInventoryData();
  }

  loadInventoryData(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loadBatches();
      this.calculateKPIs();
      this.calculateVaccineCategories();
      this.generateStockAlerts();
      this.applyFilters();
      this.loaderService.hide();
      this.notificationService.showSuccess('Inventory data loaded successfully');
    }, 1000);
  }

  loadBatches(): void {
    const currentDate = new Date('2024-12-11'); // Current date from context
    
    // Mock data from database schema
    const mockBatches = [
      { id: 1, batchNumber: 'BCG-2024-001', vaccineName: 'BCG', manufacturer: 'Serum Institute of India', quantityReceived: 500, quantityRemaining: 450, expiryDate: '2025-12-31', receiptDate: '2024-01-15', facilityId: 'FAC001' },
      { id: 2, batchNumber: 'OPV-2024-001', vaccineName: 'OPV', manufacturer: 'Bio-Manguinhos', quantityReceived: 1000, quantityRemaining: 850, expiryDate: '2025-11-30', receiptDate: '2024-02-01', facilityId: 'FAC001' },
      { id: 3, batchNumber: 'DTP-2024-001', vaccineName: 'DTP', manufacturer: 'Bharat Biotech', quantityReceived: 750, quantityRemaining: 600, expiryDate: '2025-10-31', receiptDate: '2024-03-10', facilityId: 'FAC001' },
      { id: 4, batchNumber: 'MEASLES-2024-001', vaccineName: 'Measles', manufacturer: 'Serum Institute of India', quantityReceived: 600, quantityRemaining: 500, expiryDate: '2025-09-30', receiptDate: '2024-04-05', facilityId: 'FAC001' },
      { id: 5, batchNumber: 'HEPATITIS-2024-001', vaccineName: 'Hepatitis B', manufacturer: 'GlaxoSmithKline', quantityReceived: 800, quantityRemaining: 700, expiryDate: '2026-01-31', receiptDate: '2024-05-20', facilityId: 'FAC001' },
      { id: 6, batchNumber: 'BCG-2024-002', vaccineName: 'BCG', manufacturer: 'Serum Institute of India', quantityReceived: 300, quantityRemaining: 280, expiryDate: '2025-01-10', receiptDate: '2024-06-01', facilityId: 'FAC001' },
      { id: 7, batchNumber: 'OPV-2024-002', vaccineName: 'OPV', manufacturer: 'Bio-Manguinhos', quantityReceived: 400, quantityRemaining: 350, expiryDate: '2025-01-05', receiptDate: '2024-06-15', facilityId: 'FAC001' },
      { id: 8, batchNumber: 'DTP-2024-002', vaccineName: 'DTP', manufacturer: 'Bharat Biotech', quantityReceived: 200, quantityRemaining: 45, expiryDate: '2025-08-31', receiptDate: '2024-07-01', facilityId: 'FAC001' },
      { id: 9, batchNumber: 'MEASLES-2024-002', vaccineName: 'Measles', manufacturer: 'Serum Institute of India', quantityReceived: 150, quantityRemaining: 30, expiryDate: '2025-07-31', receiptDate: '2024-07-15', facilityId: 'FAC001' },
      { id: 10, batchNumber: 'POLIO-2023-001', vaccineName: 'Polio', manufacturer: 'Sanofi Pasteur', quantityReceived: 500, quantityRemaining: 50, expiryDate: '2024-11-30', receiptDate: '2023-11-01', facilityId: 'FAC001' }
    ];

    this.batches = mockBatches.map(batch => {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      const utilizationPercent = Math.round(((batch.quantityReceived - batch.quantityRemaining) / batch.quantityReceived) * 100);
      
      let status: 'GOOD' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' = 'GOOD';
      
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING_SOON';
      } else if (batch.quantityRemaining < batch.quantityReceived * 0.2) {
        status = 'LOW_STOCK';
      }

      return {
        ...batch,
        status,
        daysUntilExpiry,
        utilizationPercent
      };
    });
  }

  calculateKPIs(): void {
    const totalBatches = this.batches.length;
    const activeVaccines = new Set(this.batches.filter(b => b.status !== 'EXPIRED').map(b => b.vaccineName)).size;
    const lowStockAlerts = this.batches.filter(b => b.status === 'LOW_STOCK').length;
    const expiringSoon = this.batches.filter(b => b.status === 'EXPIRING_SOON').length;
    const totalDoses = this.batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    
    const totalReceived = this.batches.reduce((sum, b) => sum + b.quantityReceived, 0);
    const totalUsed = this.batches.reduce((sum, b) => sum + (b.quantityReceived - b.quantityRemaining), 0);
    const utilizationRate = totalReceived > 0 ? Math.round((totalUsed / totalReceived) * 100) : 0;

    this.kpis = {
      totalBatches,
      activeVaccines,
      lowStockAlerts,
      expiringSoon,
      totalDoses,
      utilizationRate
    };
  }

  calculateVaccineCategories(): void {
    const categoryMap = new Map<string, VaccineCategory>();

    this.batches.forEach(batch => {
      if (!categoryMap.has(batch.vaccineName)) {
        categoryMap.set(batch.vaccineName, {
          name: batch.vaccineName,
          batches: 0,
          totalDoses: 0,
          availableDoses: 0,
          stockLevel: 'GOOD',
          utilizationPercent: 0
        });
      }

      const category = categoryMap.get(batch.vaccineName)!;
      category.batches++;
      category.totalDoses += batch.quantityReceived;
      category.availableDoses += batch.quantityRemaining;
    });

    this.vaccineCategories = Array.from(categoryMap.values()).map(category => {
      const utilizationPercent = Math.round(((category.totalDoses - category.availableDoses) / category.totalDoses) * 100);
      const availabilityPercent = (category.availableDoses / category.totalDoses) * 100;
      
      let stockLevel: 'GOOD' | 'MEDIUM' | 'LOW' | 'CRITICAL' = 'GOOD';
      if (availabilityPercent < 10) stockLevel = 'CRITICAL';
      else if (availabilityPercent < 25) stockLevel = 'LOW';
      else if (availabilityPercent < 50) stockLevel = 'MEDIUM';

      return {
        ...category,
        utilizationPercent,
        stockLevel
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  generateStockAlerts(): void {
    this.stockAlerts = [];
    let alertId = 1;

    this.batches.forEach(batch => {
      // Expired batches
      if (batch.status === 'EXPIRED') {
        this.stockAlerts.push({
          id: alertId++,
          type: 'EXPIRED',
          severity: 'HIGH',
          vaccineName: batch.vaccineName,
          batchNumber: batch.batchNumber,
          message: `Batch has expired and should be disposed`,
          daysRemaining: batch.daysUntilExpiry,
          quantityRemaining: batch.quantityRemaining
        });
      }
      
      // Expiring soon
      if (batch.status === 'EXPIRING_SOON') {
        this.stockAlerts.push({
          id: alertId++,
          type: 'EXPIRING',
          severity: batch.daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM',
          vaccineName: batch.vaccineName,
          batchNumber: batch.batchNumber,
          message: `Batch expiring in ${batch.daysUntilExpiry} days`,
          daysRemaining: batch.daysUntilExpiry,
          quantityRemaining: batch.quantityRemaining
        });
      }

      // Low stock
      if (batch.status === 'LOW_STOCK') {
        this.stockAlerts.push({
          id: alertId++,
          type: 'LOW_STOCK',
          severity: batch.quantityRemaining < batch.quantityReceived * 0.1 ? 'HIGH' : 'MEDIUM',
          vaccineName: batch.vaccineName,
          batchNumber: batch.batchNumber,
          message: `Only ${batch.quantityRemaining} doses remaining`,
          quantityRemaining: batch.quantityRemaining
        });
      }
    });

    // Check for reorder triggers
    this.vaccineCategories.forEach(category => {
      if (category.stockLevel === 'CRITICAL' || category.stockLevel === 'LOW') {
        this.stockAlerts.push({
          id: alertId++,
          type: 'REORDER',
          severity: category.stockLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          vaccineName: category.name,
          batchNumber: 'Multiple',
          message: `${category.name} stock is ${category.stockLevel.toLowerCase()} - consider reordering`,
          quantityRemaining: category.availableDoses
        });
      }
    });

    this.stockAlerts.sort((a, b) => {
      const severityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  applyFilters(): void {
    this.filteredBatches = this.batches.filter(batch => {
      const matchesSearch = !this.searchTerm || 
        batch.batchNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        batch.vaccineName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        batch.manufacturer.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesVaccine = this.selectedVaccine === 'all' || batch.vaccineName === this.selectedVaccine;
      const matchesStatus = this.selectedStatus === 'all' || batch.status === this.selectedStatus;

      return matchesSearch && matchesVaccine && matchesStatus;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getStatusIcon(status: string): string {
    const icons = {
      'GOOD': 'check_circle',
      'LOW_STOCK': 'warning',
      'EXPIRING_SOON': 'schedule',
      'EXPIRED': 'cancel'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getStockLevelClass(level: string): string {
    return `stock-level-${level.toLowerCase()}`;
  }

  getAlertIcon(type: string): string {
    const icons = {
      'LOW_STOCK': 'inventory_2',
      'EXPIRING': 'schedule',
      'EXPIRED': 'warning',
      'REORDER': 'shopping_cart'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  viewBatchDetails(batch: VaccineBatch): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loaderService.hide();
      this.router.navigate(['/inventory/batch', batch.id]);
    }, 800);
  }

  adjustStock(batch: VaccineBatch): void {
    this.notificationService.showInfo(`Opening stock adjustment for ${batch.batchNumber}`);
  }

  disposeBatch(batch: VaccineBatch): void {
    this.notificationService.showWarning(`Disposal process initiated for ${batch.batchNumber}`);
  }

  addNewBatch(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loaderService.hide();
      this.notificationService.showInfo('Opening add batch form');
    }, 800);
  }

  exportInventoryReport(): void {
    this.loaderService.show();
    setTimeout(() => {
      const csvContent = this.generateInventoryCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.loaderService.hide();
      this.notificationService.showSuccess('Inventory report exported successfully');
    }, 1000);
  }

  generateInventoryCSV(): string {
    let csv = 'Facility Inventory Report\n\n';
    
    // KPIs Section
    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value\n';
    csv += `Total Batches,${this.kpis.totalBatches}\n`;
    csv += `Active Vaccines,${this.kpis.activeVaccines}\n`;
    csv += `Low Stock Alerts,${this.kpis.lowStockAlerts}\n`;
    csv += `Expiring Soon,${this.kpis.expiringSoon}\n`;
    csv += `Total Available Doses,${this.kpis.totalDoses}\n`;
    csv += `Utilization Rate,${this.kpis.utilizationRate}%\n\n`;

    // Vaccine Categories
    csv += 'VACCINE CATEGORIES\n';
    csv += 'Vaccine,Batches,Total Doses,Available Doses,Stock Level,Utilization %\n';
    this.vaccineCategories.forEach(cat => {
      csv += `${cat.name},${cat.batches},${cat.totalDoses},${cat.availableDoses},${cat.stockLevel},${cat.utilizationPercent}%\n`;
    });
    csv += '\n';

    // Batch Details
    csv += 'BATCH INVENTORY\n';
    csv += 'Batch Number,Vaccine,Manufacturer,Received,Remaining,Receipt Date,Expiry Date,Days Until Expiry,Utilization %,Status\n';
    this.batches.forEach(batch => {
      csv += `${batch.batchNumber},${batch.vaccineName},${batch.manufacturer},${batch.quantityReceived},${batch.quantityRemaining},${batch.receiptDate},${batch.expiryDate},${batch.daysUntilExpiry},${batch.utilizationPercent}%,${batch.status}\n`;
    });
    csv += '\n';

    // Stock Alerts
    csv += 'STOCK ALERTS\n';
    csv += 'Type,Severity,Vaccine,Batch,Message\n';
    this.stockAlerts.forEach(alert => {
      csv += `${alert.type},${alert.severity},${alert.vaccineName},${alert.batchNumber},"${alert.message}"\n`;
    });

    return csv;
  }

  refreshInventory(): void {
    this.loadInventoryData();
  }
}
