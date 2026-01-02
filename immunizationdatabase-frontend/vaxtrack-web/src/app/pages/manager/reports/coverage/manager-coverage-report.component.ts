import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { ReportService } from '../../../../core/services/report.service';
import { PatientService } from '../../../../core/services/patient.service';
import { VaccinationService } from '../../../../core/services/vaccination.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { format } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-coverage-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent],
  templateUrl: './manager-coverage-report.component.html',
  styleUrl: './manager-coverage-report.component.scss'
})
export class ManagerCoverageReportComponent implements OnInit {
  loading = false;
  startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];
  
  // Summary Stats - loaded from backend
  totalPatientsRegistered = 0;
  totalVaccinationsRecorded = 0;
  appointmentsScheduled = 0;
  appointmentsCompleted = 0;
  appointmentsMissed = 0;
  completionRate = 0;
  
  // Coverage by Vaccine - calculated from real data
  coverageByVaccine: any[] = [];
  
  // Top Vaccines - calculated from real data
  topVaccines: any[] = [];
  
  // Coverage by Age Group - calculated from real data
  coverageByAge: any[] = [];

  constructor(
    private reportService: ReportService,
    private patientService: PatientService,
    private vaccinationService: VaccinationService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.loading = true;
    const startTime = Date.now();
    const facilityId = this.authService.getCurrentUser()?.facilityId;

    if (!facilityId) {
      console.warn('No facility ID available');
      this.loading = false;
      return;
    }

    // Load all data needed for report
    let patientsLoaded = false;
    let vaccinationsLoaded = false;
    let appointmentsLoaded = false;

    const checkComplete = () => {
      if (patientsLoaded && vaccinationsLoaded && appointmentsLoaded) {
        this.calculateReportData();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    };

    // Load patients
    this.patientService.getPatientsByFacility(facilityId).subscribe({
      next: (patients) => {
        this.totalPatientsRegistered = patients.length;
        (this as any).allPatients = patients;
        patientsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load patients:', error);
        this.totalPatientsRegistered = 0;
        (this as any).allPatients = [];
        patientsLoaded = true;
        checkComplete();
      }
    });

    // Load vaccinations
    this.vaccinationService.getVaccinationsByDateRange(facilityId, this.startDate, this.endDate).subscribe({
      next: (vaccinations) => {
        this.totalVaccinationsRecorded = vaccinations.length;
        (this as any).allVaccinations = vaccinations;
        vaccinationsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load vaccinations:', error);
        this.totalVaccinationsRecorded = 0;
        (this as any).allVaccinations = [];
        vaccinationsLoaded = true;
        checkComplete();
      }
    });

    // Load appointments
    this.appointmentService.getAppointments(facilityId).subscribe({
      next: (appointments) => {
        this.appointmentsScheduled = appointments.length;
        this.appointmentsCompleted = appointments.filter(a => a.status === 'COMPLETED').length;
        this.appointmentsMissed = appointments.filter(a => a.status === 'MISSED').length;
        this.completionRate = this.appointmentsScheduled > 0 
          ? Math.round((this.appointmentsCompleted / this.appointmentsScheduled) * 100) 
          : 0;
        appointmentsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.warn('Failed to load appointments:', error);
        this.appointmentsScheduled = 0;
        this.appointmentsCompleted = 0;
        this.appointmentsMissed = 0;
        this.completionRate = 0;
        appointmentsLoaded = true;
        checkComplete();
      }
    });
  }

  private calculateReportData(): void {
    const allPatients: any[] = (this as any).allPatients || [];
    const allVaccinations: any[] = (this as any).allVaccinations || [];

    // Calculate coverage by vaccine
    const vaccineMap = new Map<string, { total: number; vaccinated: Set<string>; count: number }>();
    
    allVaccinations.forEach(v => {
      const vaccineName = v.vaccineName || 'Unknown';
      if (!vaccineMap.has(vaccineName)) {
        vaccineMap.set(vaccineName, { total: allPatients.length, vaccinated: new Set(), count: 0 });
      }
      const data = vaccineMap.get(vaccineName)!;
      data.vaccinated.add(v.patientId);
      data.count++;
    });

    this.coverageByVaccine = Array.from(vaccineMap.entries()).map(([vaccine, data]) => ({
      vaccine,
      target: data.total,
      vaccinated: data.vaccinated.size,
      coverage: data.total > 0 ? Math.round((data.vaccinated.size / data.total) * 100) : 0,
      status: data.total > 0 && (data.vaccinated.size / data.total) >= 0.9 ? 'good' 
        : data.total > 0 && (data.vaccinated.size / data.total) >= 0.8 ? 'warning' : 'error'
    })).sort((a, b) => b.coverage - a.coverage);

    // Calculate top vaccines
    const vaccineCounts = new Map<string, number>();
    allVaccinations.forEach(v => {
      const vaccineName = v.vaccineName || 'Unknown';
      vaccineCounts.set(vaccineName, (vaccineCounts.get(vaccineName) || 0) + 1);
    });

    this.topVaccines = Array.from(vaccineCounts.entries())
      .map(([name, doses]) => ({ name, doses }))
      .sort((a, b) => b.doses - a.doses)
      .slice(0, 5);

    // Calculate coverage by age group (simplified - based on patient age)
    const ageGroups = {
      '0-2 months': { vaccinated: 0, total: 0 },
      '2-6 months': { vaccinated: 0, total: 0 },
      '6-12 months': { vaccinated: 0, total: 0 },
      '12+ months': { vaccinated: 0, total: 0 }
    };

    allPatients.forEach(patient => {
      const age = this.calculateAge(patient.dateOfBirth || patient.birthDate);
      let ageGroup = '';
      if (age <= 2) ageGroup = '0-2 months';
      else if (age <= 6) ageGroup = '2-6 months';
      else if (age <= 12) ageGroup = '6-12 months';
      else ageGroup = '12+ months';

      if (ageGroups[ageGroup as keyof typeof ageGroups]) {
        ageGroups[ageGroup as keyof typeof ageGroups].total++;
        const isVaccinated = allVaccinations.some(v => v.patientId === patient.id);
        if (isVaccinated) {
          ageGroups[ageGroup as keyof typeof ageGroups].vaccinated++;
        }
      }
    });

    this.coverageByAge = Object.entries(ageGroups).map(([ageGroup, data]) => ({
      ageGroup,
      vaccinated: data.vaccinated,
      coverage: data.total > 0 ? Math.round((data.vaccinated / data.total) * 100) : 0
    }));
  }

  private calculateAge(birthDate?: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return Math.floor(months);
  }

  exportToExcel(): void {
    // Export functionality
    console.log('Exporting to Excel...');
  }

  getCoverageStatusClass(coverage: number): string {
    if (coverage >= 90) return 'status-good';
    if (coverage >= 80) return 'status-warning';
    return 'status-error';
  }

  format = format;

  getFormattedMonth(): string {
    return format(new Date(this.startDate), 'MMMM yyyy');
  }
}
