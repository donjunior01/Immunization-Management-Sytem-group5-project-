import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

interface StockItem {
  vaccine: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  status: 'adequate' | 'low' | 'critical' | 'expiring';
  daysToExpiry: number;
  manufacturer: string;
}

interface StockAlert {
  type: 'low-stock' | 'expiring-soon' | 'expired';
  vaccine: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './stock-report.component.html',
  styleUrls: ['./stock-report.component.scss']
})
export class StockReportComponent implements OnInit {
  isLoading = false;
  displayedColumns: string[] = ['vaccine', 'batchNumber', 'quantity', 'expiryDate', 'status', 'actions'];

  // Summary statistics
  totalVaccines = 10;
  adequateStock = 4;
  lowStock = 3;
  criticalStock = 2;
  expiringBatches = 5;

  // Stock data
  stockData: StockItem[] = [
    {
      vaccine: 'BCG',
      batchNumber: 'BCG-2024-001',
      quantity: 500,
      expiryDate: '2025-12-31',
      status: 'adequate',
      daysToExpiry: 392,
      manufacturer: 'Serum Institute'
    },
    {
      vaccine: 'Polio',
      batchNumber: 'POL-2024-045',
      quantity: 350,
      expiryDate: '2025-10-15',
      status: 'adequate',
      daysToExpiry: 315,
      manufacturer: 'GSK'
    },
    {
      vaccine: 'DTP',
      batchNumber: 'DTP-2024-089',
      quantity: 150,
      expiryDate: '2025-06-30',
      status: 'low',
      daysToExpiry: 208,
      manufacturer: 'Pfizer'
    },
    {
      vaccine: 'Hepatitis B',
      batchNumber: 'HEP-2024-123',
      quantity: 200,
      expiryDate: '2025-08-20',
      status: 'low',
      daysToExpiry: 259,
      manufacturer: 'Merck'
    },
    {
      vaccine: 'Measles',
      batchNumber: 'MEA-2024-156',
      quantity: 75,
      expiryDate: '2025-03-15',
      status: 'critical',
      daysToExpiry: 101,
      manufacturer: 'Sanofi'
    },
    {
      vaccine: 'Rotavirus',
      batchNumber: 'ROT-2024-178',
      quantity: 40,
      expiryDate: '2025-02-28',
      status: 'expiring',
      daysToExpiry: 86,
      manufacturer: 'GSK'
    },
    {
      vaccine: 'Pneumococcal',
      batchNumber: 'PNE-2024-201',
      quantity: 120,
      expiryDate: '2025-07-10',
      status: 'low',
      daysToExpiry: 218,
      manufacturer: 'Pfizer'
    },
    {
      vaccine: 'HPV',
      batchNumber: 'HPV-2024-234',
      quantity: 400,
      expiryDate: '2026-01-30',
      status: 'adequate',
      daysToExpiry: 422,
      manufacturer: 'Merck'
    },
    {
      vaccine: 'Influenza',
      batchNumber: 'FLU-2024-267',
      quantity: 55,
      expiryDate: '2025-04-05',
      status: 'expiring',
      daysToExpiry: 122,
      manufacturer: 'Sanofi'
    },
    {
      vaccine: 'COVID-19',
      batchNumber: 'COV-2024-289',
      quantity: 30,
      expiryDate: '2025-02-15',
      status: 'critical',
      daysToExpiry: 73,
      manufacturer: 'Moderna'
    }
  ];

  // Stock alerts
  alerts: StockAlert[] = [
    {
      type: 'low-stock',
      vaccine: 'COVID-19',
      message: 'Critical stock level: Only 30 doses remaining',
      severity: 'high'
    },
    {
      type: 'expiring-soon',
      vaccine: 'Rotavirus',
      message: 'Expiring in 86 days - use FEFO priority',
      severity: 'high'
    },
    {
      type: 'low-stock',
      vaccine: 'Measles',
      message: 'Low stock: 75 doses remaining',
      severity: 'high'
    },
    {
      type: 'expiring-soon',
      vaccine: 'Influenza',
      message: 'Expiring in 122 days',
      severity: 'medium'
    },
    {
      type: 'low-stock',
      vaccine: 'DTP',
      message: 'Low stock: 150 doses remaining',
      severity: 'medium'
    }
  ];

  // Stock movement history
  recentMovements = [
    { vaccine: 'BCG', type: 'In', quantity: 100, date: '2024-11-30', reference: 'PO-2024-123' },
    { vaccine: 'Polio', type: 'Out', quantity: 50, date: '2024-11-29', reference: 'VAC-2024-456' },
    { vaccine: 'DTP', type: 'Out', quantity: 25, date: '2024-11-28', reference: 'VAC-2024-457' },
    { vaccine: 'Measles', type: 'Out', quantity: 30, date: '2024-11-27', reference: 'VAC-2024-458' },
    { vaccine: 'HPV', type: 'In', quantity: 200, date: '2024-11-26', reference: 'PO-2024-124' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadStockData();
  }

  loadStockData(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'adequate': return 'success';
      case 'low': return 'accent';
      case 'critical': return 'warn';
      case 'expiring': return 'warn';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'adequate': return 'check_circle';
      case 'low': return 'warning';
      case 'critical': return 'error';
      case 'expiring': return 'schedule';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'adequate': return 'Adequate';
      case 'low': return 'Low Stock';
      case 'critical': return 'Critical';
      case 'expiring': return 'Expiring Soon';
      default: return status;
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'low-stock': return 'inventory_2';
      case 'expiring-soon': return 'schedule';
      case 'expired': return 'error_outline';
      default: return 'info';
    }
  }

  getAlertColor(severity: string): string {
    switch (severity) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return '';
    }
  }

  viewBatchDetails(batch: StockItem): void {
    this.router.navigate(['/inventory']);
  }

  exportReport(): void {
    const headers = ['Vaccine', 'Batch Number', 'Quantity', 'Expiry Date', 'Days to Expiry', 'Status', 'Manufacturer'];
    const rows = this.stockData.map(item => [
      item.vaccine,
      item.batchNumber,
      item.quantity,
      item.expiryDate,
      item.daysToExpiry,
      item.status,
      item.manufacturer
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }
}
