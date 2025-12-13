import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { interval, Subscription } from 'rxjs';

interface SystemMetric {
  id: string;
  metricName: string;
  metricType: 'system' | 'database' | 'api' | 'application';
  currentValue: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  historicalData: HistoricalPoint[];
}

interface HistoricalPoint {
  timestamp: Date;
  value: number;
}

interface DataQualityMetric {
  id: string;
  dataSource: string;
  qualityDimension: 'completeness' | 'accuracy' | 'consistency' | 'timeliness';
  score: number;
  issues: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastChecked: Date;
  details: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    missingFields: string[];
  };
}

interface ApiEndpoint {
  id: string;
  endpointName: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  requestCount: number;
  lastRequest: Date;
  status: 'healthy' | 'degraded' | 'down';
  recentErrors: ApiError[];
}

interface ApiError {
  timestamp: Date;
  statusCode: number;
  errorMessage: string;
  requestPath: string;
}

interface SystemAlert {
  id: string;
  alertType: 'system' | 'database' | 'api' | 'security' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  affectedResources: string[];
}

interface OperationalMetric {
  id: string;
  metricName: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'positive' | 'neutral' | 'negative';
}

interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  uptimePercentage: number;
  lastRestart: Date;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  queuedJobs: number;
}

interface MonitoringAnalytics {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  systemHealthScore: number;
  dataQualityScore: number;
  apiHealthScore: number;
  performanceScore: number;
}

export interface PredictiveAnalytics {
  predictions: MetricPrediction[];
  anomalies: AnomalyDetection[];
  recommendations: PredictiveRecommendation[];
  confidenceScore: number;
  lastAnalyzed: Date;
}

export interface MetricPrediction {
  metricId: string;
  metricName: string;
  currentValue: number;
  predictedValue: number;
  predictionTime: Date;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  willExceedThreshold: boolean;
  timeToThreshold?: number;
}

export interface AnomalyDetection {
  id: string;
  metricId: string;
  metricName: string;
  detectedAt: Date;
  anomalyType: 'spike' | 'drop' | 'pattern_break' | 'sustained_deviation';
  severity: 'low' | 'medium' | 'high';
  deviationPercentage: number;
  expectedValue: number;
  actualValue: number;
  description: string;
  potentialCauses: string[];
}

export interface PredictiveRecommendation {
  id: string;
  category: 'preventive' | 'optimization' | 'capacity' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  estimatedEffort: string;
  potentialSavings?: string;
  implementationSteps: string[];
  relatedMetrics: string[];
}

export interface AlertThresholdConfig {
  metricId: string;
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  notificationEnabled: boolean;
  notificationChannels: ('email' | 'sms' | 'slack' | 'webhook')[];
  cooldownPeriod: number;
}

export interface HistoricalTrend {
  period: '7days' | '30days' | '90days';
  metricId: string;
  metricName: string;
  dataPoints: HistoricalDataPoint[];
  averageValue: number;
  minValue: number;
  maxValue: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

export interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface TrendComparison {
  metricId: string;
  metricName: string;
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    averageValue: number;
    peakValue: number;
    lowestValue: number;
  };
  previousPeriod: {
    startDate: Date;
    endDate: Date;
    averageValue: number;
    peakValue: number;
    lowestValue: number;
  };
  percentageChange: number;
  improvement: boolean;
}

export interface HistoricalAnalytics {
  selectedPeriod: '7days' | '30days' | '90days';
  trends: HistoricalTrend[];
  comparisons: TrendComparison[];
  topImprovedMetrics: { metricName: string; improvement: number }[];
  topDegradedMetrics: { metricName: string; degradation: number }[];
  lastUpdated: Date;
}

@Component({
  selector: 'app-system-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
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
  ],
  templateUrl: './system-monitoring.component.html',
  styleUrl: './system-monitoring.component.scss'
})
export class SystemMonitoringComponent implements OnInit, OnDestroy {
  systemMetrics: SystemMetric[] = [];
  dataQualityMetrics: DataQualityMetric[] = [];
  apiEndpoints: ApiEndpoint[] = [];
  systemAlerts: SystemAlert[] = [];
  operationalMetrics: OperationalMetric[] = [];
  systemHealth: SystemHealth = {
    overallStatus: 'healthy',
    uptime: 0,
    uptimePercentage: 99.9,
    lastRestart: new Date(),
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    queuedJobs: 0
  };
  analytics: MonitoringAnalytics = {
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    infoAlerts: 0,
    acknowledgedAlerts: 0,
    resolvedAlerts: 0,
    averageResolutionTime: 0,
    systemHealthScore: 0,
    dataQualityScore: 0,
    apiHealthScore: 0,
    performanceScore: 0
  };

  // Predictive Analytics Properties
  predictiveAnalytics: PredictiveAnalytics = {
    predictions: [],
    anomalies: [],
    recommendations: [],
    confidenceScore: 0,
    lastAnalyzed: new Date()
  };
  alertThresholds: AlertThresholdConfig[] = [];
  showPredictiveDialog = false;
  showThresholdDialog = false;
  selectedPrediction: MetricPrediction | null = null;
  selectedAnomaly: AnomalyDetection | null = null;

  // Historical Analytics Properties
  historicalAnalytics: HistoricalAnalytics = {
    selectedPeriod: '7days',
    trends: [],
    comparisons: [],
    topImprovedMetrics: [],
    topDegradedMetrics: [],
    lastUpdated: new Date()
  };
  showHistoricalDialog = false;
  selectedTrend: HistoricalTrend | null = null;
  showComparisonDialog = false;
  selectedComparison: TrendComparison | null = null;

  filteredAlerts: SystemAlert[] = [];
  displayedAlerts: SystemAlert[] = [];
  filterForm: FormGroup;
  alertForm: FormGroup;

