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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface AdverseEvent {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  vaccineName: string;
  vaccineManufacturer: string;
  batchNumber: string;
  vaccinationDate: Date;
  eventDate: Date;
  onsetTime: number; // hours after vaccination
  reportDate: Date;
  reportedBy: string;
  reporterType: 'Healthcare Provider' | 'Patient' | 'Caregiver' | 'Other';
  
  // Event Classification
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening' | 'Fatal';
  eventType: string;
  symptoms: string[];
  description: string;
  
  // Medical Details
  medicalHistory: string;
  concomitantMedications: string;
  allergies: string;
  previousReactions: boolean;
  
  // Outcome
  outcome: 'Recovered' | 'Recovering' | 'Not Recovered' | 'Fatal' | 'Unknown';
  hospitalized: boolean;
  hospitalizationDays?: number;
  treatmentProvided: string;
  
  // Causality Assessment
  causalityCategory: 'Certain' | 'Probable' | 'Possible' | 'Unlikely' | 'Unrelated' | 'Unclassifiable';
  causalityScore: number;
  assessedBy: string;
  assessmentDate: Date;
  assessmentNotes: string;
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes: string;
  
  // Regulatory
  reportedToAuthority: boolean;
  authorityReportDate?: Date;
  regulatoryActionTaken: string;
  
  status: 'Reported' | 'Under Investigation' | 'Investigated' | 'Closed';
  facilityId: string;
  facilityName: string;
}

interface EventAnalytics {
  totalEvents: number;
  mildEvents: number;
  moderateEvents: number;
  severeEvents: number;
  fatalEvents: number;
  
  underInvestigation: number;
  investigated: number;
  closed: number;
  
  averageOnsetTime: number;
  hospitalizationRate: number;
  recoveryRate: number;
  
  topSymptoms: { symptom: string; count: number }[];
  eventsByVaccine: { vaccineName: string; count: number; rate: number }[];
  eventsByAge: { ageGroup: string; count: number }[];
}

interface CausalityAssessment {
  eventId: string;
  patientName: string;
  vaccineName: string;
  
  // WHO Causality Assessment Criteria
  temporalRelationship: number; // 0-3 score
  biologicalPlausibility: number; // 0-3 score
  previousExposure: number; // 0-3 score
  otherCauses: number; // 0-3 score
  rechallenge: number; // 0-3 score
  specificity: number; // 0-3 score
  
  totalScore: number;
  category: AdverseEvent['causalityCategory'];
  confidence: number;
  notes: string;
}

interface TrendData {
  month: string;
  totalEvents: number;
  mildEvents: number;
  moderateEvents: number;
  severeEvents: number;
  fatalEvents: number;
  reportingRate: number;
}

@Component({
  selector: 'app-adverse-events',
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
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './adverse-events.component.html',
  styleUrls: ['./adverse-events.component.scss']
})
export class AdverseEventsComponent implements OnInit {
  events: AdverseEvent[] = [];
  filteredEvents: AdverseEvent[] = [];
  displayedEvents: AdverseEvent[] = [];
  
  analytics: EventAnalytics = {
    totalEvents: 0,
    mildEvents: 0,
    moderateEvents: 0,
    severeEvents: 0,
    fatalEvents: 0,
    underInvestigation: 0,
    investigated: 0,
    closed: 0,
    averageOnsetTime: 0,
    hospitalizationRate: 0,
    recoveryRate: 0,
    topSymptoms: [],
    eventsByVaccine: [],
    eventsByAge: []
  };
  
  trendData: TrendData[] = [];

  filterForm!: FormGroup;
  eventForm!: FormGroup;
  causalityForm!: FormGroup;

  // Pagination
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Table columns
  eventColumns = [
    'reportDate',
    'patientName',
    'vaccineName',
    'eventType',
    'severity',
    'outcome',
    'causality',
    'status',
    'actions'
  ];

  // Dialog state
  showEventDialog = false;
  showCausalityDialog = false;
  isEditMode = false;
  selectedEvent: AdverseEvent | null = null;

  // Options
  severities: AdverseEvent['severity'][] = [
    'Mild',
    'Moderate',
    'Severe',
    'Life-Threatening',
    'Fatal'
  ];

  outcomes: AdverseEvent['outcome'][] = [
    'Recovered',
    'Recovering',
    'Not Recovered',
    'Fatal',
    'Unknown'
  ];

