/**
 * Performance utilities for preventing UI freezing and optimizing React rendering
 */

/**
 * Schedule a task to run during idle periods to avoid UI freezing
 * @param callback - The function to run
 * @param timeout - Optional timeout to ensure the task eventually runs
 */
export const scheduleIdleTask = (callback: () => void, timeout: number = 2000): void => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
};

/**
 * Throttle a function to prevent excessive calls
 * @param func - The function to throttle
 * @param delay - The minimum time between function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};

/**
 * Debounce a function to ensure it only runs after a certain period of inactivity
 * @param func - The function to debounce
 * @param wait - The time to wait after the last call before executing
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Ensure a component doesn't block the main thread on initial render
 * by deferring initialization of heavy components
 * @param callback - Function to run when component initializes
 */
export const deferHeavyInitialization = (callback: () => void): void => {
  if (typeof window !== 'undefined') {
    // Wait for the next frame to avoid blocking initial render
    window.setTimeout(() => {
      scheduleIdleTask(callback);
    }, 0);
  }
};

/**
 * Monitor expensive operations and log performance metrics
 * @param operation - Name of the operation being monitored
 * @param callback - Function to execute and measure
 * @returns The result of the callback function
 */
export const monitorPerformance = <T>(
  operation: string,
  callback: () => T
): T => {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  
  const duration = end - start;
  
  // Log to console if operation takes longer than 16ms (1 frame at 60fps)
  if (duration > 16) {
    console.warn(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

/**
 * Prevent layout thrashing by batching DOM reads and writes
 */
export class DOMBatch {
  private reads: Array<() => any> = [];
  private writes: Array<() => void> = [];
  private scheduled = false;
  
  read(callback: () => any): void {
    this.reads.push(callback);
    this.schedule();
  }
  
  write(callback: () => void): void {
    this.writes.push(callback);
    this.schedule();
  }
  
  private schedule(): void {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.run());
    }
  }
  
  private run(): void {
    // Process all reads
    const results = this.reads.map(read => read());
    
    // Process all writes - don't pass results to write callbacks
    this.writes.forEach((write) => write());
    
    // Reset
    this.reads = [];
    this.writes = [];
    this.scheduled = false;
  }
}