  showAlertDialog = false;
  selectedAlert: SystemAlert | null = null;
  isEditMode = false;

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  displayedColumns = ['timestamp', 'severity', 'alertType', 'title', 'resources', 'status', 'actions'];

  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 5000;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      severity: [''],
      alertType: [''],
      status: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      })
    });

    this.alertForm = this.fb.group({
      acknowledgedBy: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadMonitoringData();
    this.startRealTimeUpdates();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.stopRealTimeUpdates();
  }

  loadMonitoringData(): void {
    const savedData = this.loadFromLocalStorage();
    if (savedData) {
      this.systemAlerts = savedData;
    } else {
      this.systemAlerts = this.generateMockAlerts();
    }

    this.systemMetrics = this.generateMockSystemMetrics();
    this.dataQualityMetrics = this.generateMockDataQualityMetrics();
    this.apiEndpoints = this.generateMockApiEndpoints();
    this.operationalMetrics = this.generateMockOperationalMetrics();
    this.updateSystemHealth();

    this.calculateAnalytics();
    this.applyFilters();
    
    // Run predictive analysis
    this.runPredictiveAnalysis();
  }

  generateMockAlerts(): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    const alertTypes: SystemAlert['alertType'][] = ['system', 'database', 'api', 'security', 'performance'];
    const severities: SystemAlert['severity'][] = ['info', 'warning', 'critical'];
    const now = new Date();

    const alertTemplates = [
      { type: 'system' as const, severity: 'critical' as const, title: 'High CPU Usage', message: 'CPU usage exceeded 90% for more than 5 minutes' },
      { type: 'system' as const, severity: 'warning' as const, title: 'Memory Usage High', message: 'Memory usage at 75%, consider optimization' },
      { type: 'database' as const, severity: 'critical' as const, title: 'Database Connection Pool Exhausted', message: 'All database connections in use' },
      { type: 'database' as const, severity: 'warning' as const, title: 'Slow Query Detected', message: 'Query execution time exceeded 2 seconds' },
      { type: 'api' as const, severity: 'critical' as const, title: 'API Endpoint Down', message: 'Vaccination endpoint not responding' },
      { type: 'api' as const, severity: 'warning' as const, title: 'High API Response Time', message: 'Average response time increased to 1.5s' },
      { type: 'security' as const, severity: 'critical' as const, title: 'Multiple Failed Login Attempts', message: 'Possible brute force attack detected' },
      { type: 'security' as const, severity: 'warning' as const, title: 'SSL Certificate Expiring Soon', message: 'Certificate expires in 30 days' },
      { type: 'performance' as const, severity: 'warning' as const, title: 'Disk Space Low', message: 'Disk usage at 85%, cleanup recommended' },
      { type: 'performance' as const, severity: 'info' as const, title: 'Performance Optimization Available', message: 'Database indexes can be optimized' }
    ];

    for (let i = 0; i < 50; i++) {
      const template = alertTemplates[i % alertTemplates.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);
      
      const acknowledged = Math.random() > 0.4;
      const resolved = acknowledged && Math.random() > 0.3;

      const affectedResources = this.getAffectedResources(template.type);

      alerts.push({
        id: `ALERT-${Date.now()}-${i}`,
        alertType: template.type,
        severity: template.severity,
        title: template.title,
        message: template.message,
        timestamp,
        acknowledged,
        acknowledgedBy: acknowledged ? ['Admin User', 'System Manager', 'DevOps Engineer'][Math.floor(Math.random() * 3)] : undefined,
        acknowledgedAt: acknowledged ? new Date(timestamp.getTime() + Math.random() * 60 * 60 * 1000) : undefined,
        resolved,
        resolvedAt: resolved ? new Date(timestamp.getTime() + Math.random() * 120 * 60 * 1000) : undefined,
        affectedResources
      });
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  generateMockSystemMetrics(): SystemMetric[] {
    return [
      {
        id: 'CPU-001',
        metricName: 'CPU Usage',
        metricType: 'system',
        currentValue: 45 + Math.random() * 20,
        unit: '%',
        status: 'healthy',
        threshold: { warning: 70, critical: 90 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(40, 60, 20)
      },
      {
        id: 'MEM-001',
        metricName: 'Memory Usage',
        metricType: 'system',
        currentValue: 60 + Math.random() * 15,
        unit: '%',
        status: 'healthy',
        threshold: { warning: 75, critical: 90 },
        trend: 'up',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(50, 70, 20)
      },
      {
        id: 'DISK-001',
        metricName: 'Disk Usage',
        metricType: 'system',
        currentValue: 55 + Math.random() * 10,
        unit: '%',
        status: 'healthy',
        threshold: { warning: 80, critical: 95 },
        trend: 'up',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(45, 65, 20)
      },
      {
        id: 'NET-001',
        metricName: 'Network Latency',
        metricType: 'system',
        currentValue: 20 + Math.random() * 30,
        unit: 'ms',
        status: 'healthy',
        threshold: { warning: 100, critical: 200 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(15, 50, 20)
      },
      {
        id: 'DB-001',
        metricName: 'Database Connections',
        metricType: 'database',
        currentValue: 45 + Math.floor(Math.random() * 30),
        unit: 'connections',
        status: 'healthy',
        threshold: { warning: 80, critical: 95 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(30, 70, 20)
      },
      {
        id: 'DB-002',
        metricName: 'Query Response Time',
        metricType: 'database',
        currentValue: 50 + Math.random() * 100,
        unit: 'ms',
        status: 'healthy',
        threshold: { warning: 500, critical: 1000 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(40, 150, 20)
      },
      {
        id: 'API-001',
        metricName: 'API Requests per Second',
        metricType: 'api',
        currentValue: 50 + Math.floor(Math.random() * 100),
        unit: 'req/s',
        status: 'healthy',
        threshold: { warning: 200, critical: 300 },
        trend: 'up',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(30, 120, 20)
      },
      {
        id: 'API-002',
        metricName: 'API Error Rate',
        metricType: 'api',
        currentValue: 0.5 + Math.random() * 2,
        unit: '%',
        status: 'healthy',
        threshold: { warning: 5, critical: 10 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(0.3, 3, 20)
      },
      {
        id: 'APP-001',
        metricName: 'Active Users',
        metricType: 'application',
        currentValue: 150 + Math.floor(Math.random() * 100),
        unit: 'users',
        status: 'healthy',
        threshold: { warning: 500, critical: 800 },
        trend: 'up',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(100, 250, 20)
      },
      {
        id: 'APP-002',
        metricName: 'Transaction Processing Time',
        metricType: 'application',
        currentValue: 200 + Math.random() * 300,
        unit: 'ms',
        status: 'healthy',
        threshold: { warning: 1000, critical: 2000 },
        trend: 'stable',
        lastUpdated: new Date(),
        historicalData: this.generateHistoricalData(150, 500, 20)
      }
    ];
  }

  generateHistoricalData(min: number, max: number, count: number): HistoricalPoint[] {
    const data: HistoricalPoint[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      data.push({
        timestamp: new Date(now.getTime() - i * 5 * 60 * 1000),
        value: min + Math.random() * (max - min)
      });
    }
    return data;
  }

  generateMockDataQualityMetrics(): DataQualityMetric[] {
    const dataSources = ['Patients', 'Vaccinations', 'Inventory', 'Facilities', 'Campaigns'];
    const dimensions: DataQualityMetric['qualityDimension'][] = ['completeness', 'accuracy', 'consistency', 'timeliness'];
    const metrics: DataQualityMetric[] = [];

    dataSources.forEach(source => {
      dimensions.forEach(dimension => {
        const score = 70 + Math.random() * 30;
        const totalRecords = 1000 + Math.floor(Math.random() * 4000);
        const validRecords = Math.floor(totalRecords * (score / 100));
        
        metrics.push({
          id: `DQ-${source}-${dimension}`,
          dataSource: source,
          qualityDimension: dimension,
          score: score,
          issues: totalRecords - validRecords,
          status: score >= 95 ? 'excellent' : score >= 85 ? 'good' : score >= 70 ? 'fair' : 'poor',
          lastChecked: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
          details: {
            totalRecords,
            validRecords,
            invalidRecords: totalRecords - validRecords,
            missingFields: this.getMissingFields(dimension)
          }
        });
      });
    });

    return metrics;
  }

  getMissingFields(dimension: string): string[] {
    const fieldMap: Record<string, string[]> = {
      completeness: ['phoneNumber', 'email', 'address'],
      accuracy: ['dateOfBirth', 'guardianName'],
      consistency: ['vaccineType', 'batchNumber'],
      timeliness: ['lastUpdated', 'createdAt']
    };
    return fieldMap[dimension] || [];
  }

  generateMockApiEndpoints(): ApiEndpoint[] {
    const endpoints = [
      { name: 'Get Patients', method: 'GET' as const, path: '/api/patients' },
      { name: 'Create Vaccination', method: 'POST' as const, path: '/api/vaccinations' },
      { name: 'Update Inventory', method: 'PUT' as const, path: '/api/inventory' },
      { name: 'Get Reports', method: 'GET' as const, path: '/api/reports' },
      { name: 'Create Campaign', method: 'POST' as const, path: '/api/campaigns' },
      { name: 'Get Facilities', method: 'GET' as const, path: '/api/facilities' },
      { name: 'Update Patient', method: 'PUT' as const, path: '/api/patients/:id' },
      { name: 'Delete Batch', method: 'DELETE' as const, path: '/api/batches/:id' }
    ];

    return endpoints.map((endpoint, index) => {
      const successRate = 95 + Math.random() * 4.9;
      const requestCount = 1000 + Math.floor(Math.random() * 9000);
      
      return {
        id: `EP-${index + 1}`,
        endpointName: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        averageResponseTime: 50 + Math.random() * 200,
        successRate,
        errorRate: 100 - successRate,
        requestCount,
        lastRequest: new Date(Date.now() - Math.random() * 60 * 1000),
        status: successRate >= 99 ? 'healthy' : successRate >= 95 ? 'degraded' : 'down',
        recentErrors: this.generateRecentErrors(endpoint.path, Math.floor((100 - successRate) * requestCount / 100))
      };
    });
  }

  generateRecentErrors(path: string, count: number): ApiError[] {
    const errors: ApiError[] = [];
    const errorCodes = [400, 401, 403, 404, 500, 502, 503];
    const errorMessages = [
      'Bad Request - Invalid parameters',
      'Unauthorized - Token expired',
      'Forbidden - Insufficient permissions',
      'Not Found - Resource does not exist',
      'Internal Server Error',
      'Bad Gateway',
      'Service Unavailable'
    ];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const codeIndex = Math.floor(Math.random() * errorCodes.length);
      errors.push({
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        statusCode: errorCodes[codeIndex],
        errorMessage: errorMessages[codeIndex],
        requestPath: path
      });
    }

    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  generateMockOperationalMetrics(): OperationalMetric[] {
    return [
      {
        id: 'OP-001',
        metricName: 'Daily Active Users',
        currentValue: 250,
        previousValue: 230,
        changePercent: 8.7,
        unit: 'users',
        trend: 'up',
        status: 'positive'
      },
      {
        id: 'OP-002',
        metricName: 'Vaccinations Today',
        currentValue: 450,
        previousValue: 420,
        changePercent: 7.1,
        unit: 'vaccinations',
        trend: 'up',
        status: 'positive'
      },
      {
        id: 'OP-003',
        metricName: 'System Response Time',
        currentValue: 120,
        previousValue: 150,
        changePercent: -20,
        unit: 'ms',
        trend: 'down',
        status: 'positive'
      },
      {
        id: 'OP-004',
        metricName: 'Error Rate',
        currentValue: 0.8,
        previousValue: 1.2,
        changePercent: -33.3,
        unit: '%',
        trend: 'down',
        status: 'positive'
      },
      {
        id: 'OP-005',
        metricName: 'Storage Used',
        currentValue: 65,
        previousValue: 60,
        changePercent: 8.3,
        unit: 'GB',
        trend: 'up',
        status: 'neutral'
      },
      {
        id: 'OP-006',
        metricName: 'Data Sync Failures',
        currentValue: 5,
        previousValue: 2,
        changePercent: 150,
        unit: 'failures',
        trend: 'up',
        status: 'negative'
      }
    ];
  }

  getAffectedResources(alertType: SystemAlert['alertType']): string[] {
    const resourceMap: Record<SystemAlert['alertType'], string[]> = {
      system: ['Application Server', 'Web Server', 'Load Balancer'],
      database: ['Primary Database', 'Replica Database', 'Connection Pool'],
      api: ['REST API', 'GraphQL API', 'WebSocket Server'],
      security: ['Authentication Service', 'Authorization Service', 'Firewall'],
      performance: ['Cache Server', 'CDN', 'Background Jobs']
    };

    const resources = resourceMap[alertType] || [];
    const count = 1 + Math.floor(Math.random() * 2);
    return resources.slice(0, count);
  }

  updateSystemHealth(): void {
    const now = new Date();
    const lastRestart = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const uptime = (now.getTime() - lastRestart.getTime()) / 1000;

    this.systemHealth = {
      overallStatus: this.calculateOverallStatus(),
      uptime,
      uptimePercentage: 99.5 + Math.random() * 0.4,
      lastRestart,
      memoryUsage: 60 + Math.random() * 15,
      cpuUsage: 45 + Math.random() * 20,
      diskUsage: 55 + Math.random() * 10,
      activeConnections: 150 + Math.floor(Math.random() * 100),
      queuedJobs: Math.floor(Math.random() * 50)
    };
  }

  calculateOverallStatus(): SystemHealth['overallStatus'] {
    const criticalMetrics = this.systemMetrics.filter(m => m.status === 'critical').length;
    const warningMetrics = this.systemMetrics.filter(m => m.status === 'warning').length;

    if (criticalMetrics > 0) return 'critical';
    if (warningMetrics > 2) return 'degraded';
    return 'healthy';
  }

  calculateAnalytics(): void {
    const acknowledgedAlerts = this.systemAlerts.filter(a => a.acknowledged);
    const resolvedAlerts = this.systemAlerts.filter(a => a.resolved);

    let totalResolutionTime = 0;
    resolvedAlerts.forEach(alert => {
      if (alert.resolvedAt) {
        totalResolutionTime += (alert.resolvedAt.getTime() - alert.timestamp.getTime()) / (1000 * 60);
      }
    });

    this.analytics = {
      totalAlerts: this.systemAlerts.length,
      criticalAlerts: this.systemAlerts.filter(a => a.severity === 'critical').length,
      warningAlerts: this.systemAlerts.filter(a => a.severity === 'warning').length,
      infoAlerts: this.systemAlerts.filter(a => a.severity === 'info').length,
      acknowledgedAlerts: acknowledgedAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      averageResolutionTime: resolvedAlerts.length > 0 ? totalResolutionTime / resolvedAlerts.length : 0,
      systemHealthScore: this.calculateHealthScore(this.systemMetrics.filter(m => m.metricType === 'system')),
      dataQualityScore: this.calculateDataQualityScore(),
      apiHealthScore: this.calculateApiHealthScore(),
      performanceScore: this.calculatePerformanceScore()
    };
  }

  calculateHealthScore(metrics: SystemMetric[]): number {
    if (metrics.length === 0) return 100;
    
    let totalScore = 0;
    metrics.forEach(metric => {
      const percentOfWarning = (metric.currentValue / metric.threshold.warning) * 100;
      const score = Math.max(0, 100 - percentOfWarning);
      totalScore += score;
    });

    return totalScore / metrics.length;
  }

  calculateDataQualityScore(): number {
    if (this.dataQualityMetrics.length === 0) return 100;
    const totalScore = this.dataQualityMetrics.reduce((sum, m) => sum + m.score, 0);
    return totalScore / this.dataQualityMetrics.length;
  }

  calculateApiHealthScore(): number {
    if (this.apiEndpoints.length === 0) return 100;
    const totalSuccessRate = this.apiEndpoints.reduce((sum, e) => sum + e.successRate, 0);
    return totalSuccessRate / this.apiEndpoints.length;
  }

  calculatePerformanceScore(): number {
    const cpuScore = Math.max(0, 100 - this.systemHealth.cpuUsage);
    const memoryScore = Math.max(0, 100 - this.systemHealth.memoryUsage);
    const diskScore = Math.max(0, 100 - this.systemHealth.diskUsage);
    return (cpuScore + memoryScore + diskScore) / 3;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.systemAlerts];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search) ||
        alert.id.toLowerCase().includes(search)
      );
    }

    if (filters.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    if (filters.alertType) {
      filtered = filtered.filter(alert => alert.alertType === filters.alertType);
    }

    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(alert => !alert.resolved);
      } else if (filters.status === 'acknowledged') {
        filtered = filtered.filter(alert => alert.acknowledged && !alert.resolved);
      } else if (filters.status === 'resolved') {
        filtered = filtered.filter(alert => alert.resolved);
      }
    }

    if (filters.dateRange?.start && filters.dateRange?.end) {
      const start = new Date(filters.dateRange.start).setHours(0, 0, 0, 0);
      const end = new Date(filters.dateRange.end).setHours(23, 59, 59, 999);
      filtered = filtered.filter(alert => {
        const alertTime = alert.timestamp.getTime();
        return alertTime >= start && alertTime <= end;
      });
    }

    this.filteredAlerts = filtered;
    this.updateDisplayedAlerts();
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  updateDisplayedAlerts(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.displayedAlerts = this.filteredAlerts.slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedAlerts();
  }

  openAlertDialog(alert: SystemAlert): void {
    this.selectedAlert = alert;
    this.alertForm.patchValue({
      acknowledgedBy: '',
      notes: ''
    });
    this.showAlertDialog = true;
  }

  closeAlertDialog(): void {
    this.showAlertDialog = false;
    this.selectedAlert = null;
    this.alertForm.reset();
  }

  acknowledgeAlert(): void {
    if (this.selectedAlert && this.alertForm.valid) {
      const formValue = this.alertForm.value;
      this.selectedAlert.acknowledged = true;
      this.selectedAlert.acknowledgedBy = formValue.acknowledgedBy;
      this.selectedAlert.acknowledgedAt = new Date();
      
      this.saveToLocalStorage();
      this.calculateAnalytics();
      this.applyFilters();
      this.closeAlertDialog();
    }
  }

  resolveAlert(alert: SystemAlert): void {
    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (!alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
    }
    this.saveToLocalStorage();
    this.calculateAnalytics();
    this.applyFilters();
  }

  deleteAlert(alert: SystemAlert): void {
    if (confirm(`Are you sure you want to delete alert "${alert.title}"?`)) {
      const index = this.systemAlerts.findIndex(a => a.id === alert.id);
      if (index > -1) {
        this.systemAlerts.splice(index, 1);
        this.saveToLocalStorage();
        this.calculateAnalytics();
        this.applyFilters();
      }
    }
  }

  startRealTimeUpdates(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.updateMetrics();
    });
  }

  stopRealTimeUpdates(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  updateMetrics(): void {
    this.systemMetrics.forEach(metric => {
      const change = (Math.random() - 0.5) * 10;
      metric.currentValue = Math.max(0, metric.currentValue + change);
      
      metric.status = metric.currentValue >= metric.threshold.critical ? 'critical' :
                      metric.currentValue >= metric.threshold.warning ? 'warning' : 'healthy';
      
      metric.lastUpdated = new Date();
      
      metric.historicalData.shift();
      metric.historicalData.push({
        timestamp: new Date(),
        value: metric.currentValue
      });
    });

    this.updateSystemHealth();
    this.calculateAnalytics();
  }

  exportData(format: 'csv' | 'json'): void {
    if (format === 'csv') {
      const csv = this.generateCsv();
      this.downloadFile(csv, 'system-alerts.csv', 'text/csv');
    } else if (format === 'json') {
      const json = JSON.stringify(this.systemAlerts, null, 2);
      this.downloadFile(json, 'system-alerts.json', 'application/json');
    }
  }

  generateCsv(): string {
    const headers = ['ID', 'Timestamp', 'Severity', 'Type', 'Title', 'Message', 'Status', 'Acknowledged By', 'Resolved'];
    const rows = this.systemAlerts.map(alert => [
      alert.id,
      this.formatDate(alert.timestamp),
      alert.severity,
      alert.alertType,
      alert.title,
      alert.message,
      alert.resolved ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active',
      alert.acknowledgedBy || 'N/A',
      alert.resolved ? 'Yes' : 'No'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  saveToLocalStorage(): void {
    localStorage.setItem('systemAlerts', JSON.stringify(this.systemAlerts));
  }

  loadFromLocalStorage(): SystemAlert[] | null {
    const data = localStorage.getItem('systemAlerts');
    if (data) {
      const alerts = JSON.parse(data);
      alerts.forEach((alert: SystemAlert) => {
        alert.timestamp = new Date(alert.timestamp);
        if (alert.acknowledgedAt) alert.acknowledgedAt = new Date(alert.acknowledgedAt);
        if (alert.resolvedAt) alert.resolvedAt = new Date(alert.resolvedAt);
      });
      return alerts;
    }
    return null;
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      healthy: '#10b981',
      degraded: '#f59e0b',
      critical: '#ef4444',
      down: '#991b1b'
    };
    return colors[status] || '#6b7280';
  }

  getQualityStatusColor(status: string): string {
    const colors: Record<string, string> = {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      poor: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${Math.floor(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  // ============ Predictive Analytics Methods ============

  runPredictiveAnalysis(): void {
    this.generateMetricPredictions();
    this.detectAnomalies();
    this.generatePredictiveRecommendations();
    this.predictiveAnalytics.confidenceScore = this.calculateConfidenceScore();
    this.predictiveAnalytics.lastAnalyzed = new Date();
  }

  generateMetricPredictions(): void {
    const predictions: MetricPrediction[] = [];

    this.systemMetrics.forEach(metric => {
      const prediction = this.predictMetricValue(metric);
      if (prediction) {
        predictions.push(prediction);
      }
    });

    this.predictiveAnalytics.predictions = predictions;
  }

  predictMetricValue(metric: SystemMetric): MetricPrediction | null {
    if (metric.historicalData.length < 5) return null;

    // Simple linear regression for prediction
    const recentData = metric.historicalData.slice(-10);
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    recentData.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predictedValue = slope * n + intercept;

    // Calculate confidence based on data variance
    const variance = recentData.reduce((acc, point) => {
      const predicted = slope * recentData.indexOf(point) + intercept;
      return acc + Math.pow(point.value - predicted, 2);
    }, 0) / n;
    const confidence = Math.max(0, Math.min(100, 100 - (variance / metric.currentValue) * 100));

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > metric.currentValue * 0.05) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Check if will exceed threshold
    const willExceedThreshold = predictedValue > metric.threshold.warning;
    const timeToThreshold = willExceedThreshold && slope > 0
      ? Math.floor((metric.threshold.warning - metric.currentValue) / slope) * 5
      : undefined;

    return {
      metricId: metric.id,
      metricName: metric.metricName,
      currentValue: metric.currentValue,
      predictedValue: Math.max(0, predictedValue),
      predictionTime: new Date(Date.now() + 30 * 60000), // 30 minutes ahead
      confidence: Math.round(confidence),
      trend,
      willExceedThreshold,
      timeToThreshold
    };
  }

  detectAnomalies(): void {
    const anomalies: AnomalyDetection[] = [];

    this.systemMetrics.forEach(metric => {
      const anomaly = this.checkForAnomaly(metric);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    });

    this.predictiveAnalytics.anomalies = anomalies;
  }

  checkForAnomaly(metric: SystemMetric): AnomalyDetection | null {
    if (metric.historicalData.length < 10) return null;

    const recentData = metric.historicalData.slice(-10);
    const values = recentData.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);

    const currentValue = metric.currentValue;
    const deviation = Math.abs(currentValue - mean);
    const deviationPercentage = (deviation / mean) * 100;

    // Detect anomaly if current value is more than 2 standard deviations from mean
    if (deviation > 2 * stdDev) {
      let anomalyType: 'spike' | 'drop' | 'pattern_break' | 'sustained_deviation' = 'sustained_deviation';
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (currentValue > mean + 2 * stdDev) {
        anomalyType = 'spike';
        severity = currentValue > metric.threshold.critical ? 'high' : 'medium';
      } else if (currentValue < mean - 2 * stdDev) {
        anomalyType = 'drop';
        severity = 'medium';
      }

      // Check for pattern break (sudden change in last few readings)
      const lastThree = values.slice(-3);
      const avgLastThree = lastThree.reduce((a, b) => a + b, 0) / 3;
      if (Math.abs(avgLastThree - mean) > stdDev) {
        anomalyType = 'pattern_break';
      }

      const potentialCauses = this.identifyPotentialCauses(metric, anomalyType);

      return {
        id: `anomaly-${metric.id}-${Date.now()}`,
        metricId: metric.id,
        metricName: metric.metricName,
        detectedAt: new Date(),
        anomalyType,
        severity,
        deviationPercentage: Math.round(deviationPercentage),
        expectedValue: Math.round(mean),
        actualValue: Math.round(currentValue),
        description: this.getAnomalyDescription(anomalyType, metric.metricName, deviationPercentage),
        potentialCauses
      };
    }

    return null;
  }

  identifyPotentialCauses(metric: SystemMetric, anomalyType: string): string[] {
    const causes: string[] = [];

    switch (metric.metricType) {
      case 'system':
        if (anomalyType === 'spike') {
          causes.push('High traffic load', 'Memory leak', 'Background processes running', 'DDoS attack');
        } else {
          causes.push('Service degradation', 'Resource allocation issue', 'Configuration change');
        }
        break;
      case 'database':
        if (anomalyType === 'spike') {
          causes.push('Inefficient queries', 'Missing indexes', 'Connection pool exhaustion', 'Lock contention');
        } else {
          causes.push('Database offline', 'Connection issues', 'Query optimization needed');
        }
        break;
      case 'api':
        if (anomalyType === 'spike') {
          causes.push('Increased request volume', 'Slow third-party services', 'API rate limiting', 'Network latency');
        } else {
          causes.push('Service outage', 'DNS issues', 'Authentication problems');
        }
        break;
      case 'application':
        causes.push('Code deployment', 'Configuration change', 'Resource contention', 'External dependency issue');
        break;
    }

    return causes;
  }

  private getAnomalyDescription(type: string, metricName: string, deviation: number): string {
    const descriptions: Record<string, string> = {
      spike: `Unusual spike detected in ${metricName}. Value is ${deviation.toFixed(1)}% above expected range.`,
      drop: `Significant drop detected in ${metricName}. Value is ${deviation.toFixed(1)}% below expected range.`,
      pattern_break: `Pattern break detected in ${metricName}. Recent values deviate from historical trends.`,
      sustained_deviation: `Sustained deviation in ${metricName}. Value has been ${deviation.toFixed(1)}% off from normal for extended period.`
    };
    return descriptions[type] || 'Anomaly detected in metric behavior.';
  }

  generatePredictiveRecommendations(): void {
    const recommendations: PredictiveRecommendation[] = [];

    // Analyze predictions for recommendations
    this.predictiveAnalytics.predictions.forEach(prediction => {
      if (prediction.willExceedThreshold) {
        recommendations.push({
          id: `rec-${Date.now()}-${prediction.metricId}`,
          category: 'preventive',
          priority: prediction.timeToThreshold && prediction.timeToThreshold < 60 ? 'critical' : 'high',
          title: `Prevent ${prediction.metricName} Threshold Breach`,
          description: `${prediction.metricName} is predicted to exceed warning threshold in ${prediction.timeToThreshold} minutes.`,
          impact: 'Prevents potential service degradation and maintains system health',
          estimatedEffort: '1-2 hours',
          potentialSavings: 'Prevents downtime costs ($500-2000)',
          implementationSteps: this.getPreventiveSteps(prediction.metricName),
          relatedMetrics: [prediction.metricId]
        });
      }
    });

    // Analyze anomalies for recommendations
    this.predictiveAnalytics.anomalies.forEach(anomaly => {
      if (anomaly.severity === 'high' || anomaly.severity === 'medium') {
        recommendations.push({
          id: `rec-${Date.now()}-${anomaly.metricId}`,
          category: 'optimization',
          priority: anomaly.severity === 'high' ? 'high' : 'medium',
          title: `Investigate ${anomaly.metricName} Anomaly`,
          description: anomaly.description,
          impact: 'Resolves performance issues and improves system stability',
          estimatedEffort: '2-4 hours',
          implementationSteps: [
            'Review recent system changes',
            'Analyze logs for error patterns',
            'Check resource utilization',
            'Investigate potential causes: ' + anomaly.potentialCauses.join(', ')
          ],
          relatedMetrics: [anomaly.metricId]
        });
      }
    });

    // Capacity planning recommendations
    const highUtilizationMetrics = this.systemMetrics.filter(m => 
      m.currentValue > m.threshold.warning * 0.9
    );

    if (highUtilizationMetrics.length > 0) {
      recommendations.push({
        id: `rec-capacity-${Date.now()}`,
        category: 'capacity',
        priority: 'high',
        title: 'Capacity Planning Required',
        description: `${highUtilizationMetrics.length} metrics approaching capacity limits. Consider scaling resources.`,
        impact: 'Ensures system can handle growth and prevents capacity-related outages',
        estimatedEffort: '4-8 hours',
        potentialSavings: 'Prevents emergency scaling costs ($1000-5000)',
        implementationSteps: [
          'Review current resource allocation',
          'Analyze growth trends',
          'Plan for horizontal/vertical scaling',
          'Implement auto-scaling policies',
          'Set up capacity alerts'
        ],
        relatedMetrics: highUtilizationMetrics.map(m => m.id)
      });
    }

    this.predictiveAnalytics.recommendations = recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  getPreventiveSteps(metricName: string): string[] {
    const steps: Record<string, string[]> = {
      'CPU Usage': [
        'Identify CPU-intensive processes',
        'Optimize application code',
        'Scale horizontally by adding instances',
        'Implement caching strategies'
      ],
      'Memory Usage': [
        'Check for memory leaks',
        'Optimize object allocation',
        'Increase heap size if necessary',
        'Implement garbage collection tuning'
      ],
      'Disk Usage': [
        'Clean up old logs and temporary files',
        'Archive historical data',
        'Increase storage capacity',
        'Implement data retention policies'
      ],
      'API Error Rate': [
        'Review recent code changes',
        'Check third-party service status',
        'Implement retry logic',
        'Add circuit breakers'
      ]
    };

    return steps[metricName] || [
      'Monitor metric closely',
      'Review recent changes',
      'Check system logs',
      'Consult documentation'
    ];
  }

  calculateConfidenceScore(): number {
    if (this.predictiveAnalytics.predictions.length === 0) return 0;

    const avgConfidence = this.predictiveAnalytics.predictions.reduce((sum, pred) => 
      sum + pred.confidence, 0) / this.predictiveAnalytics.predictions.length;

    // Adjust based on data completeness
    const dataCompleteness = this.systemMetrics.filter(m => 
      m.historicalData.length >= 10).length / this.systemMetrics.length;

    return Math.round(avgConfidence * dataCompleteness);
  }

  // Alert Threshold Configuration Methods

  openThresholdConfig(): void {
    this.showThresholdDialog = true;
    this.initializeAlertThresholds();
  }

  closeThresholdDialog(): void {
    this.showThresholdDialog = false;
  }

  initializeAlertThresholds(): void {
    this.alertThresholds = this.systemMetrics.map(metric => ({
      metricId: metric.id,
      metricName: metric.metricName,
      warningThreshold: metric.threshold.warning,
      criticalThreshold: metric.threshold.critical,
      notificationEnabled: true,
      notificationChannels: ['email'],
      cooldownPeriod: 300 // 5 minutes
    }));
  }

  updateThreshold(config: AlertThresholdConfig): void {
    const metric = this.systemMetrics.find(m => m.id === config.metricId);
    if (metric) {
      metric.threshold.warning = config.warningThreshold;
      metric.threshold.critical = config.criticalThreshold;
      
      // Recalculate status based on new thresholds
      if (metric.currentValue >= config.criticalThreshold) {
        metric.status = 'critical';
      } else if (metric.currentValue >= config.warningThreshold) {
        metric.status = 'warning';
      } else {
        metric.status = 'healthy';
      }

      // Save to localStorage
      this.saveToLocalStorage();
      
      // Trigger notification if enabled and threshold exceeded
      if (config.notificationEnabled && metric.status !== 'healthy') {
        this.triggerThresholdNotification(metric, config);
      }
    }
  }

  triggerThresholdNotification(metric: SystemMetric, config: AlertThresholdConfig): void {
    // Create alert for threshold breach
    const alert: SystemAlert = {
      id: `alert-threshold-${Date.now()}`,
      alertType: metric.metricType === 'system' ? 'system' : 
                 metric.metricType === 'database' ? 'database' : 
                 metric.metricType === 'api' ? 'api' : 'performance',
      severity: metric.status === 'critical' ? 'critical' : 'warning',
      title: `Threshold Exceeded: ${metric.metricName}`,
      message: `${metric.metricName} has exceeded ${metric.status} threshold. Current value: ${metric.currentValue.toFixed(1)}${metric.unit}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      affectedResources: [metric.metricName]
    };

    this.systemAlerts.unshift(alert);
    this.applyFilters();
    this.calculateAnalytics();
    this.saveToLocalStorage();

    console.log(`Notification triggered for ${metric.metricName} via channels:`, config.notificationChannels);
  }

  // Predictive Dialog Methods

  openPredictionDetails(prediction: MetricPrediction): void {
    this.selectedPrediction = prediction;
    this.showPredictiveDialog = true;
  }

  openAnomalyDetails(anomaly: AnomalyDetection): void {
    this.selectedAnomaly = anomaly;
    this.showPredictiveDialog = true;
  }

  closePredictiveDialog(): void {
    this.showPredictiveDialog = false;
    this.selectedPrediction = null;
    this.selectedAnomaly = null;
  }

  getPredictionSeverityColor(prediction: MetricPrediction): string {
    if (prediction.willExceedThreshold) {
      return prediction.timeToThreshold && prediction.timeToThreshold < 60 ? '#ef4444' : '#f59e0b';
    }
    return '#10b981';
  }

  getAnomalySeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  }

  getRecommendationPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  }

  // ============ Historical Analytics Methods ============

  changeHistoricalPeriod(period: '7days' | '30days' | '90days'): void {
    this.historicalAnalytics.selectedPeriod = period;
    this.generateHistoricalTrends();
    this.generateTrendComparisons();
    this.identifyTopMetrics();
    this.historicalAnalytics.lastUpdated = new Date();
  }

  generateHistoricalTrends(): void {
    const trends: HistoricalTrend[] = [];
    const daysCount = this.getDaysFromPeriod(this.historicalAnalytics.selectedPeriod);

    this.systemMetrics.forEach(metric => {
      if (metric.historicalData.length >= 2) {
        const relevantData = this.getDataForPeriod(metric.historicalData, daysCount);
        
        if (relevantData.length > 0) {
          const values = relevantData.map(d => d.value);
          const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
          const minValue = Math.min(...values);
          const maxValue = Math.max(...values);

          // Calculate trend direction
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

          let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
          if (Math.abs(changePercent) > 5) {
            trendDirection = changePercent > 0 ? 'increasing' : 'decreasing';
          }

          const dataPoints: HistoricalDataPoint[] = relevantData.map(point => ({
            timestamp: point.timestamp,
            value: point.value,
            status: this.getStatusFromValue(point.value, metric.threshold)
          }));

          trends.push({
            period: this.historicalAnalytics.selectedPeriod,
            metricId: metric.id,
            metricName: metric.metricName,
            dataPoints,
            averageValue: Math.round(avgValue * 100) / 100,
            minValue: Math.round(minValue * 100) / 100,
            maxValue: Math.round(maxValue * 100) / 100,
            trendDirection,
            changePercentage: Math.round(changePercent * 100) / 100
          });
        }
      }
    });

    this.historicalAnalytics.trends = trends;
  }

  getDataForPeriod(historicalData: any[], days: number): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return historicalData.filter(d => new Date(d.timestamp) >= cutoffDate);
  }

  getDaysFromPeriod(period: '7days' | '30days' | '90days'): number {
    const periodMap = { '7days': 7, '30days': 30, '90days': 90 };
    return periodMap[period];
  }

  getStatusFromValue(value: number, threshold: { warning: number; critical: number }): 'healthy' | 'warning' | 'critical' {
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'healthy';
  }

  generateTrendComparisons(): void {
    const comparisons: TrendComparison[] = [];
    const daysCount = this.getDaysFromPeriod(this.historicalAnalytics.selectedPeriod);

    this.systemMetrics.forEach(metric => {
      if (metric.historicalData.length >= daysCount * 2) {
        const now = new Date();
        const currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - daysCount);
        
        const previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysCount);
        
        const currentData = metric.historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return date >= currentPeriodStart && date <= now;
        });

        const previousData = metric.historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return date >= previousPeriodStart && date < currentPeriodStart;
        });

        if (currentData.length > 0 && previousData.length > 0) {
          const currentValues = currentData.map(d => d.value);
          const previousValues = previousData.map(d => d.value);

          const currentAvg = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
          const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length;
          const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;

          comparisons.push({
            metricId: metric.id,
            metricName: metric.metricName,
            currentPeriod: {
              startDate: currentPeriodStart,
              endDate: now,
              averageValue: Math.round(currentAvg * 100) / 100,
              peakValue: Math.max(...currentValues),
              lowestValue: Math.min(...currentValues)
            },
            previousPeriod: {
              startDate: previousPeriodStart,
              endDate: currentPeriodStart,
              averageValue: Math.round(previousAvg * 100) / 100,
              peakValue: Math.max(...previousValues),
              lowestValue: Math.min(...previousValues)
            },
            percentageChange: Math.round(percentChange * 100) / 100,
            improvement: percentChange < 0 // Lower values are better for most metrics
          });
        }
      }
    });

    this.historicalAnalytics.comparisons = comparisons;
  }

  identifyTopMetrics(): void {
    const improved = this.historicalAnalytics.comparisons
      .filter(c => c.improvement)
      .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
      .slice(0, 5)
      .map(c => ({
        metricName: c.metricName,
        improvement: Math.abs(c.percentageChange)
      }));

    const degraded = this.historicalAnalytics.comparisons
      .filter(c => !c.improvement)
      .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
      .slice(0, 5)
      .map(c => ({
        metricName: c.metricName,
        degradation: Math.abs(c.percentageChange)
      }));

    this.historicalAnalytics.topImprovedMetrics = improved;
    this.historicalAnalytics.topDegradedMetrics = degraded;
  }

  openTrendDetails(trend: HistoricalTrend): void {
    this.selectedTrend = trend;
    this.showHistoricalDialog = true;
  }

  closeHistoricalDialog(): void {
    this.showHistoricalDialog = false;
    this.selectedTrend = null;
  }

  openComparisonDetails(comparison: TrendComparison): void {
    this.selectedComparison = comparison;
    this.showComparisonDialog = true;
  }

  closeComparisonDialog(): void {
    this.showComparisonDialog = false;
    this.selectedComparison = null;
  }

  getTrendColor(direction: string): string {
    const colors: Record<string, string> = {
      increasing: '#ef4444',
      decreasing: '#10b981',
      stable: '#3b82f6'
    };
    return colors[direction] || '#6b7280';
  }

  getTrendIcon(direction: string): string {
    const icons: Record<string, string> = {
      increasing: 'trending_up',
      decreasing: 'trending_down',
      stable: 'trending_flat'
    };
    return icons[direction] || 'trending_flat';
  }

  exportHistoricalData(format: 'csv' | 'json'): void {
    const data = {
      period: this.historicalAnalytics.selectedPeriod,
      trends: this.historicalAnalytics.trends,
      comparisons: this.historicalAnalytics.comparisons,
      topImproved: this.historicalAnalytics.topImprovedMetrics,
      topDegraded: this.historicalAnalytics.topDegradedMetrics,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      this.downloadFile(jsonStr, 'historical-analysis.json', 'application/json');
    } else {
      let csv = 'Metric Name,Period,Average Value,Min Value,Max Value,Trend Direction,Change %\n';
      
      this.historicalAnalytics.trends.forEach(trend => {
        csv += `"${trend.metricName}",${trend.period},${trend.averageValue},${trend.minValue},${trend.maxValue},${trend.trendDirection},${trend.changePercentage}\n`;
      });

      csv += '\n\nComparisons\n';
      csv += 'Metric Name,Current Avg,Previous Avg,Change %,Improved\n';
      
      this.historicalAnalytics.comparisons.forEach(comp => {
        csv += `"${comp.metricName}",${comp.currentPeriod.averageValue},${comp.previousPeriod.averageValue},${comp.percentageChange},${comp.improvement}\n`;
      });

      this.downloadFile(csv, 'historical-analysis.csv', 'text/csv');
    }
  }
}
