import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface VaccineForecast {
  id: number;
  vaccineName: string;
  currentStock: number;
  averageDailyUsage: number;
  forecastPeriod: number; // in days
  predictedDemand: number;
  recommendedOrder: number;
  stockoutRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedCost: number;
  supplier: string;
  leadTime: number; // in days
  lastOrderDate: Date;
  expiryBuffer: number; // days before expiry to stop using
  seasonalFactor: number;
  trendFactor: number;
  campaignImpact: number;
  confidenceLevel: number; // percentage
}

interface DemandPrediction {
  month: string;
  predicted: number;
  actual: number;
  accuracy: number;
}

interface ResourceAllocation {
  facilityId: string;
  facilityName: string;
  allocatedBudget: number;
  utilizationRate: number;
  priority: 'High' | 'Medium' | 'Low';
  vaccines: { name: string; quantity: number }[];
  staffing: number;
  equipment: string[];
}

interface ForecastStats {
  totalPredictedDemand: number;
  totalRecommendedOrder: number;
  totalEstimatedCost: number;
  averageAccuracy: number;
  highRiskVaccines: number;
  daysUntilStockout: number;
}

interface ScenarioAnalysis {
  id: number;
  name: string;
  description: string;
  demandIncrease: number; // percentage
  budgetConstraint: number;
  impactScore: number;
  feasibility: 'High' | 'Medium' | 'Low';
  recommendations: string[];
}

@Component({
  selector: 'app-forecast-planning',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
    MatDividerModule
  ],
  templateUrl: './forecast-planning.component.html',
  styleUrl: './forecast-planning.component.scss'
})
export class ForecastPlanningComponent implements OnInit {
  forecasts: VaccineForecast[] = [];
  filteredForecasts: VaccineForecast[] = [];
  demandPredictions: DemandPrediction[] = [];
  resourceAllocations: ResourceAllocation[] = [];
  scenarios: ScenarioAnalysis[] = [];
  stats: ForecastStats = {
    totalPredictedDemand: 0,
    totalRecommendedOrder: 0,
    totalEstimatedCost: 0,
    averageAccuracy: 0,
    highRiskVaccines: 0,
    daysUntilStockout: 0
  };

  displayedColumns: string[] = ['vaccine', 'currentStock', 'predictedDemand', 'recommendedOrder', 'stockoutRisk', 'cost', 'supplier', 'actions'];

  filterForm: FormGroup;
  forecastForm: FormGroup;
  scenarioForm: FormGroup;
  allocationForm: FormGroup;

