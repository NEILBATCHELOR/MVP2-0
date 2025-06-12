/**
 * Base Token Service
 * Provides common CRUD operations for all token standards
 */

import { supabase } from '@/infrastructure/supabaseClient';
import { ValidationResult } from '../utils/mappers/shared/baseMapper';
import { TokenSchemaMapper, DatabaseTokenBase, DomainTokenBase } from '../utils/mappers/database/schemaMapper';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  warnings?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  standard?: string;
  status?: string;
  projectId?: string;
  search?: string;
}

export interface BatchOperationResult<T> {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: Array<ServiceResult<T>>;
  summary: {
    created: number;
    updated: number;
    failed: number;
  };
}

/**
 * Base Token Service providing common CRUD operations
 */
export abstract class BaseTokenService {
  protected tokenMapper = new TokenSchemaMapper();

  /**
   * Create a new token
   */
  async createToken(tokenData: any): Promise<ServiceResult<DomainTokenBase>> {
    try {
      // Validate token data
      const validation = this.tokenMapper.validate(tokenData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Map form data to database format
      const dbToken = this.tokenMapper.fromForm(tokenData);
      
      // Generate ID if not provided
      if (!dbToken.id) {
        dbToken.id = crypto.randomUUID();
      }

      // Set timestamps
      const now = new Date().toISOString();
      dbToken.created_at = now;
      dbToken.updated_at = now;

      // Insert into database
      const { data, error } = await supabase
        .from('tokens')
        .insert(dbToken as any) // Type assertion to handle config_mode enum mismatch
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Map back to domain model
      const domainToken = this.tokenMapper.toDomain(data);

      return {
        success: true,
        data: domainToken,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get token by ID
   */
  async getTokenById(id: string): Promise<ServiceResult<DomainTokenBase>> {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Token not found',
          };
        }
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const domainToken = this.tokenMapper.toDomain(data);

      return {
        success: true,
        data: domainToken,
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update token
   */
  async updateToken(id: string, updateData: Partial<any>): Promise<ServiceResult<DomainTokenBase>> {
    try {
      // Get existing token first
      const existingResult = await this.getTokenById(id);
      if (!existingResult.success || !existingResult.data) {
        return existingResult;
      }

      // Merge with existing data
      const mergedData = { ...existingResult.data, ...updateData };

      // Validate merged data
      const validation = this.tokenMapper.validate(mergedData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Map to database format
      const dbToken = this.tokenMapper.toDatabase(mergedData);
      
      // Set update timestamp
      dbToken.updated_at = new Date().toISOString();

      // Update in database
      const { data, error } = await supabase
        .from('tokens')
        .update(dbToken as any) // Type assertion to handle config_mode enum mismatch
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Map back to domain model
      const domainToken = this.tokenMapper.toDomain(data);

      return {
        success: true,
        data: domainToken,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete token
   */
  async deleteToken(id: string): Promise<ServiceResult<boolean>> {
    try {
      // Check if token exists
      const existingResult = await this.getTokenById(id);
      if (!existingResult.success) {
        return {
          success: false,
          error: 'Token not found',
        };
      }

      // Delete from database
      const { error } = await supabase
        .from('tokens')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * List tokens with pagination and filtering
   */
  async listTokens(
    filters: FilterOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<ServiceResult<{ tokens: DomainTokenBase[], total: number, page: number, limit: number }>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = pagination;

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase.from('tokens').select('*', { count: 'exact' });

      // Apply filters with proper type casting
      if (filters.standard) {
        query = query.eq('standard', filters.standard as any);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,symbol.ilike.%${filters.search}%`);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Map to domain models
      const tokens = data.map(token => this.tokenMapper.toDomain(token));

      return {
        success: true,
        data: {
          tokens,
          total: count || 0,
          page,
          limit,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Batch create tokens
   */
  async batchCreateTokens(tokensData: any[]): Promise<BatchOperationResult<DomainTokenBase>> {
    const results: Array<ServiceResult<DomainTokenBase>> = [];
    let successCount = 0;
    let failureCount = 0;
    let createdCount = 0;

    for (const tokenData of tokensData) {
      const result = await this.createToken(tokenData);
      results.push(result);
      
      if (result.success) {
        successCount++;
        createdCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results,
      summary: {
        created: createdCount,
        updated: 0,
        failed: failureCount,
      },
    };
  }

  /**
   * Batch update tokens
   */
  async batchUpdateTokens(updates: Array<{ id: string, data: Partial<any> }>): Promise<BatchOperationResult<DomainTokenBase>> {
    const results: Array<ServiceResult<DomainTokenBase>> = [];
    let successCount = 0;
    let failureCount = 0;
    let updatedCount = 0;

    for (const update of updates) {
      const result = await this.updateToken(update.id, update.data);
      results.push(result);
      
      if (result.success) {
        successCount++;
        updatedCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results,
      summary: {
        created: 0,
        updated: updatedCount,
        failed: failureCount,
      },
    };
  }

  /**
   * Get tokens by project ID
   */
  async getTokensByProject(projectId: string): Promise<ServiceResult<DomainTokenBase[]>> {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Map to domain models
      const tokens = data.map(token => this.tokenMapper.toDomain(token));

      return {
        success: true,
        data: tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Search tokens
   */
  async searchTokens(searchTerm: string, filters: FilterOptions = {}): Promise<ServiceResult<DomainTokenBase[]>> {
    try {
      const result = await this.listTokens(
        { ...filters, search: searchTerm },
        { limit: 100 }
      );
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }
      
      return {
        success: true,
        data: result.data?.tokens || [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStatistics(projectId?: string): Promise<ServiceResult<{
    total: number;
    byStandard: Record<string, number>;
    byStatus: Record<string, number>;
    recentlyCreated: number;
  }>> {
    try {
      let query = supabase.from('tokens').select('standard, status, created_at');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const total = data.length;
      const byStandard: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      
      // Count tokens created in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let recentlyCreated = 0;

      for (const token of data) {
        // Count by standard
        byStandard[token.standard] = (byStandard[token.standard] || 0) + 1;
        
        // Count by status
        byStatus[token.status] = (byStatus[token.status] || 0) + 1;
        
        // Count recently created
        if (new Date(token.created_at) > sevenDaysAgo) {
          recentlyCreated++;
        }
      }

      return {
        success: true,
        data: {
          total,
          byStandard,
          byStatus,
          recentlyCreated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate token data without saving
   */
  async validateTokenData(tokenData: any): Promise<ValidationResult> {
    try {
      return this.tokenMapper.validate(tokenData);
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Abstract methods to be implemented by specific token services
   */
  abstract createTokenWithProperties(tokenData: any, propertiesData: any): Promise<ServiceResult<any>>;
  abstract getTokenWithProperties(id: string): Promise<ServiceResult<any>>;
  abstract updateTokenWithProperties(id: string, tokenData: any, propertiesData: any): Promise<ServiceResult<any>>;
  abstract deleteTokenWithProperties(id: string): Promise<ServiceResult<boolean>>;
}

/**
 * Error handling utilities
 */
export class ServiceErrorHandler {
  static handleDatabaseError(error: any): string {
    if (error.code === 'PGRST116') {
      return 'Record not found';
    }
    if (error.code === '23505') {
      return 'Record already exists';
    }
    if (error.code === '23503') {
      return 'Referenced record does not exist';
    }
    if (error.code === '23514') {
      return 'Data validation failed';
    }
    
    return `Database error: ${error.message}`;
  }

  static handleValidationErrors(errors: string[]): string {
    if (errors.length === 1) {
      return errors[0];
    }
    return `Multiple validation errors: ${errors.join(', ')}`;
  }
}

/**
 * Service utilities
 */
export class ServiceUtils {
  static generateServiceId(): string {
    return crypto.randomUUID();
  }

  static createTimestamp(): string {
    return new Date().toISOString();
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim();
    }
    if (Array.isArray(input)) {
      return input.map(item => ServiceUtils.sanitizeInput(item));
    }
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = ServiceUtils.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }
}
