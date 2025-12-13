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
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

export interface GeographicLocation {
  id: string;
  type: 'National' | 'Region' | 'District' | 'Facility';
  name: string;
  parentId?: string;
  parentName?: string;
  code: string;
  level: number;
  population: number;
  targetPopulation: number;
  facilities: number;
  healthWorkers: number;
  vaccinesAdministered: number;
  coverageRate: number;
  performanceScore: number;
  rank: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  latitude?: number;
  longitude?: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  lastUpdated: Date;
}

export interface DistributionStats {
  totalLocations: number;
  totalFacilities: number;
  totalPopulation: number;
  averageCoverage: number;
  excellentLocations: number;
  goodLocations: number;
  fairLocations: number;
  poorLocations: number;
  topPerformer: string;
  lowestPerformer: string;
}

export interface RegionalComparison {
  regionName: string;
  coverage: number;
  population: number;
  facilities: number;
  vaccinations: number;
  performanceScore: number;
  rank: number;
}

export interface DistrictPerformance {
  districtName: string;
  regionName: string;
  coverage: number;
  facilities: number;
  population: number;
  performanceScore: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface FacilityMetrics {
  facilityName: string;
  districtName: string;
  regionName: string;
  coverage: number;
  population: number;
  healthWorkers: number;
  vaccinations: number;
  performanceScore: number;
}

@Component({
  selector: 'app-geographic-distribution',
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
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './geographic-distribution.component.html',
  styleUrl: './geographic-distribution.component.scss'
})
export class GeographicDistributionComponent implements OnInit {
  locations: GeographicLocation[] = [];
  filteredLocations: GeographicLocation[] = [];
  stats: DistributionStats = this.initializeStats();
  regionalComparison: RegionalComparison[] = [];
  districtPerformance: DistrictPerformance[] = [];
  facilityMetrics: FacilityMetrics[] = [];
  
  filterForm: FormGroup;
  displayedColumns: string[] = ['name', 'type', 'population', 'facilities', 'coverage', 'performance', 'status', 'actions'];
  
