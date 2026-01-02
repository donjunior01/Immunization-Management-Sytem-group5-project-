import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { ReportService } from '../../../core/services/report.service';
import { CoverageReport, VaccinationCount } from '../../../core/models/report.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { format, subMonths } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-district-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './district-reports.component.html',
  styleUrl: './district-reports.component.scss'
})
export class DistrictReportsComponent implements OnInit {
  coverageReport: CoverageReport | null = null;
  loading = false;
  errorMessage = '';
  startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
  endDate = format(new Date(), 'yyyy-MM-dd');

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    const startTime = Date.now();
    this.reportService.getCoverageReport('', this.startDate, this.endDate).subscribe({
      next: (report) => {
        this.coverageReport = report;
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load report';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
        });
      }
    });
  }

  exportData(): void {
    this.reportService.exportData('', this.startDate, this.endDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaccination-report-${this.startDate}-${this.endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.errorMessage = 'Failed to export data';
      }
    });
  }
}

