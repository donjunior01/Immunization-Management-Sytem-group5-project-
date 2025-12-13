import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface CoverageGap {
  id: number;
  facilityId: string;
  facilityName: string;
  districtId: string;
  districtName: string;
  vaccineName: string;
  ageGroup: string;
  targetPopulation: number;
  vaccinated: number;
  unvaccinated: number;
  coverageRate: number;
  gapPercentage: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  lastCampaignDate: Date | null;
  daysSinceLastCampaign: number | null;
  interventionStatus: 'Planned' | 'Ongoing' | 'Completed' | 'Not Started';
  recommendations: string[];
}

interface CoverageStats {
  totalFacilities: number;
  facilitiesWithGaps: number;
  averageCoverageRate: number;
  criticalGaps: number;
  highPriorityGaps: number;
  mediumPriorityGaps: number;
  lowPriorityGaps: number;
  totalTargetPopulation: number;
  totalVaccinated: number;
  totalUnvaccinated: number;
}

interface GeographicCoverage {
  districtId: string;
  districtName: string;
  facilities: number;
  targetPopulation: number;
  vaccinated: number;
  coverageRate: number;
  gapCount: number;
  criticalGaps: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface VaccineCoverage {
  vaccineName: string;
  targetPopulation: number;
  vaccinated: number;
  coverageRate: number;
  gapPercentage: number;
  facilitiesAffected: number;
  trend: 'Improving' | 'Stable' | 'Declining';
  recommendations: string[];
}

interface InterventionPlan {
  id: number;
  gapId: number;
  facilityName: string;
  vaccineName: string;
  ageGroup: string;
  targetPopulation: number;
  interventionType: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  status: 'Planned' | 'Ongoing' | 'Completed';
  expectedCoverage: number;
  actualCoverage: number | null;
  notes: string;
}

@Component({
  selector: 'app-coverage-gap',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './coverage-gap.component.html',
  styleUrls: ['./coverage-gap.component.scss']
})
export class CoverageGapComponent implements OnInit {
  coverageGaps: CoverageGap[] = [];
  filteredGaps: CoverageGap[] = [];
  coverageStats: CoverageStats = {
    totalFacilities: 0,
    facilitiesWithGaps: 0,
    averageCoverageRate: 0,
    criticalGaps: 0,
    highPriorityGaps: 0,
    mediumPriorityGaps: 0,
    lowPriorityGaps: 0,
    totalTargetPopulation: 0,
    totalVaccinated: 0,
    totalUnvaccinated: 0
  };
  geographicCoverage: GeographicCoverage[] = [];
  vaccineCoverage: VaccineCoverage[] = [];
  interventionPlans: InterventionPlan[] = [];

  displayedColumns: string[] = ['facility', 'vaccine', 'ageGroup', 'coverage', 'gap', 'priority', 'lastCampaign', 'intervention', 'actions'];

  filterForm: FormGroup;
  
  vaccines: string[] = [
    'BCG',
    'OPV',
    'DTP',
    'Measles',
    'Hepatitis B',
    'Polio',
    'Rotavirus',
    'Pneumococcal',
    'HPV',
    'Yellow Fever'
  ];

  ageGroups: string[] = [
    '0-1 months',
    '2-5 months',
    '6-11 months',
    '12-23 months',
    '2-5 years',
    '6-12 years',
    '13-18 years'
  ];

  districts: string[] = ['DIST001', 'DIST002', 'DIST003', 'DIST004', 'DIST005'];
  facilities: string[] = ['FAC001', 'FAC002', 'FAC003', 'FAC004', 'FAC005'];

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  showDetailDialog = false;
  selectedGap: CoverageGap | null = null;

