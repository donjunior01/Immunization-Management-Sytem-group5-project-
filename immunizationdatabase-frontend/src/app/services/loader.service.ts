import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  
  private loadingCount = 0;
  private readonly MINIMUM_DISPLAY_TIME = 1000; // 1000ms as required

  /**
   * Show the loader for minimum 1000ms
   * @param duration Optional custom duration in milliseconds (default: 1000ms)
   */
  show(duration: number = this.MINIMUM_DISPLAY_TIME): void {
    this.loadingCount++;
    this.loadingSubject.next(true);
    
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Hide the loader (only when all operations complete)
   */
  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Force hide the loader immediately
   */
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Show loader for an async operation with automatic 1000ms minimum
   */
  async showForOperation<T>(operation: Promise<T>): Promise<T> {
    this.show();
    try {
      const result = await operation;
      return result;
    } catch (error) {
      throw error;
    }
  }
}
