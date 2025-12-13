import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface VaccineEfficacy {
  id: string;
  vaccineName: string;
  manufacturer: string;
  batchNumber: string;
  studyPeriod: {
    startDate: Date;
    endDate: Date;
  };
  populationSize: number;
  demographics: {
    ageGroup: string;
    gender: string;
    comorbidities: string[];
  };
  efficacyRate: number; // Percentage 0-100
  effectivenessRate: number; // Percentage 0-100
  adverseEvents: {
    mild: number;
    moderate: number;
    severe: number;
    total: number;
  };
  immuneResponse: {
    antibodyLevel: number; // ng/mL
    tcellResponse: number; // Percentage
    duration: number; // Days
  };
  breakthrough: {
    cases: number;
    severity: 'Mild' | 'Moderate' | 'Severe';
    vaccinated: boolean;
  }[];
  confidence: {
    level: number; // Percentage
    interval: string;
  };
  status: 'Active' | 'Completed' | 'Under Review' | 'Pending';
  facilityId: string;
  facilityName: string;
  notes: string;
}

interface EfficacyStats {
  totalStudies: number;
  activeStudies: number;
  averageEfficacy: number;
  averageEffectiveness: number;
  totalParticipants: number;
  totalAdverseEvents: number;
  averageAntibodyLevel: number;
  breakthroughRate: number;
  highEfficacyCount: number; // >=90%
  moderateEfficacyCount: number; // 70-89%
  lowEfficacyCount: number; // <70%
}

interface ComparativeAnalysis {
  vaccineName: string;
  efficacy: number;
  effectiveness: number;
  adverseEventRate: number;
  breakthroughRate: number;
  immuneDuration: number;
  overallScore: number; // 0-100
}

interface TrendAnalysis {
  month: string;
  efficacy: number;
  effectiveness: number;
  adverseEvents: number;
  breakthroughCases: number;
}

@Component({
  selector: 'app-vaccine-efficacy',
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
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './vaccine-efficacy.component.html',
  styleUrls: ['./vaccine-efficacy.component.scss']
})
export class VaccineEfficacyComponent implements OnInit {
  efficacyRecords: VaccineEfficacy[] = [];
  filteredRecords: VaccineEfficacy[] = [];
  displayedRecords: VaccineEfficacy[] = [];
  stats: EfficacyStats = {
    totalStudies: 0,
    activeStudies: 0,
    averageEfficacy: 0,
    averageEffectiveness: 0,
    totalParticipants: 0,
    totalAdverseEvents: 0,
    averageAntibodyLevel: 0,
    breakthroughRate: 0,
    highEfficacyCount: 0,
    moderateEfficacyCount: 0,
    lowEfficacyCount: 0
  };

  comparativeData: ComparativeAnalysis[] = [];
  trendData: TrendAnalysis[] = [];

  filterForm!: FormGroup;
  recordForm!: FormGroup;

  // Pagination
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Table columns
  displayedColumns = [
    'vaccine',
    'manufacturer',
    'batch',
    'population',
    'efficacy',
    'effectiveness',
    'adverseEvents',
    'breakthrough',
    'antibody',
    'status',
    'actions'
  ];

  // Dialog state
  showRecordDialog = false;
  isEditMode = false;
  selectedRecord: VaccineEfficacy | null = null;

  // Vaccine options
  vaccines = [
    'Pfizer-BioNTech',
    'Moderna',
    'Johnson & Johnson',
    'AstraZeneca',
    'Novavax',
    'Sinovac',
    'Sinopharm',
    'Sputnik V',
    'Covaxin',
    'CanSino'
  ];

  manufacturers = [
    'Pfizer',
    'Moderna',
    'J&J',
    'AstraZeneca',
    'Novavax',
    'Sinovac',
    'Sinopharm',
    'Gamaleya',
    'Bharat Biotech',
    'CanSino'
  ];

  ageGroups = [
    '0-5 years',
    '6-11 years',
    '12-17 years',
    '18-49 years',
    '50-64 years',
    '65+ years'
  ];

  genders = ['Male', 'Female', 'All'];

