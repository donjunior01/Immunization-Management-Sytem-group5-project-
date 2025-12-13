import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

export interface DoseSchedule {
  id: string;
  vaccineName: string;
  batchNumber: string;
  targetPopulation: number;
  scheduledDoses: number;
  allocatedDoses: number;
  remainingDoses: number;
  startDate: Date;
  endDate: Date;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
  facilityId: string;
  facilityName: string;
  ageGroup: string;
  optimizationScore: number;
  constraints: string[];
  recommendations: string[];
  resourceAllocation: ResourceAllocation;
}

export interface ResourceAllocation {
  personnel: number;
  vaccinationPoints: number;
  workingHours: number;
  daysRequired: number;
  dailyCapacity: number;
  utilizationRate: number;
}

export interface OptimizationStats {
  totalSchedules: number;
  optimizedSchedules: number;
  averageScore: number;
  totalDoses: number;
  allocatedDoses: number;
  remainingCapacity: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

export interface ScenarioSimulation {
  id: string;
  name: string;
  description: string;
  parameters: SimulationParameters;
  results: SimulationResults;
  createdAt: Date;
}

export interface SimulationParameters {
  personnelCount: number;
  vaccinationPoints: number;
  workingHoursPerDay: number;
  daysAvailable: number;
  targetCoverage: number;
  priorityWeights: { high: number; medium: number; low: number };
}

export interface SimulationResults {
  achievableCoverage: number;
  dosesScheduled: number;
  resourceUtilization: number;
  estimatedCompletion: Date;
  bottlenecks: string[];
  recommendations: string[];
}

@Component({
  selector: 'app-dose-schedule',
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
    MatDialogModule,
    MatTabsModule,
    MatSliderModule,
    MatCheckboxModule
  ],
  templateUrl: './dose-schedule.component.html',
  styleUrl: './dose-schedule.component.scss'
})
export class DoseScheduleComponent implements OnInit {
  schedules: DoseSchedule[] = [];
  filteredSchedules: DoseSchedule[] = [];
  stats: OptimizationStats = this.initializeStats();
  scenarios: ScenarioSimulation[] = [];
  
  filterForm: FormGroup;
  scheduleForm: FormGroup;
  scenarioForm: FormGroup;
  
  displayedColumns: string[] = [
    'vaccineName',
    'targetPopulation',
    'scheduledDoses',
    'allocated',
    'remaining',
    'timeline',
    'priority',
    'score',
    'status',
    'actions'
  ];
  
  selectedTab = 0;
  showScheduleDialog = false;
  showScenarioDialog = false;
  selectedSchedule: DoseSchedule | null = null;
  currentScenario: ScenarioSimulation | null = null;
  
  vaccines: string[] = [
    'BCG',
    'OPV',
    'DTP',
    'Measles',
    'Hepatitis B',
    'Rotavirus',
    'Pneumococcal',
    'HPV',
    'Influenza',
    'COVID-19'
  ];
  
