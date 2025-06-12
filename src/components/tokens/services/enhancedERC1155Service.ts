/**
 * Enhanced ERC1155 Service
 * Complete implementation for multi-token management using the new architecture
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC1155PropertyMapper, TokenERC1155Properties, ERC1155FormData } from '../utils/mappers/erc1155/erc1155PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC1155TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC1155Properties;
}

export interface ERC1155CreationResult {
  token: DomainTokenBase;
  properties: TokenERC1155Properties;
  standardInsertionResults?: Record<string, any>;
}

/**
 * Enhanced ERC1155 Service with full CRUD + relationships + multi-token features
 */
export class EnhancedERC1155Service extends BaseTokenService {
  private propertyMapper = new ERC1155PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC1155 token with properties
   */
  // Removed decorator in favor of explicit audit call
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC1155FormData,
    userId?: string
  ): Promise<ServiceResult<ERC1155CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-1155',
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
          .from('token_erc1155_properties')
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
            standard: 'ERC-1155',
            configMode: context.configMode,
            hasProperties: true,
            multiTokenFeatures: {
              batchMintingEnabled: properties.batchMintingEnabled,
              craftingEnabled: properties.craftingEnabled,
              gameFeatures: properties.experiencePointsEnabled || properties.levelingEnabled,
              marketplaceFeatures: properties.marketplaceFeesEnabled,
              governanceFeatures: properties.votingPowerEnabled,
              crossChainFeatures: properties.bridgeEnabled || properties.layer2SupportEnabled,
            },
          }
        );

        return {
          success: true,
          data: {
            token,
            properties,
            standardInsertionResults: {
              token_erc1155_properties: [properties],
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
   * Get ERC1155 token with properties
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC1155TokenWithProperties>> {
    try {
      // Get main token
      const tokenResult = await this.getTokenById(id);
      if (!tokenResult.success || !tokenResult.data) {
        return tokenResult;
      }

      const token = tokenResult.data;

      // Verify it's an ERC1155 token
      if (token.standard !== 'ERC-1155') {
        return {
          success: false,
          error: 'Token is not an ERC-1155 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc1155_properties')
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
   * Update ERC1155 token with properties
   */
  // Removed decorator in favor of explicit audit call
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC1155FormData>,
    userId?: string
  ): Promise<ServiceResult<ERC1155TokenWithProperties>> {
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
        standard: 'ERC-1155',
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
          .from('token_erc1155_properties')
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
          featureChanges: this.analyzeFeatureChanges(existingProperties, updatedProperties),
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
   * Delete ERC1155 token with properties
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
          .from('token_erc1155_properties')
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
          featuresSummary: existingData?.properties ? {
            batchMinting: existingData.properties.batchMintingEnabled,
            crafting: existingData.properties.craftingEnabled,
            marketplace: existingData.properties.marketplaceFeesEnabled,
            governance: existingData.properties.votingPowerEnabled,
            crossChain: existingData.properties.bridgeEnabled,
          } : {},
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
   * List ERC1155 tokens with properties
   */
  async listERC1155TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC1155TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC1155 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-1155' },
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
        .from('token_erc1155_properties')
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
   * Validate ERC1155 configuration
   */
  async validateERC1155Configuration(
    tokenData: any,
    propertiesData: ERC1155FormData,
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-1155',
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
   * Get ERC1155 token statistics
   */
  async getERC1155Statistics(projectId?: string): Promise<ServiceResult<{
    total: number;
    withBatchMinting: number;
    withCrafting: number;
    withGameFeatures: number;
    withMarketplace: number;
    withGovernance: number;
    withCrossChain: number;
    withRoyalties: number;
    consumableTokens: number;
    configModeDistribution: Record<string, number>;
    pricingModelDistribution: Record<string, number>;
    avgRecipesPerToken: number;
    topRecipeNames: Array<{ name: string; count: number }>;
  }>> {
    try {
      let query = supabase
        .from('token_erc1155_view')
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
      let withBatchMinting = 0;
      let withCrafting = 0;
      let withGameFeatures = 0;
      let withMarketplace = 0;
      let withGovernance = 0;
      let withCrossChain = 0;
      let withRoyalties = 0;
      let consumableTokens = 0;
      const configModeDistribution: Record<string, number> = {};
      const pricingModelDistribution: Record<string, number> = {};
      const recipeNames: string[] = [];

      for (const token of data) {
        // Config mode distribution
        const configMode = (token as any).config_mode || 'min';
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;

        // Pricing model distribution
        const pricingModel = (token as any).pricing_model || 'fixed';
        pricingModelDistribution[pricingModel] = (pricingModelDistribution[pricingModel] || 0) + 1;

        // Feature counts - using type assertions for properties that might not exist in interface
        if ((token as any).batch_minting_enabled) withBatchMinting++;
        if ((token as any).crafting_enabled) withCrafting++;
        if ((token as any).experience_points_enabled || (token as any).leveling_enabled) withGameFeatures++;
        if ((token as any).marketplace_fees_enabled) withMarketplace++;
        if ((token as any).voting_power_enabled) withGovernance++;
        if ((token as any).bridge_enabled || (token as any).layer2_support_enabled) withCrossChain++;
        if ((token as any).has_royalty) withRoyalties++;
        if ((token as any).consumable_tokens) consumableTokens++;

        // Collect recipe names
        if ((token as any).token_recipes) {
          try {
            const recipes = JSON.parse((token as any).token_recipes);
            if (Array.isArray(recipes)) {
              recipes.forEach(recipe => {
                if (recipe.name) {
                  recipeNames.push(recipe.name);
                }
              });
            }
          } catch {
            // Ignore invalid JSON
          }
        }
      }

      // Calculate recipe statistics
      const recipeNameCounts: Record<string, number> = {};
      for (const name of recipeNames) {
        recipeNameCounts[name] = (recipeNameCounts[name] || 0) + 1;
      }

      const topRecipeNames = Object.entries(recipeNameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      const avgRecipesPerToken = total > 0 ? recipeNames.length / total : 0;

      return {
        success: true,
        data: {
          total,
          withBatchMinting,
          withCrafting,
          withGameFeatures,
          withMarketplace,
          withGovernance,
          withCrossChain,
          withRoyalties,
          consumableTokens,
          configModeDistribution,
          pricingModelDistribution,
          avgRecipesPerToken: Math.round(avgRecipesPerToken * 100) / 100,
          topRecipeNames,
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
   * Clone ERC1155 token configuration
   */
  async cloneERC1155Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    userId?: string
  ): Promise<ServiceResult<ERC1155CreationResult>> {
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
          'erc1155_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              new: {
                sourceTokenId,
                targetTokenId: createResult.data!.token.id,
                clonedProperties: Object.keys(clonedPropertiesData),
                clonedFeatures: {
                  batchMinting: sourceProperties.batchMintingEnabled,
                  crafting: sourceProperties.craftingEnabled,
                  marketplace: sourceProperties.marketplaceFeesEnabled,
                  governance: sourceProperties.votingPowerEnabled,
                  crossChain: sourceProperties.bridgeEnabled,
                  recipes: sourceProperties.tokenRecipes?.length || 0,
                },
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
   * Batch operations for ERC1155 tokens
   */
  async batchCreateERC1155Tokens(
    tokensData: Array<{ token: any; properties: ERC1155FormData }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC1155CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC1155CreationResult[] = [];
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
   * Update token recipes for crafting system
   */
  async updateTokenRecipes(
    tokenId: string,
    recipes: Array<{
      name: string;
      requiredTokens: Array<{ tokenId: string; amount: string }>;
      outputToken: { tokenId: string; amount: string };
      enabled: boolean;
    }>,
    userId?: string
  ): Promise<ServiceResult<TokenERC1155Properties>> {
    try {
      const existingResult = await this.getTokenWithProperties(tokenId);
      if (!existingResult.success || !existingResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or has no properties',
        };
      }

      const tokenRecipes = recipes.map(recipe => ({
        id: crypto.randomUUID(),
        name: recipe.name,
        requiredTokens: recipe.requiredTokens,
        outputToken: recipe.outputToken,
        enabled: recipe.enabled,
      }));

      const updateResult = await this.updateTokenWithProperties(
        tokenId,
        {},
        { tokenRecipes },
        userId
      );

      if (updateResult.success && updateResult.data?.properties) {
        return {
          success: true,
          data: updateResult.data.properties,
        };
      }

      return {
        success: false,
        error: 'Failed to update recipes',
      };

    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Analyze feature changes between property updates
   */
  private analyzeFeatureChanges(
    oldProperties?: TokenERC1155Properties,
    newProperties?: TokenERC1155Properties
  ): Record<string, any> {
    if (!oldProperties || !newProperties) return {};

    const changes: Record<string, any> = {};

    // Analyze key feature changes
    const featureFields = [
      'batchMintingEnabled',
      'craftingEnabled',
      'experiencePointsEnabled',
      'levelingEnabled',
      'marketplaceFeesEnabled',
      'votingPowerEnabled',
      'bridgeEnabled',
      'layer2SupportEnabled',
      'consumableTokens',
      'containerEnabled',
    ];

    for (const field of featureFields) {
      const oldValue = oldProperties[field as keyof TokenERC1155Properties];
      const newValue = newProperties[field as keyof TokenERC1155Properties];
      if (oldValue !== newValue) {
        changes[field] = { from: oldValue, to: newValue };
      }
    }

    // Analyze recipe changes
    const oldRecipeCount = oldProperties.tokenRecipes?.length || 0;
    const newRecipeCount = newProperties.tokenRecipes?.length || 0;
    if (oldRecipeCount !== newRecipeCount) {
      changes.recipeCount = { from: oldRecipeCount, to: newRecipeCount };
    }

    return changes;
  }
}

/**
 * Export default instance
 */
export const erc1155Service = new EnhancedERC1155Service();
