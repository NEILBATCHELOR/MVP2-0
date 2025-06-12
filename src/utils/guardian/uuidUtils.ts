/**
 * Browser-compatible UUID generation utility
 * Provides a fallback for environments where crypto.randomUUID() is not available
 */

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID() if available, otherwise falls back to a manual implementation
 */
export function createUUID(): string {
  // Try to use the native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      // Fall through to manual implementation
    }
  }
  
  // Fallback manual UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate multiple UUIDs at once
 */
export function createUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => createUUID());
}

export default createUUID;
