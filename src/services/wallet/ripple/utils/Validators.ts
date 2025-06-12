/**
 * Validation utilities for Ripple services
 * Provides consistent validation for API inputs and business logic
 */

import type { ValidationResult, ValidationError } from '../types';

// Validation error codes
export const VALIDATION_CODES = {
  REQUIRED: 'required',
  INVALID_FORMAT: 'invalid_format',
  INVALID_LENGTH: 'invalid_length',
  INVALID_RANGE: 'invalid_range',
  INVALID_TYPE: 'invalid_type',
  INVALID_ENUM: 'invalid_enum',
  INVALID_EMAIL: 'invalid_email',
  INVALID_PHONE: 'invalid_phone',
  INVALID_URL: 'invalid_url',
  INVALID_DATE: 'invalid_date',
  INVALID_CURRENCY: 'invalid_currency',
  INVALID_AMOUNT: 'invalid_amount',
  INVALID_ADDRESS: 'invalid_address',
  INVALID_COUNTRY_CODE: 'invalid_country_code',
  CUSTOM: 'custom'
} as const;

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  CURRENCY_CODE: /^[A-Z]{3}$/,
  COUNTRY_CODE: /^[A-Z]{2}$/,
  XRP_ADDRESS: /^r[A-Za-z0-9]{24,34}$/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  AMOUNT: /^\d+(\.\d{1,8})?$/
} as const;

// Supported currencies
const SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'INR', 'BRL', 'ZAR', 'RUB',
  'XRP', 'BTC', 'ETH', 'USDT', 'USDC', 'RLUSD'
]);

// Supported countries (ISO 3166-1 alpha-2)
const SUPPORTED_COUNTRIES = new Set([
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT',
  'SE', 'NO', 'DK', 'FI', 'JP', 'KR', 'SG', 'HK', 'MX', 'BR', 'IN', 'PH'
]);

export class RippleValidator {
  /**
   * Validate required field
   */
  static required(value: any, fieldName: string): ValidationError | null {
    if (value === undefined || value === null || value === '') {
      return {
        field: fieldName,
        code: VALIDATION_CODES.REQUIRED,
        message: `${fieldName} is required`,
        value
      };
    }
    return null;
  }

