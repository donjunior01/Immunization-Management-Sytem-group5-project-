import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-district-defaulters',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `<app-layout pageTitle="Defaulter Tracking"><div class="placeholder">Defaulter Tracking - Coming Soon</div></app-layout>`,
  styles: [`.placeholder { padding: 2rem; text-align: center; }`]
})
export class DistrictDefaultersComponent {}









