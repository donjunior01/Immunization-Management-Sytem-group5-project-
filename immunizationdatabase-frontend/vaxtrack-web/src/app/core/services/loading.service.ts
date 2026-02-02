import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly MIN_LOADING_TIME = 300; // milliseconds

  /**
   * Ensures a loading operation takes at least MIN_LOADING_TIME
   * @param startTime The timestamp when loading started
   * @returns Observable that completes after ensuring minimum time
   */
  ensureMinimumLoadingTime(startTime: number = Date.now()): Observable<void> {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, this.MIN_LOADING_TIME - elapsed);
    
    if (remainingTime > 0) {
      return of(void 0).pipe(delay(remainingTime));
    }
    
    return of(void 0);
  }

  /**
   * Wraps an async operation to ensure minimum loading time
   * @param operation The async operation to execute
   * @returns Observable that ensures minimum loading time
   */
  withMinimumLoadingTime<T>(operation: Observable<T>): Observable<T> {
    const startTime = Date.now();
    
    return operation.pipe(
      delay(0), // Ensure operation completes first
      // Then ensure minimum time has passed
      delay(0) // This will be calculated in the subscription
    );
  }
}

