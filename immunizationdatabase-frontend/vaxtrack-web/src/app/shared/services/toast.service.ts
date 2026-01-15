import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Toast, ToastType } from '../components/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new Subject<Toast[]>();
  private toasts: Toast[] = [];

  constructor() {
    // Listen for dismiss events
    window.addEventListener('toast-dismiss', ((event: CustomEvent) => {
      this.removeToast(event.detail.id);
    }) as EventListener);
  }

  getToasts() {
    return this.toasts$.asObservable();
  }

  show(type: ToastType, message: string, duration?: number): void {
    const toast: Toast = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message,
      duration
    };

    this.toasts.push(toast);
    this.toasts$.next([...this.toasts]);

    // Auto-remove after duration if specified
    if (duration && duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }

  error(message: string): void {
    this.show('error', message, 0); // Manual dismiss for errors
  }

  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next([...this.toasts]);
  }

  clear(): void {
    this.toasts = [];
    this.toasts$.next([]);
  }
}









