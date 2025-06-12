/**
 * Database Schema Mapper
 * Handles DB ↔ Domain mapping for all token tables
 */

import { BaseMapper, ValidationResult } from '../shared/baseMapper';

export interface DatabaseTokenBase {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  standard: string;
  total_supply?: string;
  metadata?: any;
  status: string;
  description?: string;
  project_id: string;
  config_mode: string;
  blocks: any;
  created_at: string;
  updated_at?: string;
}

export interface DomainTokenBase {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  standard: string;
  totalSupply?: string;
  metadata?: Record<string, any>;
  status: string;
  description?: string;
  projectId: string;
  configMode: string;
  blocks?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Schema mapper for core token table
 */
export class TokenSchemaMapper extends BaseMapper<DomainTokenBase, DatabaseTokenBase> {
  
  toDomain(dbRecord: DatabaseTokenBase): DomainTokenBase {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      symbol: dbRecord.symbol,
      decimals: dbRecord.decimals,
      standard: dbRecord.standard,
      totalSupply: dbRecord.total_supply,
      metadata: this.handleJsonbField(dbRecord.metadata),
      status: dbRecord.status,
      description: dbRecord.description,
      projectId: dbRecord.project_id,
      configMode: dbRecord.config_mode,
      blocks: this.handleJsonbField(dbRecord.blocks),
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }

  toDatabase(domainObject: DomainTokenBase): DatabaseTokenBase {
    return this.cleanUndefined({
      id: domainObject.id,
      name: domainObject.name,
      symbol: domainObject.symbol,
      decimals: domainObject.decimals,
      standard: domainObject.standard,
      total_supply: domainObject.totalSupply,
      metadata: this.prepareJsonbField(domainObject.metadata),
      status: domainObject.status,
      description: domainObject.description,
      project_id: domainObject.projectId,
      config_mode: domainObject.configMode,
      blocks: this.prepareJsonbField(domainObject.blocks || {}),
      created_at: domainObject.createdAt,
      updated_at: domainObject.updatedAt,
    }) as DatabaseTokenBase;
  }

  fromForm(formData: any): DatabaseTokenBase {
    return this.cleanUndefined({
      id: formData.id,
      name: formData.name,
      symbol: formData.symbol,
      decimals: formData.decimals || 18,
      standard: formData.standard,
      total_supply: formData.totalSupply || formData.total_supply,
      metadata: this.prepareJsonbField(formData.metadata),
      status: formData.status || 'DRAFT',
      description: formData.description,
      project_id: formData.projectId || formData.project_id,
      config_mode: formData.configMode || formData.config_mode || 'min',
      blocks: this.prepareJsonbField(formData.blocks || {}),
      created_at: formData.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }) as DatabaseTokenBase;
  }

  toForm(domainObject: DomainTokenBase): any {
    return {
      id: domainObject.id,
      name: domainObject.name,
      symbol: domainObject.symbol,
      decimals: domainObject.decimals,
      standard: domainObject.standard,
      totalSupply: domainObject.totalSupply,
      metadata: domainObject.metadata,
      status: domainObject.status,
      description: domainObject.description,
      projectId: domainObject.projectId,
      configMode: domainObject.configMode,
      blocks: domainObject.blocks,
      createdAt: domainObject.createdAt,
      updatedAt: domainObject.updatedAt,
    };
  }