  /**
   * Validate string length
   */
  static stringLength(
    value: string,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_TYPE,
        message: `${fieldName} must be a string`,
        value
      };
    }

    if (min !== undefined && value.length < min) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_LENGTH,
        message: `${fieldName} must be at least ${min} characters`,
        value
      };
    }

    if (max !== undefined && value.length > max) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_LENGTH,
        message: `${fieldName} must be no more than ${max} characters`,
        value
      };
    }

    return null;
  }

  /**
   * Validate number range
   */
  static numberRange(
    value: number,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_TYPE,
        message: `${fieldName} must be a valid number`,
        value
      };
    }

    if (min !== undefined && value < min) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_RANGE,
        message: `${fieldName} must be at least ${min}`,
        value
      };
    }

    if (max !== undefined && value > max) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_RANGE,
        message: `${fieldName} must be no more than ${max}`,
        value
      };
    }

    return null;
  }

  /**
   * Validate enum value
   */
  static enum<T extends string>(
    value: string,
    fieldName: string,
    allowedValues: readonly T[]
  ): ValidationError | null {
    if (!allowedValues.includes(value as T)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_ENUM,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        value
      };
    }
    return null;
  }

  /**
   * Validate email format
   */
  static email(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.EMAIL.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_EMAIL,
        message: `${fieldName} must be a valid email address`,
        value
      };
    }
    return null;
  }

  /**
   * Validate phone number format
   */
  static phone(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.PHONE.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_PHONE,
        message: `${fieldName} must be a valid phone number`,
        value
      };
    }
    return null;
  }

  /**
   * Validate URL format
   */
  static url(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.URL.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_URL,
        message: `${fieldName} must be a valid URL`,
        value
      };
    }
    return null;
  }

  /**
   * Validate ISO date format
   */
  static isoDate(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.ISO_DATE.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_DATE,
        message: `${fieldName} must be a valid ISO date`,
        value
      };
    }

    // Also check if it's a valid date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_DATE,
        message: `${fieldName} must be a valid date`,
        value
      };
    }

    return null;
  }

  /**
   * Validate currency code
   */
  static currencyCode(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.CURRENCY_CODE.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_CURRENCY,
        message: `${fieldName} must be a valid 3-letter currency code`,
        value
      };
    }

    if (!SUPPORTED_CURRENCIES.has(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_CURRENCY,
        message: `${fieldName} is not a supported currency`,
        value
      };
    }

    return null;
  }

  /**
   * Validate country code
   */
  static countryCode(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.COUNTRY_CODE.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_COUNTRY_CODE,
        message: `${fieldName} must be a valid 2-letter country code`,
        value
      };
    }

    if (!SUPPORTED_COUNTRIES.has(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_COUNTRY_CODE,
        message: `${fieldName} is not a supported country`,
        value
      };
    }

    return null;
  }

  /**
   * Validate monetary amount
   */
  static amount(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.AMOUNT.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_AMOUNT,
        message: `${fieldName} must be a valid amount (e.g., 123.45)`,
        value
      };
    }

    const amount = parseFloat(value);
    if (amount <= 0) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_AMOUNT,
        message: `${fieldName} must be greater than zero`,
        value
      };
    }

    return null;
  }

  /**
   * Validate XRP address
   */
  static xrpAddress(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.XRP_ADDRESS.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_ADDRESS,
        message: `${fieldName} must be a valid XRP address`,
        value
      };
    }
    return null;
  }

  /**
   * Validate Ethereum address
   */
  static ethAddress(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.ETH_ADDRESS.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_ADDRESS,
        message: `${fieldName} must be a valid Ethereum address`,
        value
      };
    }
    return null;
  }

  /**
   * Validate UUID
   */
  static uuid(value: string, fieldName: string): ValidationError | null {
    if (!PATTERNS.UUID.test(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.INVALID_FORMAT,
        message: `${fieldName} must be a valid UUID`,
        value
      };
    }
    return null;
  }

  /**
   * Custom validation with predicate function
   */
  static custom(
    value: any,
    fieldName: string,
    predicate: (value: any) => boolean,
    message: string
  ): ValidationError | null {
    if (!predicate(value)) {
      return {
        field: fieldName,
        code: VALIDATION_CODES.CUSTOM,
        message,
        value
      };
    }
    return null;
  }

  /**
   * Combine multiple validation results
   */
  static combine(...results: (ValidationError | null)[]): ValidationResult {
    const errors = results.filter(Boolean) as ValidationError[];
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate object against schema
   */
  static validateObject<T extends Record<string, any>>(
    obj: T,
    schema: ValidationSchema<T>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, validators] of Object.entries(schema)) {
      const value = obj[fieldName];
      
      for (const validator of validators) {
        const error = validator(value, fieldName);
        if (error) {
          errors.push(error);
          break; // Stop on first error for this field
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Type for validation schema
export type FieldValidator = (value: any, fieldName: string) => ValidationError | null;
export type ValidationSchema<T> = {
  [K in keyof T]?: FieldValidator[];
};

// Common validation schemas
export const COMMON_SCHEMAS = {
  // Money amount validation
  moneyAmount: (fieldName: string): FieldValidator[] => [
    (value, field) => RippleValidator.required(value?.value, `${field}.value`),
    (value, field) => RippleValidator.amount(value?.value, `${field}.value`),
    (value, field) => RippleValidator.required(value?.currency, `${field}.currency`),
    (value, field) => RippleValidator.currencyCode(value?.currency, `${field}.currency`)
  ],

  // Address validation
  address: (fieldName: string): FieldValidator[] => [
    (value, field) => RippleValidator.required(value?.street, `${field}.street`),
    (value, field) => RippleValidator.stringLength(value?.street, `${field}.street`, 1, 100),
    (value, field) => RippleValidator.required(value?.city, `${field}.city`),
    (value, field) => RippleValidator.stringLength(value?.city, `${field}.city`, 1, 50),
    (value, field) => RippleValidator.required(value?.country, `${field}.country`),
    (value, field) => RippleValidator.countryCode(value?.country, `${field}.country`),
    (value, field) => RippleValidator.required(value?.postalCode, `${field}.postalCode`),
    (value, field) => RippleValidator.stringLength(value?.postalCode, `${field}.postalCode`, 1, 20)
  ],

  // Identity validation
  identity: (fieldName: string): FieldValidator[] => [
    (value, field) => RippleValidator.required(value?.type, `${field}.type`),
    (value, field) => RippleValidator.enum(value?.type, `${field}.type`, ['individual', 'business']),
    (value, field) => {
      if (value?.type === 'individual') {
        return RippleValidator.combine(
          RippleValidator.required(value.firstName, `${field}.firstName`),
          RippleValidator.required(value.lastName, `${field}.lastName`)
        ).errors[0] || null;
      }
      return null;
    },
    (value, field) => {
      if (value?.type === 'business') {
        return RippleValidator.required(value.businessName, `${field}.businessName`);
      }
      return null;
    }
  ]
};

// Export validator instance and utilities
export const validator = RippleValidator;
export const validate = RippleValidator.validateObject;
export const required = RippleValidator.required;
export const stringLength = RippleValidator.stringLength;
export const numberRange = RippleValidator.numberRange;
export const enumValue = RippleValidator.enum;
export const email = RippleValidator.email;
export const phone = RippleValidator.phone;
export const url = RippleValidator.url;
export const isoDate = RippleValidator.isoDate;
export const currencyCode = RippleValidator.currencyCode;
export const countryCode = RippleValidator.countryCode;
export const amount = RippleValidator.amount;
export const xrpAddress = RippleValidator.xrpAddress;
export const ethAddress = RippleValidator.ethAddress;
export const uuid = RippleValidator.uuid;
export const custom = RippleValidator.custom;
export const combine = RippleValidator.combine;
