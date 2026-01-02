import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-district-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent, BaseChartDirective],
  templateUrl: './district-dashboard.component.html',
  styleUrl: './district-dashboard.component.scss'
})
export class DistrictDashboardComponent implements OnInit {
  @ViewChild('coverageChart') coverageChart?: BaseChartDirective;
  @ViewChild('volumeChart') volumeChart?: BaseChartDirective;

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
      // Load facilities for the district
      if (districtId) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:230',message:'Loading facilities by district',data:{districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        this.facilityService.getFacilitiesByDistrict(districtId).subscribe({
          next: (facilities) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:234',message:'Facilities loaded by district',data:{districtId,facilitiesCount:facilities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            // Update total facilities count for district (keep national stats as fallback)
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
              status: 'good'
            }));
            facilitiesLoaded = true;
            
            // Load detailed stats for each facility
            this.loadFacilityDetails(() => {
              facilityDetailsLoaded = true;
              checkComplete();
            });
          },
          error: (error) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:252',message:'Failed to load facilities by district',data:{districtId,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            console.error('Failed to load facilities by district:', error);
            this.errorMessage = 'Failed to load district facilities. Using national statistics.';
            // Don't fallback to all facilities to avoid 404 - just use national stats
            facilitiesLoaded = true;
            facilityDetailsLoaded = true;
            checkComplete();
          }
        });
      } else {
        // No district ID available - skip loading facilities, use national stats only
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-dashboard.component.ts:312',message:'No districtId available, using national stats',data:{hasFacilityId:!!facilityId,userFacilityId:facilityId,userDistrictId:user?.districtId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        console.warn('No districtId available for user, using national statistics only');
        
        // Show informational message to user (not an error)
        if (!facilityId) {
          this.infoMessage = 'Your account is not assigned to a district or facility. Displaying national statistics. Please contact your administrator to assign you to a district.';
        } else {
          this.infoMessage = 'Your facility is not assigned to a district. Displaying national statistics. Please contact your administrator to update your facility\'s district assignment.';
        }
        
        facilitiesLoaded = true;
        facilityDetailsLoaded = true;
        // Still try to load trend data
        this.loadTrendData();
        checkComplete();
      }
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
}
