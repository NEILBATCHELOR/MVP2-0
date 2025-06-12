/**
 * Utility functions for object manipulation
 */

/**
 * Deep merges source objects into target
 * Properly handles arrays and nested objects
 * Arrays are either replaced or merged based on options
 */
export function deepMerge<T>(target: T, ...sources: any[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        // For arrays, replace completely rather than merge items
        if (source[key].length > 0) {
          // Create a deep copy of the array to prevent reference issues
          target[key] = JSON.parse(JSON.stringify(source[key]));
        } else if (!target[key]) {
          target[key] = [];
        }
      } else {
        // For primitive values, only override if the source value is defined/non-null
        if (source[key] !== undefined && source[key] !== null) {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Checks if value is a proper object (not null, not array, etc)
 */
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 * Preserves all complex fields from source in target
 * Used to ensure no complex nested structures are lost
 */
export function preserveComplexFields(target: any, source: any, fieldPaths: string[]): any {
  const result = {...target};
  
  for (const path of fieldPaths) {
    const parts = path.split('.');
    let sourceCurrent = source;
    let targetCurrent = result;
    
    // Navigate through the path to find the field
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // If we're at the last part, copy the value
      if (i === parts.length - 1) {
        if (sourceCurrent && sourceCurrent[part] !== undefined) {
          // Use deep clone for arrays and objects to avoid reference issues
          if (Array.isArray(sourceCurrent[part]) || isObject(sourceCurrent[part])) {
            targetCurrent[part] = JSON.parse(JSON.stringify(sourceCurrent[part]));
          } else {
            targetCurrent[part] = sourceCurrent[part];
          }
        }
        break;
      }
      
      // Otherwise, navigate deeper
      if (sourceCurrent && sourceCurrent[part] !== undefined) {
        sourceCurrent = sourceCurrent[part];
        
        // Create path in target if it doesn't exist
        if (!targetCurrent[part]) {
          targetCurrent[part] = Array.isArray(sourceCurrent) ? [] : {};
        }
        
        targetCurrent = targetCurrent[part];
      } else {
        // Path doesn't exist in source
        break;
      }
    }
  }
  
  return result;
} 