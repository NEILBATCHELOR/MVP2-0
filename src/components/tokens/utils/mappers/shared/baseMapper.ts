/**
 * Base Mapper Infrastructure
 * Provides common mapping patterns for all token standards
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface StandardMapper<TDomain, TDatabase> {
  toDomain(dbRecord: TDatabase): TDomain;
  toDatabase(domainObject: TDomain): TDatabase;
  fromForm(formData: any): TDatabase;
  toForm(domainObject: TDomain): any;
}

export interface ValidatingMapper<T> extends StandardMapper<T, any> {
  validate(data: any): ValidationResult;
  sanitize(data: any): any;
  transform(data: any): any;
}

export interface RelationshipMapper<TParent, TChild> {
  mapWithRelations(parent: TParent, children: TChild[]): EnhancedEntity;
  syncRelations(parentId: string, children: TChild[]): Promise<void>;
  validateRelations(data: any): ValidationResult;
}

export interface EnhancedEntity {
  id: string;
  [key: string]: any;
  relations?: Record<string, any[]>;
}

/**
 * Base implementation providing common functionality
 */
export abstract class BaseMapper<TDomain, TDatabase> implements StandardMapper<TDomain, TDatabase> {
  abstract toDomain(dbRecord: TDatabase): TDomain;
  abstract toDatabase(domainObject: TDomain): TDatabase;
  abstract fromForm(formData: any): TDatabase;
  abstract toForm(domainObject: TDomain): any;

  /**
   * Convert snake_case to camelCase
   */
  protected snakeToCamel(obj: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[camelKey] = this.snakeToCamel(value);
      } else if (Array.isArray(value)) {
        converted[camelKey] = value.map(item => 
          typeof item === 'object' && item !== null ? this.snakeToCamel(item) : item
        );
      } else {
        converted[camelKey] = value;
      }
    }
    
    return converted;
  }

  /**
   * Convert camelCase to snake_case
   */
  protected camelToSnake(obj: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[snakeKey] = this.camelToSnake(value);
      } else if (Array.isArray(value)) {
        converted[snakeKey] = value.map(item => 
          typeof item === 'object' && item !== null ? this.camelToSnake(item) : item
        );
      } else {
        converted[snakeKey] = value;
      }
    }
    
    return converted;
  }

  /**
   * Handle JSONB field conversion
   */
  protected handleJsonbField(value: any): Record<string, any> | null {
    if (!value) return null;
    
    // If already an object, return as-is
    if (typeof value === 'object') {
      return value as Record<string, any>;
    }
    
    // If string, try to parse
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Prepare JSONB field for database
   */
  protected prepareJsonbField(value: any): any {
    if (!value) return null;
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

  /**
   * Validate required fields
   */
  protected validateRequired(obj: any, requiredFields: string[]): ValidationResult {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!obj[field] && obj[field] !== 0 && obj[field] !== false) {
        errors.push(`${field} is required`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean undefined values from object
   */
  protected cleanUndefined(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Merge default values with provided data
   */
  protected mergeDefaults(data: Record<string, any>, defaults: Record<string, any>): Record<string, any> {
    return { ...defaults, ...data };
  }

  /**
   * Type-safe property access
   */
  protected safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current?.[key] === undefined) {
          return defaultValue;
        }
        current = current[key];
      }
      
      return current;
    } catch {
      return defaultValue;
    }
  }
}

/**
 * Utility functions for common mapping operations
 */
export class MapperUtils {
  /**
   * Ensure numeric string conversion
   */
  static toNumericString(value: any): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return '0';
  }

  /**
   * Ensure boolean conversion
   */
  static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  /**
   * Ensure array conversion
   */
  static toArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  }

  /**
   * Date handling
   */
  static toISOString(date: any): string | null {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return null;
  }

  /**
   * UUID validation
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Ethereum address validation
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
