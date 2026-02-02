import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { PatientService } from '../../../../core/services/patient.service';
import { VaccinationService } from '../../../../core/services/vaccination.service';
import { AdverseEventService } from '../../../../core/services/adverse-event.service';
import { StockService } from '../../../../core/services/stock.service';
import { Patient } from '../../../../core/models/patient.model';
import { VaccinationRecord, Vaccine, CreateAdverseEventRequest } from '../../../../core/models/vaccination.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { format } from 'date-fns';
import { environment } from '../../../../../environments/environment';
import { ensureMinimumLoadingTime } from '../../../../core/utils/loading.util';

@Component({
  selector: 'app-record-vaccination',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './record-vaccination.component.html',
  styleUrl: './record-vaccination.component.scss'
})
export class RecordVaccinationComponent implements OnInit {
  vaccinationForm: FormGroup;
  patient: Patient | null = null;
  loading = false;
  showSuccessModal = false;
  showStockWarning = false;
  stockWarningMessage = '';
  errorMessage = '';

  // Table and modal state
  vaccinations: VaccinationRecord[] = [];
  filteredVaccinations: VaccinationRecord[] = [];
  searchQuery = '';
  filterDate = format(new Date(), 'yyyy-MM-dd');
  showRecordModal = false;
  showOfflineBanner = false;
  isLoadingData = false; // Made public for template access

  availableVaccines: Vaccine[] = [];
  availableBatches: any[] = []; // Array of { id, batchNumber, expiry, quantity }
  patientSearchQuery = '';
  patientSearchResults: Patient[] = [];
  selectedPatient: Patient | null = null;
  loadingBatches = false;
  
  administrationSites = [
    { value: 'LEFT_ARM', label: 'Left Arm' },
    { value: 'RIGHT_ARM', label: 'Right Arm' },
    { value: 'LEFT_THIGH', label: 'Left Thigh' },
    { value: 'RIGHT_THIGH', label: 'Right Thigh' }
  ];

  suggestedDose = 1;
  nextAppointmentDate: Date | null = null;

  // Adverse event form state
  showAdverseEventForm = false;
  adverseEventForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private vaccinationService: VaccinationService,
    private adverseEventService: AdverseEventService,
    private stockService: StockService,
    private toastService: ToastService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.vaccinationForm = this.fb.group({
      patientId: ['', [Validators.required]],
      vaccineId: ['', [Validators.required]],
      vaccine: [''], // Not required - only vaccineId is needed
      doseNumber: [1, [Validators.required, Validators.min(1)]],
      batchNumber: ['', [Validators.required]],
      administeredDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
      administrationDate: [new Date().toISOString().split('T')[0]], // Not required - only administeredDate is needed
      administrationSite: ['LEFT_ARM', [Validators.required]],
      site: [''], // Not required - only administrationSite is needed
      adverseEventNotes: [''],
      adverseEvents: [''], // Keep for backward compatibility
      markAdverseEvent: [false],
      adverseEvent: this.fb.group({
        severity: [''],
        description: [''],
        actionTaken: ['']
      })
    });

    // Adverse event form (separate for easier access)
    this.adverseEventForm = this.vaccinationForm.get('adverseEvent') as FormGroup;

    // Add dynamic max validator for dose number based on selected vaccine
    this.vaccinationForm.get('vaccineId')?.valueChanges.subscribe(() => {
      const doseControl = this.vaccinationForm.get('doseNumber');
      const maxDose = this.getMaxDoseForVaccine();
      doseControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(maxDose)
      ]);
      doseControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {this.checkOfflineStatus();
    
    // Check both route params and query params for patientId
    const routePatientId = this.route.snapshot.paramMap.get('patientId');
    const queryPatientId = this.route.snapshot.queryParamMap.get('patientId');
    const patientId = routePatientId || queryPatientId;if (patientId) {
      this.loadPatient(patientId);
      this.selectedPatient = { id: patientId } as Patient;
      this.vaccinationForm.patchValue({ patientId });
      // Auto-open modal if patientId is provided
      setTimeout(() => {this.openRecordModal();
      }, 500);
    }

    this.loadVaccinations();
    this.loadVaccines();// Set default date to today and sync site field
    this.vaccinationForm.patchValue({
      administrationDate: new Date().toISOString().split('T')[0],
      administeredDate: format(new Date(), 'yyyy-MM-dd'),
      site: 'LEFT_ARM' // Sync site with default administrationSite
    });

    // Load batches when vaccine is selected
    this.vaccinationForm.get('vaccineId')?.valueChanges.subscribe(vaccineId => {if (vaccineId) {
        const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
        if (vaccine) {
          this.vaccinationForm.patchValue({ 
            vaccine: vaccine.name,
            // Ensure site matches administrationSite for backward compatibility
            site: this.vaccinationForm.get('administrationSite')?.value || 'LEFT_ARM'
          });
          this.loadBatches(vaccine.name);
          // Auto-suggest dose when vaccine is selected
          this.suggestNextDose(vaccine.name);
        }
      }
    });
    
    // Monitor form validity changes
    this.vaccinationForm.statusChanges.subscribe(status => {});

    this.vaccinationForm.get('vaccine')?.valueChanges.subscribe(vaccine => {
      if (vaccine) {
        this.loadBatches(vaccine);
        this.suggestNextDose(vaccine);
      }
    });
  }

