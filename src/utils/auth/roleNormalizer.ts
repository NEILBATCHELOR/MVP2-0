/**
 * Normalizes role names to handle various formats:
 * Examples:
 * - "Operations Manager" -> "operationsmanager"
 * - "OPERATIONS_MANAGER" -> "operationsmanager"
 * - "operationsManager" -> "operationsmanager"
 * - "OperationsManager" -> "operationsmanager"
 * - "operations-manager" -> "operationsmanager"
 * - "Operations_Manager" -> "operationsmanager"
 * 
 * @param role The role name to normalize
 * @returns Normalized role name in lowercase without special characters
 */
export const normalizeRoleName = (role: string): string => {
  if (!role) return '';
  
  // Convert to lowercase first
  let normalized = role.toLowerCase();
  
  // Replace common separators (hyphens, underscores) with spaces
  normalized = normalized.replace(/[-_]/g, ' ');
  
  // Handle camelCase and PascalCase by adding spaces before capitals
  normalized = normalized.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  
  // Remove all spaces
  normalized = normalized.replace(/\s+/g, '');
  
  // Remove any remaining special characters but keep numbers
  normalized = normalized.replace(/[^a-z0-9]/g, '');
  
  return normalized;
};

/**
 * Gets a display name version of a role
 * Examples:
 * - "operations_manager" -> "Operations Manager"
 * - "operationsManager" -> "Operations Manager"
 * - "OPERATIONS_MANAGER" -> "Operations Manager"
 * 
 * @param role The role name to convert to display format
 * @returns Display formatted role name
 */
export const getRoleDisplayName = (role: string): string => {
  if (!role) return '';
  
  // First convert to lowercase and replace separators with spaces
  let display = role.toLowerCase().replace(/[-_]/g, ' ');
  
  // Handle camelCase and PascalCase
  display = display.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  
  // Remove duplicate spaces
  display = display.replace(/\s+/g, ' ').trim();
  
  // Title Case: Capitalize all words except articles, coordinating conjunctions, and prepositions
  const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of']);
  
  return display.split(' ')
    .map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || index === display.split(' ').length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // For other words, only capitalize if not a minor word
      return minorWords.has(word.toLowerCase()) 
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Checks if two role names match after normalization
 * Examples:
 * - doRolesMatch("Operations Manager", "operations_manager") -> true
 * - doRolesMatch("OperationsManager", "OPERATIONS_MANAGER") -> true
 * - doRolesMatch("operations-manager", "operationsManager") -> true
 */
export const doRolesMatch = (role1: string, role2: string): boolean => {
  return normalizeRoleName(role1) === normalizeRoleName(role2);
};

/**
 * Converts a role name to a valid database identifier
 * Examples:
 * - "Operations Manager" -> "operations_manager"
 * - "operationsManager" -> "operations_manager"
 * 
 * @param role The role name to convert to database format
 * @returns Database formatted role name
 */
export const getDatabaseRoleName = (role: string): string => {
  if (!role) return '';
  
  // First normalize to get consistent format
  let dbName = role.toLowerCase();
  
  // Handle camelCase and PascalCase
  dbName = dbName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  
  // Replace spaces and hyphens with underscores
  dbName = dbName.replace(/[\s-]+/g, '_');
  
  // Remove duplicate underscores and trim
  dbName = dbName.replace(/_+/g, '_').replace(/^_|_$/g, '');
  
  // Remove any remaining special characters but keep underscores and numbers
  dbName = dbName.replace(/[^a-z0-9_]/g, '');
  
  return dbName;
};

/**
 * Examples of how different formats normalize:
 * normalizeRoleName('superadmin')      -> 'superadmin'
 * normalizeRoleName('SUPERADMIN')      -> 'superadmin'
 * normalizeRoleName('Superadmin')      -> 'superadmin'
 * normalizeRoleName('Super Admin')     -> 'superadmin'
 * normalizeRoleName('super_admin')     -> 'superadmin'
 * normalizeRoleName('superAdmin')      -> 'superadmin'
 * normalizeRoleName('SuperAdmin')      -> 'superadmin'
 * normalizeRoleName('super-admin')     -> 'superadmin'
 * normalizeRoleName('Super Admin')     -> 'superadmin'
 * 
 * normalizeRoleName('Operations Manager') -> 'operationsmanager'
 * normalizeRoleName('OPERATIONS_MANAGER') -> 'operationsmanager'
 * normalizeRoleName('OperationsManager') -> 'operationsmanager'
 */