  validate(data: any): ValidationResult {
    const requiredFields = ['name', 'symbol', 'standard', 'projectId'];
    const baseValidation = this.validateRequired(data, requiredFields);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors: string[] = [];

    // Validate decimals
    if (data.decimals && (data.decimals < 0 || data.decimals > 18)) {
      errors.push('Decimals must be between 0 and 18');
    }

    // Validate symbol format
    if (data.symbol && (data.symbol.length < 1 || data.symbol.length > 11)) {
      errors.push('Symbol must be between 1 and 11 characters');
    }

    // Validate name length
    if (data.name && data.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Generic property table mapper
 */
export abstract class PropertyTableMapper<TDomain, TDatabase> extends BaseMapper<TDomain, TDatabase> {
  protected abstract getTableName(): string;
  protected abstract getRequiredFields(): string[];

  validate(data: any): ValidationResult {
    const requiredFields = this.getRequiredFields();
    const baseValidation = this.validateRequired(data, requiredFields);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // Validate token_id if present
    if (data.token_id && !data.token_id.match(/^[0-9a-f-]{36}$/i)) {
      return {
        valid: false,
        errors: ['Invalid token_id format']
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Create insert data with proper timestamps
   */
  protected createInsertData(data: any): any {
    const now = new Date().toISOString();
    return {
      ...data,
      created_at: data.created_at || now,
      updated_at: now,
    };
  }

  /**
   * Create update data with timestamp
   */
  protected createUpdateData(data: any): any {
    const now = new Date().toISOString();
    const { created_at, ...updateData } = data;
    return {
      ...updateData,
      updated_at: now,
    };
  }
}

/**
 * Relationship table mapper
 */
export abstract class RelationshipTableMapper<TDomain, TDatabase> extends BaseMapper<TDomain, TDatabase> {
  protected abstract getParentIdField(): string;
  protected abstract getChildIdField(): string;

  /**
   * Map array of relationships
   */
  mapRelationshipArray(parentId: string, relationships: any[]): TDatabase[] {
    return relationships.map(rel => this.toDatabase({
      ...rel,
      [this.getParentIdField()]: parentId,
    } as TDomain));
  }

  /**
   * Validate relationship data
   */
  validateRelationship(data: any): ValidationResult {
    const errors: string[] = [];

    const parentField = this.getParentIdField();
    const childField = this.getChildIdField();

    if (!data[parentField]) {
      errors.push(`${parentField} is required`);
    }

    if (!data[childField]) {
      errors.push(`${childField} is required`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * View mapper for database views
 */
export class ViewMapper {
  /**
   * Map view data to domain object
   */
  static mapView<T>(viewData: any, mapper: (data: any) => T): T {
    return mapper(viewData);
  }

  /**
   * Handle view aggregations
   */
  static handleAggregation(viewData: any, aggregationFields: string[]): Record<string, any> {
    const aggregated: Record<string, any> = {};
    
    for (const field of aggregationFields) {
      if (viewData[field] !== undefined) {
        aggregated[field] = viewData[field];
      }
    }
    
    return aggregated;
  }
}

/**
 * Database operation helpers
 */
export class DatabaseOperationMapper {
  /**
   * Prepare batch insert data
   */
  static prepareBatchInsert<T>(
    items: T[],
    mapper: (item: T) => any
  ): any[] {
    const now = new Date().toISOString();
    
    return items.map(item => ({
      ...mapper(item),
      created_at: now,
      updated_at: now,
    }));
  }

  /**
   * Prepare batch update data
   */
  static prepareBatchUpdate<T>(
    items: T[],
    mapper: (item: T) => any,
    idField: string = 'id'
  ): Array<{where: any, data: any}> {
    const now = new Date().toISOString();
    
    return items.map(item => {
      const mapped = mapper(item);
      const { [idField]: id, created_at, ...updateData } = mapped;
      
      return {
        where: { [idField]: id },
        data: {
          ...updateData,
          updated_at: now,
        }
      };
    });
  }

  /**
   * Handle upsert operations
   */
  static prepareUpsert<T>(
    item: T,
    mapper: (item: T) => any,
    conflictFields: string[]
  ): {insert: any, update: any, conflict: any} {
    const now = new Date().toISOString();
    const mapped = mapper(item);
    
    const insertData = {
      ...mapped,
      created_at: now,
      updated_at: now,
    };
    
    const { created_at, ...updateData } = mapped;
    const finalUpdateData = {
      ...updateData,
      updated_at: now,
    };
    
    const conflict = conflictFields.reduce((acc, field) => {
      acc[field] = mapped[field];
      return acc;
    }, {} as any);
    
    return {
      insert: insertData,
      update: finalUpdateData,
      conflict,
    };
  }
}
