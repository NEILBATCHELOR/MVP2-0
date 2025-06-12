/**
 * Simple logger for application-level logging
 */
export const logger = {
  /**
   * Log an informational message
   * 
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  info: (message: string, meta?: Record<string, any>) => {
    console.info(`[INFO] ${message}`, meta ? meta : '');
  },

  /**
   * Log a warning message
   * 
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[WARN] ${message}`, meta ? meta : '');
  },

  /**
   * Log an error message
   * 
   * @param message - Message to log
   * @param error - Optional error object or metadata
   */
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
  },

  /**
   * Log a debug message (only in development)
   * 
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta ? meta : '');
    }
  }
}; 