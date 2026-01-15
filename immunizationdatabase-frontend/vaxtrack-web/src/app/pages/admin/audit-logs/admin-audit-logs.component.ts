import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `<app-layout pageTitle="Audit Logs"><div class="placeholder">Audit Logs - Coming Soon</div></app-layout>`,
  styles: [`.placeholder { padding: 2rem; text-align: center; }`]
})
export class AdminAuditLogsComponent {}









