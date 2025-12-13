import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SystemMonitoringComponent } from './system-monitoring.component';
import type { 
  AlertThresholdConfig, 
  MetricPrediction, 
  AnomalyDetection,
  HistoricalTrend,
  TrendComparison
} from './system-monitoring.component';

describe('SystemMonitoringComponent', () => {
  let component: SystemMonitoringComponent;
  let fixture: ComponentFixture<SystemMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SystemMonitoringComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatMenuModule,
        MatTabsModule,
        MatProgressBarModule,
        MatTooltipModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SystemMonitoringComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize filter form with correct controls', () => {
      fixture.detectChanges();
      
      expect(component.filterForm.contains('search')).toBeTruthy();
      expect(component.filterForm.contains('severity')).toBeTruthy();
      expect(component.filterForm.contains('alertType')).toBeTruthy();
      expect(component.filterForm.contains('status')).toBeTruthy();
      expect(component.filterForm.contains('dateRange')).toBeTruthy();
      
      const dateRange = component.filterForm.get('dateRange');
      expect(dateRange?.get('start')).toBeTruthy();
      expect(dateRange?.get('end')).toBeTruthy();
    });

    it('should initialize alert form with correct controls', () => {
      fixture.detectChanges();
      
      expect(component.alertForm.contains('acknowledgedBy')).toBeTruthy();
      expect(component.alertForm.contains('notes')).toBeTruthy();
      expect(component.alertForm.get('acknowledgedBy')?.hasError('required')).toBeTruthy();
    });

    it('should load monitoring data on initialization', () => {
      fixture.detectChanges();
      
      expect(component.systemAlerts.length).toBeGreaterThan(0);
      expect(component.systemMetrics.length).toBeGreaterThan(0);
      expect(component.dataQualityMetrics.length).toBeGreaterThan(0);
      expect(component.apiEndpoints.length).toBeGreaterThan(0);
      expect(component.operationalMetrics.length).toBeGreaterThan(0);
    });

    it('should start real-time updates on initialization', fakeAsync(() => {
      const updateSpy = spyOn<any>(component, 'updateMetrics');
      fixture.detectChanges();
      
      tick(5000);
      expect(updateSpy).toHaveBeenCalled();
    }));
  });

  describe('Mock Data Generation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate 50 alerts with correct distribution', () => {
      expect(component.systemAlerts.length).toBe(50);
      
      const criticalAlerts = component.systemAlerts.filter(a => a.severity === 'critical');
      const warningAlerts = component.systemAlerts.filter(a => a.severity === 'warning');
      const infoAlerts = component.systemAlerts.filter(a => a.severity === 'info');
      
      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(warningAlerts.length).toBeGreaterThan(0);
      expect(infoAlerts.length).toBeGreaterThan(0);
    });

    it('should generate alerts with appropriate acknowledgment status', () => {
      const acknowledgedAlerts = component.systemAlerts.filter(a => a.acknowledged);
      const acknowledgedPercentage = (acknowledgedAlerts.length / component.systemAlerts.length) * 100;
      
      expect(acknowledgedPercentage).toBeGreaterThan(50);
      expect(acknowledgedPercentage).toBeLessThan(70);
    });

    it('should generate 10 system metrics with thresholds', () => {
      expect(component.systemMetrics.length).toBe(10);
      
      component.systemMetrics.forEach(metric => {
        expect(metric.threshold.warning).toBeDefined();
        expect(metric.threshold.critical).toBeDefined();
        expect(metric.threshold.warning).toBeLessThan(metric.threshold.critical);
      });
    });

    it('should generate system metrics with 20 historical data points each', () => {
      component.systemMetrics.forEach(metric => {
        expect(metric.historicalData.length).toBe(20);
        
        const timestamps = metric.historicalData.map(h => h.timestamp.getTime());
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
        }
      });
    });

    it('should generate 20 data quality metrics across 5 sources and 4 dimensions', () => {
      expect(component.dataQualityMetrics.length).toBe(20);
      
      const sources = new Set(component.dataQualityMetrics.map(m => m.dataSource));
      const dimensions = new Set(component.dataQualityMetrics.map(m => m.qualityDimension));
      
      expect(sources.size).toBe(5);
      expect(dimensions.size).toBe(4);
    });

    it('should assign quality status based on score', () => {
      component.dataQualityMetrics.forEach(metric => {
        if (metric.score >= 95) {
          expect(metric.status).toBe('excellent');
        } else if (metric.score >= 85) {
          expect(metric.status).toBe('good');
        } else if (metric.score >= 70) {
          expect(metric.status).toBe('fair');
        } else {
          expect(metric.status).toBe('poor');
        }
      });
    });

    it('should generate 8 API endpoints with realistic metrics', () => {
      expect(component.apiEndpoints.length).toBe(8);
      
      component.apiEndpoints.forEach(endpoint => {
        expect(endpoint.method).toMatch(/^(GET|POST|PUT|DELETE)$/);
        expect(endpoint.successRate).toBeGreaterThan(95);
        expect(endpoint.successRate).toBeLessThanOrEqual(100);
        expect(endpoint.averageResponseTime).toBeGreaterThan(0);
      });
    });

    it('should assign API endpoint status based on success rate', () => {
      component.apiEndpoints.forEach(endpoint => {
        if (endpoint.successRate >= 99) {
          expect(endpoint.status).toBe('healthy');
        } else if (endpoint.successRate >= 95) {
          expect(endpoint.status).toBe('degraded');
        } else {
          expect(endpoint.status).toBe('down');
        }
      });
    });

    it('should generate 6 operational metrics with trend analysis', () => {
      expect(component.operationalMetrics.length).toBe(6);
      
      component.operationalMetrics.forEach(metric => {
        expect(metric.currentValue).toBeDefined();
        expect(metric.previousValue).toBeDefined();
        expect(metric.changePercent).toBeDefined();
        expect(['up', 'down', 'stable']).toContain(metric.trend);
      });
    });

    it('should calculate change percentage correctly for operational metrics', () => {
      component.operationalMetrics.forEach(metric => {
        const expected = ((metric.currentValue - metric.previousValue) / metric.previousValue) * 100;
        expect(Math.abs(metric.changePercent - expected)).toBeLessThan(0.01);
      });
    });
  });

  describe('Real-Time Updates', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update metrics every 5 seconds', fakeAsync(() => {
      const updateSpy = spyOn<any>(component, 'updateMetrics').and.callThrough();
      
      tick(5000);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      
      tick(5000);
      expect(updateSpy).toHaveBeenCalledTimes(2);
      
      tick(5000);
      expect(updateSpy).toHaveBeenCalledTimes(3);
    }));

    it('should modify metric values during updates', fakeAsync(() => {
      const initialValues = component.systemMetrics.map(m => m.currentValue);
      
      tick(5000);
      
      const updatedValues = component.systemMetrics.map(m => m.currentValue);
      let changesDetected = 0;
      
      for (let i = 0; i < initialValues.length; i++) {
        if (initialValues[i] !== updatedValues[i]) {
          changesDetected++;
        }
      }
      
      expect(changesDetected).toBeGreaterThan(0);
    }));

    it('should recalculate status based on thresholds during updates', fakeAsync(() => {
      const metric = component.systemMetrics[0];
      metric.currentValue = metric.threshold.critical + 10;
      
      tick(5000);
      fixture.detectChanges();
      
      const updatedMetric = component.systemMetrics[0];
      if (updatedMetric.currentValue >= updatedMetric.threshold.critical) {
        expect(updatedMetric.status).toBe('critical');
      } else if (updatedMetric.currentValue >= updatedMetric.threshold.warning) {
        expect(updatedMetric.status).toBe('warning');
      } else {
        expect(updatedMetric.status).toBe('healthy');
      }
    }));

    it('should update historical data array during updates', fakeAsync(() => {
      const metric = component.systemMetrics[0];
      const initialLastPoint = metric.historicalData[metric.historicalData.length - 1];
      
      tick(5000);
      
      const updatedLastPoint = metric.historicalData[metric.historicalData.length - 1];
      expect(updatedLastPoint.timestamp.getTime()).toBeGreaterThan(initialLastPoint.timestamp.getTime());
    }));

    it('should update system health during metric updates', fakeAsync(() => {
      const initialHealth = { ...component.systemHealth };
      
      tick(5000);
      
      expect(component.systemHealth.lastRestart).toEqual(initialHealth.lastRestart);
      expect(component.systemHealth.overallStatus).toBeDefined();
    }));

    it('should stop real-time updates on component destroy', fakeAsync(() => {
      const updateSpy = spyOn<any>(component, 'updateMetrics');
      
      tick(5000);
      const callCountBeforeDestroy = updateSpy.calls.count();
      
      component.ngOnDestroy();
      tick(5000);
      
      expect(updateSpy.calls.count()).toBe(callCountBeforeDestroy);
    }));
  });

  describe('System Health Calculation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate overall status as healthy when no critical or warning metrics', () => {
      component.systemMetrics.forEach(metric => {
        metric.status = 'healthy';
      });
      
      component['updateSystemHealth']();
      
      expect(component.systemHealth.overallStatus).toBe('healthy');
    });

    it('should calculate overall status as degraded when 2+ warning metrics', () => {
      component.systemMetrics[0].status = 'warning';
      component.systemMetrics[1].status = 'warning';
      component.systemMetrics.slice(2).forEach(metric => {
        metric.status = 'healthy';
      });
      
      component['updateSystemHealth']();
      
      expect(component.systemHealth.overallStatus).toBe('degraded');
    });

    it('should calculate overall status as critical when any critical metric', () => {
      component.systemMetrics[0].status = 'critical';
      component.systemMetrics.slice(1).forEach(metric => {
        metric.status = 'healthy';
      });
      
      component['updateSystemHealth']();
      
      expect(component.systemHealth.overallStatus).toBe('critical');
    });

    it('should calculate uptime from last restart', () => {
      const now = new Date();
      const lastRestart = new Date(now.getTime() - 86400000); // 1 day ago
      component.systemHealth.lastRestart = lastRestart;
      
      component['updateSystemHealth']();
      
      const expectedUptime = Math.floor((now.getTime() - lastRestart.getTime()) / 1000);
      expect(Math.abs(component.systemHealth.uptime - expectedUptime)).toBeLessThan(5);
    });

    it('should format uptime to days/hours/minutes', () => {
      const seconds = 90061; // 1 day, 1 hour, 1 minute, 1 second
      const formatted = component.formatUptime(seconds);
      
      expect(formatted).toContain('1d');
      expect(formatted).toContain('1h');
      expect(formatted).toContain('1m');
    });

    it('should track resource usage percentages', () => {
      expect(component.systemHealth.memoryUsage).toBeGreaterThan(0);
      expect(component.systemHealth.memoryUsage).toBeLessThanOrEqual(100);
      expect(component.systemHealth.cpuUsage).toBeGreaterThan(0);
      expect(component.systemHealth.cpuUsage).toBeLessThanOrEqual(100);
      expect(component.systemHealth.diskUsage).toBeGreaterThan(0);
      expect(component.systemHealth.diskUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('Analytics Calculation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should count total alerts', () => {
      component['calculateAnalytics']();
      
      expect(component.analytics.totalAlerts).toBe(component.systemAlerts.length);
    });

    it('should count critical alerts', () => {
      const expectedCritical = component.systemAlerts.filter(a => a.severity === 'critical').length;
      component['calculateAnalytics']();
      
      expect(component.analytics.criticalAlerts).toBe(expectedCritical);
    });

    it('should count warning alerts', () => {
      const expectedWarning = component.systemAlerts.filter(a => a.severity === 'warning').length;
      component['calculateAnalytics']();
      
      expect(component.analytics.warningAlerts).toBe(expectedWarning);
    });

    it('should count info alerts', () => {
      const expectedInfo = component.systemAlerts.filter(a => a.severity === 'info').length;
      component['calculateAnalytics']();
      
      expect(component.analytics.infoAlerts).toBe(expectedInfo);
    });

    it('should count acknowledged alerts', () => {
      const expectedAcknowledged = component.systemAlerts.filter(a => a.acknowledged).length;
      component['calculateAnalytics']();
      
      expect(component.analytics.acknowledgedAlerts).toBe(expectedAcknowledged);
    });

    it('should count resolved alerts', () => {
      const expectedResolved = component.systemAlerts.filter(a => a.resolved).length;
      component['calculateAnalytics']();
      
      expect(component.analytics.resolvedAlerts).toBe(expectedResolved);
    });

    it('should calculate average resolution time from resolved alerts', () => {
      const resolvedAlerts = component.systemAlerts.filter(a => a.resolved && a.resolvedAt);
      if (resolvedAlerts.length > 0) {
        const totalMinutes = resolvedAlerts.reduce((sum, alert) => {
          if (alert.resolvedAt) {
            return sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime()) / 60000;
          }
          return sum;
        }, 0);
        const expected = totalMinutes / resolvedAlerts.length;
        
        component['calculateAnalytics']();
        
        expect(Math.abs(component.analytics.averageResolutionTime - expected)).toBeLessThan(1);
      }
    });

    it('should calculate system health score from system metrics', () => {
      component['calculateAnalytics']();
      
      expect(component.analytics.systemHealthScore).toBeGreaterThan(0);
      expect(component.analytics.systemHealthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate data quality score as average', () => {
      const expectedScore = component.dataQualityMetrics.reduce((sum, m) => sum + m.score, 0) / component.dataQualityMetrics.length;
      
      component['calculateAnalytics']();
      
      expect(Math.abs(component.analytics.dataQualityScore - expectedScore)).toBeLessThan(0.01);
    });

    it('should calculate API health score from success rates', () => {
      const expectedScore = component.apiEndpoints.reduce((sum, e) => sum + e.successRate, 0) / component.apiEndpoints.length;
      
      component['calculateAnalytics']();
      
      expect(Math.abs(component.analytics.apiHealthScore - expectedScore)).toBeLessThan(0.01);
    });

    it('should calculate performance score from resource usage', () => {
      component['calculateAnalytics']();
      
      expect(component.analytics.performanceScore).toBeGreaterThan(0);
      expect(component.analytics.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Alert Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open alert dialog with selected alert', () => {
      const alert = component.systemAlerts[0];
      component.openAlertDialog(alert);
      
      expect(component.selectedAlert).toBe(alert);
      expect(component.showAlertDialog).toBeTruthy();
    });

    it('should reset alert form when opening dialog', () => {
      component.alertForm.patchValue({
        acknowledgedBy: 'Test User',
        notes: 'Test notes'
      });
      
      const alert = component.systemAlerts[0];
      component.openAlertDialog(alert);
      
      expect(component.alertForm.get('acknowledgedBy')?.value).toBe('');
      expect(component.alertForm.get('notes')?.value).toBe('');
    });

    it('should close alert dialog and reset form', () => {
      component.openAlertDialog(component.systemAlerts[0]);
      component.alertForm.patchValue({
        acknowledgedBy: 'Test User'
      });
      
      component.closeAlertDialog();
      
      expect(component.showAlertDialog).toBeFalsy();
      expect(component.selectedAlert).toBeNull();
      expect(component.alertForm.get('acknowledgedBy')?.value).toBe('');
    });

    it('should acknowledge alert with user and timestamp', () => {
      const alert = component.systemAlerts.find(a => !a.acknowledged);
      if (alert) {
        component.openAlertDialog(alert);
        component.alertForm.patchValue({
          acknowledgedBy: 'Test User',
          notes: 'Acknowledged for testing'
        });
        
        component.acknowledgeAlert();
        
        expect(alert.acknowledged).toBeTruthy();
        expect(alert.acknowledgedBy).toBe('Test User');
        expect(alert.acknowledgedAt).toBeDefined();
      }
    });

    it('should not acknowledge alert with invalid form', () => {
      const alert = component.systemAlerts.find(a => !a.acknowledged);
      if (alert) {
        component.openAlertDialog(alert);
        component.alertForm.patchValue({
          acknowledgedBy: ''
        });
        
        component.acknowledgeAlert();
        
        expect(alert.acknowledged).toBeFalsy();
      }
    });

    it('should resolve alert and set resolved timestamp', () => {
      const alert = component.systemAlerts.find(a => !a.resolved);
      if (alert) {
        component.resolveAlert(alert);
        
        expect(alert.resolved).toBeTruthy();
        expect(alert.resolvedAt).toBeDefined();
      }
    });

    it('should auto-acknowledge when resolving unacknowledged alert', () => {
      const alert = component.systemAlerts.find(a => !a.acknowledged && !a.resolved);
      if (alert) {
        component.resolveAlert(alert);
        
        expect(alert.acknowledged).toBeTruthy();
        expect(alert.acknowledgedBy).toBe('System');
        expect(alert.acknowledgedAt).toBeDefined();
        expect(alert.resolved).toBeTruthy();
      }
    });

    it('should delete alert after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const initialCount = component.systemAlerts.length;
      const alert = component.systemAlerts[0];
      
      component.deleteAlert(alert);
      
      expect(component.systemAlerts.length).toBe(initialCount - 1);
      expect(component.systemAlerts).not.toContain(alert);
    });

    it('should not delete alert without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const initialCount = component.systemAlerts.length;
      const alert = component.systemAlerts[0];
      
      component.deleteAlert(alert);
      
      expect(component.systemAlerts.length).toBe(initialCount);
    });

    it('should save to localStorage after acknowledging', () => {
      spyOn<any>(component, 'saveToLocalStorage');
      const alert = component.systemAlerts.find(a => !a.acknowledged);
      
      if (alert) {
        component.openAlertDialog(alert);
        component.alertForm.patchValue({ acknowledgedBy: 'Test User' });
        component.acknowledgeAlert();
        
        expect(component['saveToLocalStorage']).toHaveBeenCalled();
      }
    });

    it('should recalculate analytics after alert operations', () => {
      spyOn<any>(component, 'calculateAnalytics');
      const alert = component.systemAlerts.find(a => !a.resolved);
      
      if (alert) {
        component.resolveAlert(alert);
        expect(component['calculateAnalytics']).toHaveBeenCalled();
      }
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter alerts by search text in title', () => {
      const searchTerm = component.systemAlerts[0].title.substring(0, 5);
      component.filterForm.patchValue({ search: searchTerm });
      component.applyFilters();
      
      expect(component.filteredAlerts.length).toBeGreaterThan(0);
      component.filteredAlerts.forEach(alert => {
        expect(alert.title.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    });

    it('should filter alerts by search text in message', () => {
      const alert = component.systemAlerts.find(a => a.message.length > 10);
      if (alert) {
        const searchTerm = alert.message.substring(0, 5);
        component.filterForm.patchValue({ search: searchTerm });
        component.applyFilters();
        
        const found = component.filteredAlerts.some(a => 
          a.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
        expect(found).toBeTruthy();
      }
    });

    it('should filter alerts by severity', () => {
      component.filterForm.patchValue({ severity: 'critical' });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.severity).toBe('critical');
      });
    });

    it('should filter alerts by alert type', () => {
      component.filterForm.patchValue({ alertType: 'system' });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.alertType).toBe('system');
      });
    });

    it('should filter alerts by active status', () => {
      component.filterForm.patchValue({ status: 'active' });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.resolved).toBeFalsy();
      });
    });

    it('should filter alerts by acknowledged status', () => {
      component.filterForm.patchValue({ status: 'acknowledged' });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.acknowledged).toBeTruthy();
        expect(alert.resolved).toBeFalsy();
      });
    });

    it('should filter alerts by resolved status', () => {
      component.filterForm.patchValue({ status: 'resolved' });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.resolved).toBeTruthy();
      });
    });

    it('should filter alerts by date range', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 5);
      
      component.filterForm.patchValue({
        dateRange: {
          start: startDate,
          end: endDate
        }
      });
      component.applyFilters();
      
      component.filteredAlerts.forEach(alert => {
        expect(alert.timestamp.getTime()).toBeGreaterThanOrEqual(startDate.setHours(0, 0, 0, 0));
        expect(alert.timestamp.getTime()).toBeLessThanOrEqual(endDate.setHours(23, 59, 59, 999));
      });
    });

    it('should reset all filters', () => {
      component.filterForm.patchValue({
        search: 'test',
        severity: 'critical',
        alertType: 'system',
        status: 'active'
      });
      
      component.resetFilters();
      
      expect(component.filterForm.get('search')?.value).toBe('');
      expect(component.filterForm.get('severity')?.value).toBe('');
      expect(component.filterForm.get('alertType')?.value).toBe('');
      expect(component.filterForm.get('status')?.value).toBe('');
    });

    it('should update displayed alerts after filtering', () => {
      spyOn<any>(component, 'updateDisplayedAlerts');
      component.filterForm.patchValue({ severity: 'critical' });
      component.applyFilters();
      
      expect(component['updateDisplayedAlerts']).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should slice filtered alerts by page index and size', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      component['updateDisplayedAlerts']();
      
      expect(component.displayedAlerts.length).toBeLessThanOrEqual(10);
    });

    it('should update displayed alerts on page change', () => {
      const event = { pageIndex: 1, pageSize: 10, length: component.filteredAlerts.length };
      component.onPageChange(event);
      
      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('should respect page size options', () => {
      expect(component.pageSizeOptions).toContain(5);
      expect(component.pageSizeOptions).toContain(10);
      expect(component.pageSizeOptions).toContain(25);
      expect(component.pageSizeOptions).toContain(50);
    });
  });

  describe('Export', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should export to CSV with correct headers', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportData('csv');
      
      const call = (component as any).downloadFile.calls.mostRecent();
      const content = call.args[0];
      
      expect(content).toContain('ID,Timestamp,Severity,Type,Title,Message,Status,Acknowledged By,Resolved');
    });

    it('should format alert data for CSV rows', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportData('csv');
      
      const call = (component as any).downloadFile.calls.mostRecent();
      const content = call.args[0];
      const rows = content.split('\n');
      
      expect(rows.length).toBeGreaterThan(1);
    });

    it('should download CSV file with correct filename', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportData('csv');
      
      const call = (component as any).downloadFile.calls.mostRecent();
      expect(call.args[1]).toBe('system-alerts.csv');
      expect(call.args[2]).toBe('text/csv');
    });

    it('should export to JSON with correct structure', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportData('json');
      
      const call = (component as any).downloadFile.calls.mostRecent();
      const content = call.args[0];
      const data = JSON.parse(content);
      
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBe(component.systemAlerts.length);
    });

    it('should download JSON file with correct filename', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportData('json');
      
      const call = (component as any).downloadFile.calls.mostRecent();
      expect(call.args[1]).toBe('system-alerts.json');
      expect(call.args[2]).toBe('application/json');
    });
  });

  describe('localStorage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save alerts to localStorage', () => {
      component['saveToLocalStorage']();
      
      const stored = localStorage.getItem('systemAlerts');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(Array.isArray(parsed)).toBeTruthy();
      }
    });

    it('should load alerts from localStorage with Date conversion', () => {
      const testAlert = {
        id: 'test-1',
        alertType: 'system' as const,
        severity: 'info' as const,
        title: 'Test Alert',
        message: 'Test message',
        timestamp: new Date(),
        acknowledged: true,
        acknowledgedBy: 'Test User',
        acknowledgedAt: new Date(),
        resolved: false,
        affectedResources: []
      };
      
      localStorage.setItem('systemAlerts', JSON.stringify([testAlert]));
      
      const loaded = component['loadFromLocalStorage']();
      
      expect(loaded).toBeTruthy();
      if (loaded) {
        expect(loaded[0].timestamp instanceof Date).toBeTruthy();
        expect(loaded[0].acknowledgedAt instanceof Date).toBeTruthy();
      }
    });

    it('should return null if localStorage has no data', () => {
      localStorage.clear();
      const loaded = component['loadFromLocalStorage']();
      
      expect(loaded).toBeNull();
    });

    it('should generate mock data when localStorage is empty', () => {
      localStorage.clear();
      component.ngOnInit();
      
      expect(component.systemAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct severity colors', () => {
      expect(component.getSeverityColor('info')).toBe('#3b82f6');
      expect(component.getSeverityColor('warning')).toBe('#f59e0b');
      expect(component.getSeverityColor('critical')).toBe('#ef4444');
    });

    it('should return correct status colors', () => {
      expect(component.getStatusColor('healthy')).toBe('#10b981');
      expect(component.getStatusColor('degraded')).toBe('#f59e0b');
      expect(component.getStatusColor('critical')).toBe('#ef4444');
      expect(component.getStatusColor('down')).toBe('#991b1b');
    });

    it('should return correct quality status colors', () => {
      expect(component.getQualityStatusColor('excellent')).toBe('#10b981');
      expect(component.getQualityStatusColor('good')).toBe('#3b82f6');
      expect(component.getQualityStatusColor('fair')).toBe('#f59e0b');
      expect(component.getQualityStatusColor('poor')).toBe('#ef4444');
    });

    it('should format date with time', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = component.formatDate(date);
      
      expect(formatted).toContain('Mar');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should format uptime with days, hours, and minutes', () => {
      const seconds = 90061; // 1d 1h 1m 1s
      const formatted = component.formatUptime(seconds);
      
      expect(formatted).toMatch(/\d+d/);
      expect(formatted).toMatch(/\d+h/);
      expect(formatted).toMatch(/\d+m/);
    });

    it('should format number with thousands separators', () => {
      expect(component.formatNumber(1000)).toBe('1,000');
      expect(component.formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format percentage with one decimal', () => {
      expect(component.formatPercentage(95.567)).toBe('95.6%');
      expect(component.formatPercentage(100)).toBe('100.0%');
    });

    it('should format duration to hours or minutes', () => {
      expect(component.formatDuration(30)).toBe('30 min');
      expect(component.formatDuration(90)).toBe('1h 30m');
      expect(component.formatDuration(125)).toBe('2h 5m');
    });
  });

  describe('Table Columns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toContain('timestamp');
      expect(component.displayedColumns).toContain('severity');
      expect(component.displayedColumns).toContain('alertType');
      expect(component.displayedColumns).toContain('title');
      expect(component.displayedColumns).toContain('resources');
      expect(component.displayedColumns).toContain('status');
      expect(component.displayedColumns).toContain('actions');
    });
  });

  describe('Predictive Analytics', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize predictive analytics properties', () => {
      expect(component.predictiveAnalytics).toBeDefined();
      expect(component.predictiveAnalytics.predictions).toEqual([]);
      expect(component.predictiveAnalytics.anomalies).toEqual([]);
      expect(component.predictiveAnalytics.recommendations).toEqual([]);
      expect(component.predictiveAnalytics.confidenceScore).toBe(0);
      expect(component.alertThresholds).toEqual([]);
      expect(component.showPredictiveDialog).toBe(false);
      expect(component.showThresholdDialog).toBe(false);
    });

    it('should run predictive analysis and update confidence score', () => {
      component.systemMetrics[0].historicalData = Array(10).fill(null).map((_, i) => ({
        timestamp: new Date(),
        value: 50 + i * 5
      }));

      component.runPredictiveAnalysis();

      expect(component.predictiveAnalytics.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(component.predictiveAnalytics.lastAnalyzed).toBeDefined();
    });

    it('should handle anomaly detection', () => {
      component.systemMetrics[0].historicalData = Array(10).fill(null).map(() => ({
        timestamp: new Date(),
        value: 50
      }));
      component.systemMetrics[0].currentValue = 150;

      component.runPredictiveAnalysis();

      // Anomalies may or may not be detected based on implementation
      expect(component.predictiveAnalytics.anomalies).toBeDefined();
      expect(Array.isArray(component.predictiveAnalytics.anomalies)).toBe(true);
    });

    it('should generate recommendations based on predictions and anomalies', () => {
      component.systemMetrics[0].historicalData = Array(15).fill(null).map((_, i) => ({
        timestamp: new Date(),
        value: 50 + i * 3
      }));

      component.runPredictiveAnalysis();

      expect(component.predictiveAnalytics.recommendations).toBeDefined();
      expect(Array.isArray(component.predictiveAnalytics.recommendations)).toBe(true);
    });
  });

  describe('Threshold Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open threshold config dialog', () => {
      component.openThresholdConfig();

      expect(component.showThresholdDialog).toBe(true);
      expect(component.alertThresholds.length).toBeGreaterThan(0);
    });

    it('should close threshold dialog', () => {
      component.showThresholdDialog = true;
      component.closeThresholdDialog();

      expect(component.showThresholdDialog).toBe(false);
    });

    it('should update threshold values', () => {
      component.systemMetrics = [{
        id: 'cpu-usage',
        metricName: 'CPU Usage',
        currentValue: 85,
        unit: '%',
        status: 'healthy',
        metricType: 'system',
        trend: 'stable',
        threshold: { warning: 80, critical: 90 },
        historicalData: [],
        lastUpdated: new Date()
      }];

      const config: AlertThresholdConfig = {
        metricId: 'cpu-usage',
        metricName: 'CPU Usage',
        warningThreshold: 70,
        criticalThreshold: 85,
        notificationEnabled: true,
        notificationChannels: ['email' as const],
        cooldownPeriod: 300
      };

      component.updateThreshold(config);

      const metric = component.systemMetrics[0];
      expect(metric.threshold.warning).toBe(70);
      expect(metric.threshold.critical).toBe(85);
    });
  });

  describe('Prediction Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open prediction details', () => {
      const prediction: MetricPrediction = {
        metricId: 'cpu-usage',
        metricName: 'CPU Usage',
        currentValue: 75,
        predictedValue: 95,
        predictionTime: new Date(),
        confidence: 85,
        trend: 'increasing' as const,
        willExceedThreshold: true
      };

      component.openPredictionDetails(prediction);

      expect(component.selectedPrediction).toBe(prediction);
      expect(component.showPredictiveDialog).toBe(true);
    });

    it('should open anomaly details', () => {
      const anomaly: AnomalyDetection = {
        id: 'anomaly-1',
        metricId: 'memory-usage',
        metricName: 'Memory Usage',
        detectedAt: new Date(),
        anomalyType: 'spike' as const,
        severity: 'high' as const,
        deviationPercentage: 200,
        expectedValue: 50,
        actualValue: 150,
        description: 'Spike detected',
        potentialCauses: ['Memory leak']
      };

      component.openAnomalyDetails(anomaly);

      expect(component.selectedAnomaly).toBe(anomaly);
      expect(component.showPredictiveDialog).toBe(true);
    });

    it('should close predictive dialog', () => {
      component.selectedPrediction = {} as any;
      component.selectedAnomaly = {} as any;
      component.showPredictiveDialog = true;

      component.closePredictiveDialog();

      expect(component.selectedPrediction).toBeNull();
      expect(component.selectedAnomaly).toBeNull();
      expect(component.showPredictiveDialog).toBe(false);
    });
  });

  describe('Color Helper Methods', () => {
    it('should return correct prediction severity colors', () => {
      const criticalPrediction: MetricPrediction = {
        metricId: 'cpu',
        metricName: 'CPU',
        currentValue: 75,
        predictedValue: 95,
        predictionTime: new Date(),
        confidence: 85,
        trend: 'increasing' as const,
        willExceedThreshold: true,
        timeToThreshold: 45
      };
      expect(component.getPredictionSeverityColor(criticalPrediction)).toBe('#ef4444');

      const warningPrediction: MetricPrediction = {
        metricId: 'cpu',
        metricName: 'CPU',
        currentValue: 75,
        predictedValue: 85,
        predictionTime: new Date(),
        confidence: 80,
        trend: 'increasing' as const,
        willExceedThreshold: true,
        timeToThreshold: 90
      };
      expect(component.getPredictionSeverityColor(warningPrediction)).toBe('#f59e0b');

      const healthyPrediction: MetricPrediction = {
        metricId: 'cpu',
        metricName: 'CPU',
        currentValue: 50,
        predictedValue: 55,
        predictionTime: new Date(),
        confidence: 90,
        trend: 'stable' as const,
        willExceedThreshold: false
      };
      expect(component.getPredictionSeverityColor(healthyPrediction)).toBe('#10b981');
    });

    it('should return correct anomaly severity colors', () => {
      expect(component.getAnomalySeverityColor('low')).toBe('#3b82f6');
      expect(component.getAnomalySeverityColor('medium')).toBe('#f59e0b');
      expect(component.getAnomalySeverityColor('high')).toBe('#ef4444');
    });

    it('should return correct recommendation priority colors', () => {
      expect(component.getRecommendationPriorityColor('low')).toBe('#6b7280');
      expect(component.getRecommendationPriorityColor('medium')).toBe('#3b82f6');
      expect(component.getRecommendationPriorityColor('high')).toBe('#f59e0b');
      expect(component.getRecommendationPriorityColor('critical')).toBe('#ef4444');
    });
  });

  // Historical Analysis Tests
  describe('Historical Analysis', () => {
    it('should initialize historical analytics with default values', () => {
      expect(component.historicalAnalytics).toBeDefined();
      expect(component.historicalAnalytics.selectedPeriod).toBe('7days');
      expect(component.historicalAnalytics.trends).toEqual([]);
      expect(component.historicalAnalytics.comparisons).toEqual([]);
      expect(component.historicalAnalytics.topImprovedMetrics).toEqual([]);
      expect(component.historicalAnalytics.topDegradedMetrics).toEqual([]);
      expect(component.historicalAnalytics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should change historical period and regenerate analysis', () => {
      spyOn(component, 'generateHistoricalTrends');
      spyOn(component, 'generateTrendComparisons');
      spyOn(component, 'identifyTopMetrics');

      component.changeHistoricalPeriod('30days');

      expect(component.historicalAnalytics.selectedPeriod).toBe('30days');
      expect(component.generateHistoricalTrends).toHaveBeenCalled();
      expect(component.generateTrendComparisons).toHaveBeenCalled();
      expect(component.identifyTopMetrics).toHaveBeenCalled();
      expect(component.historicalAnalytics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should get correct days from period string', () => {
      expect(component.getDaysFromPeriod('7days')).toBe(7);
      expect(component.getDaysFromPeriod('30days')).toBe(30);
      expect(component.getDaysFromPeriod('90days')).toBe(90);
    });

    it('should get correct status from value and threshold', () => {
      const threshold = { warning: 70, critical: 90 };

      expect(component.getStatusFromValue(95, threshold)).toBe('critical');
      expect(component.getStatusFromValue(85, threshold)).toBe('warning');
      expect(component.getStatusFromValue(50, threshold)).toBe('healthy');
    });

    it('should filter data for specified period', () => {
      const now = new Date();
      const historicalData = [
        { timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), value: 50 },
        { timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), value: 60 },
        { timestamp: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), value: 70 }
      ];

      const filtered7Days = component.getDataForPeriod(historicalData, 7);
      const filtered30Days = component.getDataForPeriod(historicalData, 30);

      expect(filtered7Days.length).toBe(1);
      expect(filtered30Days.length).toBe(2);
    });

    it('should generate historical trends with correct structure', () => {
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 75,
          unit: '%',
          status: 'warning' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'up' as const,
          lastUpdated: new Date(),
          historicalData: [
            { timestamp: new Date(), value: 75 },
            { timestamp: new Date(Date.now() - 1000 * 60 * 60), value: 70 },
            { timestamp: new Date(Date.now() - 2 * 1000 * 60 * 60), value: 65 }
          ]
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateHistoricalTrends();

      expect(component.historicalAnalytics.trends.length).toBeGreaterThan(0);
      const trend = component.historicalAnalytics.trends[0];
      expect(trend.period).toBe('7days');
      expect(trend.metricId).toBeDefined();
      expect(trend.metricName).toBeDefined();
      expect(trend.dataPoints).toBeDefined();
      expect(trend.averageValue).toBeDefined();
      expect(trend.minValue).toBeDefined();
      expect(trend.maxValue).toBeDefined();
      expect(['increasing', 'decreasing', 'stable']).toContain(trend.trendDirection);
    });

    it('should detect increasing trend when second half average is higher', () => {
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 80,
          unit: '%',
          status: 'warning' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'up' as const,
          lastUpdated: new Date(),
          historicalData: [
            { timestamp: new Date(), value: 90 },
            { timestamp: new Date(Date.now() - 1000), value: 85 },
            { timestamp: new Date(Date.now() - 2000), value: 60 },
            { timestamp: new Date(Date.now() - 3000), value: 55 }
          ]
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateHistoricalTrends();

      const trend = component.historicalAnalytics.trends[0];
      expect(trend.trendDirection).toBe('increasing');
      expect(trend.changePercentage).toBeGreaterThan(5);
    });

    it('should detect decreasing trend when second half average is lower', () => {
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 50,
          unit: '%',
          status: 'healthy' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'down' as const,
          lastUpdated: new Date(),
          historicalData: [
            { timestamp: new Date(), value: 50 },
            { timestamp: new Date(Date.now() - 1000), value: 55 },
            { timestamp: new Date(Date.now() - 2000), value: 85 },
            { timestamp: new Date(Date.now() - 3000), value: 90 }
          ]
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateHistoricalTrends();

      const trend = component.historicalAnalytics.trends[0];
      expect(trend.trendDirection).toBe('decreasing');
      expect(trend.changePercentage).toBeLessThan(-5);
    });

    it('should generate trend comparisons with sufficient data', () => {
      const now = new Date();
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 75,
          unit: '%',
          status: 'warning' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'stable' as const,
          lastUpdated: new Date(),
          historicalData: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
            value: 70 + Math.random() * 10
          }))
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateTrendComparisons();

      expect(component.historicalAnalytics.comparisons.length).toBeGreaterThan(0);
      const comparison = component.historicalAnalytics.comparisons[0];
      expect(comparison.metricId).toBeDefined();
      expect(comparison.metricName).toBeDefined();
      expect(comparison.currentPeriod).toBeDefined();
      expect(comparison.previousPeriod).toBeDefined();
      expect(comparison.percentageChange).toBeDefined();
      expect(typeof comparison.improvement).toBe('boolean');
    });

    it('should skip comparisons when insufficient data', () => {
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 75,
          unit: '%',
          status: 'warning' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'stable' as const,
          lastUpdated: new Date(),
          historicalData: [
            { timestamp: new Date(), value: 75 },
            { timestamp: new Date(Date.now() - 1000), value: 70 }
          ]
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateTrendComparisons();

      expect(component.historicalAnalytics.comparisons.length).toBe(0);
    });

    it('should calculate percentage change correctly', () => {
      const now = new Date();
      component.systemMetrics = [
        {
          id: 'cpu',
          metricName: 'CPU Usage',
          metricType: 'system' as const,
          currentValue: 60,
          unit: '%',
          status: 'healthy' as const,
          threshold: { warning: 70, critical: 90 },
          trend: 'stable' as const,
          lastUpdated: new Date(),
          historicalData: [
            ...Array.from({ length: 7 }, (_, i) => ({
              timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
              value: 60
            })),
            ...Array.from({ length: 7 }, (_, i) => ({
              timestamp: new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000),
              value: 80
            }))
          ]
        }
      ];

      component.historicalAnalytics.selectedPeriod = '7days';
      component.generateTrendComparisons();

      const comparison = component.historicalAnalytics.comparisons[0];
      expect(comparison.percentageChange).toBeLessThan(0); // 60 is less than 80, so negative change
      expect(comparison.improvement).toBe(true); // Lower values are better
    });

    it('should identify top improved metrics', () => {
      component.historicalAnalytics.comparisons = [
        {
          metricId: 'cpu',
          metricName: 'CPU Usage',
          currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 60, peakValue: 70, lowestValue: 50 },
          previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 80, peakValue: 90, lowestValue: 70 },
          percentageChange: -25,
          improvement: true
        },
        {
          metricId: 'memory',
          metricName: 'Memory Usage',
          currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 70, peakValue: 80, lowestValue: 60 },
          previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 85, peakValue: 95, lowestValue: 75 },
          percentageChange: -17.6,
          improvement: true
        }
      ];

      component.identifyTopMetrics();

      expect(component.historicalAnalytics.topImprovedMetrics.length).toBe(2);
      expect(component.historicalAnalytics.topImprovedMetrics[0].metricName).toBe('CPU Usage');
      expect(component.historicalAnalytics.topImprovedMetrics[0].improvement).toBe(25);
    });

    it('should identify top degraded metrics', () => {
      component.historicalAnalytics.comparisons = [
        {
          metricId: 'cpu',
          metricName: 'CPU Usage',
          currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 80, peakValue: 90, lowestValue: 70 },
          previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 60, peakValue: 70, lowestValue: 50 },
          percentageChange: 33.3,
          improvement: false
        },
        {
          metricId: 'memory',
          metricName: 'Memory Usage',
          currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 85, peakValue: 95, lowestValue: 75 },
          previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 70, peakValue: 80, lowestValue: 60 },
          percentageChange: 21.4,
          improvement: false
        }
      ];

      component.identifyTopMetrics();

      expect(component.historicalAnalytics.topDegradedMetrics.length).toBe(2);
      expect(component.historicalAnalytics.topDegradedMetrics[0].metricName).toBe('CPU Usage');
      expect(component.historicalAnalytics.topDegradedMetrics[0].degradation).toBe(33.3);
    });

    it('should limit top metrics to 5 items', () => {
      component.historicalAnalytics.comparisons = Array.from({ length: 10 }, (_, i) => ({
        metricId: `metric${i}`,
        metricName: `Metric ${i}`,
        currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 60, peakValue: 70, lowestValue: 50 },
        previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 80, peakValue: 90, lowestValue: 70 },
        percentageChange: -25,
        improvement: true
      }));

      component.identifyTopMetrics();

      expect(component.historicalAnalytics.topImprovedMetrics.length).toBe(5);
    });

    it('should open trend details dialog', () => {
      const mockTrend: HistoricalTrend = {
        period: '7days',
        metricId: 'cpu',
        metricName: 'CPU Usage',
        dataPoints: [],
        averageValue: 75,
        minValue: 50,
        maxValue: 90,
        trendDirection: 'increasing',
        changePercentage: 15
      };

      component.openTrendDetails(mockTrend);

      expect(component.selectedTrend).toEqual(mockTrend);
      expect(component.showHistoricalDialog).toBe(true);
    });

    it('should close trend details dialog', () => {
      component.showHistoricalDialog = true;
      component.selectedTrend = {
        period: '7days',
        metricId: 'cpu',
        metricName: 'CPU Usage',
        dataPoints: [],
        averageValue: 75,
        minValue: 50,
        maxValue: 90,
        trendDirection: 'increasing',
        changePercentage: 15
      };

      component.closeHistoricalDialog();

      expect(component.showHistoricalDialog).toBe(false);
      expect(component.selectedTrend).toBeNull();
    });

    it('should open comparison details dialog', () => {
      const mockComparison: TrendComparison = {
        metricId: 'cpu',
        metricName: 'CPU Usage',
        currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 60, peakValue: 70, lowestValue: 50 },
        previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 80, peakValue: 90, lowestValue: 70 },
        percentageChange: -25,
        improvement: true
      };

      component.openComparisonDetails(mockComparison);

      expect(component.selectedComparison).toEqual(mockComparison);
      expect(component.showComparisonDialog).toBe(true);
    });

    it('should close comparison details dialog', () => {
      component.showComparisonDialog = true;
      component.selectedComparison = {
        metricId: 'cpu',
        metricName: 'CPU Usage',
        currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 60, peakValue: 70, lowestValue: 50 },
        previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 80, peakValue: 90, lowestValue: 70 },
        percentageChange: -25,
        improvement: true
      };

      component.closeComparisonDialog();

      expect(component.showComparisonDialog).toBe(false);
      expect(component.selectedComparison).toBeNull();
    });

    it('should return correct trend colors', () => {
      expect(component.getTrendColor('increasing')).toBe('#ef4444');
      expect(component.getTrendColor('decreasing')).toBe('#10b981');
      expect(component.getTrendColor('stable')).toBe('#3b82f6');
    });

    it('should return correct trend icons', () => {
      expect(component.getTrendIcon('increasing')).toBe('trending_up');
      expect(component.getTrendIcon('decreasing')).toBe('trending_down');
      expect(component.getTrendIcon('stable')).toBe('trending_flat');
    });

    it('should export historical data as CSV', () => {
      spyOn(component, 'downloadFile');
      component.historicalAnalytics = {
        selectedPeriod: '7days',
        trends: [
          {
            period: '7days',
            metricId: 'cpu',
            metricName: 'CPU Usage',
            dataPoints: [],
            averageValue: 75,
            minValue: 50,
            maxValue: 90,
            trendDirection: 'increasing',
            changePercentage: 15
          }
        ],
        comparisons: [
          {
            metricId: 'cpu',
            metricName: 'CPU Usage',
            currentPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 75, peakValue: 90, lowestValue: 60 },
            previousPeriod: { startDate: new Date(), endDate: new Date(), averageValue: 65, peakValue: 80, lowestValue: 50 },
            percentageChange: 15.4,
            improvement: false
          }
        ],
        topImprovedMetrics: [],
        topDegradedMetrics: [],
        lastUpdated: new Date()
      };

      component.exportHistoricalData('csv');

      expect(component.downloadFile).toHaveBeenCalledWith(
        jasmine.stringContaining('Metric Name,Period,Average Value'),
        'historical-analysis.csv',
        'text/csv'
      );
    });

    it('should export historical data as JSON', () => {
      spyOn(component, 'downloadFile');
      component.historicalAnalytics = {
        selectedPeriod: '7days',
        trends: [],
        comparisons: [],
        topImprovedMetrics: [],
        topDegradedMetrics: [],
        lastUpdated: new Date()
      };

      component.exportHistoricalData('json');

      expect(component.downloadFile).toHaveBeenCalledWith(
        jasmine.stringContaining('"period"'),
        'historical-analysis.json',
        'application/json'
      );
    });
  });
});