  loadVaccinations(): void {
    if (this.isLoadingData) return;
    
    this.isLoadingData = true;
    this.loading = true;
    this.errorMessage = '';
    const startTime = Date.now();
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
    
    console.log('Loading vaccinations - User:', user, 'Facility ID:', facilityId);
    
    if (!facilityId) {
      console.warn('No facility ID available for user:', user);
      this.errorMessage = 'No facility ID available. Please ensure you are assigned to a facility.';
      this.vaccinations = [];
      this.filteredVaccinations = [];
      ensureMinimumLoadingTime(startTime, () => {
        this.loading = false;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      });
      return;
    }
    
    this.vaccinationService.getVaccinationsByFacility(facilityId).subscribe({
      next: (vaccinations) => {
        console.log('Loaded vaccinations:', vaccinations);
        this.vaccinations = vaccinations || [];
        this.applyFilters();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load vaccinations:', error);
        this.errorMessage = error?.error?.message || 'Failed to load vaccinations. Please try again.';
        this.vaccinations = [];
        this.filteredVaccinations = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadVaccines(): void {
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
    
    if (!facilityId) {
      console.warn('No facility ID available for loading vaccines');
      this.availableVaccines = [];
      return;
    }

    // Load vaccines and filter to show only those with available stock
    this.vaccinationService.getAllVaccines().subscribe({
      next: (vaccines) => {
        // Filter vaccines to show only those with available batches in stock
        const vaccinesWithStock: Vaccine[] = [];
        
        // Check each vaccine for available stock
        const checkStockPromises = vaccines.map(vaccine => {
          return this.stockService.getBatchesByVaccine(vaccine.name, facilityId).toPromise()
            .then(batches => {
              const availableBatches = batches?.filter(b => (b.quantity || 0) > 0 && !b.isDepleted) || [];
              if (availableBatches.length > 0) {
                vaccinesWithStock.push(vaccine);
              }
            })
            .catch(() => {
              // If error checking stock, still include vaccine (might be network issue)
              vaccinesWithStock.push(vaccine);
            });
        });

        Promise.all(checkStockPromises).then(() => {
          this.availableVaccines = vaccinesWithStock.length > 0 ? vaccinesWithStock : vaccines;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load vaccines:', error);
        this.availableVaccines = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.vaccinations];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.patientName?.toLowerCase().includes(query) ||
        v.vaccineName?.toLowerCase().includes(query) ||
        v.batchNumber?.toLowerCase().includes(query)
      );
    }
    
    if (this.filterDate) {
      filtered = filtered.filter(v => {
        const adminDate = v.administeredDate ? format(new Date(v.administeredDate), 'yyyy-MM-dd') : '';
        return adminDate === this.filterDate;
      });
    }
    
    this.filteredVaccinations = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onDateChange(): void {
    this.applyFilters();
  }

  openRecordModal(): void {const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.loadPatient(patientId);
      this.selectedPatient = { id: patientId } as Patient;
      this.vaccinationForm.patchValue({ patientId });
    }
    
    this.vaccinationForm.reset({
      patientId: patientId || '',
      doseNumber: 1,
      administeredDate: format(new Date(), 'yyyy-MM-dd'),
      administrationDate: new Date().toISOString().split('T')[0],
      administrationSite: 'LEFT_ARM',
      site: 'LEFT_ARM', // Set site to match administrationSite
      adverseEvent: {
        severity: '',
        description: '',
        actionTaken: ''
      }
    });
    this.showAdverseEventForm = false; // Reset checkbox state
    this.selectedPatient = patientId ? this.selectedPatient : null;
    this.patientSearchResults = [];
    this.availableBatches = [];
    this.loadingBatches = false;
    // Disable batch dropdown initially
    this.vaccinationForm.get('batchNumber')?.disable();
    this.showRecordModal = true;
    
    // Ensure adverse event form is properly initialized
    if (this.adverseEventForm) {
      this.adverseEventForm.reset({
        severity: '',
        description: '',
        actionTaken: ''
      });
    }// Force change detection after a brief delay to ensure template renders
    setTimeout(() => {this.cdr.detectChanges();
    }, 100);
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
    this.showAdverseEventForm = false;
    this.vaccinationForm.reset({
      doseNumber: 1,
      administeredDate: format(new Date(), 'yyyy-MM-dd'),
      administrationDate: new Date().toISOString().split('T')[0],
      administrationSite: 'LEFT_ARM',
      site: 'LEFT_ARM',
      adverseEvent: {
        severity: '',
        description: '',
        actionTaken: ''
      }
    });
    // Clear validators on adverse event form
    this.adverseEventForm.get('severity')?.clearValidators();
    this.adverseEventForm.get('description')?.clearValidators();
    this.adverseEventForm.get('severity')?.updateValueAndValidity();
    this.adverseEventForm.get('description')?.updateValueAndValidity();
    this.selectedPatient = null;
    this.patientSearchResults = [];
    this.availableBatches = [];
  }

  toggleAdverseEventForm(): void {
    this.showAdverseEventForm = !this.showAdverseEventForm;
    if (this.showAdverseEventForm) {
      // Set validators when showing the form
      this.adverseEventForm.get('severity')?.setValidators([Validators.required]);
      this.adverseEventForm.get('description')?.setValidators([Validators.required]);
      this.adverseEventForm.get('severity')?.updateValueAndValidity();
      this.adverseEventForm.get('description')?.updateValueAndValidity();
    } else {
      // Clear validators and reset when hiding
      this.adverseEventForm.get('severity')?.clearValidators();
      this.adverseEventForm.get('description')?.clearValidators();
      this.adverseEventForm.get('severity')?.updateValueAndValidity();
      this.adverseEventForm.get('description')?.updateValueAndValidity();
      this.adverseEventForm.reset();
    }
  }

  searchPatients(): void {
    const query = this.patientSearchQuery.trim();
    if (query.length < 2) {
      this.patientSearchResults = [];
      return;
    }

    this.patientService.searchPatients(query).subscribe({
      next: (response) => {
        this.patientSearchResults = response.patients?.slice(0, 10) || [];
      },
      error: (error) => {
        console.warn('Failed to search patients:', error);
        this.patientSearchResults = [];
      }
    });
  }

  selectPatient(patient: Patient): void {this.selectedPatient = patient;
    this.patient = patient; // Also set patient for dose suggestion
    this.patientSearchQuery = patient.fullName || `${patient.firstName} ${patient.lastName}`.trim();
    this.patientSearchResults = [];
    this.vaccinationForm.patchValue({ patientId: patient.id || patient.patientId });// Auto-suggest dose when patient is selected and vaccine is already chosen
    const vaccineId = this.vaccinationForm.get('vaccineId')?.value;
    if (vaccineId) {
      const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
      if (vaccine) {
        this.suggestNextDose(vaccine.name);
      }
    }
  }

  onVaccineChange(): void {
    const vaccineId = this.vaccinationForm.get('vaccineId')?.value;
    const batchControl = this.vaccinationForm.get('batchNumber');
    
    if (vaccineId) {
      const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
      if (vaccine) {
        this.vaccinationForm.patchValue({ vaccine: vaccine.name });
        // Use vaccine name instead of ID for batch lookup
        console.log('Loading batches for vaccine:', vaccine.name);
        // Disable batch dropdown while loading
        batchControl?.disable();
        this.loadBatches(vaccine.name);
      } else {
        console.warn('Vaccine not found in availableVaccines:', vaccineId);
        this.availableBatches = [];
        batchControl?.disable();
      }
    } else {
      this.availableBatches = [];
      batchControl?.disable();
    }
    this.vaccinationForm.patchValue({ batchNumber: '' });
  }

  loadPatient(id: string): void {
    this.patientService.getPatientById(id).subscribe({
      next: (patientDetail) => {
        this.patient = patientDetail as any;
      },
      error: (error) => {
        console.error('Failed to load patient:', error);
        this.patient = null;
        this.errorMessage = error.error?.message || 'Failed to load patient details. Please try again.';
      }
    });
  }

  loadBatches(vaccineName: string): void {
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
    const batchControl = this.vaccinationForm.get('batchNumber');
    
    if (!facilityId) {
      console.warn('No facility ID available for loading batches');
      this.availableBatches = [];
      batchControl?.disable();
      return;
    }

    this.loadingBatches = true;
    this.availableBatches = [];
    console.log('Loading batches for:', { vaccineName, facilityId });

    // Load available batches for the selected vaccine from stock service
    this.stockService.getBatchesByVaccine(vaccineName, facilityId).subscribe({
      next: (batches) => {
        console.log('Batches received from backend:', batches);
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.availableBatches = batches.map(batch => ({
            id: batch.id,
            vaccineId: batch.vaccineId || '',
            vaccineName: batch.vaccineName || vaccineName,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity || 0,
            expiryDate: batch.expiryDate,
            receivedDate: batch.receivedDate || batch.expiryDate,
            facilityId: batch.facilityId || facilityId || '',
            isDepleted: batch.isDepleted || false
          }));
          console.log('Mapped batches:', this.availableBatches);
          this.loadingBatches = false;
          // Enable batch dropdown if batches are available
          if (this.availableBatches.length > 0) {
            batchControl?.enable();
          } else {
            batchControl?.disable();
          }
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Failed to load batches:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.availableBatches = [];
          this.loadingBatches = false;
          batchControl?.disable();
          this.errorMessage = 'Failed to load batches. Please try again.';
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  onBatchChange(): void {
    const batchNumber = this.vaccinationForm.get('batchNumber')?.value;
    if (batchNumber) {
      const selectedBatch = this.availableBatches.find(b => b.batchNumber === batchNumber);
      if (selectedBatch && selectedBatch.quantity <= 0) {
        this.toastService.warning('Selected batch has no available doses');
      }
    }
  }

  onAdministrationSiteChange(): void {
    // Keep site field in sync with administrationSite for backward compatibility
    const adminSite = this.vaccinationForm.get('administrationSite')?.value;
    if (adminSite) {
      this.vaccinationForm.patchValue({ site: adminSite }, { emitEvent: false });}
  }

  getBatchPlaceholderText(): string {
    if (this.loadingBatches) {
      return 'Loading batches...';
    }
    if (this.availableBatches.length === 0 && this.vaccinationForm.get('vaccineId')?.value) {
      return 'No batches available';
    }
    return 'Select Batch';
  }

  suggestNextDose(vaccine: string): void {// Get patient's vaccination history and suggest next dose
    if (this.patient || this.selectedPatient) {
      const patientId = this.patient?.id || this.selectedPatient?.id;if (patientId) {this.vaccinationService.getPatientVaccinations(patientId).subscribe({
          next: (vaccinations) => {// Find the highest dose number for this vaccine
            const vaccineDoses = vaccinations
              .filter(v => v.vaccineName?.toLowerCase() === vaccine.toLowerCase())
              .map(v => v.doseNumber || 0);if (vaccineDoses.length > 0) {
              const maxDose = Math.max(...vaccineDoses);
              this.suggestedDose = maxDose + 1;// Update form with suggested dose
              this.vaccinationForm.patchValue({ doseNumber: this.suggestedDose });
            } else {
              // First dose
              this.suggestedDose = 1;this.vaccinationForm.patchValue({ doseNumber: 1 });
            }
          },
          error: (error) => {
            console.warn('Could not load vaccination history for dose suggestion:', error);// Default to dose 1 if history unavailable
            this.suggestedDose = 1;
            this.vaccinationForm.patchValue({ doseNumber: 1 });
          }
        });
      } else {}
    } else {
      // No patient selected, default to dose 1this.suggestedDose = 1;
      this.vaccinationForm.patchValue({ doseNumber: 1 });
    }
  }

  onSubmit(): void {
    if (this.vaccinationForm.valid) {
      const patientId = this.vaccinationForm.value.patientId || this.selectedPatient?.id || this.patient?.id;
      
      if (!patientId) {
        this.toastService.error('Patient information is missing. Please select a patient.');
        return;
      }

      // Check stock level
      const selectedBatch = this.availableBatches.find(b =>
        b.batchNumber === this.vaccinationForm.value.batchNumber ||
        b.id === this.vaccinationForm.value.batchNumber
      );
      if (selectedBatch && selectedBatch.quantity <= 15) {
        this.stockWarningMessage = `Only ${selectedBatch.quantity} doses remaining after this vaccination. Contact facility manager for resupply.`;
        this.showStockWarning = true;
        return;
      }

      this.loading = true;
      // Map form data to API format (matching backend RecordVaccinationRequest)
      // Find batch ID from batch number - backend expects Long (number)
      let batchId: number | null = null;
      if (selectedBatch?.id) {
        batchId = typeof selectedBatch.id === 'number' ? selectedBatch.id : parseInt(selectedBatch.id, 10);
      } else if (this.vaccinationForm.value.batchNumber) {
        // Try to parse batchNumber if it's a string ID
        const parsed = parseInt(this.vaccinationForm.value.batchNumber, 10);
        if (!isNaN(parsed)) {
          batchId = parsed;
        }
      }

      if (!batchId || isNaN(batchId)) {
        this.toastService.error('Please select a valid batch number.');
        this.loading = false;
        return;
      }

      // Get facilityId from patient or current user
      const user = this.authService.getCurrentUser();
      const facilityId = this.selectedPatient?.facilityId || this.patient?.facilityId || user?.facilityId || '';
      
      if (!facilityId) {
        this.toastService.error('Facility ID is required. Please ensure you are assigned to a facility.');
        this.loading = false;
        return;
      }

      const vaccineName = this.vaccinationForm.value.vaccine || 
                         this.availableVaccines.find(v => v.id === this.vaccinationForm.value.vaccineId)?.name || '';
      
      const vaccinationData: any = {
        patientId: patientId, // Must be UUID string
        vaccineName: vaccineName, // Backend uses vaccineName
        doseNumber: parseInt(this.vaccinationForm.value.doseNumber, 10), // Ensure it's a number
        batchId: batchId, // Backend expects batchId (numeric Long)
        dateAdministered: this.vaccinationForm.value.administeredDate || this.vaccinationForm.value.administrationDate, // Backend uses dateAdministered (YYYY-MM-DD)
        facilityId: facilityId, // Must be non-empty string
        administrationSite: this.vaccinationForm.value.administrationSite || 'LEFT_ARM', // Backend requires administrationSite
        notes: this.vaccinationForm.value.adverseEventNotes || this.vaccinationForm.value.adverseEvents || undefined
      };

      // Calculate next appointment (typically 4 weeks for most vaccines)
      this.nextAppointmentDate = new Date();
      this.nextAppointmentDate.setDate(this.nextAppointmentDate.getDate() + 28);

      if (environment.useMockAuth) {
        // Simulate successful recording
        setTimeout(() => {
          this.loading = false;
          this.showSuccessModal = true;
          this.toastService.success('Vaccination recorded successfully!');
          this.closeRecordModal();
          this.loadVaccinations();
        }, 500);
        return;
      }this.vaccinationService.recordVaccination(vaccinationData).subscribe({
        next: (response) => {// If adverse event form is filled, submit it
          const adverseEventData = this.vaccinationForm.get('adverseEvent')?.value;
          if (this.showAdverseEventForm && adverseEventData && adverseEventData.severity && adverseEventData.description) {
            // Convert vaccination ID to number if it's a string
            let vaccinationIdNum: number | undefined = undefined;
            if (response.id) {
              const idStr = String(response.id);
              const parsed = parseInt(idStr, 10);
              if (!isNaN(parsed)) {
                vaccinationIdNum = parsed;
              }
            }

            const adverseEventRequest: CreateAdverseEventRequest = {
              patientId: patientId,
              vaccinationId: vaccinationIdNum,
              severity: adverseEventData.severity,
              description: adverseEventData.description,
              actionTaken: adverseEventData.actionTaken || undefined
            };

            this.adverseEventService.createAdverseEvent(adverseEventRequest).subscribe({
              next: () => {
                this.toastService.success('Vaccination and adverse event recorded successfully!');
                this.loading = false;
                this.showSuccessModal = true;
                this.closeRecordModal();
                this.loadVaccinations();
              },
              error: (error) => {
                console.error('Failed to record adverse event:', error);
                this.toastService.warning('Vaccination recorded but failed to record adverse event. Please report it separately.');
                this.loading = false;
                this.showSuccessModal = true;
                this.closeRecordModal();
                this.loadVaccinations();
              }
            });
          } else {
            this.loading = false;
            this.showSuccessModal = true;
            
            // Set next appointment date from response if available
            if (response.nextAppointmentDate) {
              this.nextAppointmentDate = new Date(response.nextAppointmentDate);
            } else {
              // Fallback: calculate next appointment (typically 4 weeks for most vaccines)
              this.nextAppointmentDate = new Date();
              this.nextAppointmentDate.setDate(this.nextAppointmentDate.getDate() + 28);
            }
            
            this.toastService.success('Vaccination recorded successfully!');
            this.closeRecordModal();
            this.loadVaccinations();
          }
        },
        error: (error) => {this.loading = false;
          this.toastService.error('Failed to record vaccination. Please try again.');
          console.error('Error:', error);
        }
      });
    } else {
      this.vaccinationForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    const user = this.authService.getCurrentUser();
    const role = user?.role?.toUpperCase();
    
    if (this.patient) {
      // Navigate based on role
      if (role === 'FACILITY_MANAGER') {
        this.router.navigate(['/manager/patients', this.patient.id]);
      } else if (role === 'GOVERNMENT_OFFICIAL') {
        this.router.navigate(['/admin/patients', this.patient.id]);
      } else {
        this.router.navigate(['/vaccinator/patients', this.patient.id]);
      }
    } else {
      // Navigate to appropriate dashboard
      if (role === 'FACILITY_MANAGER') {
        this.router.navigate(['/manager/dashboard']);
      } else if (role === 'GOVERNMENT_OFFICIAL') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/vaccinator/dashboard']);
      }
    }
  }

  onSaveAndScheduleNext(): void {
    this.onSubmit();
    // After success, schedule next appointment automatically
  }

  confirmStockWarning(): void {
    this.showStockWarning = false;
    this.onSubmit();
  }

  getVaccineName(): string {
    const vaccineId = this.vaccinationForm.get('vaccineId')?.value;
    const vaccineName = this.vaccinationForm.get('vaccine')?.value;
    
    if (vaccineName) {
      return vaccineName;
    }
    
    if (vaccineId && Array.isArray(this.availableVaccines) && this.availableVaccines.length > 0) {
      const vaccine = this.availableVaccines.find((v: Vaccine) => v && v.id === vaccineId);
      return vaccine?.name || 'Unknown Vaccine';
    }
    
    return 'Unknown Vaccine';
  }

  getPatientDisplayName(): string {
    if (!this.patient) return 'Patient';
    return this.patient.fullName ||
           `${this.patient.firstName || ''} ${this.patient.lastName || ''}`.trim() ||
           'Patient';
  }

  getPatientAge(): string {
    if (!this.patient?.birthDate && !this.patient?.dateOfBirth) return 'N/A';
    const birthDate = this.patient.birthDate || this.patient.dateOfBirth || '';
    if (!birthDate) return 'N/A';

    try {
      const birth = new Date(birthDate);
      const months = Math.floor((new Date().getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (months < 12) {
        return `${months} months`;
      } else {
        const years = Math.floor(months / 12);
        return `${years} years`;
      }
    } catch {
      return 'N/A';
    }
  }

  getMaxDoseForVaccine(): number {
    const vaccineId = this.vaccinationForm.get('vaccineId')?.value;
    if (!vaccineId) return 10; // Default max
    
    const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
    if (!vaccine) return 10;
    
    const vaccineName = vaccine.name.toUpperCase();
    // Match backend validation logic
    switch (vaccineName) {
      case 'BCG': return 1;
      case 'OPV': return 4;
      case 'DTP':
      case 'PENTA': return 3;
      case 'MEASLES': return 2;
      case 'HEPATITIS B': return 3;
      case 'ROTAVIRUS': return 2;
      case 'PNEUMOCOCCAL': return 3;
      case 'COVID-19': return 3;
      case 'TETANUS': return 5;
      case 'YELLOW FEVER': return 1;
      case 'MENINGITIS': return 1;
      default: return 1;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.vaccinationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return 'Invalid value';
      if (field.errors['max']) {
        const maxDose = this.getMaxDoseForVaccine();
        return `Maximum dose for this vaccine is ${maxDose}`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vaccinationForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  format = format;

  printCard(): void {
    window.print();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  checkOfflineStatus(): void {this.showOfflineBanner = !(typeof window !== 'undefined' && window.navigator ? window.navigator.onLine : true);if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {this.showOfflineBanner = false;
      });
      window.addEventListener('offline', () => {this.showOfflineBanner = true;
      });
    }
  }
}

