/**
 * Enhanced logger for application-level logging
 * Centralizes logging functionality with context support
 */

/**
 * Logger interface with context-aware logging methods
 */
export const logger = {
  /**
   * Log an informational message with context
   * 
   * @param context - The logging context (usually component/service name)
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  info: (context: string, message: string, meta?: Record<string, any>) => {
    console.info(`[INFO][${context}] ${message}`, meta ? meta : '');
  },

  /**
   * Log a warning message with context
   * 
   * @param context - The logging context (usually component/service name)
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  warn: (context: string, message: string, meta?: Record<string, any>) => {
    console.warn(`[WARN][${context}] ${message}`, meta ? meta : '');
  },

  /**
   * Log an error message with context
   * 
   * @param context - The logging context (usually component/service name)
   * @param message - Message to log
   * @param error - Optional error object or metadata
   */
  error: (context: string, message: string, error?: unknown) => {
    console.error(`[ERROR][${context}] ${message}`, error ? error : '');
  },

  /**
   * Log a debug message with context (only in development)
   * 
   * @param context - The logging context (usually component/service name)
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  debug: (context: string, message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG][${context}] ${message}`, meta ? meta : '');
    }
  }
};