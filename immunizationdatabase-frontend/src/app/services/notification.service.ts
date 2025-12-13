import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationOptions {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultDuration = 4000;

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   */
  success(message: string, action: string = 'Close', options?: NotificationOptions): void {
    const config: MatSnackBarConfig = {
      duration: options?.duration || this.defaultDuration,
      horizontalPosition: options?.horizontalPosition || 'end',
      verticalPosition: options?.verticalPosition || 'top',
      panelClass: ['notification-success', ...(options?.panelClass || [])]
    };

    this.snackBar.open(message, action, config);
  }

  /**
   * Show error notification
   */
  error(message: string, action: string = 'Close', options?: NotificationOptions): void {
    const config: MatSnackBarConfig = {
      duration: options?.duration || this.defaultDuration,
      horizontalPosition: options?.horizontalPosition || 'end',
      verticalPosition: options?.verticalPosition || 'top',
      panelClass: ['notification-error', ...(options?.panelClass || [])]
    };

    this.snackBar.open(message, action, config);
  }

  /**
   * Show warning notification
   */
  warning(message: string, action: string = 'Close', options?: NotificationOptions): void {
    const config: MatSnackBarConfig = {
      duration: options?.duration || this.defaultDuration,
      horizontalPosition: options?.horizontalPosition || 'end',
      verticalPosition: options?.verticalPosition || 'top',
      panelClass: ['notification-warning', ...(options?.panelClass || [])]
    };

    this.snackBar.open(message, action, config);
  }

  /**
   * Show info notification
   */
  info(message: string, action: string = 'Close', options?: NotificationOptions): void {
    const config: MatSnackBarConfig = {
      duration: options?.duration || this.defaultDuration,
      horizontalPosition: options?.horizontalPosition || 'end',
      verticalPosition: options?.verticalPosition || 'top',
      panelClass: ['notification-info', ...(options?.panelClass || [])]
    };

    this.snackBar.open(message, action, config);
  }

  /**
   * Show confirmation notification with custom styling
   */
  confirm(message: string, action: string = 'OK'): void {
    this.success(message, action, {
      duration: 3000,
      panelClass: ['notification-confirm']
    });
  }

  // Alias methods for backward compatibility
  showSuccess(message: string, action?: string, options?: NotificationOptions): void {
    this.success(message, action || 'Close', options);
  }

  showError(message: string, action?: string, options?: NotificationOptions): void {
    this.error(message, action || 'Close', options);
  }

  showWarning(message: string, action?: string, options?: NotificationOptions): void {
    this.warning(message, action || 'Close', options);
  }

  showInfo(message: string, action?: string, options?: NotificationOptions): void {
    this.info(message, action || 'Close', options);
  }
}
