import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QRCodeModule } from 'angularx-qrcode';
import { PatientService } from '../../services/patient.service';
import { VaccinationRealService, VaccinationResponse } from '../../services/vaccination-real.service';
import { Patient } from '../../models/patient.model';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-print-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    QRCodeModule
  ],
  templateUrl: './print-card.component.html',
  styleUrls: ['./print-card.component.scss']
})
export class PrintCardComponent implements OnInit {
  patient: Patient | null = null;
  vaccinations: VaccinationResponse[] = [];
  isLoading = true;
  qrCodeData = '';
  displayedColumns = ['date', 'vaccine', 'dose', 'batch', 'administeredBy'];
  currentDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private vaccinationService: VaccinationRealService,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    const patientId = this.route.snapshot.paramMap.get('patientId');
    if (patientId) {
      this.loadPatientData(patientId);
    } else {
      this.notificationService.error('No patient ID provided');
      setTimeout(() => {
        this.router.navigate(['/vaccinations/history']);
      }, 1500);
    }
  }

  loadPatientData(patientId: string): void {
    this.isLoading = true;

    // Load patient details
    this.patientService.getPatient(patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.qrCodeData = `PATIENT:${patient.id}|NAME:${patient.fullName}|DOB:${patient.dateOfBirth}|FACILITY:${patient.facilityId}`;
        
        // Load vaccination history
        this.loadVaccinationHistory(patientId);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.notificationService.error('Failed to load patient information');
        this.isLoading = false;
      }
    });
  }

  loadVaccinationHistory(patientId: string): void {
    this.vaccinationService.getPatientVaccinations(patientId).subscribe({
      next: (vaccinations) => {
        // Sort by date, most recent first
        this.vaccinations = vaccinations.sort((a, b) => 
          new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vaccinations:', error);
        this.notificationService.error('Failed to load vaccination history');
        this.isLoading = false;
      }
    });
  }

  printCard(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      window.print();
      this.notificationService.success('Print dialog opened');
    }, 1000);
  }

  goBack(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.router.navigate(['/vaccinations/history'], {
        queryParams: { patientId: this.patient?.id }
      });
    }, 1000);
  }

  getAge(dateOfBirth: string): string {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 1) {
      const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  }

  getVaccinationStatus(): string {
    if (!this.vaccinations || this.vaccinations.length === 0) {
      return 'No vaccinations recorded';
    }

    const uniqueVaccines = new Set(this.vaccinations.map(v => v.vaccineName));
    return `${this.vaccinations.length} dose${this.vaccinations.length !== 1 ? 's' : ''} - ${uniqueVaccines.size} vaccine${uniqueVaccines.size !== 1 ? 's' : ''}`;
  }

  getNextDueVaccine(): string {
    // This is a simplified version - in production, you'd check against immunization schedule
    const lastVaccination = this.vaccinations[0];
    if (!lastVaccination) {
      return 'Contact health facility for schedule';
    }

    // Basic logic: if last dose was within 6 weeks, suggest follow-up
    const lastDate = new Date(lastVaccination.dateAdministered);
    const today = new Date();
    const weeksSince = Math.floor((today.getTime() - lastDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (weeksSince < 6) {
      return `Follow-up in ${6 - weeksSince} week${6 - weeksSince !== 1 ? 's' : ''}`;
    }

    return 'Contact health facility for schedule';
  }
}