  showInterventionDialog = false;
  interventionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      vaccineName: [''],
      ageGroup: [''],
      districtId: [''],
      facilityId: [''],
      priority: [''],
      interventionStatus: [''],
      coverageRateMin: [''],
      coverageRateMax: ['']
    });

    this.interventionForm = this.fb.group({
      interventionType: [''],
      startDate: [''],
      endDate: [''],
      budget: [''],
      expectedCoverage: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.generateMockData();
    this.calculateStats();
    this.generateGeographicCoverage();
    this.generateVaccineCoverage();
    this.generateInterventionPlans();
    this.applyFilters();
    this.loadFromLocalStorage();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  generateMockData(): void {
    const priorities: ('Critical' | 'High' | 'Medium' | 'Low')[] = ['Critical', 'High', 'Medium', 'Low'];
    const interventionStatuses: ('Planned' | 'Ongoing' | 'Completed' | 'Not Started')[] = ['Planned', 'Ongoing', 'Completed', 'Not Started'];
    
    this.coverageGaps = [];
    let id = 1;

    for (let i = 0; i < 50; i++) {
      const facilityIndex = Math.floor(Math.random() * this.facilities.length);
      const vaccineIndex = Math.floor(Math.random() * this.vaccines.length);
      const ageGroupIndex = Math.floor(Math.random() * this.ageGroups.length);
      const districtIndex = Math.floor(Math.random() * this.districts.length);

      const targetPopulation = Math.floor(Math.random() * 900) + 100; // 100-1000
      const coverageRate = Math.random() * 100; // 0-100%
      const vaccinated = Math.floor((targetPopulation * coverageRate) / 100);
      const unvaccinated = targetPopulation - vaccinated;
      const gapPercentage = 100 - coverageRate;

      let priority: 'Critical' | 'High' | 'Medium' | 'Low';
      if (coverageRate < 50) {
        priority = 'Critical';
      } else if (coverageRate < 70) {
        priority = 'High';
      } else if (coverageRate < 85) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      const hasLastCampaign = Math.random() > 0.3;
      const daysSinceLastCampaign = hasLastCampaign ? Math.floor(Math.random() * 180) + 1 : null;
      const lastCampaignDate = hasLastCampaign && daysSinceLastCampaign ? this.subtractDays(new Date(), daysSinceLastCampaign) : null;

      const interventionStatus = interventionStatuses[Math.floor(Math.random() * interventionStatuses.length)];

      const recommendations: string[] = [];
      if (coverageRate < 70) {
        recommendations.push('Conduct targeted outreach campaign');
        recommendations.push('Increase community awareness programs');
      }
      if (!hasLastCampaign || (daysSinceLastCampaign && daysSinceLastCampaign > 90)) {
        recommendations.push('Schedule new vaccination campaign');
      }
      if (gapPercentage > 30) {
        recommendations.push('Deploy mobile vaccination teams');
        recommendations.push('Establish temporary vaccination posts');
      }
      if (coverageRate < 50) {
        recommendations.push('Conduct house-to-house vaccination');
        recommendations.push('Engage community leaders and health promoters');
      }

      this.coverageGaps.push({
        id: id++,
        facilityId: this.facilities[facilityIndex],
        facilityName: `Health Center ${this.facilities[facilityIndex]}`,
        districtId: this.districts[districtIndex],
        districtName: `District ${this.districts[districtIndex]}`,
        vaccineName: this.vaccines[vaccineIndex],
        ageGroup: this.ageGroups[ageGroupIndex],
        targetPopulation,
        vaccinated,
        unvaccinated,
        coverageRate: Math.round(coverageRate * 10) / 10,
        gapPercentage: Math.round(gapPercentage * 10) / 10,
        priority,
        lastCampaignDate,
        daysSinceLastCampaign,
        interventionStatus,
        recommendations
      });
    }

    this.coverageGaps.sort((a, b) => {
      const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  calculateStats(): void {
    const uniqueFacilities = new Set(this.coverageGaps.map(g => g.facilityId)).size;
    const facilitiesWithGaps = new Set(
      this.coverageGaps.filter(g => g.gapPercentage > 15).map(g => g.facilityId)
    ).size;

    const totalCoverage = this.coverageGaps.reduce((sum, g) => sum + g.coverageRate, 0);
    const averageCoverage = this.coverageGaps.length > 0 ? totalCoverage / this.coverageGaps.length : 0;

    this.coverageStats = {
      totalFacilities: uniqueFacilities,
      facilitiesWithGaps,
      averageCoverageRate: Math.round(averageCoverage * 10) / 10,
      criticalGaps: this.coverageGaps.filter(g => g.priority === 'Critical').length,
      highPriorityGaps: this.coverageGaps.filter(g => g.priority === 'High').length,
      mediumPriorityGaps: this.coverageGaps.filter(g => g.priority === 'Medium').length,
      lowPriorityGaps: this.coverageGaps.filter(g => g.priority === 'Low').length,
      totalTargetPopulation: this.coverageGaps.reduce((sum, g) => sum + g.targetPopulation, 0),
      totalVaccinated: this.coverageGaps.reduce((sum, g) => sum + g.vaccinated, 0),
      totalUnvaccinated: this.coverageGaps.reduce((sum, g) => sum + g.unvaccinated, 0)
    };
  }

  generateGeographicCoverage(): void {
    const districtMap = new Map<string, GeographicCoverage>();

    this.coverageGaps.forEach(gap => {
      if (!districtMap.has(gap.districtId)) {
        districtMap.set(gap.districtId, {
          districtId: gap.districtId,
          districtName: gap.districtName,
          facilities: 0,
          targetPopulation: 0,
          vaccinated: 0,
          coverageRate: 0,
          gapCount: 0,
          criticalGaps: 0,
          priority: 'Low'
        });
      }

      const district = districtMap.get(gap.districtId)!;
      district.targetPopulation += gap.targetPopulation;
      district.vaccinated += gap.vaccinated;
      district.gapCount++;
      if (gap.priority === 'Critical') {
        district.criticalGaps++;
      }
    });

    this.geographicCoverage = Array.from(districtMap.values()).map(district => {
      const facilities = new Set(
        this.coverageGaps.filter(g => g.districtId === district.districtId).map(g => g.facilityId)
      ).size;
      
      const coverageRate = district.targetPopulation > 0 
        ? (district.vaccinated / district.targetPopulation) * 100 
        : 0;

      let priority: 'Critical' | 'High' | 'Medium' | 'Low';
      if (coverageRate < 50 || district.criticalGaps > 5) {
        priority = 'Critical';
      } else if (coverageRate < 70 || district.criticalGaps > 2) {
        priority = 'High';
      } else if (coverageRate < 85) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      return {
        ...district,
        facilities,
        coverageRate: Math.round(coverageRate * 10) / 10,
        priority
      };
    });

    this.geographicCoverage.sort((a, b) => a.coverageRate - b.coverageRate);
  }

  generateVaccineCoverage(): void {
    const vaccineMap = new Map<string, VaccineCoverage>();

    this.coverageGaps.forEach(gap => {
      if (!vaccineMap.has(gap.vaccineName)) {
        vaccineMap.set(gap.vaccineName, {
          vaccineName: gap.vaccineName,
          targetPopulation: 0,
          vaccinated: 0,
          coverageRate: 0,
          gapPercentage: 0,
          facilitiesAffected: 0,
          trend: 'Stable',
          recommendations: []
        });
      }

      const vaccine = vaccineMap.get(gap.vaccineName)!;
      vaccine.targetPopulation += gap.targetPopulation;
      vaccine.vaccinated += gap.vaccinated;
    });

    this.vaccineCoverage = Array.from(vaccineMap.values()).map(vaccine => {
      const coverageRate = vaccine.targetPopulation > 0 
        ? (vaccine.vaccinated / vaccine.targetPopulation) * 100 
        : 0;
      const gapPercentage = 100 - coverageRate;

      const facilitiesAffected = new Set(
        this.coverageGaps.filter(g => g.vaccineName === vaccine.vaccineName).map(g => g.facilityId)
      ).size;

      // Simulate trend (in real app, would compare with historical data)
      const trendValue = Math.random();
      let trend: 'Improving' | 'Stable' | 'Declining';
      if (trendValue < 0.3) {
        trend = 'Declining';
      } else if (trendValue < 0.7) {
        trend = 'Stable';
      } else {
        trend = 'Improving';
      }

      const recommendations: string[] = [];
      if (coverageRate < 70) {
        recommendations.push(`Launch ${vaccine.vaccineName} catch-up campaign`);
        recommendations.push('Increase vaccine availability and accessibility');
      }
      if (trend === 'Declining') {
        recommendations.push('Investigate reasons for declining coverage');
        recommendations.push('Strengthen routine immunization services');
      }
      if (gapPercentage > 30) {
        recommendations.push('Implement mass vaccination drive');
        recommendations.push('Enhance cold chain capacity');
      }

      return {
        ...vaccine,
        coverageRate: Math.round(coverageRate * 10) / 10,
        gapPercentage: Math.round(gapPercentage * 10) / 10,
        facilitiesAffected,
        trend,
        recommendations
      };
    });

    this.vaccineCoverage.sort((a, b) => a.coverageRate - b.coverageRate);
  }

  generateInterventionPlans(): void {
    this.interventionPlans = [];
    let id = 1;

    const interventionTypes = [
      'Outreach Campaign',
      'Mobile Vaccination Team',
      'Community Awareness Program',
      'House-to-House Vaccination',
      'School-based Campaign',
      'Market Day Vaccination'
    ];

    const criticalGaps = this.coverageGaps.filter(g => g.priority === 'Critical' || g.priority === 'High').slice(0, 10);

    criticalGaps.forEach(gap => {
      const interventionType = interventionTypes[Math.floor(Math.random() * interventionTypes.length)];
      const startDate = this.addDays(new Date(), Math.floor(Math.random() * 30) + 1);
      const endDate = this.addDays(startDate, Math.floor(Math.random() * 20) + 10);
      const budget = Math.floor(Math.random() * 50000) + 10000;
      const expectedCoverage = Math.min(gap.coverageRate + 15 + Math.random() * 15, 95);
      
      const statuses: ('Planned' | 'Ongoing' | 'Completed')[] = ['Planned', 'Ongoing', 'Completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const actualCoverage = status === 'Completed' 
        ? Math.min(gap.coverageRate + 10 + Math.random() * 20, 95)
        : null;

      this.interventionPlans.push({
        id: id++,
        gapId: gap.id,
        facilityName: gap.facilityName,
        vaccineName: gap.vaccineName,
        ageGroup: gap.ageGroup,
        targetPopulation: gap.unvaccinated,
        interventionType,
        startDate,
        endDate,
        budget,
        status,
        expectedCoverage: Math.round(expectedCoverage * 10) / 10,
        actualCoverage: actualCoverage ? Math.round(actualCoverage * 10) / 10 : null,
        notes: `${interventionType} targeting ${gap.unvaccinated} unvaccinated children`
      });
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredGaps = this.coverageGaps.filter(gap => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          gap.facilityName.toLowerCase().includes(searchLower) ||
          gap.districtName.toLowerCase().includes(searchLower) ||
          gap.vaccineName.toLowerCase().includes(searchLower) ||
          gap.ageGroup.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.vaccineName && gap.vaccineName !== filters.vaccineName) return false;
      if (filters.ageGroup && gap.ageGroup !== filters.ageGroup) return false;
      if (filters.districtId && gap.districtId !== filters.districtId) return false;
      if (filters.facilityId && gap.facilityId !== filters.facilityId) return false;
      if (filters.priority && gap.priority !== filters.priority) return false;
      if (filters.interventionStatus && gap.interventionStatus !== filters.interventionStatus) return false;
      
      if (filters.coverageRateMin && gap.coverageRate < parseFloat(filters.coverageRateMin)) return false;
      if (filters.coverageRateMax && gap.coverageRate > parseFloat(filters.coverageRateMax)) return false;

      return true;
    });

    this.pageIndex = 0;
    this.saveToLocalStorage();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  getPaginatedGaps(): CoverageGap[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredGaps.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  viewGapDetails(gap: CoverageGap): void {
    this.selectedGap = gap;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedGap = null;
  }

  planIntervention(gap: CoverageGap): void {
    this.selectedGap = gap;
    this.interventionForm.reset();
    this.showInterventionDialog = true;
  }

  closeInterventionDialog(): void {
    this.showInterventionDialog = false;
    this.selectedGap = null;
    this.interventionForm.reset();
  }

  submitIntervention(): void {
    if (this.interventionForm.valid && this.selectedGap) {
      this.loaderService.show();
      
      setTimeout(() => {
        this.notificationService.success('Intervention plan created successfully');
        this.closeInterventionDialog();
      }, 1000);
    }
  }

  exportGaps(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();

    setTimeout(() => {
      const data = this.filteredGaps.map(gap => ({
        'Facility': gap.facilityName,
        'District': gap.districtName,
        'Vaccine': gap.vaccineName,
        'Age Group': gap.ageGroup,
        'Target Population': gap.targetPopulation,
        'Vaccinated': gap.vaccinated,
        'Unvaccinated': gap.unvaccinated,
        'Coverage Rate': `${gap.coverageRate}%`,
        'Gap Percentage': `${gap.gapPercentage}%`,
        'Priority': gap.priority,
        'Intervention Status': gap.interventionStatus
      }));

      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, 'coverage-gaps.csv', 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'coverage-gaps.json', 'application/json');
      } else if (format === 'pdf') {
        this.notificationService.info('PDF export functionality would be implemented here');
      }

      this.notificationService.success(`Coverage gaps exported as ${format.toUpperCase()}`);
    }, 1000);
  }

  generateCoverageReport(): void {
    this.loaderService.show();

    setTimeout(() => {
      this.notificationService.success('Coverage gap analysis report generated successfully');
    }, 2000);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]?.toString() || '';
        return `"${value.replace(/"/g, '""')}"`;
      }).join(','))
    ];

    return csvRows.join('\n');
  }

  private downloadFile(content: string, fileName: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getPriorityColor(priority: string): 'primary' | 'accent' | 'warn' {
    switch (priority) {
      case 'Critical': return 'warn';
      case 'High': return 'warn';
      case 'Medium': return 'accent';
      case 'Low': return 'primary';
      default: return 'primary';
    }
  }

  getInterventionStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Completed': return 'primary';
      case 'Ongoing': return 'accent';
      case 'Planned': return 'accent';
      case 'Not Started': return 'warn';
      default: return 'primary';
    }
  }

  getTrendColor(trend: string): 'primary' | 'accent' | 'warn' {
    switch (trend) {
      case 'Improving': return 'primary';
      case 'Stable': return 'accent';
      case 'Declining': return 'warn';
      default: return 'accent';
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private saveToLocalStorage(): void {
    const data = {
      coverageGaps: this.coverageGaps,
      coverageStats: this.coverageStats,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('coverageGapData', JSON.stringify(data));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('coverageGapData');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.coverageGaps) {
        this.coverageGaps = data.coverageGaps.map((gap: any) => ({
          ...gap,
          lastCampaignDate: gap.lastCampaignDate ? new Date(gap.lastCampaignDate) : null
        }));
        this.calculateStats();
        this.applyFilters();
      }
    }
  }
}
