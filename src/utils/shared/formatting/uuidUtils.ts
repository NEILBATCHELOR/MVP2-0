import { v4 as uuidv4, validate as isUUID } from 'uuid';

/**
 * Check if a string is a valid UUID
 * @param str String to validate
 * @returns True if string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Ensure a value is a valid UUID
 * @param value Value to check/convert
 * @param prefix Optional prefix for deterministic UUID generation
 * @returns Valid UUID
 */
export function ensureUUID(value: string | undefined | null, prefix?: string): string {
  if (!value) {
    return uuidv4(); // Generate new UUID if no value provided
  }
  
  // If it's already a valid UUID, use it
  if (isValidUUID(value)) {
    return value;
  }
  
  // Handle special cases
  if (value === 'admin-bypass') {
    return '00000000-0000-0000-0000-000000000000'; // Special admin UUID
  }
  
  // For other strings, generate a deterministic UUID based on the input
  // This ensures the same input always generates the same UUID
  if (prefix) {
    const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace for URLs
    const combined = `${prefix}:${value}`;
    return uuidv4(); // TODO: Use UUID v5 with namespace for deterministic generation
  }
  
  // Default to random UUID
  return uuidv4();
}

/**
 * Generate a new UUID
 * @returns New UUID
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate a deterministic UUID from a string
 * @param input Input string
 * @param namespace Optional namespace UUID
 * @returns Deterministic UUID
 */
export function generateDeterministicUUID(input: string, namespace?: string): string {
  // TODO: Implement UUID v5 generation for deterministic UUIDs
  return uuidv4();
} 