/**
 * Enhanced ERC4626 Service
 * Tokenized vault implementation with strategy management and yield optimization
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC4626PropertyMapper, TokenERC4626Properties, ERC4626FormData } from '../utils/mappers/erc4626/erc4626PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC4626TokenWithProperties extends DomainTokenBase {
  tokenId: string;
  properties?: TokenERC4626Properties;
}

export interface ERC4626CreationResult {
  token: ERC4626TokenWithProperties;
  properties: TokenERC4626Properties;
  standardInsertionResults?: Record<string, any>;
}

export interface ERC4626Statistics {
  total: number;
  totalValueLocked: string;
  averageAPY: string;
  withLeverage: number;
  withInsurance: number;
  withGovernance: number;
  byRiskRating: Record<string, number>;
  byAuditStatus: Record<string, number>;
  configModeDistribution: Record<string, number>;
}

export interface VaultPerformance {
  vaultId: string;
  totalAssets: string;
  totalShares: string;
  sharePrice: string;
  apy7d: string;
  apy30d: string;
  apy1y: string;
  totalReturn: string;
  maxDrawdown: string;
  sharpeRatio: string;
  volatility: string;
  lastUpdated: string;
}

/**
 * Enhanced ERC4626 Service with tokenized vault features
 */
export class EnhancedERC4626Service extends BaseTokenService {
  private propertyMapper = new ERC4626PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC4626 tokenized vault with properties
   */
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC4626FormData,
    userId?: string
  ): Promise<ServiceResult<ERC4626CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-4626',
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
        // Create a complete properties object with the required id for the database
        const propertiesWithId = {
          ...propertiesData,
          // Add id explicitly as it's required by the database schema but not part of the form data interface
        };
        const propertiesDbData = this.propertyMapper.fromForm(propertiesWithId, token.id);

        const { data: insertedPropertiesData, error: propertiesError } = await supabase
          .from('token_erc4626_properties')
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
            standard: 'ERC-4626',
            configMode: context.configMode,
            hasProperties: true,
            assetAddress: properties.assetAddress,
            strategyCount: properties.vaultStrategies?.length || 0,
            insuranceCoverage: properties.insuranceCoverage,
            autoRebalancing: properties.autoRebalancing,
          }
        );

        return {
          success: true,
          data: {
            token: { ...token, tokenId: token.id },
            properties,
            standardInsertionResults: {
              token_erc4626_properties: [properties],
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
   * Get ERC4626 token with properties
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC4626TokenWithProperties>> {
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

      // Verify it's an ERC4626 token
      if (token.standard !== 'ERC-4626') {
        return {
          success: false,
          error: 'Token is not an ERC-4626 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc4626_properties')
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
   * Update ERC4626 token with properties
   */
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC4626FormData>,
    userId?: string
  ): Promise<ServiceResult<ERC4626TokenWithProperties>> {
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
        standard: 'ERC-4626',
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
          // Convert the result to the correct type
          return {
            ...tokenUpdateResult,
            data: tokenUpdateResult.data as unknown as ERC4626TokenWithProperties
          };
        }
        // Cast to the required type with tokenId
        updatedToken = { ...tokenUpdateResult.data, tokenId: id } as ERC4626TokenWithProperties;
      }

      // Update properties if data provided
      let updatedProperties = existingProperties;
      if (Object.keys(propertiesData).length > 0 && existingProperties) {
        const propertiesDbData = this.propertyMapper.toDatabase({
          ...existingProperties,
          ...propertiesData,
          tokenId: id, // Ensure tokenId is set
          updatedAt: new Date().toISOString(),
        });

        const { data: newPropertiesData, error: propertiesError } = await supabase
          .from('token_erc4626_properties')
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
          strategyChanges: this.detectStrategyChanges(existingProperties, updatedProperties),
          feeChanges: this.detectFeeChanges(existingProperties, updatedProperties),
          riskChanges: this.detectRiskChanges(existingProperties, updatedProperties),
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
   * Delete ERC4626 token with properties
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
          .from('token_erc4626_properties')
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
          assetAddress: existingData?.properties?.assetAddress,
          strategyCount: existingData?.properties?.vaultStrategies?.length || 0,
          totalValueLocked: this.calculateTotalAssets(existingData?.properties),
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
   * List ERC4626 tokens with properties
   */
  async listERC4626TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC4626TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC4626 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-4626' },
        pagination
      );

      if (!tokensResult.success || !tokensResult.data) {
        // Cast the result to the correct return type
        return {
          ...tokensResult,
          data: tokensResult.data ? {
            ...tokensResult.data,
            tokens: tokensResult.data.tokens.map(token => ({ ...token, tokenId: token.id })) as ERC4626TokenWithProperties[]
          } : undefined
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
        .from('token_erc4626_properties')
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

      const tokensWithProperties: ERC4626TokenWithProperties[] = tokens.map(token => ({
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
   * Validate ERC4626 configuration
   */
  async validateERC4626Configuration(
    tokenData: any,
    propertiesData: ERC4626FormData,
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-4626',
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
   * Get ERC4626 token statistics
   */
  async getERC4626Statistics(projectId?: string): Promise<ServiceResult<ERC4626Statistics>> {
    try {
      // Create query without chaining to avoid TypeScript deep instantiation issues
      const baseQuery = supabase.from('token_erc4626_view').select('*');

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
      let totalValueLocked = 0;
      let totalAPY = 0;
      let withLeverage = 0;
      let withInsurance = 0;
      let withGovernance = 0;
      const byRiskRating: Record<string, number> = {};
      const byAuditStatus: Record<string, number> = {};
      const configModeDistribution: Record<string, number> = {};

      for (const token of data) {
        // Map database properties first
        // Make sure the token has the required properties for the mapper
        const tokenWithRequiredProps = { ...token };
        
        // Ensure token has an id property for the mapper
        if (!('id' in tokenWithRequiredProps)) {
          (tokenWithRequiredProps as any).id = token.token_id || '';
        }
        
        const properties = this.propertyMapper.toDomain(tokenWithRequiredProps as any);
        
        // Config mode distribution - use a default since config_mode doesn't exist in db
        const configMode = 'min'; // Default since config_mode column doesn't exist
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;

        // Risk rating distribution - use riskAssessment.riskLevel as fallback
        const riskLevel = properties.riskAssessment?.riskLevel || 'medium';
        byRiskRating[riskLevel] = (byRiskRating[riskLevel] || 0) + 1;

        // Audit status distribution - default since audit_status doesn't exist in db
        const auditStatus = 'unaudited'; // Default since audit_status column doesn't exist
        byAuditStatus[auditStatus] = (byAuditStatus[auditStatus] || 0) + 1;

        // Feature counts - use correct field names from domain properties
        if (properties.riskAssessment?.leverageEnabled) withLeverage++;
        if (properties.insuranceCoverage) withInsurance++;
        if (properties.vaultGovernance?.tokenEnabled) withGovernance++;

        // TVL calculation (simplified) - initial_assets doesn't exist in db
        // Using a placeholder since initial_assets column doesn't exist
        // This would need to be calculated from actual vault data
        totalValueLocked += 0; // Placeholder

        // APY calculation from riskAssessment since performanceMetrics doesn't exist
        if (properties.riskAssessment && typeof properties.riskAssessment === 'object') {
          const apyData = properties.riskAssessment['apy'] as any;
          if (apyData && typeof apyData === 'string') {
            totalAPY += parseFloat(apyData);
          }
        }
      }

      const averageAPY = total > 0 ? (totalAPY / total).toFixed(2) : '0';

      return {
        success: true,
        data: {
          total,
          totalValueLocked: totalValueLocked.toString(),
          averageAPY,
          withLeverage,
          withInsurance,
          withGovernance,
          byRiskRating,
          byAuditStatus,
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
   * Clone ERC4626 token configuration
   */
  async cloneERC4626Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    userId?: string
  ): Promise<ServiceResult<ERC4626CreationResult>> {
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

      // Prepare new properties data - reset sensitive operational data
      const clonedPropertiesData = this.propertyMapper.toForm({
        ...sourceProperties,
        id: undefined,
        tokenId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        // Reset operational data that shouldn't be cloned
        initialAssets: undefined,
        riskAssessment: {}, // Reset performance data
      });

      // Create new token
      const createResult = await this.createTokenWithProperties(
        clonedTokenData,
        clonedPropertiesData,
        userId
      );

      if (createResult.success) {
        // Create audit trail for cloning
        await (AuditService.createAuditEntry as any)(
          'erc4626_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              sourceTokenId,
              targetTokenId: createResult.data!.token.id,
              clonedProperties: Object.keys(clonedPropertiesData),
              assetAddress: createResult.data!.properties.assetAddress,
              strategyCount: createResult.data!.properties.vaultStrategies?.length || 0,
              riskLevel: createResult.data!.properties.riskAssessment?.riskLevel || 'medium',
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
   * Batch operations for ERC4626 tokens
   */
  async batchCreateERC4626Tokens(
    tokensData: Array<{ token: any; properties: ERC4626FormData }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC4626CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC4626CreationResult[] = [];
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
   * ERC4626-specific vault management operations
   */

  /**
   * Get vault performance metrics
   */
  async getVaultPerformance(tokenId: string): Promise<ServiceResult<VaultPerformance>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or missing properties',
        };
      }

      const properties = tokenResult.data.properties;
      
      // Calculate performance metrics (simplified - in practice would use actual vault data)
      const totalAssets = properties.initialAssets || '0';
      const totalShares = '1000000'; // Would get from contract
      const sharePrice = (parseFloat(totalAssets) / parseFloat(totalShares)).toString();

      // Get performance metrics from riskAssessment since performanceMetrics doesn't exist
      let apy7d = '0';
      let apy30d = '0'; 
      let apy1y = '0';
      
      if (properties.riskAssessment && typeof properties.riskAssessment === 'object') {
        const perfData = properties.riskAssessment as any;
        apy7d = perfData.apy7d || '0';
        apy30d = perfData.apy30d || '0';
        apy1y = perfData.apy1y || '0';
      }

      const totalReturn = properties.riskAssessment?.totalReturn || '0';
      const maxDrawdown = properties.riskAssessment?.maxDrawdown || '0';
      const sharpeRatio = properties.riskAssessment?.sharpeRatio || '0';
      const volatility = properties.riskAssessment?.volatility || '0';

      return {
        success: true,
        data: {
          vaultId: tokenId,
          totalAssets,
          totalShares,
          sharePrice,
          apy7d,
          apy30d,
          apy1y,
          totalReturn: totalReturn as string,
          maxDrawdown: maxDrawdown as string,
          sharpeRatio: sharpeRatio as string,
          volatility: volatility as string,
          lastUpdated: new Date().toISOString(),
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Performance calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Manage vault strategies
   */
  async manageVaultStrategies(
    tokenId: string,
    strategies: Array<{
      name: string;
      strategyType: string;
      allocationPercentage: string;
      riskLevel: string;
      targetAssets: string[];
      isActive: boolean;
    }>,
    userId?: string
  ): Promise<ServiceResult<ERC4626TokenWithProperties>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or missing properties',
        };
      }

      const properties = tokenResult.data.properties;
      
      // Create new strategies matching the VaultStrategy interface
      const newStrategies = strategies.map(strategy => ({
      strategyType: strategy.strategyType as 'conservative' | 'moderate' | 'aggressive' | 'custom',
      allocation: {
      [strategy.strategyType]: strategy.allocationPercentage
      },
      isActive: strategy.isActive,
      rebalanceFrequency: 30, // Default rebalance frequency in days
      riskLevel: strategy.riskLevel === 'low' ? 1 : strategy.riskLevel === 'medium' ? 2 : 3,
      }));

      // Update properties with new strategies
      const updatedStrategies = [...(properties.vaultStrategies || []), ...newStrategies];

      const updateResult = await this.updateTokenWithProperties(
        tokenId,
        {},
        { vaultStrategies: updatedStrategies },
        userId
      );

      if (!updateResult.success || !updateResult.data?.properties) {
        return updateResult;
      }

      // Create audit trail for strategy changes
      await AuditService.createAuditEntry(
        'erc4626_strategies',
        tokenId,
        'UPDATE',
        {
          strategyChanges: {
            old: {
              total: properties.vaultStrategies?.length || 0,
              activeStrategies: properties.vaultStrategies?.filter(s => s.isActive).length || 0
            },
            new: {
              addedCount: newStrategies.length,
              total: updatedStrategies.length,
              totalAllocation: updatedStrategies.reduce(
                (sum, s) => {
                  const allocationValues = Object.values(s.allocation || {});
                  return sum + allocationValues.reduce((acc, val) => acc + parseFloat(val as string || '0'), 0);
                },
                0
              ),
              activeStrategies: updatedStrategies.filter(s => s.isActive).length,
            }
          },
        },
        { userId }
      );

      return {
        success: true,
        data: updateResult.data,
      };

    } catch (error) {
      return {
        success: false,
        error: `Strategy management error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update vault risk parameters
   */
  async updateRiskParameters(
    tokenId: string,
    riskParams: {
      maxLeverage?: string;
      liquidationThreshold?: string;
      liquidationPenalty?: string;
      riskRating?: string;
      tvlCap?: string;
      individualCap?: string;
    },
    userId?: string
  ): Promise<ServiceResult<ERC4626TokenWithProperties>> {
    try {
      // Map risk parameters to proper ERC4626FormData format
      const updateData: Partial<ERC4626FormData> = {
        riskAssessment: {
          maxLeverage: riskParams.maxLeverage,
          liquidationThreshold: riskParams.liquidationThreshold,
          liquidationPenalty: riskParams.liquidationPenalty,
          riskLevel: riskParams.riskRating,
          tvlCap: riskParams.tvlCap,
          individualCap: riskParams.individualCap,
        }
      };

      const updateResult = await this.updateTokenWithProperties(
        tokenId,
        {},
        updateData,
        userId
      );

      if (!updateResult.success || !updateResult.data?.properties) {
        return updateResult;
      }

      // Create specific risk parameter audit entry
      await (AuditService.createAuditEntry as any)(
        'erc4626_risk',
        tokenId,
        'UPDATE',
        {
          riskUpdate: {
            changes: riskParams,
            riskLevel: riskParams.riskRating || 'unchanged',
            leverageEnabled: !!riskParams.maxLeverage && parseFloat(riskParams.maxLeverage) > 1,
            timestamp: new Date().toISOString(),
          },
        },
        { userId }
      );

      return {
        success: true,
        data: updateResult.data,
      };

    } catch (error) {
      return {
        success: false,
        error: `Risk parameter update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Private helper methods
   */

  private detectStrategyChanges(oldProps?: TokenERC4626Properties, newProps?: TokenERC4626Properties): any {
    const oldStrategies = oldProps?.vaultStrategies || [];
    const newStrategies = newProps?.vaultStrategies || [];
    
    return {
      added: newStrategies.length - oldStrategies.length,
      modified: newStrategies.filter((strategy, index) => 
        oldStrategies[index] && oldStrategies[index].strategyType !== strategy.strategyType
      ).length,
      totalAllocation: newStrategies.reduce(
        (sum, s) => {
          // Use allocation record values since allocationPercentage doesn't exist
          const allocationValues = Object.values(s.allocation || {});
          const total = allocationValues.reduce((acc, val) => acc + parseFloat(val as string || '0'), 0);
          return sum + total;
        },
        0
      ),
    };
  }

  private detectFeeChanges(oldProps?: TokenERC4626Properties, newProps?: TokenERC4626Properties): any {
    return {
      managementFee: {
        old: oldProps?.feeStructure?.managementFee || '0',
        new: newProps?.feeStructure?.managementFee || '0',
      },
      performanceFee: {
        old: oldProps?.feeStructure?.performanceFee || '0',
        new: newProps?.feeStructure?.performanceFee || '0',
      },
      withdrawalFee: {
        old: oldProps?.feeStructure?.withdrawalFee || '0',
        new: newProps?.feeStructure?.withdrawalFee || '0',
      },
    };
  }

  private detectRiskChanges(oldProps?: TokenERC4626Properties, newProps?: TokenERC4626Properties): any {
    return {
      riskLevel: {
        old: oldProps?.riskAssessment?.riskLevel || 'medium',
        new: newProps?.riskAssessment?.riskLevel || 'medium',
      },
      leverageEnabled: {
        old: oldProps?.riskAssessment?.leverageEnabled || false,
        new: newProps?.riskAssessment?.leverageEnabled || false,
      },
      maxLeverage: {
        old: oldProps?.riskAssessment?.maxLeverage || '1',
        new: newProps?.riskAssessment?.maxLeverage || '1',
      },
    };
  }

  private calculateTotalAssets(properties?: TokenERC4626Properties): string {
    if (!properties?.initialAssets) return '0';
    
    // In practice, this would calculate based on current vault state
    return properties.initialAssets;
  }
}

/**
 * Export default instance
 */
export const erc4626Service = new EnhancedERC4626Service();
