/**
 * Enhanced ERC20 Service
 * Complete reference implementation using the new architecture
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC20PropertyMapper, TokenERC20Properties, ERC20FormData } from '../utils/mappers/erc20/erc20PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC20TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC20Properties;
}

export interface ERC20CreationResult {
  token: DomainTokenBase;
  properties: TokenERC20Properties;
  standardInsertionResults?: Record<string, any>;
}

/**
 * Enhanced ERC20 Service with full CRUD + relationships
 */
export class EnhancedERC20Service extends BaseTokenService {
  private propertyMapper = new ERC20PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC20 token with properties
   */
  // Removed decorator in favor of explicit audit call
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC20FormData,
    userId?: string
  ): Promise<ServiceResult<ERC20CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-20',
        configMode: tokenData.configMode || 'min',
        operation: 'create',
      };

      // Comprehensive validation
      const mergedData = { ...tokenData, ...propertiesData };
      const validation = ValidationService.validateComprehensive(mergedData, context);
      
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Create main token record
      const tokenResult = await this.createToken(tokenData);
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: tokenResult.error,
          errors: tokenResult.errors,
        };
      }

      const token = tokenResult.data;

      try {
        // Create properties record
        const propertiesDbData = this.propertyMapper.fromForm({
          ...propertiesData,
          tokenId: token.id,
        });

        const { data: insertedPropertiesData, error: propertiesError } = await supabase
          .from('token_erc20_properties')
          .insert(propertiesDbData)
          .select()
          .single();

        if (propertiesError) {
          // Rollback token creation
          await this.deleteToken(token.id);
          return {
            success: false,
            error: `Failed to create properties: ${propertiesError.message}`,
          };
        }

        const properties = this.propertyMapper.toDomain(insertedPropertiesData);

        // Create audit trail
        await AuditService.auditTokenOperation(
          'CREATE',
          token.id,
          null,
          { token, properties },
          userId,
          {
            standard: 'ERC-20',
            configMode: context.configMode,
            hasProperties: true,
          }
        );

        return {
          success: true,
          data: {
            token,
            properties,
            standardInsertionResults: {
              token_erc20_properties: [properties],
            },
          },
          warnings: validation.warnings,
        };

      } catch (propertiesError) {
        // Rollback token creation
        await this.deleteToken(token.id);
        throw propertiesError;
      }

    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get ERC20 token with properties
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC20TokenWithProperties>> {
    try {
      // Get main token
      const tokenResult = await this.getTokenById(id);
      if (!tokenResult.success || !tokenResult.data) {
        return tokenResult;
      }

      const token = tokenResult.data;

      // Verify it's an ERC20 token
      if (token.standard !== 'ERC-20') {
        return {
          success: false,
          error: 'Token is not an ERC-20 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc20_properties')
        .select('*')
        .eq('token_id', id)
        .single();

      if (propertiesError) {
        if (propertiesError.code === 'PGRST116') {
          // No properties found, return token without properties
          return {
            success: true,
            data: { ...token, properties: undefined },
          };
        }
        return {
          success: false,
          error: `Failed to get properties: ${propertiesError.message}`,
        };
      }

      const properties = this.propertyMapper.toDomain(propertiesData);

      return {
        success: true,
        data: {
          ...token,
          properties,
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
   * Update ERC20 token with properties
   */
  // Removed decorator in favor of explicit audit call
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC20FormData>,
    userId?: string
  ): Promise<ServiceResult<ERC20TokenWithProperties>> {
    try {
      // Get existing data for validation and audit
      const existingResult = await this.getTokenWithProperties(id);
      if (!existingResult.success || !existingResult.data) {
        return existingResult;
      }

      const existingToken = existingResult.data;
      const existingProperties = existingToken.properties;

      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-20',
        configMode: existingToken.configMode as 'min' | 'max',
        operation: 'update',
        existingData: existingToken,
      };

      // Merge and validate data
      const mergedTokenData = { ...existingToken, ...tokenData };
      const mergedPropertiesData = { ...existingProperties, ...propertiesData };
      const mergedData = { ...mergedTokenData, ...mergedPropertiesData };

      const validation = ValidationService.validateComprehensive(
        mergedData,
        context,
        existingToken
      );

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Update token if data provided
      let updatedToken = existingToken;
      if (Object.keys(tokenData).length > 0) {
        const tokenUpdateResult = await this.updateToken(id, tokenData);
        if (!tokenUpdateResult.success || !tokenUpdateResult.data) {
          return tokenUpdateResult;
        }
        updatedToken = tokenUpdateResult.data;
      }

      // Update properties if data provided
      let updatedProperties = existingProperties;
      if (Object.keys(propertiesData).length > 0 && existingProperties) {
        const propertiesDbData = this.propertyMapper.toDatabase({
          ...existingProperties,
          ...propertiesData,
          updatedAt: new Date().toISOString(),
        });

        const { data: newPropertiesData, error: propertiesError } = await supabase
          .from('token_erc20_properties')
          .update(propertiesDbData)
          .eq('token_id', id)
          .select()
          .single();

        if (propertiesError) {
          return {
            success: false,
            error: `Failed to update properties: ${propertiesError.message}`,
          };
        }

        updatedProperties = this.propertyMapper.toDomain(newPropertiesData);
      }

      // Create audit trail
      await AuditService.auditTokenOperation(
        'UPDATE',
        id,
        { token: existingToken, properties: existingProperties },
        { token: updatedToken, properties: updatedProperties },
        userId,
        {
          updatedFields: {
            token: Object.keys(tokenData),
            properties: Object.keys(propertiesData),
          },
        }
      );

      return {
        success: true,
        data: {
          ...updatedToken,
          properties: updatedProperties,
        },
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
   * Delete ERC20 token with properties
   */
  // Removed decorator in favor of explicit audit call
  async deleteTokenWithProperties(id: string, userId?: string): Promise<ServiceResult<boolean>> {
    try {
      // Get existing data for audit
      const existingResult = await this.getTokenWithProperties(id);
      if (!existingResult.success) {
        return {
          success: false,
          error: existingResult.error || 'Token not found',
        };
      }

      const existingData = existingResult.data;

      // Delete properties first (cascade delete)
      if (existingData?.properties) {
        const { error: propertiesError } = await supabase
          .from('token_erc20_properties')
          .delete()
          .eq('token_id', id);

        if (propertiesError) {
          return {
            success: false,
            error: `Failed to delete properties: ${propertiesError.message}`,
          };
        }
      }

      // Delete main token
      const deleteResult = await this.deleteToken(id);
      if (!deleteResult.success) {
        return deleteResult;
      }

      // Create audit trail
      await AuditService.auditTokenOperation(
        'DELETE',
        id,
        existingData,
        null,
        userId,
        {
          deletedProperties: !!existingData?.properties,
        }
      );

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
   * List ERC20 tokens with properties
   */
  async listERC20TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC20TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC20 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-20' },
        pagination
      );

      if (!tokensResult.success || !tokensResult.data) {
        return tokensResult;
      }

      const { tokens, total, page, limit } = tokensResult.data;

      // Get properties for all tokens
      const tokenIds = tokens.map(token => token.id);
      
      if (tokenIds.length === 0) {
        return {
          success: true,
          data: { tokens: [], total, page, limit },
        };
      }

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc20_properties')
        .select('*')
        .in('token_id', tokenIds);

      if (propertiesError) {
        // Return tokens without properties on error
        console.warn('Failed to load properties:', propertiesError);
        return {
          success: true,
          data: {
            tokens: tokens.map(token => ({ ...token, properties: undefined })),
            total,
            page,
            limit,
          },
        };
      }

      // Map properties to tokens
      const propertiesMap = new Map();
      if (propertiesData) {
        for (const props of propertiesData) {
          propertiesMap.set(props.token_id, this.propertyMapper.toDomain(props));
        }
      }

      const tokensWithProperties = tokens.map(token => ({
        ...token,
        properties: propertiesMap.get(token.id),
      }));

      return {
        success: true,
        data: {
          tokens: tokensWithProperties,
          total,
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
   * Validate ERC20 configuration
   */
  async validateERC20Configuration(
    tokenData: any,
    propertiesData: ERC20FormData,
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-20',
        configMode,
        operation: 'create',
      };

      const mergedData = { ...tokenData, ...propertiesData };
      const validation = ValidationService.validateComprehensive(mergedData, context);

      return {
        success: true,
        data: {
          isValid: validation.valid,
          errors: validation.errors || [],
          warnings: validation.warnings || [],
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get ERC20 token statistics
   */
  async getERC20Statistics(projectId?: string): Promise<ServiceResult<{
    total: number;
    withGovernance: number;
    withFees: number;
    withVesting: number;
    withStaking: number;
    configModeDistribution: Record<string, number>;
    tokenTypes: Record<string, number>;
  }>> {
    try {
      let query = supabase
        .from('token_erc20_view')
        .select('*');

      if (projectId) {
        query = query.eq('token_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const total = data.length;
      let withGovernance = 0;
      let withFees = 0;
      let withVesting = 0;
      let withStaking = 0;
      const configModeDistribution: Record<string, number> = {};
      const tokenTypes: Record<string, number> = {};

      for (const token of data) {
        // Config mode distribution
        const configMode = (token as any).config_mode || 'min';
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;

        // Token types
        const tokenType = (token as any).token_type || 'standard';
        tokenTypes[tokenType] = (tokenTypes[tokenType] || 0) + 1;

        // Feature counts - using type assertions for properties that might not exist in interface
        if ((token as any).governance_enabled) withGovernance++;
        if ((token as any).buy_fee_enabled || (token as any).sell_fee_enabled) withFees++;
        if ((token as any).vesting_enabled) withVesting++;
        if ((token as any).staking_enabled) withStaking++;
      }

      return {
        success: true,
        data: {
          total,
          withGovernance,
          withFees,
          withVesting,
          withStaking,
          configModeDistribution,
          tokenTypes,
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
   * Clone ERC20 token configuration
   */
  async cloneERC20Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    userId?: string
  ): Promise<ServiceResult<ERC20CreationResult>> {
    try {
      // Get source token with properties
      const sourceResult = await this.getTokenWithProperties(sourceTokenId);
      if (!sourceResult.success || !sourceResult.data) {
        return {
          success: false,
          error: 'Source token not found',
        };
      }

      const sourceToken = sourceResult.data;
      const sourceProperties = sourceToken.properties;

      if (!sourceProperties) {
        return {
          success: false,
          error: 'Source token has no properties to clone',
        };
      }

      // Prepare new token data
      const clonedTokenData = {
        ...sourceToken,
        ...newTokenData,
        id: undefined, // Let the service generate new ID
        createdAt: undefined,
        updatedAt: undefined,
      };

      // Prepare new properties data
      const clonedPropertiesData = this.propertyMapper.toForm({
        ...sourceProperties,
        id: undefined,
        tokenId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      });

      // Create new token
      const createResult = await this.createTokenWithProperties(
        clonedTokenData,
        clonedPropertiesData,
        userId
      );

      if (createResult.success) {
        // Create audit trail for cloning
        await AuditService.createAuditEntry(
          'erc20_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              new: {
                sourceTokenId,
                targetTokenId: createResult.data!.token.id,
                clonedProperties: Object.keys(clonedPropertiesData),
              },
            },
          },
          { userId }
        );
      }

      return createResult;

    } catch (error) {
      return {
        success: false,
        error: `Clone error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Batch operations for ERC20 tokens
   */
  async batchCreateERC20Tokens(
    tokensData: Array<{ token: any; properties: ERC20FormData }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC20CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC20CreationResult[] = [];
    const failed: Array<{ index: number; error: string; data: any }> = [];

    for (let i = 0; i < tokensData.length; i++) {
      const { token, properties } = tokensData[i];
      
      try {
        const result = await this.createTokenWithProperties(token, properties, userId);
        
        if (result.success && result.data) {
          successful.push(result.data);
        } else {
          failed.push({
            index: i,
            error: result.error || result.errors?.join(', ') || 'Unknown error',
            data: { token, properties },
          });
        }
      } catch (error) {
        failed.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: { token, properties },
        });
      }
    }

    return {
      success: successful.length > 0,
      data: {
        successful,
        failed,
        summary: {
          total: tokensData.length,
          success: successful.length,
          failed: failed.length,
        },
      },
    };
  }
}

/**
 * Export default instance
 */
export const erc20Service = new EnhancedERC20Service();

/**
 * Export individual functions for compatibility with existing hooks
 */
export const getERC20Properties = (tokenId: string, options?: any) => 
  erc20Service.getTokenWithProperties(tokenId);

export const updateERC20Properties = (tokenId: string, updates: any) => 
  erc20Service.updateTokenWithProperties(tokenId, {}, updates);

export const createERC20Token = (tokenData: any, propertiesData: ERC20FormData, userId?: string) => 
  erc20Service.createTokenWithProperties(tokenData, propertiesData, userId);
