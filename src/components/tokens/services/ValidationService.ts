/**
 * Validation Service
 * Provides comprehensive validation for token data and operations
 */

import { ValidationResult } from '../utils/mappers/shared/baseMapper';
import { JsonbConfigMapper } from '../utils/mappers/config/jsonbConfigMapper';

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  message: string;
  validator?: (value: any, data: any) => boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface ValidationSchema {
  rules: ValidationRule[];
  dependencies?: Array<{
    field: string;
    dependsOn: string;
    condition: (value: any) => boolean;
  }>;
  crossFieldValidations?: Array<{
    fields: string[];
    validator: (data: any) => boolean;
    message: string;
  }>;
}

export interface ValidationContext {
  standard: string;
  configMode: 'min' | 'max';
  operation: 'create' | 'update';
  existingData?: any;
}

/**
 * Comprehensive Validation Service
 */
export class ValidationService {
  
  /**
   * Validate data against a schema
   */
  static validate(data: any, schema: ValidationSchema, context?: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate individual rules
    for (const rule of schema.rules) {
      const fieldResult = this.validateField(data, rule, context);
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors);
      }
      if (fieldResult.warnings) {
        warnings.push(...fieldResult.warnings);
      }
    }

    // Validate dependencies
    if (schema.dependencies) {
      for (const dependency of schema.dependencies) {
        const dependencyResult = this.validateDependency(data, dependency);
        if (!dependencyResult.valid) {
          errors.push(...dependencyResult.errors);
        }
      }
    }

    // Validate cross-field validations
    if (schema.crossFieldValidations) {
      for (const crossValidation of schema.crossFieldValidations) {
        if (!crossValidation.validator(data)) {
          errors.push(crossValidation.message);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a single field
   */
  private static validateField(data: any, rule: ValidationRule, context?: ValidationContext): ValidationResult {
    const value = this.getNestedValue(data, rule.field);
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          errors.push(rule.message);
        }
        break;

      case 'format':
        if (!this.isEmpty(value) && rule.pattern && !rule.pattern.test(String(value))) {
          errors.push(rule.message);
        }
        break;

      case 'range':
        if (!this.isEmpty(value)) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${rule.field} must be a valid number`);
          } else {
            if (rule.min !== undefined && numValue < rule.min) {
              errors.push(`${rule.field} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && numValue > rule.max) {
              errors.push(`${rule.field} must be at most ${rule.max}`);
            }
          }
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value, data)) {
          errors.push(rule.message);
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate field dependencies
   */
  private static validateDependency(data: any, dependency: {
    field: string;
    dependsOn: string;
    condition: (value: any) => boolean;
  }): ValidationResult {
    const dependentValue = this.getNestedValue(data, dependency.dependsOn);
    const fieldValue = this.getNestedValue(data, dependency.field);

    if (dependency.condition(dependentValue) && this.isEmpty(fieldValue)) {
      return {
        valid: false,
        errors: [`${dependency.field} is required when ${dependency.dependsOn} is set`],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Get nested value from object
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Check if value is empty
   */
  private static isEmpty(value: any): boolean {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  /**
   * Token-specific validation schemas
   */
  static getTokenValidationSchema(standard: string, configMode: 'min' | 'max'): ValidationSchema {
    const baseRules: ValidationRule[] = [
      {
        field: 'name',
        type: 'required',
        message: 'Token name is required',
      },
      {
        field: 'symbol',
        type: 'required',
        message: 'Token symbol is required',
      },
      {
        field: 'symbol',
        type: 'format',
        pattern: /^[A-Z0-9]{1,11}$/,
        message: 'Symbol must be 1-11 uppercase alphanumeric characters',
      },
      {
        field: 'decimals',
        type: 'range',
        min: 0,
        max: 18,
        message: 'Decimals must be between 0 and 18',
      },
    ];

    const schemas: Record<string, ValidationSchema> = {
      'ERC-20': {
        rules: [
          ...baseRules,
          {
            field: 'initialSupply',
            type: 'custom',
            message: 'Initial supply must be a valid number',
            validator: (value) => !value || /^\d+(\.\d+)?$/.test(value),
          },
          {
            field: 'cap',
            type: 'custom',
            message: 'Cap must be a valid number',
            validator: (value) => !value || /^\d+(\.\d+)?$/.test(value),
          },
        ],
        crossFieldValidations: [
          {
            fields: ['initialSupply', 'cap'],
            validator: (data) => {
              if (!data.initialSupply || !data.cap) return true;
              return parseFloat(data.initialSupply) <= parseFloat(data.cap);
            },
            message: 'Initial supply cannot exceed cap',
          },
        ],
      },

      'ERC-721': {
        rules: [
          ...baseRules.filter(rule => rule.field !== 'decimals'), // NFTs don't have decimals
          {
            field: 'baseURI',
            type: 'format',
            pattern: /^https?:\/\/.+/,
            message: 'Base URI must be a valid HTTP(S) URL',
          },
          {
            field: 'maxSupply',
            type: 'custom',
            message: 'Max supply must be a positive integer',
            validator: (value) => !value || (/^\d+$/.test(String(value)) && parseInt(String(value)) > 0),
          },
        ],
      },

      'ERC-1155': {
        rules: [
          ...baseRules.filter(rule => rule.field !== 'decimals'),
          {
            field: 'baseURI',
            type: 'format',
            pattern: /^https?:\/\/.+/,
            message: 'Base URI must be a valid HTTP(S) URL',
          },
        ],
      },

      'ERC-1400': {
        rules: [
          ...baseRules,
          {
            field: 'securityType',
            type: 'required',
            message: 'Security type is required for ERC-1400 tokens',
          },
          {
            field: 'issuingJurisdiction',
            type: 'required',
            message: 'Issuing jurisdiction is required for security tokens',
          },
          {
            field: 'controllerAddress',
            type: 'format',
            pattern: /^0x[a-fA-F0-9]{40}$/,
            message: 'Controller address must be a valid Ethereum address',
          },
        ],
      },

      'ERC-3525': {
        rules: [
          ...baseRules,
          {
            field: 'valueDecimals',
            type: 'range',
            min: 0,
            max: 18,
            message: 'Value decimals must be between 0 and 18',
          },
          {
            field: 'slotType',
            type: 'required',
            message: 'Slot type is required for ERC-3525 tokens',
          },
        ],
      },

      'ERC-4626': {
        rules: [
          ...baseRules,
          {
            field: 'asset',
            type: 'required',
            message: 'Underlying asset is required for vault tokens',
          },
          {
            field: 'asset',
            type: 'format',
            pattern: /^0x[a-fA-F0-9]{40}$/,
            message: 'Asset must be a valid Ethereum address',
          },
        ],
      },
    };

    return schemas[standard] || { rules: baseRules };
  }

  /**
   * Validate JSONB configurations
   */
  static validateJSONBConfigs(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate transfer config
    if (data.transferConfig) {
      const transferValidation = JsonbConfigMapper.validateTransferConfig(data.transferConfig);
      if (!transferValidation.valid) {
        errors.push(...transferValidation.errors);
      }
    }

    // Validate governance config
    if (data.governanceConfig) {
      const governanceValidation = JsonbConfigMapper.validateGovernanceConfig(data.governanceConfig);
      if (!governanceValidation.valid) {
        errors.push(...governanceValidation.errors);
      }
    }

    // Validate royalty config
    if (data.royaltyConfig) {
      const royaltyValidation = JsonbConfigMapper.validateRoyaltyConfig(data.royaltyConfig);
      if (!royaltyValidation.valid) {
        errors.push(...royaltyValidation.errors);
      }
    }

    // Business logic warnings
    if (data.transferConfig?.enabled && data.transferConfig?.restrictions?.requireApproval) {
      warnings.push('Transfer approval requirement may impact token liquidity');
    }

    if (data.governanceConfig?.enabled && !data.governanceConfig?.quorumPercentage) {
      warnings.push('Governance enabled but no quorum percentage set');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(data: any, context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Standard-specific business rules
    switch (context.standard) {
      case 'ERC-20':
        if (data.isMintable && !data.cap) {
          warnings.push('Mintable token without cap may have unlimited supply');
        }
        
        if (data.isBurnable && data.burnOnTransfer) {
          warnings.push('Both burnable and burn-on-transfer enabled may reduce supply rapidly');
        }
        break;

      case 'ERC-721':
        if (data.hasRoyalty && (!data.royaltyPercentage || !data.royaltyReceiver)) {
          errors.push('Royalty enabled but percentage or receiver not specified');
        }
        
        if (data.maxSupply && parseInt(String(data.maxSupply)) > 10000) {
          warnings.push('Large max supply for NFT collection may impact gas costs');
        }
        break;

      case 'ERC-1400':
        if (!data.requireKYC) {
          warnings.push('Security token without KYC requirement may face regulatory issues');
        }
        
        if (!data.transferRestrictions?.enabled) {
          warnings.push('Security token without transfer restrictions may not be compliant');
        }
        break;
    }

    // Economic model validation
    if (data.feeOnTransfer?.enabled) {
      const totalFees = Object.values(data.feeOnTransfer.fees || {})
        .reduce((sum: number, fee: any) => {
          const feeValue = parseFloat(String(fee)) || 0;
          return sum + feeValue;
        }, 0);
      
      if (typeof totalFees === 'number' && totalFees > 50) {
        warnings.push('High transaction fees may discourage trading');
      }
    }

    // Security validation
    if (data.isPausable && !data.pausableBy) {
      errors.push('Pausable token must specify who can pause');
    }

    if (data.isMintable && !data.mintableBy) {
      errors.push('Mintable token must specify who can mint');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate deployment readiness
   */
  static validateDeploymentReadiness(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required for deployment
    const requiredFields = ['name', 'symbol', 'decimals'];
    for (const field of requiredFields) {
      if (this.isEmpty(data[field])) {
        errors.push(`${field} is required for deployment`);
      }
    }

    // Deployment-specific checks
    if (data.initialSupply && parseFloat(data.initialSupply) === 0) {
      warnings.push('Zero initial supply means no tokens will be created on deployment');
    }

    if (!data.description) {
      warnings.push('Token description recommended for better user understanding');
    }

    // Gas estimation warnings
    if (data.governanceEnabled) {
      warnings.push('Governance features increase deployment gas costs');
    }

    if (data.hasRoyalty) {
      warnings.push('Royalty features increase deployment gas costs');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate update operation
   */
  static validateUpdate(newData: any, existingData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Immutable fields that cannot be changed after deployment
    const immutableFields = ['name', 'symbol', 'decimals', 'standard'];
    
    for (const field of immutableFields) {
      if (existingData[field] && newData[field] && existingData[field] !== newData[field]) {
        errors.push(`${field} cannot be changed after token creation`);
      }
    }

    // Fields that require careful consideration
    if (existingData.isMintable && !newData.isMintable) {
      warnings.push('Disabling minting is irreversible in most implementations');
    }

    if (existingData.isPausable && !newData.isPausable) {
      warnings.push('Disabling pause functionality is irreversible in most implementations');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Comprehensive validation combining all checks
   */
  static validateComprehensive(
    data: any, 
    context: ValidationContext, 
    existingData?: any
  ): ValidationResult {
    const results: ValidationResult[] = [];

    // Schema validation
    const schema = this.getTokenValidationSchema(context.standard, context.configMode);
    results.push(this.validate(data, schema, context));

    // JSONB config validation
    results.push(this.validateJSONBConfigs(data));

    // Business rules validation
    results.push(this.validateBusinessRules(data, context));

    // Update validation if applicable
    if (context.operation === 'update' && existingData) {
      results.push(this.validateUpdate(data, existingData));
    }

    // Deployment readiness (for create operations)
    if (context.operation === 'create') {
      results.push(this.validateDeploymentReadiness(data));
    }

    // Combine all results
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const result of results) {
      if (result.errors) {
        allErrors.push(...result.errors);
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPercentage(value: string | number): boolean {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  static isValidSupplyAmount(value: string): boolean {
    return /^\d+(\.\d+)?$/.test(value) && parseFloat(value) >= 0;
  }

  static isValidDecimals(decimals: number): boolean {
    return Number.isInteger(decimals) && decimals >= 0 && decimals <= 18;
  }

  static isValidSymbol(symbol: string): boolean {
    return /^[A-Z0-9]{1,11}$/.test(symbol);
  }

  static sanitizeTokenName(name: string): string {
    return name.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
  }

  static sanitizeTokenSymbol(symbol: string): string {
    return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 11);
  }
}
