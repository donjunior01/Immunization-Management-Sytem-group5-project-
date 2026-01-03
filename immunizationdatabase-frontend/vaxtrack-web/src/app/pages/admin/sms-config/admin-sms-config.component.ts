import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-admin-sms-config',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `<app-layout pageTitle="SMS Configuration"><div class="placeholder">SMS Gateway Configuration - Coming Soon</div></app-layout>`,
  styles: [`.placeholder { padding: 2rem; text-align: center; }`]
})
export class AdminSmsConfigComponent {}