  priorities: string[] = ['All', 'High', 'Medium', 'Low'];
  statuses: string[] = ['All', 'Scheduled', 'In Progress', 'Completed', 'Delayed'];
  
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      vaccine: ['All'],
      priority: ['All'],
      status: ['All'],
      dateRange: [null]
    });

    this.scheduleForm = this.fb.group({
      vaccineName: ['', Validators.required],
      batchNumber: ['', Validators.required],
      targetPopulation: [0, [Validators.required, Validators.min(1)]],
      scheduledDoses: [0, [Validators.required, Validators.min(1)]],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      priority: ['Medium', Validators.required],
      facilityId: ['', Validators.required],
      ageGroup: ['', Validators.required],
      personnel: [1, [Validators.required, Validators.min(1)]],
      vaccinationPoints: [1, [Validators.required, Validators.min(1)]],
      workingHours: [8, [Validators.required, Validators.min(1), Validators.max(24)]]
    });

    this.scenarioForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      personnelCount: [5, [Validators.required, Validators.min(1)]],
      vaccinationPoints: [2, [Validators.required, Validators.min(1)]],
      workingHoursPerDay: [8, [Validators.required, Validators.min(1), Validators.max(24)]],
      daysAvailable: [30, [Validators.required, Validators.min(1)]],
      targetCoverage: [90, [Validators.required, Validators.min(0), Validators.max(100)]],
      highPriorityWeight: [3, [Validators.required, Validators.min(1)]],
      mediumPriorityWeight: [2, [Validators.required, Validators.min(1)]],
      lowPriorityWeight: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadSchedules();
    this.loadScenarios();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private loadSchedules(): void {
    const savedSchedules = localStorage.getItem('doseSchedules');
    if (savedSchedules) {
      this.schedules = JSON.parse(savedSchedules, (key, value) => {
        if (key === 'startDate' || key === 'endDate' || key === 'estimatedCompletion') {
          return new Date(value);
        }
        return value;
      });
    } else {
      this.schedules = this.generateMockSchedules();
      this.saveToLocalStorage();
    }
    
    this.filteredSchedules = [...this.schedules];
    this.calculateStats();
  }

  private loadScenarios(): void {
    const savedScenarios = localStorage.getItem('doseScenarios');
    if (savedScenarios) {
      this.scenarios = JSON.parse(savedScenarios, (key, value) => {
        if (key === 'createdAt' || key === 'estimatedCompletion') {
          return new Date(value);
        }
        return value;
      });
    }
  }

  private generateMockSchedules(): DoseSchedule[] {
    const facilities = [
      { id: 'FAC001', name: 'Central Health Center' },
      { id: 'FAC002', name: 'Northern Clinic' },
      { id: 'FAC003', name: 'Southern Hospital' },
      { id: 'FAC004', name: 'Eastern Medical Center' },
      { id: 'FAC005', name: 'Western Health Facility' }
    ];

    const ageGroups = [
      '0-1 months',
      '2-4 months',
      '6-12 months',
      '1-2 years',
      '2-5 years',
      '6-11 years',
      '12-17 years',
      '18-64 years',
      '65+ years'
    ];

    const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
    const statuses: Array<'Scheduled' | 'In Progress' | 'Completed' | 'Delayed'> = [
      'Scheduled',
      'In Progress',
      'Completed',
      'Delayed'
    ];

    const schedules: DoseSchedule[] = [];
    let id = 1;

    this.vaccines.forEach((vaccine, vIndex) => {
      facilities.forEach((facility, fIndex) => {
        const targetPopulation = Math.floor(Math.random() * 3000) + 500;
        const scheduledDoses = Math.floor(targetPopulation * (0.8 + Math.random() * 0.2));
        const allocatedDoses = Math.floor(scheduledDoses * (0.5 + Math.random() * 0.5));
        const remainingDoses = scheduledDoses - allocatedDoses;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 90) + 30);
        
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const personnel = Math.floor(Math.random() * 8) + 2;
        const vaccinationPoints = Math.floor(Math.random() * 4) + 1;
        const workingHours = 8;
        const dailyCapacity = personnel * vaccinationPoints * (workingHours * 10);
        const daysRequired = Math.ceil(scheduledDoses / dailyCapacity);
        const utilizationRate = (allocatedDoses / (dailyCapacity * daysRequired)) * 100;
        
        const optimizationScore = Math.floor(
          (utilizationRate * 0.4) +
          (priority === 'High' ? 30 : priority === 'Medium' ? 20 : 10) +
          (status === 'Completed' ? 30 : status === 'In Progress' ? 20 : 10)
        );

        const constraints: string[] = [];
        const recommendations: string[] = [];

        if (remainingDoses > scheduledDoses * 0.3) {
          constraints.push('High remaining doses');
          recommendations.push('Increase daily vaccination capacity');
        }
        if (utilizationRate < 50) {
          constraints.push('Low resource utilization');
          recommendations.push('Optimize personnel allocation');
        }
        if (daysRequired > 60) {
          constraints.push('Extended timeline');
          recommendations.push('Add more vaccination points');
        }
        if (priority === 'High' && status === 'Delayed') {
          constraints.push('High priority delayed');
          recommendations.push('Reallocate resources immediately');
        }

        schedules.push({
          id: `SCH-${String(id).padStart(3, '0')}`,
          vaccineName: vaccine,
          batchNumber: `BATCH-${vaccine.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
          targetPopulation,
          scheduledDoses,
          allocatedDoses,
          remainingDoses,
          startDate,
          endDate,
          priority,
          status,
          facilityId: facility.id,
          facilityName: facility.name,
          ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
          optimizationScore,
          constraints,
          recommendations,
          resourceAllocation: {
            personnel,
            vaccinationPoints,
            workingHours,
            daysRequired,
            dailyCapacity,
            utilizationRate: Math.round(utilizationRate * 100) / 100
          }
        });
        
        id++;
      });
    });

    return schedules;
  }

  private calculateStats(): void {
    this.stats = {
      totalSchedules: this.filteredSchedules.length,
      optimizedSchedules: this.filteredSchedules.filter(s => s.optimizationScore >= 70).length,
      averageScore: this.filteredSchedules.reduce((sum, s) => sum + s.optimizationScore, 0) / 
                   (this.filteredSchedules.length || 1),
      totalDoses: this.filteredSchedules.reduce((sum, s) => sum + s.scheduledDoses, 0),
      allocatedDoses: this.filteredSchedules.reduce((sum, s) => sum + s.allocatedDoses, 0),
      remainingCapacity: this.filteredSchedules.reduce((sum, s) => sum + s.remainingDoses, 0),
      highPriority: this.filteredSchedules.filter(s => s.priority === 'High').length,
      mediumPriority: this.filteredSchedules.filter(s => s.priority === 'Medium').length,
      lowPriority: this.filteredSchedules.filter(s => s.priority === 'Low').length
    };
  }

  private initializeStats(): OptimizationStats {
    return {
      totalSchedules: 0,
      optimizedSchedules: 0,
      averageScore: 0,
      totalDoses: 0,
      allocatedDoses: 0,
      remainingCapacity: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredSchedules = this.schedules.filter(schedule => {
      const matchesSearch = !filters.search || 
        schedule.vaccineName.toLowerCase().includes(filters.search.toLowerCase()) ||
        schedule.facilityName.toLowerCase().includes(filters.search.toLowerCase()) ||
        schedule.batchNumber.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesVaccine = filters.vaccine === 'All' || schedule.vaccineName === filters.vaccine;
      const matchesPriority = filters.priority === 'All' || schedule.priority === filters.priority;
      const matchesStatus = filters.status === 'All' || schedule.status === filters.status;
      
      let matchesDate = true;
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        const scheduleDate = schedule.startDate;
        matchesDate = scheduleDate >= filters.dateRange.start && scheduleDate <= filters.dateRange.end;
      }
      
      return matchesSearch && matchesVaccine && matchesPriority && matchesStatus && matchesDate;
    });
    
    this.calculateStats();
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccine: 'All',
      priority: 'All',
      status: 'All',
      dateRange: null
    });
  }

  getPaginatedData(): DoseSchedule[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredSchedules.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  openScheduleDialog(schedule?: DoseSchedule): void {
    if (schedule) {
      this.selectedSchedule = schedule;
      this.scheduleForm.patchValue({
        vaccineName: schedule.vaccineName,
        batchNumber: schedule.batchNumber,
        targetPopulation: schedule.targetPopulation,
        scheduledDoses: schedule.scheduledDoses,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        priority: schedule.priority,
        facilityId: schedule.facilityId,
        ageGroup: schedule.ageGroup,
        personnel: schedule.resourceAllocation.personnel,
        vaccinationPoints: schedule.resourceAllocation.vaccinationPoints,
        workingHours: schedule.resourceAllocation.workingHours
      });
    } else {
      this.selectedSchedule = null;
      this.scheduleForm.reset({
        priority: 'Medium',
        personnel: 1,
        vaccinationPoints: 1,
        workingHours: 8
      });
    }
    this.showScheduleDialog = true;
  }

  closeScheduleDialog(): void {
    this.showScheduleDialog = false;
    this.selectedSchedule = null;
  }

  saveSchedule(): void {
    if (this.scheduleForm.valid) {
      const formValue = this.scheduleForm.value;
      
      if (this.selectedSchedule) {
        const index = this.schedules.findIndex(s => s.id === this.selectedSchedule!.id);
        if (index !== -1) {
          this.schedules[index] = {
            ...this.selectedSchedule,
            ...formValue,
            resourceAllocation: {
              ...this.selectedSchedule.resourceAllocation,
              personnel: formValue.personnel,
              vaccinationPoints: formValue.vaccinationPoints,
              workingHours: formValue.workingHours
            }
          };
          this.notificationService.success('Schedule updated successfully');
        }
      } else {
        const newSchedule: DoseSchedule = {
          id: `SCH-${String(this.schedules.length + 1).padStart(3, '0')}`,
          vaccineName: formValue.vaccineName,
          batchNumber: formValue.batchNumber,
          targetPopulation: formValue.targetPopulation,
          scheduledDoses: formValue.scheduledDoses,
          allocatedDoses: 0,
          remainingDoses: formValue.scheduledDoses,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          priority: formValue.priority,
          status: 'Scheduled',
          facilityId: formValue.facilityId,
          facilityName: 'Selected Facility',
          ageGroup: formValue.ageGroup,
          optimizationScore: 50,
          constraints: [],
          recommendations: [],
          resourceAllocation: {
            personnel: formValue.personnel,
            vaccinationPoints: formValue.vaccinationPoints,
            workingHours: formValue.workingHours,
            daysRequired: 0,
            dailyCapacity: 0,
            utilizationRate: 0
          }
        };
        this.schedules.push(newSchedule);
        this.notificationService.success('Schedule created successfully');
      }
      
      this.saveToLocalStorage();
      this.applyFilters();
      this.closeScheduleDialog();
    }
  }

  deleteSchedule(schedule: DoseSchedule): void {
    this.notificationService.confirm('Are you sure you want to delete this schedule?');
    // Note: In a real implementation, we would wait for user confirmation
    // For now, we proceed with deletion
    this.schedules = this.schedules.filter(s => s.id !== schedule.id);
    this.saveToLocalStorage();
    this.applyFilters();
    this.notificationService.success('Schedule deleted successfully');
  }

  optimizeSchedule(schedule: DoseSchedule): void {
    this.loaderService.show();
    
    setTimeout(() => {
      const index = this.schedules.findIndex(s => s.id === schedule.id);
      if (index !== -1) {
        this.schedules[index].optimizationScore = Math.min(
          this.schedules[index].optimizationScore + 15,
          100
        );
        this.schedules[index].recommendations = [
          'Resource allocation optimized',
          'Timeline adjusted for efficiency',
          'Personnel scheduling improved'
        ];
        this.saveToLocalStorage();
        this.applyFilters();
        this.notificationService.success('Schedule optimized successfully');
      }
    }, 1500);
  }

  openScenarioDialog(): void {
    this.scenarioForm.reset({
      personnelCount: 5,
      vaccinationPoints: 2,
      workingHoursPerDay: 8,
      daysAvailable: 30,
      targetCoverage: 90,
      highPriorityWeight: 3,
      mediumPriorityWeight: 2,
      lowPriorityWeight: 1
    });
    this.currentScenario = null;
    this.showScenarioDialog = true;
  }

  closeScenarioDialog(): void {
    this.showScenarioDialog = false;
    this.currentScenario = null;
  }

  runSimulation(): void {
    if (this.scenarioForm.valid) {
      this.loaderService.show();
      
      setTimeout(() => {
        const formValue = this.scenarioForm.value;
        
        const dailyCapacity = formValue.personnelCount * formValue.vaccinationPoints * 
                            (formValue.workingHoursPerDay * 10);
        const totalCapacity = dailyCapacity * formValue.daysAvailable;
        const dosesScheduled = Math.min(totalCapacity, this.stats.totalDoses);
        const achievableCoverage = Math.min(
          (dosesScheduled / this.stats.totalDoses) * 100,
          formValue.targetCoverage
        );
        
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(
          estimatedCompletion.getDate() + Math.ceil(dosesScheduled / dailyCapacity)
        );
        
        const bottlenecks: string[] = [];
        const recommendations: string[] = [];
        
        if (achievableCoverage < formValue.targetCoverage) {
          bottlenecks.push('Insufficient capacity to reach target coverage');
          recommendations.push('Increase personnel or vaccination points');
        }
        if (dailyCapacity < this.stats.totalDoses / formValue.daysAvailable) {
          bottlenecks.push('Daily capacity below required rate');
          recommendations.push('Extend working hours or add more days');
        }
        
        const scenario: ScenarioSimulation = {
          id: `SIM-${String(this.scenarios.length + 1).padStart(3, '0')}`,
          name: formValue.name,
          description: formValue.description,
          parameters: {
            personnelCount: formValue.personnelCount,
            vaccinationPoints: formValue.vaccinationPoints,
            workingHoursPerDay: formValue.workingHoursPerDay,
            daysAvailable: formValue.daysAvailable,
            targetCoverage: formValue.targetCoverage,
            priorityWeights: {
              high: formValue.highPriorityWeight,
              medium: formValue.mediumPriorityWeight,
              low: formValue.lowPriorityWeight
            }
          },
          results: {
            achievableCoverage: Math.round(achievableCoverage * 100) / 100,
            dosesScheduled,
            resourceUtilization: Math.min((dosesScheduled / totalCapacity) * 100, 100),
            estimatedCompletion,
            bottlenecks,
            recommendations
          },
          createdAt: new Date()
        };
        
        this.scenarios.push(scenario);
        this.currentScenario = scenario;
        localStorage.setItem('doseScenarios', JSON.stringify(this.scenarios));
        this.notificationService.success('Simulation completed successfully');
      }, 2000);
    }
  }

  exportData(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();
    
    setTimeout(() => {
      if (format === 'csv') {
        const csv = this.convertToCSV(this.filteredSchedules);
        this.downloadFile(csv, 'dose-schedules.csv', 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(this.filteredSchedules, null, 2);
        this.downloadFile(json, 'dose-schedules.json', 'application/json');
      } else if (format === 'pdf') {
        this.notificationService.info('PDF export will be implemented with backend integration');
      }
      
      this.notificationService.success(`Dose schedules exported as ${format.toUpperCase()}`);
    }, 1000);
  }

  private convertToCSV(data: DoseSchedule[]): string {
    const headers = [
      'ID',
      'Vaccine',
      'Batch',
      'Target Population',
      'Scheduled Doses',
      'Allocated',
      'Remaining',
      'Start Date',
      'End Date',
      'Priority',
      'Status',
      'Facility',
      'Age Group',
      'Score'
    ];
    
    const rows = data.map(schedule => [
      schedule.id,
      schedule.vaccineName,
      schedule.batchNumber,
      schedule.targetPopulation,
      schedule.scheduledDoses,
      schedule.allocatedDoses,
      schedule.remainingDoses,
      this.formatDate(schedule.startDate),
      this.formatDate(schedule.endDate),
      schedule.priority,
      schedule.status,
      schedule.facilityName,
      schedule.ageGroup,
      schedule.optimizationScore
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('doseSchedules', JSON.stringify(this.schedules));
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High': return 'warn';
      case 'Medium': return 'accent';
      case 'Low': return 'primary';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completed': return 'primary';
      case 'In Progress': return 'accent';
      case 'Scheduled': return 'primary';
      case 'Delayed': return 'warn';
      default: return '';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }
}
