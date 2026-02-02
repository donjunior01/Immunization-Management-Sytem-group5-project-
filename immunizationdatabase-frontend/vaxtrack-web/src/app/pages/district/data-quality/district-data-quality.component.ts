import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-district-data-quality',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `<app-layout pageTitle="Data Quality"><div class="placeholder">Data Quality Dashboard - Coming Soon</div></app-layout>`,
  styles: [`.placeholder { padding: 2rem; text-align: center; }`]
})
export class DistrictDataQualityComponent {}

