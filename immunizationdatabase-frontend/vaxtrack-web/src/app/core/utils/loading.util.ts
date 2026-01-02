/**
 * Utility function to ensure minimum loading time of 300ms
 * @param startTime Timestamp when loading started
 * @param callback Function to execute after minimum time has passed
 */
export function ensureMinimumLoadingTime(
  startTime: number,
  callback: () => void
): void {
  const MIN_LOADING_TIME = 300; // milliseconds
  const elapsed = Date.now() - startTime;
  const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

  if (remainingTime > 0) {
    setTimeout(() => {
      callback();
    }, remainingTime);
  } else {
    // If already past minimum time, execute immediately
    callback();
  }
}


