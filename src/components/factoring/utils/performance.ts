/**
 * Performance Utilities for Factoring Components
 * 
 * This file contains utilities for optimizing the performance of factoring components
 * that were experiencing Violation warnings in the browser console.
 */

/**
 * Creates a debounced version of a function that delays execution until
 * a specified timeout has elapsed since the last call.
 * 
 * @param func The function to debounce
 * @param wait The timeout in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
}

/**
 * Creates a throttled version of a function that only executes
 * once within a specified time period.
 * 
 * @param func The function to throttle
 * @param limit The timeout in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measures and logs the time taken to execute a function.
 * Use this to identify slow operations.
 * 
 * @param name Identifier for the measurement
 * @param func The function to measure
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  return function(...args: Parameters<T>): ReturnType<T> {
    console.time(`[Performance] ${name}`);
    const result = func(...args);
    console.timeEnd(`[Performance] ${name}`);
    return result;
  };
}

/**
 * A memoization function that caches results based on a serialized version of the arguments.
 * Use for expensive calculations that are called with the same arguments multiple times.
 * 
 * @param func The function to memoize
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Executes heavy calculations in chunks to avoid blocking the main thread.
 * This helps prevent "Violation handler took Xms" warnings.
 * 
 * @param items Array of items to process
 * @param processFn Function to process each item
 * @param chunkSize Number of items to process per chunk (default: 50)
 * @param delay Delay between chunks in ms (default: 16ms - roughly one frame)
 */
export function processInChunks<T, R>(
  items: T[],
  processFn: (item: T) => R,
  chunkSize = 50,
  delay = 16
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = [];
    let index = 0;
    
    function processNextChunk() {
      const start = index;
      const end = Math.min(index + chunkSize, items.length);
      
      for (let i = start; i < end; i++) {
        results.push(processFn(items[i]));
      }
      
      index = end;
      
      if (index < items.length) {
        setTimeout(processNextChunk, delay);
      } else {
        resolve(results);
      }
    }
    
    processNextChunk();
  });
}

/**
 * A simplified React.memo-like function to determine if a component's props have changed.
 * Use this for manual memoization checks.
 * 
 * @param prevProps Previous props object
 * @param nextProps Next props object
 */
export function arePropsEqual<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
      // For functions, we consider them equal if their string representations match
      // This is imperfect but can help in some cases
      return prevProps[key].toString() === nextProps[key].toString();
    }
    
    // For arrays or objects, do a shallow comparison
    if (typeof prevProps[key] === 'object' && prevProps[key] !== null) {
      if (Array.isArray(prevProps[key]) && Array.isArray(nextProps[key])) {
        return prevProps[key].length === nextProps[key].length;
      }
      return false; // Deep equality is expensive, so we'll just trigger a rerender
    }
    
    // For primitives, do a strict equality check
    return prevProps[key] === nextProps[key];
  });
} 