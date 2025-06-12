# Performance Optimization for Factoring Components

## Overview

This directory contains performance optimization utilities for the factoring module, which was experiencing browser console violations:

```
[Violation] 'message' handler took <N>ms
[Violation] 'mousedown' handler took 181ms
[Violation] Forced reflow while executing JavaScript took 30ms
```

These violations were specifically occurring in the `/factoring/distribution` and `/factoring/tokenization` routes.

## Implemented Solutions

The following performance optimization strategies have been implemented:

1. **Throttling** - Limiting how often function calls can fire
2. **Debouncing** - Delaying function execution until after a pause in events
3. **Memoization** - Caching expensive calculation results
4. **Chunked Processing** - Breaking large data operations into smaller chunks

## Performance Utilities

The `performance.ts` file includes the following utility functions:

- `debounce()` - Prevents rapid consecutive calls to functions, like handling input changes
- `throttle()` - Limits execution frequency, good for scroll/resize handlers
- `memoize()` - Caches results for repeated calls with same arguments
- `processInChunks()` - Processes large arrays in smaller chunks to avoid blocking the main thread
- `measurePerformance()` - Utility to measure and log execution time
- `arePropsEqual()` - Custom implementation for shallow prop comparison

## Optimization Applied To

- `TokenDistributionManager.tsx`
- `TokenizationManager.tsx`

## Usage Example

```typescript
// Import utilities
import { debounce, throttle, memoize, processInChunks } from "./utils/performance";

// Throttle a data fetching function
const throttledFetchData = useMemo(
  () => throttle(async () => {
    // Fetch data logic
  }, 300),
  [dependencies]
);

// Debounce an input handler
const handleInputChange = useCallback(
  debounce((value: string) => {
    // Handle input change logic
  }, 300),
  [dependencies]
);

// Memoize expensive calculations
const calculateValue = useMemo(
  () => memoize((param1: number, param2: number): number => {
    // Expensive calculation
    return result;
  }),
  [dependencies]
);

// Process large datasets in chunks
const processedData = await processInChunks(
  largeArray,
  processItem,
  50 // Process 50 items at a time
);
```

## Results

The implementation of these performance optimizations has reduced or eliminated the console violation warnings and improved UI responsiveness, particularly when:

1. Handling large datasets in table views
2. Processing complex calculations for token distribution
3. Rendering complex UI components with many reactive dependencies 