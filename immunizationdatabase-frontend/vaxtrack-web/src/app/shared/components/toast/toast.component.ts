import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() toast!: Toast;
  
  private destroy$ = new Subject<void>();
  private timeoutId?: number;

  ngOnInit(): void {
    // Auto-dismiss based on type
    const duration = this.toast.duration || this.getDefaultDuration(this.toast.type);
    
    if (duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.dismiss();
      }, duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismiss(): void {
    // Emit dismiss event - parent component will handle removal
    const event = new CustomEvent('toast-dismiss', { detail: { id: this.toast.id } });
    window.dispatchEvent(event);
  }

  private getDefaultDuration(type: ToastType): number {
    switch (type) {
      case 'success': return 3000; // 3 seconds
      case 'error': return 0; // Manual dismiss
      case 'warning': return 5000; // 5 seconds
      case 'info': return 4000; // 4 seconds
      default: return 3000;
    }
  }

  getIcon(): string {
    switch (this.toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}