  levels: string[] = ['All', 'National', 'Region', 'District', 'Facility'];
  statuses: string[] = ['All', 'Excellent', 'Good', 'Fair', 'Poor'];
  trends: string[] = ['All', 'Increasing', 'Stable', 'Decreasing'];
  regions: string[] = ['Central', 'Eastern', 'Northern', 'Southern', 'Western'];
  
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  
  selectedLocation: GeographicLocation | null = null;
  showDetailDialog = false;
  selectedView: 'hierarchy' | 'comparison' | 'performance' = 'hierarchy';

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      level: ['All'],
      status: ['All'],
      trend: ['All'],
      region: ['All'],
      minCoverage: [''],
      maxCoverage: ['']
    });
  }

  ngOnInit(): void {
    this.generateMockData();
    this.calculateStats();
    this.analyzeRegionalComparison();
    this.analyzeDistrictPerformance();
    this.analyzeFacilityMetrics();
    this.applyFilters();
    this.loadFromLocalStorage();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private initializeStats(): DistributionStats {
    return {
      totalLocations: 0,
      totalFacilities: 0,
      totalPopulation: 0,
      averageCoverage: 0,
      excellentLocations: 0,
      goodLocations: 0,
      fairLocations: 0,
      poorLocations: 0,
      topPerformer: '',
      lowestPerformer: ''
    };
  }

  private generateMockData(): void {
    const locations: GeographicLocation[] = [];
    let id = 1;

    // National level
    locations.push({
      id: `NAT-${id++}`,
      type: 'National',
      name: 'Kenya National Immunization Program',
      code: 'KE-NAT-001',
      level: 0,
      population: 52000000,
      targetPopulation: 5200000,
      facilities: 250,
      healthWorkers: 1250,
      vaccinesAdministered: 4680000,
      coverageRate: 90.0,
      performanceScore: 92.5,
      rank: 1,
      trend: 'increasing',
      status: 'Excellent',
      lastUpdated: new Date(2024, 11, 10)
    });

    // Regional level (5 regions)
    this.regions.forEach((region, index) => {
      const coverage = 75 + Math.random() * 20;
      const population = 8000000 + Math.random() * 4000000;
      const targetPop = population * 0.1;
      const vaccinated = Math.floor(targetPop * (coverage / 100));
      
      locations.push({
        id: `REG-${id++}`,
        type: 'Region',
        name: `${region} Region`,
        parentId: 'NAT-1',
        parentName: 'Kenya National',
        code: `KE-${region.substring(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
        level: 1,
        population: Math.floor(population),
        targetPopulation: Math.floor(targetPop),
        facilities: 40 + Math.floor(Math.random() * 20),
        healthWorkers: 200 + Math.floor(Math.random() * 100),
        vaccinesAdministered: vaccinated,
        coverageRate: parseFloat(coverage.toFixed(1)),
        performanceScore: parseFloat((coverage + Math.random() * 10 - 5).toFixed(1)),
        rank: index + 2,
        trend: coverage > 85 ? 'increasing' : coverage > 75 ? 'stable' : 'decreasing',
        status: coverage >= 90 ? 'Excellent' : coverage >= 80 ? 'Good' : coverage >= 70 ? 'Fair' : 'Poor',
        lastUpdated: new Date(2024, 11, 9 - index)
      });
    });

    // District level (3 districts per region = 15 districts)
    this.regions.forEach((region, regIndex) => {
      for (let d = 0; d < 3; d++) {
        const coverage = 70 + Math.random() * 25;
        const population = 1500000 + Math.random() * 1000000;
        const targetPop = population * 0.1;
        const vaccinated = Math.floor(targetPop * (coverage / 100));
        
        locations.push({
          id: `DIST-${id++}`,
          type: 'District',
          name: `${region} District ${d + 1}`,
          parentId: `REG-${regIndex + 2}`,
          parentName: `${region} Region`,
          code: `KE-${region.substring(0, 3).toUpperCase()}-D${d + 1}`,
          level: 2,
          population: Math.floor(population),
          targetPopulation: Math.floor(targetPop),
          facilities: 10 + Math.floor(Math.random() * 10),
          healthWorkers: 50 + Math.floor(Math.random() * 50),
          vaccinesAdministered: vaccinated,
          coverageRate: parseFloat(coverage.toFixed(1)),
          performanceScore: parseFloat((coverage + Math.random() * 8 - 4).toFixed(1)),
          rank: regIndex * 3 + d + 7,
          trend: coverage > 85 ? 'increasing' : coverage > 72 ? 'stable' : 'decreasing',
          status: coverage >= 90 ? 'Excellent' : coverage >= 80 ? 'Good' : coverage >= 70 ? 'Fair' : 'Poor',
          lastUpdated: new Date(2024, 11, 8 - (regIndex + d))
        });
      }
    });

    // Facility level (2 facilities per district = 30 facilities)
    let districtIndex = 0;
    this.regions.forEach((region, regIndex) => {
      for (let d = 0; d < 3; d++) {
        for (let f = 0; f < 2; f++) {
          const coverage = 65 + Math.random() * 30;
          const population = 50000 + Math.random() * 150000;
          const targetPop = population * 0.1;
          const vaccinated = Math.floor(targetPop * (coverage / 100));
          
          locations.push({
            id: `FAC-${id++}`,
            type: 'Facility',
            name: `${region} HC ${d + 1}-${f + 1}`,
            parentId: `DIST-${districtIndex + 7}`,
            parentName: `${region} District ${d + 1}`,
            code: `KE-${region.substring(0, 3).toUpperCase()}-F${d + 1}${f + 1}`,
            level: 3,
            population: Math.floor(population),
            targetPopulation: Math.floor(targetPop),
            facilities: 1,
            healthWorkers: 5 + Math.floor(Math.random() * 10),
            vaccinesAdministered: vaccinated,
            coverageRate: parseFloat(coverage.toFixed(1)),
            performanceScore: parseFloat((coverage + Math.random() * 10 - 5).toFixed(1)),
            rank: districtIndex * 2 + f + 22,
            trend: coverage > 85 ? 'increasing' : coverage > 70 ? 'stable' : 'decreasing',
            latitude: -1.286389 + Math.random() * 8,
            longitude: 36.817223 + Math.random() * 8,
            status: coverage >= 90 ? 'Excellent' : coverage >= 80 ? 'Good' : coverage >= 70 ? 'Fair' : 'Poor',
            lastUpdated: new Date(2024, 11, 7 - f)
          });
        }
        districtIndex++;
      }
    });

    // Sort by rank
    this.locations = locations.sort((a, b) => a.rank - b.rank);
    this.saveToLocalStorage();
  }

  private calculateStats(): void {
    if (this.filteredLocations.length === 0) {
      this.stats = this.initializeStats();
      return;
    }

    const facilities = this.locations.filter(l => l.type === 'Facility');
    const totalPopulation = this.locations
      .filter(l => l.type === 'Region')
      .reduce((sum, l) => sum + l.population, 0);
    
    const coverages = this.filteredLocations.map(l => l.coverageRate);
    const avgCoverage = coverages.reduce((sum, c) => sum + c, 0) / coverages.length;

    const statusCounts = {
      Excellent: this.filteredLocations.filter(l => l.status === 'Excellent').length,
      Good: this.filteredLocations.filter(l => l.status === 'Good').length,
      Fair: this.filteredLocations.filter(l => l.status === 'Fair').length,
      Poor: this.filteredLocations.filter(l => l.status === 'Poor').length
    };

    const sortedByPerformance = [...this.filteredLocations].sort((a, b) => b.performanceScore - a.performanceScore);

    this.stats = {
      totalLocations: this.filteredLocations.length,
      totalFacilities: facilities.length,
      totalPopulation: totalPopulation,
      averageCoverage: parseFloat(avgCoverage.toFixed(1)),
      excellentLocations: statusCounts.Excellent,
      goodLocations: statusCounts.Good,
      fairLocations: statusCounts.Fair,
      poorLocations: statusCounts.Poor,
      topPerformer: sortedByPerformance[0]?.name || 'N/A',
      lowestPerformer: sortedByPerformance[sortedByPerformance.length - 1]?.name || 'N/A'
    };
  }

  private analyzeRegionalComparison(): void {
    const regions = this.locations.filter(l => l.type === 'Region');
    
    this.regionalComparison = regions.map(region => ({
      regionName: region.name,
      coverage: region.coverageRate,
      population: region.population,
      facilities: region.facilities,
      vaccinations: region.vaccinesAdministered,
      performanceScore: region.performanceScore,
      rank: region.rank
    })).sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private analyzeDistrictPerformance(): void {
    const districts = this.locations.filter(l => l.type === 'District');
    
    this.districtPerformance = districts.map(district => ({
      districtName: district.name,
      regionName: district.parentName || '',
      coverage: district.coverageRate,
      facilities: district.facilities,
      population: district.population,
      performanceScore: district.performanceScore,
      status: district.status
    })).sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private analyzeFacilityMetrics(): void {
    const facilities = this.locations.filter(l => l.type === 'Facility');
    
    this.facilityMetrics = facilities.map(facility => {
      const district = this.locations.find(l => l.id === facility.parentId);
      const region = district ? this.locations.find(l => l.id === district.parentId) : undefined;
      
      return {
        facilityName: facility.name,
        districtName: district?.name || '',
        regionName: region?.name || '',
        coverage: facility.coverageRate,
        population: facility.population,
        healthWorkers: facility.healthWorkers,
        vaccinations: facility.vaccinesAdministered,
        performanceScore: facility.performanceScore
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredLocations = this.locations.filter(location => {
      const matchesSearch = !filters.search || 
        location.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        location.code.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesLevel = filters.level === 'All' || location.type === filters.level;
      const matchesStatus = filters.status === 'All' || location.status === filters.status;
      const matchesTrend = filters.trend === 'All' || 
        location.trend.toLowerCase() === filters.trend.toLowerCase();
      
      const matchesRegion = filters.region === 'All' || 
        location.name.includes(filters.region) ||
        location.parentName?.includes(filters.region);
      
      const matchesMinCoverage = !filters.minCoverage || 
        location.coverageRate >= parseFloat(filters.minCoverage);
      
      const matchesMaxCoverage = !filters.maxCoverage || 
        location.coverageRate <= parseFloat(filters.maxCoverage);
      
      return matchesSearch && matchesLevel && matchesStatus && matchesTrend && 
             matchesRegion && matchesMinCoverage && matchesMaxCoverage;
    });

    this.calculateStats();
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      level: 'All',
      status: 'All',
      trend: 'All',
      region: 'All',
      minCoverage: '',
      maxCoverage: ''
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedLocations(): GeographicLocation[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredLocations.slice(startIndex, startIndex + this.pageSize);
  }

  viewLocationDetails(location: GeographicLocation): void {
    this.selectedLocation = location;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedLocation = null;
  }

  changeView(view: 'hierarchy' | 'comparison' | 'performance'): void {
    this.selectedView = view;
  }

  exportData(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();

    setTimeout(() => {
      const data = this.filteredLocations.map(loc => ({
        'Location Name': loc.name,
        'Type': loc.type,
        'Code': loc.code,
        'Parent': loc.parentName || 'N/A',
        'Population': loc.population,
        'Target Population': loc.targetPopulation,
        'Facilities': loc.facilities,
        'Health Workers': loc.healthWorkers,
        'Vaccinations': loc.vaccinesAdministered,
        'Coverage Rate': `${loc.coverageRate}%`,
        'Performance Score': loc.performanceScore,
        'Status': loc.status,
        'Trend': loc.trend,
        'Rank': loc.rank
      }));

      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, 'geographic-distribution.csv', 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'geographic-distribution.json', 'application/json');
      } else if (format === 'pdf') {
        this.notificationService.info('PDF export functionality would be implemented here');
      }

      this.notificationService.success(`Geographic data exported as ${format.toUpperCase()}`);
    }, 1000);
  }

  generateReport(): void {
    this.loaderService.show();

    setTimeout(() => {
      this.notificationService.success('Geographic distribution report generated successfully');
    }, 2000);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]?.toString() || '';
        return `"${value.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Excellent': 'primary',
      'Good': 'accent',
      'Fair': 'warn',
      'Poor': 'warn'
    };
    return colors[status] || 'primary';
  }

  getTrendIcon(trend: string): string {
    const icons: { [key: string]: string } = {
      'increasing': 'trending_up',
      'stable': 'trending_flat',
      'decreasing': 'trending_down'
    };
    return icons[trend] || 'trending_flat';
  }

  getTrendColor(trend: string): string {
    const colors: { [key: string]: string } = {
      'increasing': '#4caf50',
      'stable': '#ff9800',
      'decreasing': '#f44336'
    };
    return colors[trend] || '#ff9800';
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'National': 'public',
      'Region': 'location_city',
      'District': 'domain',
      'Facility': 'local_hospital'
    };
    return icons[type] || 'place';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatPercentage(num: number): string {
    return num.toFixed(1) + '%';
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('geographic-locations', JSON.stringify(this.locations));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('geographic-locations');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.locations = parsed.map((loc: any) => ({
          ...loc,
          lastUpdated: new Date(loc.lastUpdated)
        }));
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }
}