  comorbidityOptions = [
    'Diabetes',
    'Hypertension',
    'Cardiovascular Disease',
    'Respiratory Disease',
    'Obesity',
    'Immunocompromised',
    'Cancer',
    'Kidney Disease',
    'Liver Disease',
    'None'
  ];

  statuses: VaccineEfficacy['status'][] = ['Active', 'Completed', 'Under Review', 'Pending'];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadEfficacyRecords();
    this.calculateStats();
    this.generateComparativeAnalysis();
    this.generateTrendAnalysis();
    this.applyFilters();
  }

  initializeForms(): void {
    // Filter form
    this.filterForm = this.fb.group({
      search: [''],
      vaccine: [''],
      manufacturer: [''],
      status: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      }),
      efficacyMin: [0],
      efficacyMax: [100]
    });

    // Record form
    this.recordForm = this.fb.group({
      vaccineName: ['', Validators.required],
      manufacturer: ['', Validators.required],
      batchNumber: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      populationSize: [0, [Validators.required, Validators.min(1)]],
      ageGroup: ['', Validators.required],
      gender: ['', Validators.required],
      comorbidities: [[]],
      efficacyRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      effectivenessRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      mildEvents: [0, [Validators.required, Validators.min(0)]],
      moderateEvents: [0, [Validators.required, Validators.min(0)]],
      severeEvents: [0, [Validators.required, Validators.min(0)]],
      antibodyLevel: [0, [Validators.required, Validators.min(0)]],
      tcellResponse: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      immuneDuration: [0, [Validators.required, Validators.min(0)]],
      breakthroughCases: [0, [Validators.required, Validators.min(0)]],
      breakthroughSeverity: ['Mild', Validators.required],
      confidenceLevel: [95, [Validators.required, Validators.min(0), Validators.max(100)]],
      confidenceInterval: ['', Validators.required],
      status: ['Active', Validators.required],
      facilityName: ['', Validators.required],
      notes: ['']
    });

    // Watch filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  generateMockEfficacyRecords(): VaccineEfficacy[] {
    const records: VaccineEfficacy[] = [];
    const facilities = [
      'Central Hospital',
      'Regional Health Center',
      'Community Clinic',
      'Research Institute',
      'Medical College'
    ];

    this.vaccines.forEach((vaccine, vIndex) => {
      facilities.forEach((facility, fIndex) => {
        const baseDate = new Date(2024, 0, 1);
        const startDate = new Date(baseDate);
        startDate.setMonth(startDate.getMonth() + fIndex * 2);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);

        const populationSize = 500 + Math.floor(Math.random() * 1500);
        const efficacyRate = 65 + Math.random() * 30;
        const effectivenessRate = efficacyRate - (5 + Math.random() * 10);

        const mildEvents = Math.floor(populationSize * (0.05 + Math.random() * 0.15));
        const moderateEvents = Math.floor(populationSize * (0.01 + Math.random() * 0.05));
        const severeEvents = Math.floor(populationSize * (0.001 + Math.random() * 0.01));

        const breakthroughCount = Math.floor(populationSize * (0.02 + Math.random() * 0.08));
        const breakthrough: VaccineEfficacy['breakthrough'] = [];
        for (let i = 0; i < breakthroughCount; i++) {
          breakthrough.push({
            cases: 1,
            severity: ['Mild', 'Moderate', 'Severe'][Math.floor(Math.random() * 3)] as 'Mild' | 'Moderate' | 'Severe',
            vaccinated: true
          });
        }

        records.push({
          id: `EFF-${(vIndex * 5 + fIndex + 1).toString().padStart(3, '0')}`,
          vaccineName: vaccine,
          manufacturer: this.manufacturers[vIndex],
          batchNumber: `BATCH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          studyPeriod: {
            startDate,
            endDate
          },
          populationSize,
          demographics: {
            ageGroup: this.ageGroups[Math.floor(Math.random() * this.ageGroups.length)],
            gender: this.genders[Math.floor(Math.random() * this.genders.length)],
            comorbidities: this.comorbidityOptions
              .slice(0, Math.floor(Math.random() * 3))
              .concat(['None'])
          },
          efficacyRate,
          effectivenessRate,
          adverseEvents: {
            mild: mildEvents,
            moderate: moderateEvents,
            severe: severeEvents,
            total: mildEvents + moderateEvents + severeEvents
          },
          immuneResponse: {
            antibodyLevel: 200 + Math.random() * 800,
            tcellResponse: 60 + Math.random() * 35,
            duration: 180 + Math.floor(Math.random() * 180)
          },
          breakthrough,
          confidence: {
            level: 90 + Math.random() * 9,
            interval: `${(efficacyRate - 5).toFixed(1)}% - ${(efficacyRate + 5).toFixed(1)}%`
          },
          status: this.statuses[Math.floor(Math.random() * this.statuses.length)],
          facilityId: `FAC-${(fIndex + 1).toString().padStart(3, '0')}`,
          facilityName: facility,
          notes: `Study conducted with ${populationSize} participants over 6-month period.`
        });
      });
    });

    return records;
  }

  loadEfficacyRecords(): void {
    // Try to load from localStorage
    const stored = localStorage.getItem('vaccineEfficacyRecords');
    if (stored) {
      this.efficacyRecords = JSON.parse(stored, (key, value) => {
        if (key === 'startDate' || key === 'endDate') {
          return new Date(value);
        }
        return value;
      });
    } else {
      // Generate mock data
      this.efficacyRecords = this.generateMockEfficacyRecords();
      this.saveToLocalStorage();
    }
  }

  saveToLocalStorage(): void {
    localStorage.setItem('vaccineEfficacyRecords', JSON.stringify(this.efficacyRecords));
  }

  calculateStats(): void {
    this.stats = {
      totalStudies: this.efficacyRecords.length,
      activeStudies: this.efficacyRecords.filter(r => r.status === 'Active').length,
      averageEfficacy: this.efficacyRecords.reduce((sum, r) => sum + r.efficacyRate, 0) / this.efficacyRecords.length || 0,
      averageEffectiveness: this.efficacyRecords.reduce((sum, r) => sum + r.effectivenessRate, 0) / this.efficacyRecords.length || 0,
      totalParticipants: this.efficacyRecords.reduce((sum, r) => sum + r.populationSize, 0),
      totalAdverseEvents: this.efficacyRecords.reduce((sum, r) => sum + r.adverseEvents.total, 0),
      averageAntibodyLevel: this.efficacyRecords.reduce((sum, r) => sum + r.immuneResponse.antibodyLevel, 0) / this.efficacyRecords.length || 0,
      breakthroughRate: (this.efficacyRecords.reduce((sum, r) => sum + r.breakthrough.length, 0) / this.stats.totalParticipants) * 100 || 0,
      highEfficacyCount: this.efficacyRecords.filter(r => r.efficacyRate >= 90).length,
      moderateEfficacyCount: this.efficacyRecords.filter(r => r.efficacyRate >= 70 && r.efficacyRate < 90).length,
      lowEfficacyCount: this.efficacyRecords.filter(r => r.efficacyRate < 70).length
    };
  }

  generateComparativeAnalysis(): void {
    const vaccineGroups = new Map<string, VaccineEfficacy[]>();

    this.efficacyRecords.forEach(record => {
      if (!vaccineGroups.has(record.vaccineName)) {
        vaccineGroups.set(record.vaccineName, []);
      }
      vaccineGroups.get(record.vaccineName)!.push(record);
    });

    this.comparativeData = Array.from(vaccineGroups.entries()).map(([vaccine, records]) => {
      const avgEfficacy = records.reduce((sum, r) => sum + r.efficacyRate, 0) / records.length;
      const avgEffectiveness = records.reduce((sum, r) => sum + r.effectivenessRate, 0) / records.length;
      const totalPop = records.reduce((sum, r) => sum + r.populationSize, 0);
      const totalAdverse = records.reduce((sum, r) => sum + r.adverseEvents.total, 0);
      const adverseEventRate = (totalAdverse / totalPop) * 100;
      const totalBreakthrough = records.reduce((sum, r) => sum + r.breakthrough.length, 0);
      const breakthroughRate = (totalBreakthrough / totalPop) * 100;
      const avgDuration = records.reduce((sum, r) => sum + r.immuneResponse.duration, 0) / records.length;

      // Calculate overall score (0-100)
      const efficacyScore = avgEfficacy * 0.35;
      const effectivenessScore = avgEffectiveness * 0.25;
      const safetyScore = (100 - adverseEventRate * 10) * 0.20;
      const breakthroughScore = (100 - breakthroughRate * 10) * 0.10;
      const durationScore = (avgDuration / 365) * 100 * 0.10;
      const overallScore = efficacyScore + effectivenessScore + safetyScore + breakthroughScore + durationScore;

      return {
        vaccineName: vaccine,
        efficacy: avgEfficacy,
        effectiveness: avgEffectiveness,
        adverseEventRate,
        breakthroughRate,
        immuneDuration: avgDuration,
        overallScore: Math.min(100, Math.max(0, overallScore))
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }

  generateTrendAnalysis(): void {
    const monthlyData = new Map<string, {
      efficacy: number[];
      effectiveness: number[];
      adverseEvents: number[];
      breakthroughCases: number[];
    }>();

    this.efficacyRecords.forEach(record => {
      const monthKey = `${record.studyPeriod.startDate.getFullYear()}-${(record.studyPeriod.startDate.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          efficacy: [],
          effectiveness: [],
          adverseEvents: [],
          breakthroughCases: []
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.efficacy.push(record.efficacyRate);
      data.effectiveness.push(record.effectivenessRate);
      data.adverseEvents.push(record.adverseEvents.total);
      data.breakthroughCases.push(record.breakthrough.length);
    });

    this.trendData = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        efficacy: data.efficacy.reduce((sum, val) => sum + val, 0) / data.efficacy.length,
        effectiveness: data.effectiveness.reduce((sum, val) => sum + val, 0) / data.effectiveness.length,
        adverseEvents: data.adverseEvents.reduce((sum, val) => sum + val, 0),
        breakthroughCases: data.breakthroughCases.reduce((sum, val) => sum + val, 0)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredRecords = this.efficacyRecords.filter(record => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          record.vaccineName.toLowerCase().includes(searchLower) ||
          record.manufacturer.toLowerCase().includes(searchLower) ||
          record.batchNumber.toLowerCase().includes(searchLower) ||
          record.facilityName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Vaccine filter
      if (filters.vaccine && record.vaccineName !== filters.vaccine) {
        return false;
      }

      // Manufacturer filter
      if (filters.manufacturer && record.manufacturer !== filters.manufacturer) {
        return false;
      }

      // Status filter
      if (filters.status && record.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const recordStart = record.studyPeriod.startDate.getTime();
        const recordEnd = record.studyPeriod.endDate.getTime();

        if (filters.dateRange.start) {
          const filterStart = new Date(filters.dateRange.start).getTime();
          if (recordEnd < filterStart) return false;
        }

        if (filters.dateRange.end) {
          const filterEnd = new Date(filters.dateRange.end).getTime();
          if (recordStart > filterEnd) return false;
        }
      }

      // Efficacy range filter
      if (record.efficacyRate < filters.efficacyMin || record.efficacyRate > filters.efficacyMax) {
        return false;
      }

      return true;
    });

    this.updateDisplayedRecords();
  }

  updateDisplayedRecords(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRecords = this.filteredRecords.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedRecords();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccine: '',
      manufacturer: '',
      status: '',
      dateRange: { start: null, end: null },
      efficacyMin: 0,
      efficacyMax: 100
    });
  }

  openRecordDialog(record?: VaccineEfficacy): void {
    this.isEditMode = !!record;
    this.selectedRecord = record || null;

    if (this.isEditMode && record) {
      this.recordForm.patchValue({
        vaccineName: record.vaccineName,
        manufacturer: record.manufacturer,
        batchNumber: record.batchNumber,
        startDate: record.studyPeriod.startDate,
        endDate: record.studyPeriod.endDate,
        populationSize: record.populationSize,
        ageGroup: record.demographics.ageGroup,
        gender: record.demographics.gender,
        comorbidities: record.demographics.comorbidities,
        efficacyRate: record.efficacyRate,
        effectivenessRate: record.effectivenessRate,
        mildEvents: record.adverseEvents.mild,
        moderateEvents: record.adverseEvents.moderate,
        severeEvents: record.adverseEvents.severe,
        antibodyLevel: record.immuneResponse.antibodyLevel,
        tcellResponse: record.immuneResponse.tcellResponse,
        immuneDuration: record.immuneResponse.duration,
        breakthroughCases: record.breakthrough.length,
        breakthroughSeverity: record.breakthrough[0]?.severity || 'Mild',
        confidenceLevel: record.confidence.level,
        confidenceInterval: record.confidence.interval,
        status: record.status,
        facilityName: record.facilityName,
        notes: record.notes
      });
    } else {
      this.recordForm.reset({
        vaccineName: '',
        manufacturer: '',
        batchNumber: '',
        startDate: null,
        endDate: null,
        populationSize: 0,
        ageGroup: '',
        gender: '',
        comorbidities: [],
        efficacyRate: 0,
        effectivenessRate: 0,
        mildEvents: 0,
        moderateEvents: 0,
        severeEvents: 0,
        antibodyLevel: 0,
        tcellResponse: 0,
        immuneDuration: 0,
        breakthroughCases: 0,
        breakthroughSeverity: 'Mild',
        confidenceLevel: 95,
        confidenceInterval: '',
        status: 'Active',
        facilityName: '',
        notes: ''
      });
    }

    this.showRecordDialog = true;
  }

  closeRecordDialog(): void {
    this.showRecordDialog = false;
    this.isEditMode = false;
    this.selectedRecord = null;
    this.recordForm.reset();
  }

  saveRecord(): void {
    if (this.recordForm.invalid) {
      this.notificationService.error('Please fill in all required fields correctly.');
      return;
    }

    this.loaderService.show();

    const formValue = this.recordForm.value;
    const totalAdverse = formValue.mildEvents + formValue.moderateEvents + formValue.severeEvents;

    const breakthrough: VaccineEfficacy['breakthrough'] = [];
    for (let i = 0; i < formValue.breakthroughCases; i++) {
      breakthrough.push({
        cases: 1,
        severity: formValue.breakthroughSeverity,
        vaccinated: true
      });
    }

    const record: VaccineEfficacy = {
      id: this.isEditMode && this.selectedRecord ? this.selectedRecord.id : `EFF-${Date.now()}`,
      vaccineName: formValue.vaccineName,
      manufacturer: formValue.manufacturer,
      batchNumber: formValue.batchNumber,
      studyPeriod: {
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate)
      },
      populationSize: formValue.populationSize,
      demographics: {
        ageGroup: formValue.ageGroup,
        gender: formValue.gender,
        comorbidities: formValue.comorbidities
      },
      efficacyRate: formValue.efficacyRate,
      effectivenessRate: formValue.effectivenessRate,
      adverseEvents: {
        mild: formValue.mildEvents,
        moderate: formValue.moderateEvents,
        severe: formValue.severeEvents,
        total: totalAdverse
      },
      immuneResponse: {
        antibodyLevel: formValue.antibodyLevel,
        tcellResponse: formValue.tcellResponse,
        duration: formValue.immuneDuration
      },
      breakthrough,
      confidence: {
        level: formValue.confidenceLevel,
        interval: formValue.confidenceInterval
      },
      status: formValue.status,
      facilityId: this.isEditMode && this.selectedRecord ? this.selectedRecord.facilityId : `FAC-${Date.now()}`,
      facilityName: formValue.facilityName,
      notes: formValue.notes
    };

    if (this.isEditMode) {
      const index = this.efficacyRecords.findIndex(r => r.id === this.selectedRecord!.id);
      if (index !== -1) {
        this.efficacyRecords[index] = record;
        this.notificationService.success('Efficacy record updated successfully!');
      }
    } else {
      this.efficacyRecords.unshift(record);
      this.notificationService.success('Efficacy record created successfully!');
    }

    this.saveToLocalStorage();
    this.calculateStats();
    this.generateComparativeAnalysis();
    this.generateTrendAnalysis();
    this.applyFilters();
    this.closeRecordDialog();
  }

  deleteRecord(record: VaccineEfficacy): void {
    this.notificationService.confirm(
      `Are you sure you want to delete the efficacy record for ${record.vaccineName} (${record.batchNumber})?`
    );

    this.efficacyRecords = this.efficacyRecords.filter(r => r.id !== record.id);
    this.saveToLocalStorage();
    this.calculateStats();
    this.generateComparativeAnalysis();
    this.generateTrendAnalysis();
    this.applyFilters();
    this.notificationService.success('Efficacy record deleted successfully!');
  }

  exportData(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();

    setTimeout(() => {
      if (format === 'csv') {
        const csv = this.convertToCSV(this.filteredRecords);
        this.downloadFile(csv, 'vaccine-efficacy-data.csv', 'text/csv');
        this.notificationService.success('Data exported as CSV successfully!');
      } else if (format === 'json') {
        const json = JSON.stringify(this.filteredRecords, null, 2);
        this.downloadFile(json, 'vaccine-efficacy-data.json', 'application/json');
        this.notificationService.success('Data exported as JSON successfully!');
      } else {
        this.notificationService.info('PDF export will be implemented with a reporting library.');
      }
    }, 1000);
  }

  private convertToCSV(records: VaccineEfficacy[]): string {
    const headers = [
      'ID',
      'Vaccine Name',
      'Manufacturer',
      'Batch Number',
      'Start Date',
      'End Date',
      'Population Size',
      'Age Group',
      'Gender',
      'Efficacy Rate (%)',
      'Effectiveness Rate (%)',
      'Mild Events',
      'Moderate Events',
      'Severe Events',
      'Total Adverse Events',
      'Antibody Level',
      'T-Cell Response (%)',
      'Immune Duration (days)',
      'Breakthrough Cases',
      'Confidence Level (%)',
      'Status',
      'Facility'
    ];

    const rows = records.map(r => [
      r.id,
      r.vaccineName,
      r.manufacturer,
      r.batchNumber,
      this.formatDate(r.studyPeriod.startDate),
      this.formatDate(r.studyPeriod.endDate),
      r.populationSize,
      r.demographics.ageGroup,
      r.demographics.gender,
      r.efficacyRate.toFixed(2),
      r.effectivenessRate.toFixed(2),
      r.adverseEvents.mild,
      r.adverseEvents.moderate,
      r.adverseEvents.severe,
      r.adverseEvents.total,
      r.immuneResponse.antibodyLevel.toFixed(2),
      r.immuneResponse.tcellResponse.toFixed(2),
      r.immuneResponse.duration,
      r.breakthrough.length,
      r.confidence.level.toFixed(2),
      r.status,
      r.facilityName
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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

  getEfficacyColor(efficacy: number): string {
    if (efficacy >= 90) return '#10b981'; // Green
    if (efficacy >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  getStatusColor(status: VaccineEfficacy['status']): string {
    switch (status) {
      case 'Active':
        return '#10b981';
      case 'Completed':
        return '#3b82f6';
      case 'Under Review':
        return '#f59e0b';
      case 'Pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  }

  getSeverityColor(severity: 'Mild' | 'Moderate' | 'Severe'): string {
    switch (severity) {
      case 'Mild':
        return '#10b981';
      case 'Moderate':
        return '#f59e0b';
      case 'Severe':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getAverageAdverseEventRate(): string {
    if (this.comparativeData.length === 0) return '0.0%';
    const avg = this.comparativeData.reduce((sum, v) => sum + v.adverseEventRate, 0) / this.comparativeData.length;
    return this.formatPercentage(avg);
  }

  getAverageImmuneDuration(): string {
    if (this.comparativeData.length === 0) return '0';
    const avg = this.comparativeData.reduce((sum, v) => sum + v.immuneDuration, 0) / this.comparativeData.length;
    return avg.toFixed(0);
  }
}