  causalityCategories: AdverseEvent['causalityCategory'][] = [
    'Certain',
    'Probable',
    'Possible',
    'Unlikely',
    'Unrelated',
    'Unclassifiable'
  ];

  statuses: AdverseEvent['status'][] = [
    'Reported',
    'Under Investigation',
    'Investigated',
    'Closed'
  ];

  reporterTypes: AdverseEvent['reporterType'][] = [
    'Healthcare Provider',
    'Patient',
    'Caregiver',
    'Other'
  ];

  commonSymptoms = [
    'Fever',
    'Pain at injection site',
    'Redness',
    'Swelling',
    'Fatigue',
    'Headache',
    'Muscle pain',
    'Chills',
    'Nausea',
    'Vomiting',
    'Diarrhea',
    'Rash',
    'Itching',
    'Dizziness',
    'Allergic reaction',
    'Anaphylaxis',
    'Seizure',
    'Difficulty breathing',
    'Chest pain',
    'Loss of consciousness'
  ];

  vaccines = [
    'BCG',
    'Hepatitis B',
    'Polio (OPV)',
    'Polio (IPV)',
    'DTP',
    'Hib',
    'Pneumococcal',
    'Rotavirus',
    'Measles',
    'MMR',
    'HPV',
    'COVID-19',
    'Influenza',
    'Varicella'
  ];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadEvents();
    this.calculateAnalytics();
    this.generateTrendData();
    this.applyFilters();
  }

  initializeForms(): void {
    // Filter form
    this.filterForm = this.fb.group({
      search: [''],
      vaccineName: [''],
      severity: [''],
      outcome: [''],
      causality: [''],
      status: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      })
    });

    // Event form
    this.eventForm = this.fb.group({
      patientName: ['', Validators.required],
      patientAge: [0, [Validators.required, Validators.min(0), Validators.max(120)]],
      patientGender: ['', Validators.required],
      vaccineName: ['', Validators.required],
      vaccineManufacturer: ['', Validators.required],
      batchNumber: ['', Validators.required],
      vaccinationDate: [null, Validators.required],
      eventDate: [null, Validators.required],
      reportDate: [new Date(), Validators.required],
      reportedBy: ['', Validators.required],
      reporterType: ['Healthcare Provider', Validators.required],
      
      severity: ['Mild', Validators.required],
      eventType: ['', Validators.required],
      symptoms: [[]],
      description: ['', Validators.required],
      
      medicalHistory: [''],
      concomitantMedications: [''],
      allergies: [''],
      previousReactions: [false],
      
      outcome: ['Unknown', Validators.required],
      hospitalized: [false],
      hospitalizationDays: [0],
      treatmentProvided: [''],
      
      followUpRequired: [false],
      followUpDate: [null],
      followUpNotes: [''],
      
      reportedToAuthority: [false],
      authorityReportDate: [null],
      regulatoryActionTaken: ['']
    });

    // Causality assessment form
    this.causalityForm = this.fb.group({
      temporalRelationship: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      biologicalPlausibility: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      previousExposure: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      otherCauses: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      rechallenge: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      specificity: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      notes: ['', Validators.required]
    });

    // Watch filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Watch causality form changes to calculate score
    this.causalityForm.valueChanges.subscribe(() => {
      this.calculateCausalityScore();
    });
  }

  generateMockEvents(): AdverseEvent[] {
    const events: AdverseEvent[] = [];
    const facilities = [
      'Central Hospital',
      'Regional Health Center',
      'Community Clinic',
      'District Hospital',
      'Urban Health Post'
    ];

    for (let i = 0; i < 100; i++) {
      const vaccinationDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const onsetHours = Math.floor(Math.random() * 168); // Up to 7 days
      const eventDate = new Date(vaccinationDate.getTime() + onsetHours * 3600000);
      const reportDate = new Date(eventDate.getTime() + Math.random() * 7 * 24 * 3600000);

      const severity = this.severities[Math.floor(Math.random() * this.severities.length)];
      const hospitalized = severity === 'Severe' || severity === 'Life-Threatening' || severity === 'Fatal';

      events.push({
        id: `AE-${(i + 1).toString().padStart(4, '0')}`,
        patientId: `PAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        patientName: this.generateRandomName(),
        patientAge: Math.floor(Math.random() * 80) + 1,
        patientGender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as any,
        vaccineName: this.vaccines[Math.floor(Math.random() * this.vaccines.length)],
        vaccineManufacturer: ['Pfizer', 'Moderna', 'AstraZeneca', 'Johnson & Johnson', 'Serum Institute'][Math.floor(Math.random() * 5)],
        batchNumber: `BATCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        vaccinationDate,
        eventDate,
        onsetTime: onsetHours,
        reportDate,
        reportedBy: this.generateRandomName(),
        reporterType: this.reporterTypes[Math.floor(Math.random() * this.reporterTypes.length)],
        
        severity,
        eventType: this.getEventTypeForSeverity(severity),
        symptoms: this.getRandomSymptoms(severity),
        description: `Patient experienced ${severity.toLowerCase()} adverse event following vaccination.`,
        
        medicalHistory: Math.random() > 0.7 ? 'Hypertension, Diabetes' : 'None reported',
        concomitantMedications: Math.random() > 0.6 ? 'Paracetamol, Antihistamines' : 'None',
        allergies: Math.random() > 0.8 ? 'Penicillin allergy' : 'None known',
        previousReactions: Math.random() > 0.9,
        
        outcome: this.getOutcomeForSeverity(severity),
        hospitalized,
        hospitalizationDays: hospitalized ? Math.floor(Math.random() * 14) + 1 : undefined,
        treatmentProvided: hospitalized ? 'Symptomatic treatment, monitoring' : 'Home care advised',
        
        causalityCategory: this.causalityCategories[Math.floor(Math.random() * this.causalityCategories.length)],
        causalityScore: Math.floor(Math.random() * 18) + 1,
        assessedBy: this.generateRandomName(),
        assessmentDate: new Date(reportDate.getTime() + Math.random() * 14 * 24 * 3600000),
        assessmentNotes: 'Causality assessment completed based on WHO criteria.',
        
        followUpRequired: Math.random() > 0.5,
        followUpDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 3600000) : undefined,
        followUpNotes: Math.random() > 0.5 ? 'Follow-up scheduled' : '',
        
        reportedToAuthority: Math.random() > 0.3,
        authorityReportDate: Math.random() > 0.3 ? new Date(reportDate.getTime() + Math.random() * 7 * 24 * 3600000) : undefined,
        regulatoryActionTaken: Math.random() > 0.8 ? 'Investigation initiated' : 'None',
        
        status: this.statuses[Math.floor(Math.random() * this.statuses.length)],
        facilityId: `FAC-${Math.floor(Math.random() * 5) + 1}`,
        facilityName: facilities[Math.floor(Math.random() * facilities.length)]
      });
    }

    return events.sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime());
  }

  private generateRandomName(): string {
    const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private getEventTypeForSeverity(severity: AdverseEvent['severity']): string {
    const types = {
      'Mild': ['Local reaction', 'Mild fever', 'Injection site pain'],
      'Moderate': ['Moderate fever', 'Rash', 'Headache'],
      'Severe': ['High fever', 'Severe allergic reaction', 'Persistent vomiting'],
      'Life-Threatening': ['Anaphylaxis', 'Seizure', 'Severe allergic reaction'],
      'Fatal': ['Anaphylactic shock', 'Cardiac arrest', 'Severe complication']
    };
    const options = types[severity];
    return options[Math.floor(Math.random() * options.length)];
  }

  private getRandomSymptoms(severity: AdverseEvent['severity']): string[] {
    const count = severity === 'Mild' ? 2 : severity === 'Moderate' ? 3 : severity === 'Severe' ? 4 : 5;
    const shuffled = [...this.commonSymptoms].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getOutcomeForSeverity(severity: AdverseEvent['severity']): AdverseEvent['outcome'] {
    if (severity === 'Fatal') return 'Fatal';
    if (severity === 'Life-Threatening') return Math.random() > 0.5 ? 'Recovering' : 'Not Recovered';
    if (severity === 'Severe') return Math.random() > 0.3 ? 'Recovering' : 'Recovered';
    return Math.random() > 0.2 ? 'Recovered' : 'Recovering';
  }

  loadEvents(): void {
    const stored = localStorage.getItem('adverseEvents');
    if (stored) {
      this.events = JSON.parse(stored, (key, value) => {
        if (key === 'vaccinationDate' || key === 'eventDate' || key === 'reportDate' || 
            key === 'assessmentDate' || key === 'followUpDate' || key === 'authorityReportDate') {
          return value ? new Date(value) : undefined;
        }
        return value;
      });
    } else {
      this.events = this.generateMockEvents();
      this.saveToLocalStorage();
    }
  }

  saveToLocalStorage(): void {
    localStorage.setItem('adverseEvents', JSON.stringify(this.events));
  }

  calculateAnalytics(): void {
    this.analytics = {
      totalEvents: this.events.length,
      mildEvents: this.events.filter(e => e.severity === 'Mild').length,
      moderateEvents: this.events.filter(e => e.severity === 'Moderate').length,
      severeEvents: this.events.filter(e => e.severity === 'Severe').length,
      fatalEvents: this.events.filter(e => e.severity === 'Fatal').length,
      underInvestigation: this.events.filter(e => e.status === 'Under Investigation').length,
      investigated: this.events.filter(e => e.status === 'Investigated').length,
      closed: this.events.filter(e => e.status === 'Closed').length,
      averageOnsetTime: this.events.reduce((sum, e) => sum + e.onsetTime, 0) / this.events.length || 0,
      hospitalizationRate: (this.events.filter(e => e.hospitalized).length / this.events.length) * 100 || 0,
      recoveryRate: (this.events.filter(e => e.outcome === 'Recovered').length / this.events.length) * 100 || 0,
      topSymptoms: this.getTopSymptoms(),
      eventsByVaccine: this.getEventsByVaccine(),
      eventsByAge: this.getEventsByAge()
    };
  }

  getTopSymptoms(): { symptom: string; count: number }[] {
    const symptomCounts = new Map<string, number>();
    this.events.forEach(event => {
      event.symptoms.forEach(symptom => {
        symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1);
      });
    });

    return Array.from(symptomCounts.entries())
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getEventsByVaccine(): { vaccineName: string; count: number; rate: number }[] {
    const vaccineCounts = new Map<string, number>();
    this.events.forEach(event => {
      vaccineCounts.set(event.vaccineName, (vaccineCounts.get(event.vaccineName) || 0) + 1);
    });

    return Array.from(vaccineCounts.entries())
      .map(([vaccineName, count]) => ({
        vaccineName,
        count,
        rate: (count / this.events.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  getEventsByAge(): { ageGroup: string; count: number }[] {
    const ageGroups = {
      '0-1': 0,
      '1-5': 0,
      '6-12': 0,
      '13-18': 0,
      '19-30': 0,
      '31-50': 0,
      '51-70': 0,
      '70+': 0
    };

    this.events.forEach(event => {
      const age = event.patientAge;
      if (age < 1) ageGroups['0-1']++;
      else if (age < 6) ageGroups['1-5']++;
      else if (age < 13) ageGroups['6-12']++;
      else if (age < 19) ageGroups['13-18']++;
      else if (age < 31) ageGroups['19-30']++;
      else if (age < 51) ageGroups['31-50']++;
      else if (age < 71) ageGroups['51-70']++;
      else ageGroups['70+']++;
    });

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({ ageGroup, count }));
  }

  generateTrendData(): void {
    const monthlyData = new Map<string, TrendData>();
    const totalVaccinations = 10000; // Mock data

    this.events.forEach(event => {
      const monthKey = this.formatMonth(event.reportDate);
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          totalEvents: 0,
          mildEvents: 0,
          moderateEvents: 0,
          severeEvents: 0,
          fatalEvents: 0,
          reportingRate: 0
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.totalEvents++;
      
      if (event.severity === 'Mild') data.mildEvents++;
      else if (event.severity === 'Moderate') data.moderateEvents++;
      else if (event.severity === 'Severe') data.severeEvents++;
      else if (event.severity === 'Fatal') data.fatalEvents++;
    });

    this.trendData = Array.from(monthlyData.values())
      .map(data => ({
        ...data,
        reportingRate: (data.totalEvents / totalVaccinations) * 100000 // per 100,000 vaccinations
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredEvents = this.events.filter(event => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          event.patientName.toLowerCase().includes(searchLower) ||
          event.vaccineName.toLowerCase().includes(searchLower) ||
          event.eventType.toLowerCase().includes(searchLower) ||
          event.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.vaccineName && event.vaccineName !== filters.vaccineName) return false;
      if (filters.severity && event.severity !== filters.severity) return false;
      if (filters.outcome && event.outcome !== filters.outcome) return false;
      if (filters.causality && event.causalityCategory !== filters.causality) return false;
      if (filters.status && event.status !== filters.status) return false;

      if (filters.dateRange?.start && event.reportDate < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange?.end && event.reportDate > new Date(filters.dateRange.end)) return false;

      return true;
    });

    this.updateDisplayedEvents();
  }

  updateDisplayedEvents(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedEvents = this.filteredEvents.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedEvents();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccineName: '',
      severity: '',
      outcome: '',
      causality: '',
      status: '',
      dateRange: { start: null, end: null }
    });
  }

  openEventDialog(event?: AdverseEvent): void {
    this.isEditMode = !!event;
    this.selectedEvent = event || null;

    if (this.isEditMode && event) {
      this.eventForm.patchValue({
        patientName: event.patientName,
        patientAge: event.patientAge,
        patientGender: event.patientGender,
        vaccineName: event.vaccineName,
        vaccineManufacturer: event.vaccineManufacturer,
        batchNumber: event.batchNumber,
        vaccinationDate: event.vaccinationDate,
        eventDate: event.eventDate,
        reportDate: event.reportDate,
        reportedBy: event.reportedBy,
        reporterType: event.reporterType,
        severity: event.severity,
        eventType: event.eventType,
        symptoms: event.symptoms,
        description: event.description,
        medicalHistory: event.medicalHistory,
        concomitantMedications: event.concomitantMedications,
        allergies: event.allergies,
        previousReactions: event.previousReactions,
        outcome: event.outcome,
        hospitalized: event.hospitalized,
        hospitalizationDays: event.hospitalizationDays || 0,
        treatmentProvided: event.treatmentProvided,
        followUpRequired: event.followUpRequired,
        followUpDate: event.followUpDate,
        followUpNotes: event.followUpNotes,
        reportedToAuthority: event.reportedToAuthority,
        authorityReportDate: event.authorityReportDate,
        regulatoryActionTaken: event.regulatoryActionTaken
      });
    } else {
      this.eventForm.reset({
        patientName: '',
        patientAge: 0,
        patientGender: '',
        vaccineName: '',
        vaccineManufacturer: '',
        batchNumber: '',
        vaccinationDate: null,
        eventDate: null,
        reportDate: new Date(),
        reportedBy: '',
        reporterType: 'Healthcare Provider',
        severity: 'Mild',
        eventType: '',
        symptoms: [],
        description: '',
        medicalHistory: '',
        concomitantMedications: '',
        allergies: '',
        previousReactions: false,
        outcome: 'Unknown',
        hospitalized: false,
        hospitalizationDays: 0,
        treatmentProvided: '',
        followUpRequired: false,
        followUpDate: null,
        followUpNotes: '',
        reportedToAuthority: false,
        authorityReportDate: null,
        regulatoryActionTaken: ''
      });
    }

    this.showEventDialog = true;
  }

  closeEventDialog(): void {
    this.showEventDialog = false;
    this.isEditMode = false;
    this.selectedEvent = null;
    this.eventForm.reset();
  }

  saveEvent(): void {
    if (this.eventForm.invalid) {
      this.notificationService.error('Please fill in all required fields correctly.');
      return;
    }

    this.loaderService.show();

    const formValue = this.eventForm.value;
    const vaccinationDate = new Date(formValue.vaccinationDate);
    const eventDate = new Date(formValue.eventDate);
    const onsetTime = (eventDate.getTime() - vaccinationDate.getTime()) / 3600000;

    const event: AdverseEvent = {
      id: this.isEditMode && this.selectedEvent ? this.selectedEvent.id : `AE-${Date.now()}`,
      patientId: this.isEditMode && this.selectedEvent ? this.selectedEvent.patientId : `PAT-${Date.now()}`,
      patientName: formValue.patientName,
      patientAge: formValue.patientAge,
      patientGender: formValue.patientGender,
      vaccineName: formValue.vaccineName,
      vaccineManufacturer: formValue.vaccineManufacturer,
      batchNumber: formValue.batchNumber,
      vaccinationDate,
      eventDate,
      onsetTime,
      reportDate: new Date(formValue.reportDate),
      reportedBy: formValue.reportedBy,
      reporterType: formValue.reporterType,
      severity: formValue.severity,
      eventType: formValue.eventType,
      symptoms: formValue.symptoms || [],
      description: formValue.description,
      medicalHistory: formValue.medicalHistory || '',
      concomitantMedications: formValue.concomitantMedications || '',
      allergies: formValue.allergies || '',
      previousReactions: formValue.previousReactions,
      outcome: formValue.outcome,
      hospitalized: formValue.hospitalized,
      hospitalizationDays: formValue.hospitalized ? formValue.hospitalizationDays : undefined,
      treatmentProvided: formValue.treatmentProvided || '',
      causalityCategory: this.isEditMode && this.selectedEvent ? this.selectedEvent.causalityCategory : 'Unclassifiable',
      causalityScore: this.isEditMode && this.selectedEvent ? this.selectedEvent.causalityScore : 0,
      assessedBy: this.isEditMode && this.selectedEvent ? this.selectedEvent.assessedBy : '',
      assessmentDate: this.isEditMode && this.selectedEvent ? this.selectedEvent.assessmentDate : new Date(),
      assessmentNotes: this.isEditMode && this.selectedEvent ? this.selectedEvent.assessmentNotes : '',
      followUpRequired: formValue.followUpRequired,
      followUpDate: formValue.followUpDate ? new Date(formValue.followUpDate) : undefined,
      followUpNotes: formValue.followUpNotes || '',
      reportedToAuthority: formValue.reportedToAuthority,
      authorityReportDate: formValue.authorityReportDate ? new Date(formValue.authorityReportDate) : undefined,
      regulatoryActionTaken: formValue.regulatoryActionTaken || '',
      status: this.isEditMode && this.selectedEvent ? this.selectedEvent.status : 'Reported',
      facilityId: this.isEditMode && this.selectedEvent ? this.selectedEvent.facilityId : 'FAC-001',
      facilityName: this.isEditMode && this.selectedEvent ? this.selectedEvent.facilityName : 'Current Facility'
    };

    if (this.isEditMode) {
      const index = this.events.findIndex(e => e.id === this.selectedEvent!.id);
      if (index !== -1) {
        this.events[index] = event;
        this.notificationService.success('Adverse event updated successfully!');
      }
    } else {
      this.events.unshift(event);
      this.notificationService.success('Adverse event reported successfully!');
    }

    this.saveToLocalStorage();
    this.calculateAnalytics();
    this.generateTrendData();
    this.applyFilters();
    this.closeEventDialog();
  }

  deleteEvent(event: AdverseEvent): void {
    this.notificationService.confirm(`Are you sure you want to delete adverse event ${event.id}?`);

    this.events = this.events.filter(e => e.id !== event.id);
    this.saveToLocalStorage();
    this.calculateAnalytics();
    this.generateTrendData();
    this.applyFilters();
    this.notificationService.success('Adverse event deleted successfully!');
  }

  openCausalityDialog(event: AdverseEvent): void {
    this.selectedEvent = event;
    
    // Calculate scores from existing causality if available
    if (event.causalityScore > 0) {
      const avgScore = event.causalityScore / 6;
      this.causalityForm.patchValue({
        temporalRelationship: Math.round(avgScore),
        biologicalPlausibility: Math.round(avgScore),
        previousExposure: Math.round(avgScore),
        otherCauses: Math.round(avgScore),
        rechallenge: Math.round(avgScore),
        specificity: Math.round(avgScore),
        notes: event.assessmentNotes
      });
    } else {
      this.causalityForm.reset({
        temporalRelationship: 0,
        biologicalPlausibility: 0,
        previousExposure: 0,
        otherCauses: 0,
        rechallenge: 0,
        specificity: 0,
        notes: ''
      });
    }

    this.showCausalityDialog = true;
  }

  closeCausalityDialog(): void {
    this.showCausalityDialog = false;
    this.selectedEvent = null;
    this.causalityForm.reset();
  }

  calculateCausalityScore(): { totalScore: number; category: AdverseEvent['causalityCategory'] } {
    const formValue = this.causalityForm.value;
    const totalScore = 
      formValue.temporalRelationship +
      formValue.biologicalPlausibility +
      formValue.previousExposure +
      formValue.otherCauses +
      formValue.rechallenge +
      formValue.specificity;

    // Update category based on WHO criteria
    let category: AdverseEvent['causalityCategory'];
    if (totalScore >= 15) category = 'Certain';
    else if (totalScore >= 12) category = 'Probable';
    else if (totalScore >= 8) category = 'Possible';
    else if (totalScore >= 4) category = 'Unlikely';
    else if (totalScore === 0) category = 'Unclassifiable';
    else category = 'Unrelated';

    return { totalScore, category };
  }

  saveCausality(): void {
    if (this.causalityForm.invalid || !this.selectedEvent) {
      this.notificationService.error('Please complete all assessment criteria.');
      return;
    }

    this.loaderService.show();

    const { totalScore, category } = this.calculateCausalityScore();
    const formValue = this.causalityForm.value;

    const index = this.events.findIndex(e => e.id === this.selectedEvent!.id);
    if (index !== -1) {
      this.events[index].causalityScore = totalScore;
      this.events[index].causalityCategory = category;
      this.events[index].assessedBy = 'Current User';
      this.events[index].assessmentDate = new Date();
      this.events[index].assessmentNotes = formValue.notes;
      this.events[index].status = 'Investigated';

      this.saveToLocalStorage();
      this.calculateAnalytics();
      this.applyFilters();
      this.notificationService.success('Causality assessment saved successfully!');
    }

    this.closeCausalityDialog();
  }

  exportData(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();

    setTimeout(() => {
      if (format === 'csv') {
        const csv = this.convertToCSV(this.filteredEvents);
        this.downloadFile(csv, 'adverse-events.csv', 'text/csv');
        this.notificationService.success('Data exported as CSV successfully!');
      } else if (format === 'json') {
        const json = JSON.stringify(this.filteredEvents, null, 2);
        this.downloadFile(json, 'adverse-events.json', 'application/json');
        this.notificationService.success('Data exported as JSON successfully!');
      } else {
        this.notificationService.info('PDF export will be implemented with a reporting library.');
      }
    }, 1000);
  }

  private convertToCSV(events: AdverseEvent[]): string {
    const headers = [
      'ID',
      'Report Date',
      'Patient Name',
      'Age',
      'Gender',
      'Vaccine',
      'Manufacturer',
      'Batch',
      'Event Date',
      'Onset Hours',
      'Severity',
      'Event Type',
      'Symptoms',
      'Outcome',
      'Hospitalized',
      'Causality',
      'Status'
    ];

    const rows = events.map(e => [
      e.id,
      this.formatDate(e.reportDate),
      e.patientName,
      e.patientAge,
      e.patientGender,
      e.vaccineName,
      e.vaccineManufacturer,
      e.batchNumber,
      this.formatDate(e.eventDate),
      e.onsetTime.toFixed(1),
      e.severity,
      e.eventType,
      e.symptoms.join('; '),
      e.outcome,
      e.hospitalized ? 'Yes' : 'No',
      e.causalityCategory,
      e.status
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

  getSeverityColor(severity: AdverseEvent['severity']): string {
    switch (severity) {
      case 'Mild':
        return '#10b981';
      case 'Moderate':
        return '#f59e0b';
      case 'Severe':
        return '#ff6b35';
      case 'Life-Threatening':
        return '#ef4444';
      case 'Fatal':
        return '#991b1b';
      default:
        return '#6b7280';
    }
  }

  getOutcomeColor(outcome: AdverseEvent['outcome']): string {
    switch (outcome) {
      case 'Recovered':
        return '#10b981';
      case 'Recovering':
        return '#3b82f6';
      case 'Not Recovered':
        return '#f59e0b';
      case 'Fatal':
        return '#ef4444';
      case 'Unknown':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  }

  getCausalityColor(causality: AdverseEvent['causalityCategory']): string {
    switch (causality) {
      case 'Certain':
        return '#ef4444';
      case 'Probable':
        return '#ff6b35';
      case 'Possible':
        return '#f59e0b';
      case 'Unlikely':
        return '#10b981';
      case 'Unrelated':
        return '#6b7280';
      case 'Unclassifiable':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  }

  getStatusColor(status: AdverseEvent['status']): string {
    switch (status) {
      case 'Reported':
        return '#3b82f6';
      case 'Under Investigation':
        return '#f59e0b';
      case 'Investigated':
        return '#8b5cf6';
      case 'Closed':
        return '#10b981';
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

  formatMonth(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatHours(hours: number): string {
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    const days = (hours / 24).toFixed(1);
    return `${days} days`;
  }
}
