// Shared validation types
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema<T = any> {
  [key: string]: ValidationRule<any>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Additional validation utility types
export type ValidatorFunction<T> = (value: T) => string | null;

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidatorFunction<any>;
}
