/**
 * Enhanced ERC3525 Service
 * Semi-fungible token implementation with slot management and value operations
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC3525PropertyMapper, TokenERC3525Properties, ERC3525FormData } from '../utils/mappers/erc3525/erc3525PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC3525TokenWithProperties extends DomainTokenBase {
  tokenId: string;
  properties?: TokenERC3525Properties;
}

export interface ERC3525CreationResult {
  token: ERC3525TokenWithProperties;
  properties: TokenERC3525Properties;
  standardInsertionResults?: Record<string, any>;
}

export interface ERC3525Statistics {
  total: number;
  totalSlots: number;
  totalValueAllocated: string;
  byInstrumentType: Record<string, number>;
  withRoyalties: number;
  withGovernance: number;
  withStaking: number;
  crossChainEnabled: number;
  configModeDistribution: Record<string, number>;
}

export interface SlotStatistics {
  slotId: string;
  name: string;
  totalValue: string;
  holderCount: number;
  transactionCount: number;
  averageValue: string;
  lastActivity: string;
}

/**
 * Enhanced ERC3525 Service with semi-fungible token features
 */
export class EnhancedERC3525Service extends BaseTokenService {
  private propertyMapper = new ERC3525PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC3525 semi-fungible token with properties
   */
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC3525FormData,
    userId?: string
  ): Promise<ServiceResult<ERC3525CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-3525',
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
          .from('token_erc3525_properties')
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

        // Create audit trail with simplified type handling
        await (AuditService.auditTokenOperation as any)(
          'CREATE',
          token.id,
          null,
          { token, properties },
          userId,
          {
            standard: 'ERC-3525',
            configMode: context.configMode,
            hasProperties: true,
            slotCount: properties.slotConfigurations?.length || 0,
            instrumentCount: properties.financialInstruments?.length || 0,
          }
        );

        return {
          success: true,
          data: {
            token: { ...token, tokenId: token.id },
            properties,
            standardInsertionResults: {
              token_erc3525_properties: [properties],
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
   * Get ERC3525 token with properties
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC3525TokenWithProperties>> {
    try {
      // Get main token
      const tokenResult = await this.getTokenById(id);
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: tokenResult.error || 'Token not found',
          errors: tokenResult.errors,
        };
      }

      const token = tokenResult.data;

      // Verify it's an ERC3525 token
      if (token.standard !== 'ERC-3525') {
        return {
          success: false,
          error: 'Token is not an ERC-3525 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc3525_properties')
        .select('*')
        .eq('token_id', id)
        .single();

      if (propertiesError) {
        if (propertiesError.code === 'PGRST116') {
          // No properties found, return token without properties
          return {
            success: true,
            data: { ...token, tokenId: token.id, properties: undefined },
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
          tokenId: token.id,
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
   * Update ERC3525 token with properties
   */
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC3525FormData>,
    userId?: string
  ): Promise<ServiceResult<ERC3525TokenWithProperties>> {
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
        standard: 'ERC-3525',
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
          return {
            success: false,
            error: tokenUpdateResult.error || 'Failed to update token',
            errors: tokenUpdateResult.errors,
          };
        }
        updatedToken = { ...tokenUpdateResult.data, tokenId: id, properties: existingProperties };
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
          .from('token_erc3525_properties')
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
      await (AuditService.auditTokenOperation as any)(
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
          slotChanges: this.detectSlotChanges(existingProperties, updatedProperties),
          valueChanges: this.detectValueChanges(existingProperties, updatedProperties),
        }
      );

      return {
        success: true,
        data: {
          ...updatedToken,
          tokenId: updatedToken.id,
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
   * Delete ERC3525 token with properties
   */
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
          .from('token_erc3525_properties')
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
      await (AuditService.auditTokenOperation as any)(
        'DELETE',
        id,
        existingData,
        null,
        userId,
        {
          deletedProperties: !!existingData?.properties,
          slotCount: existingData?.properties?.slotConfigurations?.length || 0,
          totalValueAllocated: this.calculateTotalAllocatedValue(existingData?.properties),
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
   * List ERC3525 tokens with properties
   */
  async listERC3525TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC3525TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC3525 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-3525' },
        pagination
      );

      if (!tokensResult.success || !tokensResult.data) {
        return {
          success: false,
          error: tokensResult.error || 'Failed to get tokens',
          errors: tokensResult.errors,
        };
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
        .from('token_erc3525_properties')
        .select('*')
        .in('token_id', tokenIds);

      if (propertiesError) {
        // Return tokens without properties on error
        console.warn('Failed to load properties:', propertiesError);
        return {
          success: true,
          data: {
            tokens: tokens.map(token => ({ ...token, tokenId: token.id, properties: undefined })),
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

      const tokensWithProperties: ERC3525TokenWithProperties[] = tokens.map(token => ({
        ...token,
        tokenId: token.id,
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
   * Validate ERC3525 configuration
   */
  async validateERC3525Configuration(
    tokenData: any,
    propertiesData: ERC3525FormData,
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-3525',
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
   * Get ERC3525 token statistics
   */
  async getERC3525Statistics(projectId?: string): Promise<ServiceResult<ERC3525Statistics>> {
    try {
      // Create query without chaining to avoid TypeScript deep instantiation issues
      const baseQuery = supabase.from('token_erc3525_view').select('*');

      // Use any type to bypass TypeScript's deep type checking
      const finalQuery = projectId ? 
        (baseQuery as any).eq('project_id', projectId) : 
        baseQuery;

      const { data, error } = await finalQuery;

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const total = data.length;
      let totalSlots = 0;
      let totalValueAllocated = 0;
      let withRoyalties = 0;
      let withGovernance = 0;
      let withStaking = 0;
      let crossChainEnabled = 0;
      const byInstrumentType: Record<string, number> = {};
      const configModeDistribution: Record<string, number> = {};

      for (const token of data) {
        // Config mode distribution
        const configMode = (token as any).config_mode || 'min';
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;

        // Feature counts - using type assertions for properties that might not exist in interface
        if ((token as any).royalty_enabled) withRoyalties++;
        if ((token as any).governance_enabled) withGovernance++;
        if ((token as any).staking_enabled) withStaking++;
        if ((token as any).cross_chain_enabled) crossChainEnabled++;

        // Slot and value calculations
        if ((token as any).slot_configurations) {
          try {
            const slots = JSON.parse((token as any).slot_configurations);
            if (Array.isArray(slots)) {
              totalSlots += slots.length;
            }
          } catch {}
        }

        if ((token as any).value_allocations) {
          try {
            const allocations = JSON.parse((token as any).value_allocations);
            if (Array.isArray(allocations)) {
              for (const allocation of allocations) {
                totalValueAllocated += parseFloat(allocation.allocatedValue || 0);
              }
            }
          } catch {}
        }

        // Instrument type distribution
        if ((token as any).financial_instruments) {
          try {
            const instruments = JSON.parse((token as any).financial_instruments);
            if (Array.isArray(instruments)) {
              for (const instrument of instruments) {
                const type = instrument.instrumentType || 'other';
                byInstrumentType[type] = (byInstrumentType[type] || 0) + 1;
              }
            }
          } catch {}
        }
      }

      return {
        success: true,
        data: {
          total,
          totalSlots,
          totalValueAllocated: totalValueAllocated.toString(),
          byInstrumentType,
          withRoyalties,
          withGovernance,
          withStaking,
          crossChainEnabled,
          configModeDistribution,
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
   * Clone ERC3525 token configuration
   */
  async cloneERC3525Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    userId?: string
  ): Promise<ServiceResult<ERC3525CreationResult>> {
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

      // Prepare new properties data - reset sensitive data
      const clonedPropertiesData = this.propertyMapper.toForm({
        ...sourceProperties,
        id: undefined,
        tokenId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        // Reset value allocations as they are specific to original token
        valueAllocations: [],
        paymentSchedules: [],
        valueAdjustments: [],
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
          'erc3525_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              new: {
                sourceTokenId,
                targetTokenId: createResult.data!.token.id,
                clonedProperties: Object.keys(clonedPropertiesData),
                slotCount: createResult.data!.properties.slotConfigurations?.length || 0,
                instrumentCount: createResult.data!.properties.financialInstruments?.length || 0,
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
   * Batch operations for ERC3525 tokens
   */
  async batchCreateERC3525Tokens(
    tokensData: Array<{ token: any; properties: ERC3525FormData }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC3525CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC3525CreationResult[] = [];
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

  /**
   * ERC3525-specific slot management operations
   */

  /**
   * Get slot statistics for a token
   */
  async getSlotStatistics(tokenId: string): Promise<ServiceResult<SlotStatistics[]>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or missing properties',
        };
      }

      const properties = tokenResult.data.properties;
      const slotStats: SlotStatistics[] = [];

      // Calculate statistics for each slot
      for (const slot of properties.slotConfigurations || []) {
        const allocations = properties.valueAllocations?.filter(
          allocation => allocation.slotId === slot.slotId
        ) || [];

        const totalValue = allocations.reduce(
          (sum, allocation) => sum + parseFloat(allocation.allocatedValue || '0'),
          0
        );

        const holderCount = new Set(allocations.map(a => a.holderAddress)).size;

        slotStats.push({
          slotId: slot.slotId,
          name: slot.name,
          totalValue: totalValue.toString(),
          holderCount,
          transactionCount: allocations.length,
          averageValue: holderCount > 0 ? (totalValue / holderCount).toString() : '0',
          lastActivity: new Date().toISOString(), // TODO: Get from actual transaction data
        });
      }

      return {
        success: true,
        data: slotStats,
      };

    } catch (error) {
      return {
        success: false,
        error: `Slot statistics error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Manage value allocations for slots
   */
  async manageValueAllocations(
    tokenId: string,
    allocations: Array<{
      slotId: string;
      holderAddress: string;
      allocatedValue: string;
      restrictions?: string[];
    }>,
    userId?: string
  ): Promise<ServiceResult<TokenERC3525Properties>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or missing properties',
        };
      }

      const properties = tokenResult.data.properties;
      
      // Create new allocations with IDs
      const newAllocations = allocations.map(allocation => ({
        allocationId: crypto.randomUUID(),
        slotId: allocation.slotId,
        holderAddress: allocation.holderAddress,
        allocatedValue: allocation.allocatedValue,
        restrictions: allocation.restrictions || [],
        metadata: {},
      }));

      // Update properties with new allocations
      const updatedAllocations = [...(properties.valueAllocations || []), ...newAllocations];

      const updateResult = await this.updateTokenWithProperties(
        tokenId,
        {},
        { valueAllocations: updatedAllocations },
        userId
      );

      if (!updateResult.success || !updateResult.data?.properties) {
        return updateResult;
      }

      // Create audit trail for allocation changes
      await AuditService.createAuditEntry(
        'erc3525_allocations',
        tokenId,
        'UPDATE',
        {
          allocationChanges: {
            old: {
              total: properties.valueAllocations?.length || 0,
              totalValue: this.calculateTotalAllocatedValue(properties)
            },
            new: {
              added: newAllocations.length,
              total: updatedAllocations.length,
              totalValue: this.calculateTotalAllocatedValue(updateResult.data.properties),
              affectedSlots: [...new Set(newAllocations.map(a => a.slotId))],
            }
          },
        },
        { userId }
      );

      if (!updateResult.success || !updateResult.data?.properties) {
        return {
          success: false,
          error: updateResult.error || 'Failed to manage value allocations',
        };
      }

      return {
        success: true,
        data: updateResult.data.properties,
      };

    } catch (error) {
      return {
        success: false,
        error: `Allocation management error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Private helper methods
   */

  private detectSlotChanges(oldProps?: TokenERC3525Properties, newProps?: TokenERC3525Properties): { old?: any; new?: any; } {
    const oldSlots = oldProps?.slotConfigurations || [];
    const newSlots = newProps?.slotConfigurations || [];
    
    return {
      old: { count: oldSlots.length },
      new: { 
        count: newSlots.length,
        changes: {
          modified: newSlots.filter(slot => 
            oldSlots.find(old => old.slotId === slot.slotId && old.name !== slot.name)
          ).length,
        }
      }
    };
  }

  private detectValueChanges(oldProps?: TokenERC3525Properties, newProps?: TokenERC3525Properties): { old?: any; new?: any; } {
    const oldTotal = this.calculateTotalAllocatedValue(oldProps);
    const newTotal = this.calculateTotalAllocatedValue(newProps);
    
    return {
      old: { totalValue: oldTotal },
      new: { 
        totalValue: newTotal,
        difference: (parseFloat(newTotal) - parseFloat(oldTotal)).toString(),
      }
    };
  }

  private calculateTotalAllocatedValue(properties?: TokenERC3525Properties): string {
    if (!properties?.valueAllocations) return '0';
    
    const total = properties.valueAllocations.reduce(
      (sum, allocation) => sum + parseFloat(allocation.allocatedValue || '0'),
      0
    );
    
    return total.toString();
  }
}

/**
 * Export default instance
 */
export const erc3525Service = new EnhancedERC3525Service();
