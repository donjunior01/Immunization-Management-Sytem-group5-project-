import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { environment } from '../../../../environments/environment';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { ReportService } from '../../../core/services/report.service';
import { FacilityService } from '../../../core/services/facility.service';
import { AuthService } from '../../../core/services/auth.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { StockService } from '../../../core/services/stock.service';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

declare var L: any; // Leaflet

@Component({
  selector: 'app-district-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent, BaseChartDirective],
  templateUrl: './district-dashboard.component.html',
  styleUrl: './district-dashboard.component.scss'
})
export class DistrictDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('coverageChart') coverageChart?: BaseChartDirective;
  @ViewChild('volumeChart') volumeChart?: BaseChartDirective;

  private map: any = null;
  private mapMarkers: any[] = [];

  // Helper getters to ensure type safety
  get hasCoverageChartData(): boolean {
    return !!(this.coverageChartData?.labels && this.coverageChartData.labels.length > 0);
  }

  get hasVolumeChartData(): boolean {
    return !!(this.volumeChartData?.labels && this.volumeChartData.labels.length > 0);
  }

  loading = false;
  errorMessage = '';
  infoMessage = ''; // For informational messages (not errors)
  
  // District Summary - loaded from backend
  totalFacilities = 0;
  vaccinationsThisMonth = 0;
  districtCoverage = 0;
  facilitiesLowStock = 0;
  criticalAlerts = 0;
  
  // Facility Performance - loaded from backend
  facilities: any[] = [];
  
  // Chart configurations
  public coverageChartType: ChartType = 'line';
  public coverageChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'District Coverage Trend (Last 6 Months)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };
  public coverageChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Coverage %',
      data: [],
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }, {
      label: 'Target (90%)',
      data: [],
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false
    }]
  };

  public volumeChartType: ChartType = 'bar';
  public volumeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Vaccination Volume'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  public volumeChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Vaccinations',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };

  private isLoadingData = false; // Prevent multiple simultaneous loads

  constructor(
    private cdr: ChangeDetectorRef,
    private reportService: ReportService,
    private facilityService: FacilityService,
    private authService: AuthService,
    private vaccinationService: VaccinationService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:133',message:'ngOnInit called',data:{hasCoverageChartData:!!this.coverageChartData,hasCoverageLabels:!!this.coverageChartData?.labels,coverageLabelsType:typeof this.coverageChartData?.labels,coverageLabelsLength:this.coverageChartData?.labels?.length,hasVolumeChartData:!!this.volumeChartData,hasVolumeLabels:!!this.volumeChartData?.labels,volumeLabelsType:typeof this.volumeChartData?.labels,volumeLabelsLength:this.volumeChartData?.labels?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();

    const user = this.authService.getCurrentUser();
    let districtId = user?.districtId;
    const facilityId = user?.facilityId;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:168',message:'loadDashboardData started',data:{hasUser:!!user,hasDistrictId:!!districtId,hasFacilityId:!!facilityId,userId:user?.id,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    // Track loading states
    let statsLoaded = false;
    let facilitiesLoaded = false;
    let facilityDetailsLoaded = false;
    let districtIdResolved = false;

    const checkComplete = () => {
      if (statsLoaded && facilitiesLoaded && facilityDetailsLoaded && districtIdResolved) {
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    };

    // If no districtId but user has facilityId, try to get districtId from facility
    const resolveDistrictId = (onResolved: () => void) => {
      if (districtId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:185',message:'DistrictId already available',data:{districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        districtIdResolved = true;
        onResolved();
        return;
      }

      if (facilityId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:192',message:'Attempting to get districtId from facility',data:{facilityId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        // Try to get districtId from user's facility
        this.facilityService.getFacilityById(facilityId).subscribe({
          next: (facility) => {
            // Check both districtId and district properties (backend may use either)
            const facilityDistrictId = (facility as any).districtId || facility.district;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:210',message:'Facility loaded for districtId resolution',data:{facilityId:facility?.id,facilityDistrictId,facilityDistrict:facility?.district,hasDistrictId:!!facilityDistrictId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            if (facilityDistrictId) {
              districtId = facilityDistrictId;
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:201',message:'DistrictId resolved from facility',data:{resolvedDistrictId:districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
              // #endregion
            }
            districtIdResolved = true;
            onResolved();
          },
          error: (error) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:225',message:'Failed to load facility for districtId',data:{facilityId,error:error?.message,errorStatus:error?.status,errorStatusText:error?.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            console.warn('Failed to load facility to get districtId:', error);
            // Handle specific error cases
            if (error?.status === 404) {
              console.warn(`Facility with ID ${facilityId} not found. User may have invalid facilityId.`);
            } else if (error?.status === 403) {
              console.warn(`Access denied to facility ${facilityId}. User may not have permission.`);
            }
            districtIdResolved = true;
            onResolved();
          }
        });
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:232',message:'No districtId or facilityId available',data:{hasUser:!!user,userFacilityId:user?.facilityId,userDistrictId:user?.districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        districtIdResolved = true;
        onResolved();
      }
    };

    // Load national/district statistics
    this.reportService.getNationalStatistics().subscribe({
      next: (stats) => {
        this.totalFacilities = stats.totalFacilities || 0;
        this.vaccinationsThisMonth = stats.totalVaccinationsAdministered || 0;
        this.districtCoverage = stats.coverageRate || 0;
        this.facilitiesLowStock = stats.lowStockAlerts || 0;
        this.criticalAlerts = stats.facilitiesWithAlerts || 0;
        statsLoaded = true;
        // Load trend data after stats are loaded
        this.loadTrendData();
        checkComplete();
      },
      error: (error) => {
        console.error('Failed to load district statistics:', error);
        this.errorMessage = 'Failed to load district statistics. Please try again.';
        statsLoaded = true;
        checkComplete();
      }
    });

    // Resolve districtId first (from user or facility), then load facilities
    resolveDistrictId(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:264',message:'DistrictId resolution complete',data:{resolvedDistrictId:districtId,hasDistrictId:!!districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      // District dashboard plays admin role - load ALL facilities
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:267',message:'Loading all facilities (admin role)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.facilityService.getAllFacilities(true).subscribe({
        next: (facilities) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:271',message:'All facilities loaded',data:{facilitiesCount:facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          // Update total facilities count
          if (facilities.length > 0) {
            this.totalFacilities = facilities.length;
          }
          this.facilities = facilities.map(f => ({
            id: f.id,
            name: f.name || f.id,
            coverage: 0,
            vaccinations: 0,
            stockStatus: 'good',
            lastSync: 'N/A',
            status: 'good',
            location: f.location || '',
            type: f.type || ''
          }));
          facilitiesLoaded = true;
          
          // Load detailed stats for each facility
          this.loadFacilityDetails(() => {
            facilityDetailsLoaded = true;
            // Update map markers after facilities are loaded
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:298',message:'Facilities loaded, checking map',data:{hasMap:!!this.map,facilitiesCount:this.facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            if (this.map) {
              this.updateMapMarkers();
            } else {
              // Map not initialized yet, try to initialize it
              setTimeout(() => {
                if (!this.map) {
                  this.initializeMap();
                }
                if (this.map) {
                  this.updateMapMarkers();
                }
              }, 600);
            }
            checkComplete();
          });
        },
        error: (error) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:290',message:'Failed to load all facilities',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error('Failed to load all facilities:', error);
          this.errorMessage = 'Failed to load facilities. Using national statistics.';
          facilitiesLoaded = true;
          facilityDetailsLoaded = true;
          checkComplete();
        }
      });
    });
  }

  private loadFacilityDetails(onComplete?: () => void): void {
    if (this.facilities.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    let loadedCount = 0;
    const totalFacilities = this.facilities.length;

    if (totalFacilities === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.facilities.forEach((facility, index) => {
      // Load dashboard stats for each facility
      this.reportService.getDashboardStats(facility.id).subscribe({
        next: (stats) => {
          facility.vaccinations = stats.vaccinationsThisMonth || 0;
          facility.coverage = stats.coverageRate || 0;
          
          // Determine stock status
          if (stats.expiringBatches > 0 || stats.availableBatches === 0) {
            facility.stockStatus = 'out';
            facility.status = 'error';
          } else if (stats.availableBatches < 3) {
            facility.stockStatus = 'low';
            facility.status = 'warning';
          } else {
            facility.stockStatus = 'good';
            facility.status = 'good';
          }

          loadedCount++;
          if (loadedCount === totalFacilities) {
            // Calculate district-specific vaccinations for the month from facilities
            const districtVaccinations = this.facilities.reduce((sum, f) => sum + (f.vaccinations || 0), 0);
            // Use district-specific count if available, otherwise keep national stats
            if (districtVaccinations > 0) {
              this.vaccinationsThisMonth = districtVaccinations;
            }
            
            // Calculate average district coverage from facilities
            const avgCoverage = this.facilities.length > 0
              ? this.facilities.reduce((sum, f) => sum + (f.coverage || 0), 0) / this.facilities.length
              : 0;
            if (avgCoverage > 0) {
              this.districtCoverage = Math.round(avgCoverage * 10) / 10;
            }
            
            // Sort facilities by coverage
            this.facilities.sort((a, b) => (b.coverage || 0) - (a.coverage || 0));
            
            // Update low stock count from facilities
            this.facilitiesLowStock = this.facilities.filter(f => f.stockStatus === 'low' || f.stockStatus === 'out').length;
            
            // Update map markers after facilities are loaded with coverage data
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:383',message:'Facilities loaded with coverage, updating map',data:{hasMap:!!this.map,facilitiesCount:this.facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            if (this.map) {
              setTimeout(() => this.updateMapMarkers(), 100);
            } else {
              // Map not initialized yet, try to initialize it
              setTimeout(() => {
                if (!this.map) {
                  this.initializeMap();
                }
                if (this.map) {
                  this.updateMapMarkers();
                }
              }, 600);
            }
            
            this.cdr.detectChanges();
            if (onComplete) onComplete();
          }
        },
        error: (error) => {
          console.warn(`Failed to load stats for facility ${facility.id}:`, error);
          loadedCount++;
          if (loadedCount === totalFacilities) {
            this.cdr.detectChanges();
            if (onComplete) onComplete();
          }
        }
      });

      // Load stock levels to determine status (non-blocking)
      this.stockService.getStockLevels(facility.id).subscribe({
        next: (levels) => {
          const lowStockItems = levels.filter(l => l.status === 'LOW' || l.status === 'CRITICAL').length;
          if (lowStockItems > 0) {
            facility.stockStatus = lowStockItems > 2 ? 'out' : 'low';
            facility.status = lowStockItems > 2 ? 'error' : 'warning';
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          // Ignore stock errors, use default
        }
      });
    });
  }

  getCoverageStatusClass(coverage: number): string {
    if (coverage >= 90) return 'status-good';
    if (coverage >= 80) return 'status-warning';
    return 'status-error';
  }

  getStockStatusIcon(status: string): string {
    switch (status) {
      case 'good': return '🟢';
      case 'low': return '🟡';
      case 'out': return '🔴';
      default: return '⚪';
    }
  }

  private loadTrendData(): void {
    const user = this.authService.getCurrentUser();
    const districtId = user?.districtId;
    
    // Use empty facilityId to get district/national trend data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Load coverage report to get trend data
    this.reportService.getCoverageReport('', startDateStr, endDate).subscribe({
      next: (report: any) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:358',message:'loadTrendData report received',data:{hasTrendData:!!report.trendData,trendDataIsArray:Array.isArray(report.trendData),trendDataLength:report.trendData?.length,hasCoverageChartDataBefore:!!this.coverageChartData,hasCoverageLabelsBefore:!!this.coverageChartData?.labels},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (report.trendData && Array.isArray(report.trendData) && report.trendData.length > 0) {
          // Update coverage trend chart
          const newLabels = report.trendData.map((t: any) => t.month || '');
          const newData = report.trendData.map((t: any) => t.coverage || 0);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:365',message:'Before coverageChartData assignment',data:{newLabelsLength:newLabels.length,newDataLength:newData.length,hasCoverageChartData:!!this.coverageChartData,hasCoverageLabels:!!this.coverageChartData?.labels},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          this.coverageChartData = {
            labels: newLabels,
            datasets: [{
              label: 'Coverage %',
              data: newData,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }, {
              label: 'Target (90%)',
              data: report.trendData.map(() => 90),
              borderColor: 'rgba(34, 197, 94, 1)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false
            }]
          };
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:385',message:'After coverageChartData assignment',data:{hasCoverageChartData:!!this.coverageChartData,hasCoverageLabels:!!this.coverageChartData?.labels,coverageLabelsType:typeof this.coverageChartData?.labels,coverageLabelsLength:this.coverageChartData?.labels?.length,coverageLabelsIsArray:Array.isArray(this.coverageChartData?.labels)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:405',message:'Coverage chart data updated',data:{labelsLength:this.coverageChartData?.labels?.length ?? 0,datasetsLength:this.coverageChartData?.datasets?.length ?? 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          // Trigger change detection - ng2-charts will automatically update when data changes
          this.cdr.detectChanges();
        }

        // Calculate vaccination volume from trend data (approximate)
        if (report.trendData && Array.isArray(report.trendData) && report.trendData.length > 0) {
          // Estimate vaccinations from coverage (assuming target population)
          const estimatedVaccinations = report.trendData.map((t: any) => {
            // Estimate: coverage * 1000 (assuming base target)
            return Math.round((t.coverage || 0) * 10);
          });
          const volumeLabels = report.trendData.map((t: any) => t.month || '');
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:400',message:'Before volumeChartData assignment',data:{volumeLabelsLength:volumeLabels.length,estimatedVaccinationsLength:estimatedVaccinations.length,hasVolumeChartData:!!this.volumeChartData,hasVolumeLabels:!!this.volumeChartData?.labels},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          this.volumeChartData = {
            labels: volumeLabels,
            datasets: [{
              label: 'Vaccinations',
              data: estimatedVaccinations,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2
            }]
          };
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:412',message:'After volumeChartData assignment',data:{hasVolumeChartData:!!this.volumeChartData,hasVolumeLabels:!!this.volumeChartData?.labels,volumeLabelsType:typeof this.volumeChartData?.labels,volumeLabelsLength:this.volumeChartData?.labels?.length,volumeLabelsIsArray:Array.isArray(this.volumeChartData?.labels)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:420',message:'Volume chart data updated',data:{labelsLength:this.volumeChartData?.labels?.length ?? 0,datasetsLength:this.volumeChartData?.datasets?.length ?? 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          // Trigger change detection - ng2-charts will automatically update when data changes
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.warn('Failed to load trend data:', error);
        // Charts will remain empty, which is fine
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize map after view is ready
    setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:525',message:'ngAfterViewInit - initializing map',data:{facilitiesCount:this.facilities.length,hasMap:!!this.map,leafletLoaded:typeof L !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      this.initializeMap();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapMarkers = [];
  }

  private initializeMap(): void {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:538',message:'initializeMap called',data:{leafletLoaded:typeof L !== 'undefined',facilitiesCount:this.facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:541',message:'Leaflet not loaded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('facility-map');
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:545',message:'Checking map container',data:{mapContainerExists:!!mapContainer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!mapContainer) {
      console.warn('Map container not found');
      return;
    }

    // Default center: Kenya (Nairobi)
    const defaultCenter: [number, number] = [-1.2921, 36.8219];
    
    // Initialize map
    this.map = L.map('facility-map', {
      center: defaultCenter,
      zoom: 6,
      zoomControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:567',message:'Map initialized',data:{facilitiesCount:this.facilities.length,willUpdateMarkers:this.facilities.length > 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Add markers when facilities are loaded
    if (this.facilities.length > 0) {
      this.updateMapMarkers();
    }
  }

  private updateMapMarkers(): void {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:573',message:'updateMapMarkers called',data:{hasMap:!!this.map,leafletLoaded:typeof L !== 'undefined',facilitiesCount:this.facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!this.map || typeof L === 'undefined') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:576',message:'updateMapMarkers early return',data:{hasMap:!!this.map,leafletLoaded:typeof L !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    // Clear existing markers
    this.mapMarkers.forEach(marker => marker.remove());
    this.mapMarkers = [];

    if (this.facilities.length === 0) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:582',message:'No facilities to display',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    // Generate coordinates for facilities (mock data - in production, use actual coordinates)
    const bounds: [number, number][] = [];
    
    this.facilities.forEach((facility, index) => {
      // Generate mock coordinates around Kenya
      // In production, these should come from the backend or geocoding service
      // Using a deterministic approach based on facility ID for consistency
      const hash = facility.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const lat = -1.2921 + ((hash % 100) / 100 - 0.5) * 2; // Kenya latitude range
      const lng = 36.8219 + (((hash * 7) % 100) / 100 - 0.5) * 2; // Kenya longitude range
      
      // Determine marker color based on coverage
      let markerColor = '#ef4444'; // Red for <80%
      if (facility.coverage >= 90) {
        markerColor = '#22c55e'; // Green for >=90%
      } else if (facility.coverage >= 80) {
        markerColor = '#f59e0b'; // Orange for 80-90%
      }

      // Create custom icon
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600;">${facility.name}</h4>
            <p style="margin: 4px 0; font-size: 0.875rem;"><strong>Coverage:</strong> ${facility.coverage}%</p>
            <p style="margin: 4px 0; font-size: 0.875rem;"><strong>Vaccinations:</strong> ${facility.vaccinations}</p>
            <p style="margin: 4px 0; font-size: 0.875rem;"><strong>Stock:</strong> ${facility.stockStatus}</p>
            ${facility.location ? `<p style="margin: 4px 0; font-size: 0.875rem;"><strong>Location:</strong> ${facility.location}</p>` : ''}
          </div>
        `);

      this.mapMarkers.push(marker);
      bounds.push([lat, lng]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:627',message:'Map markers added and bounds fitted',data:{markersCount:this.mapMarkers.length,boundsCount:bounds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:630',message:'No bounds to fit',data:{markersCount:this.mapMarkers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }
}