  showForecastDialog = false;
  showScenarioDialog = false;
  showAllocationDialog = false;
  showDetailDialog = false;
  isEditMode = false;
  selectedForecast: VaccineForecast | null = null;
  selectedScenario: ScenarioAnalysis | null = null;

  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  vaccines = ['BCG', 'OPV', 'DTP', 'Measles', 'Hepatitis B', 'Pentavalent', 'Rotavirus', 'Pneumococcal', 'HPV', 'Yellow Fever'];
  suppliers = ['Serum Institute of India', 'Bio-Manguinhos', 'Bharat Biotech', 'GlaxoSmithKline', 'Sanofi Pasteur'];
  riskOptions = ['Low', 'Medium', 'High', 'Critical'];
  facilities = [
    { id: 'FAC001', name: 'Central Hospital' },
    { id: 'FAC002', name: 'District Health Center' },
    { id: 'FAC003', name: 'Community Clinic' },
    { id: 'FAC004', name: 'Regional Medical Center' },
    { id: 'FAC005', name: 'Rural Health Post' }
  ];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      vaccineName: [''],
      stockoutRisk: [''],
      supplier: ['']
    });

    this.forecastForm = this.fb.group({
      id: [null],
      vaccineName: ['', Validators.required],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      averageDailyUsage: [0, [Validators.required, Validators.min(0)]],
      forecastPeriod: [30, [Validators.required, Validators.min(1)]],
      supplier: ['', Validators.required],
      leadTime: [14, [Validators.required, Validators.min(1)]],
      expiryBuffer: [30, [Validators.required, Validators.min(0)]],
      seasonalFactor: [1.0, [Validators.required, Validators.min(0)]],
      trendFactor: [1.0, [Validators.required, Validators.min(0)]],
      campaignImpact: [0, [Validators.required, Validators.min(0)]]
    });

    this.scenarioForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      demandIncrease: [0, [Validators.required, Validators.min(-100), Validators.max(500)]],
      budgetConstraint: [0, [Validators.required, Validators.min(0)]],
      feasibility: ['High', Validators.required]
    });

    this.allocationForm = this.fb.group({
      facilityId: ['', Validators.required],
      allocatedBudget: [0, [Validators.required, Validators.min(0)]],
      priority: ['Medium', Validators.required],
      staffing: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    if (this.forecasts.length === 0) {
      this.generateMockData();
    }
    this.calculateStats();
    this.generateDemandPredictions();
    this.generateResourceAllocations();
    this.generateScenarios();
    this.applyFilters();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  generateMockData(): void {
    const vaccines = this.vaccines;
    const suppliers = this.suppliers;
    
    this.forecasts = vaccines.map((vaccine, index) => {
      const currentStock = Math.floor(Math.random() * 500) + 100;
      const averageDailyUsage = Math.floor(Math.random() * 20) + 5;
      const forecastPeriod = 30;
      const seasonalFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const trendFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      const campaignImpact = Math.floor(Math.random() * 100);
      
      const baseDemand = averageDailyUsage * forecastPeriod;
      const predictedDemand = Math.round(baseDemand * seasonalFactor * trendFactor) + campaignImpact;
      
      const daysUntilStockout = currentStock / averageDailyUsage;
      const leadTime = Math.floor(Math.random() * 14) + 7;
      const recommendedOrder = Math.max(0, predictedDemand - currentStock + (averageDailyUsage * leadTime));
      
      let stockoutRisk: 'Low' | 'Medium' | 'High' | 'Critical';
      if (daysUntilStockout < 7) stockoutRisk = 'Critical';
      else if (daysUntilStockout < 14) stockoutRisk = 'High';
      else if (daysUntilStockout < 30) stockoutRisk = 'Medium';
      else stockoutRisk = 'Low';

      const unitCost = 5 + Math.random() * 15;
      const estimatedCost = recommendedOrder * unitCost;
      
      const confidenceLevel = 70 + Math.random() * 25;

      return {
        id: index + 1,
        vaccineName: vaccine,
        currentStock,
        averageDailyUsage,
        forecastPeriod,
        predictedDemand,
        recommendedOrder: Math.round(recommendedOrder),
        stockoutRisk,
        estimatedCost: Math.round(estimatedCost),
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        leadTime,
        lastOrderDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        expiryBuffer: 30,
        seasonalFactor: parseFloat(seasonalFactor.toFixed(2)),
        trendFactor: parseFloat(trendFactor.toFixed(2)),
        campaignImpact,
        confidenceLevel: Math.round(confidenceLevel)
      };
    });

    this.saveToLocalStorage();
  }

  generateDemandPredictions(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    this.demandPredictions = [];
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const predicted = 800 + Math.floor(Math.random() * 400);
      const actual = predicted + Math.floor((Math.random() - 0.5) * 200);
      const accuracy = Math.round((1 - Math.abs(predicted - actual) / predicted) * 100);

      this.demandPredictions.push({
        month: months[monthIndex],
        predicted,
        actual,
        accuracy
      });
    }
  }

  generateResourceAllocations(): void {
    this.resourceAllocations = this.facilities.map(facility => {
      const allocatedBudget = 50000 + Math.floor(Math.random() * 100000);
      const utilizationRate = 60 + Math.floor(Math.random() * 35);
      const priority = utilizationRate > 85 ? 'High' : utilizationRate > 70 ? 'Medium' : 'Low';
      
      const numVaccines = 3 + Math.floor(Math.random() * 3);
      const vaccines = [];
      for (let i = 0; i < numVaccines; i++) {
        vaccines.push({
          name: this.vaccines[Math.floor(Math.random() * this.vaccines.length)],
          quantity: Math.floor(Math.random() * 500) + 100
        });
      }

      return {
        facilityId: facility.id,
        facilityName: facility.name,
        allocatedBudget,
        utilizationRate,
        priority: priority as 'High' | 'Medium' | 'Low',
        vaccines,
        staffing: 5 + Math.floor(Math.random() * 15),
        equipment: ['Cold Storage', 'Vaccine Carrier', 'Temperature Monitor']
      };
    });
  }

  generateScenarios(): void {
    this.scenarios = [
      {
        id: 1,
        name: 'Epidemic Outbreak Response',
        description: 'Rapid response to disease outbreak with 50% demand increase',
        demandIncrease: 50,
        budgetConstraint: 500000,
        impactScore: 95,
        feasibility: 'Medium',
        recommendations: [
          'Activate emergency procurement protocols',
          'Coordinate with neighboring facilities',
          'Deploy mobile vaccination units',
          'Increase cold chain capacity by 30%'
        ]
      },
      {
        id: 2,
        name: 'Routine Scale-Up',
        description: 'Gradual increase in routine immunization coverage',
        demandIncrease: 20,
        budgetConstraint: 250000,
        impactScore: 78,
        feasibility: 'High',
        recommendations: [
          'Expand outreach programs',
          'Train additional healthcare workers',
          'Improve appointment scheduling',
          'Enhance community engagement'
        ]
      },
      {
        id: 3,
        name: 'Budget Constraint',
        description: 'Operation under 20% budget reduction',
        demandIncrease: -10,
        budgetConstraint: 150000,
        impactScore: 62,
        feasibility: 'High',
        recommendations: [
          'Prioritize high-impact vaccines',
          'Optimize stock rotation',
          'Reduce wastage by 50%',
          'Negotiate bulk purchase discounts'
        ]
      },
      {
        id: 4,
        name: 'Campaign Integration',
        description: 'Integration of multiple vaccination campaigns',
        demandIncrease: 35,
        budgetConstraint: 400000,
        impactScore: 88,
        feasibility: 'Medium',
        recommendations: [
          'Coordinate campaign schedules',
          'Pool resources across facilities',
          'Leverage volunteer networks',
          'Implement catch-up strategies'
        ]
      }
    ];
  }

  calculateStats(): void {
    if (this.forecasts.length === 0) {
      return;
    }

    this.stats.totalPredictedDemand = this.forecasts.reduce((sum, f) => sum + f.predictedDemand, 0);
    this.stats.totalRecommendedOrder = this.forecasts.reduce((sum, f) => sum + f.recommendedOrder, 0);
    this.stats.totalEstimatedCost = this.forecasts.reduce((sum, f) => sum + f.estimatedCost, 0);
    this.stats.averageAccuracy = this.demandPredictions.length > 0
      ? Math.round(this.demandPredictions.reduce((sum, d) => sum + d.accuracy, 0) / this.demandPredictions.length)
      : 0;
    this.stats.highRiskVaccines = this.forecasts.filter(f => f.stockoutRisk === 'High' || f.stockoutRisk === 'Critical').length;
    
    const minDaysUntilStockout = this.forecasts.map(f => f.currentStock / f.averageDailyUsage);
    this.stats.daysUntilStockout = Math.round(Math.min(...minDaysUntilStockout));
  }

  applyFilters(): void {
    const { search, vaccineName, stockoutRisk, supplier } = this.filterForm.value;

    this.filteredForecasts = this.forecasts.filter(forecast => {
      const matchesSearch = !search || 
        forecast.vaccineName.toLowerCase().includes(search.toLowerCase()) ||
        forecast.supplier.toLowerCase().includes(search.toLowerCase());
      const matchesVaccine = !vaccineName || forecast.vaccineName === vaccineName;
      const matchesRisk = !stockoutRisk || forecast.stockoutRisk === stockoutRisk;
      const matchesSupplier = !supplier || forecast.supplier === supplier;

      return matchesSearch && matchesVaccine && matchesRisk && matchesSupplier;
    });

    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccineName: '',
      stockoutRisk: '',
      supplier: ''
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedForecasts(): VaccineForecast[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredForecasts.slice(startIndex, startIndex + this.pageSize);
  }

  openForecastDialog(forecast?: VaccineForecast): void {
    this.isEditMode = !!forecast;
    this.selectedForecast = forecast || null;

    if (forecast) {
      this.forecastForm.patchValue(forecast);
    } else {
      this.forecastForm.reset({
        forecastPeriod: 30,
        leadTime: 14,
        expiryBuffer: 30,
        seasonalFactor: 1.0,
        trendFactor: 1.0,
        campaignImpact: 0,
        currentStock: 0,
        averageDailyUsage: 0
      });
    }

    this.showForecastDialog = true;
  }

  closeForecastDialog(): void {
    this.showForecastDialog = false;
    this.selectedForecast = null;
    this.forecastForm.reset();
  }

  saveForecast(): void {
    if (this.forecastForm.invalid) {
      this.forecastForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const formValue = this.forecastForm.value;
    
    // Calculate predicted demand
    const baseDemand = formValue.averageDailyUsage * formValue.forecastPeriod;
    const predictedDemand = Math.round(baseDemand * formValue.seasonalFactor * formValue.trendFactor) + formValue.campaignImpact;
    
    // Calculate recommended order
    const daysUntilStockout = formValue.currentStock / formValue.averageDailyUsage;
    const recommendedOrder = Math.max(0, predictedDemand - formValue.currentStock + (formValue.averageDailyUsage * formValue.leadTime));
    
    // Determine stockout risk
    let stockoutRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    if (daysUntilStockout < 7) stockoutRisk = 'Critical';
    else if (daysUntilStockout < 14) stockoutRisk = 'High';
    else if (daysUntilStockout < 30) stockoutRisk = 'Medium';
    else stockoutRisk = 'Low';

    const unitCost = 10;
    const estimatedCost = Math.round(recommendedOrder * unitCost);
    const confidenceLevel = 75 + Math.random() * 20;

    if (this.isEditMode && this.selectedForecast) {
      Object.assign(this.selectedForecast, {
        ...formValue,
        predictedDemand,
        recommendedOrder: Math.round(recommendedOrder),
        stockoutRisk,
        estimatedCost,
        confidenceLevel: Math.round(confidenceLevel)
      });
      this.notificationService.success('Forecast updated successfully');
    } else {
      const newForecast: VaccineForecast = {
        id: this.forecasts.length > 0 ? Math.max(...this.forecasts.map(f => f.id)) + 1 : 1,
        ...formValue,
        predictedDemand,
        recommendedOrder: Math.round(recommendedOrder),
        stockoutRisk,
        estimatedCost,
        lastOrderDate: new Date(),
        confidenceLevel: Math.round(confidenceLevel)
      };
      this.forecasts.unshift(newForecast);
      this.notificationService.success('Forecast created successfully');
    }

    this.saveToLocalStorage();
    this.calculateStats();
    this.applyFilters();
    this.closeForecastDialog();
  }

  viewForecastDetails(forecast: VaccineForecast): void {
    this.selectedForecast = forecast;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedForecast = null;
  }

  deleteForecast(forecast: VaccineForecast): void {
    if (confirm(`Are you sure you want to delete the forecast for ${forecast.vaccineName}?`)) {
      this.forecasts = this.forecasts.filter(f => f.id !== forecast.id);
      this.saveToLocalStorage();
      this.calculateStats();
      this.applyFilters();
      this.notificationService.success('Forecast deleted successfully');
    }
  }

  openScenarioDialog(scenario?: ScenarioAnalysis): void {
    this.isEditMode = !!scenario;
    this.selectedScenario = scenario || null;

    if (scenario) {
      this.scenarioForm.patchValue(scenario);
    } else {
      this.scenarioForm.reset({
        demandIncrease: 0,
        budgetConstraint: 0,
        feasibility: 'High'
      });
    }

    this.showScenarioDialog = true;
  }

  closeScenarioDialog(): void {
    this.showScenarioDialog = false;
    this.selectedScenario = null;
    this.scenarioForm.reset();
  }

  saveScenario(): void {
    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const formValue = this.scenarioForm.value;
    const impactScore = Math.round(50 + Math.random() * 50);

    if (this.isEditMode && this.selectedScenario) {
      Object.assign(this.selectedScenario, {
        ...formValue,
        impactScore
      });
      this.notificationService.success('Scenario updated successfully');
    } else {
      const newScenario: ScenarioAnalysis = {
        id: this.scenarios.length > 0 ? Math.max(...this.scenarios.map(s => s.id)) + 1 : 1,
        ...formValue,
        impactScore,
        recommendations: []
      };
      this.scenarios.push(newScenario);
      this.notificationService.success('Scenario created successfully');
    }

    this.closeScenarioDialog();
  }

  exportForecasts(format: 'csv' | 'json' | 'pdf'): void {
    if (format === 'csv') {
      const csv = this.convertToCSV(this.filteredForecasts);
      this.downloadFile(csv, 'vaccine-forecasts.csv', 'text/csv');
      this.notificationService.success('Exported to CSV successfully');
    } else if (format === 'json') {
      const json = JSON.stringify(this.filteredForecasts, null, 2);
      this.downloadFile(json, 'vaccine-forecasts.json', 'application/json');
      this.notificationService.success('Exported to JSON successfully');
    } else {
      this.notificationService.info('PDF export will be implemented with a reporting library');
    }
  }

  private convertToCSV(data: VaccineForecast[]): string {
    const headers = ['Vaccine', 'Current Stock', 'Avg Daily Usage', 'Predicted Demand', 'Recommended Order', 'Stockout Risk', 'Cost', 'Supplier'];
    const rows = data.map(f => [
      f.vaccineName,
      f.currentStock,
      f.averageDailyUsage,
      f.predictedDemand,
      f.recommendedOrder,
      f.stockoutRisk,
      f.estimatedCost,
      f.supplier
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

  getRiskColor(risk: string): 'primary' | 'accent' | 'warn' {
    switch (risk) {
      case 'Critical': return 'warn';
      case 'High': return 'warn';
      case 'Medium': return 'accent';
      default: return 'primary';
    }
  }

  getPriorityColor(priority: string): 'primary' | 'accent' | 'warn' {
    switch (priority) {
      case 'High': return 'warn';
      case 'Medium': return 'accent';
      default: return 'primary';
    }
  }

  getFeasibilityColor(feasibility: string): 'primary' | 'accent' | 'warn' {
    switch (feasibility) {
      case 'High': return 'primary';
      case 'Medium': return 'accent';
      default: return 'warn';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('vaccineForecasts', JSON.stringify(this.forecasts));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('vaccineForecasts');
    if (stored) {
      this.forecasts = JSON.parse(stored);
      this.forecasts.forEach(f => {
        f.lastOrderDate = new Date(f.lastOrderDate);
      });
    }
  }
}
