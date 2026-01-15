import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-district-export',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `<app-layout pageTitle="Export Data"><div class="placeholder">Export Data - Coming Soon</div></app-layout>`,
  styles: [`.placeholder { padding: 2rem; text-align: center; }`]
})
export class DistrictExportComponent {}









