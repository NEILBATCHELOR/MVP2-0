/**
 * Main Utils Export
 * 
 * Central export point for commonly used utility functions
 */

// Re-export cn utility function
export { cn } from '@/utils/shared/utils';

// Re-export other commonly used utilities
export { generateUUID } from '@/utils/shared/formatting/uuidUtils';
export { 
  formatDate,
  formatDateTime,
  formatCurrency,
  formatPercentage
} from '@/utils/shared/formatting/exportUtils';

// Type utilities
export type { ClassValue } from 'clsx';
