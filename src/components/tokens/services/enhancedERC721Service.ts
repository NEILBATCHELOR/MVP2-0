/**
 * Enhanced ERC721 Service
 * Complete reference implementation for NFT token management using the new architecture
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC721PropertyMapper, TokenERC721Properties, ERC721FormData, TokenERC721Attribute } from '../utils/mappers/erc721/erc721PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { ValidationResult } from '../utils/mappers/shared/baseMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC721TokenWithProperties extends DomainTokenBase {
  properties?: TokenERC721Properties;
  attributes?: TokenERC721Attribute[];
}

export interface ERC721CreationResult {
  token: DomainTokenBase;
  properties: TokenERC721Properties;
  attributes?: TokenERC721Attribute[];
  standardInsertionResults?: Record<string, any>;
}

/**
 * Enhanced ERC721 Service with full CRUD + relationships + trait management
 */
export class EnhancedERC721Service extends BaseTokenService {
  private propertyMapper = new ERC721PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC721 token with properties and attributes
   */
  // Removed decorator in favor of explicit audit call
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC721FormData,
    attributesData?: TokenERC721Attribute[],
    userId?: string
  ): Promise<ServiceResult<ERC721CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-721',
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
          .from('token_erc721_properties')
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

        // Create attributes if provided
        let attributes: TokenERC721Attribute[] | undefined;
        if (attributesData && attributesData.length > 0) {
          const attributeInserts = attributesData.map(attr => ({
            token_id: token.id,
            trait_type: attr.traitType,
            values: attr.values,
          }));

          const { data: attributesResult, error: attributesError } = await supabase
            .from('token_erc721_attributes')
            .insert(attributeInserts)
            .select();

          if (attributesError) {
            // Rollback previous operations
            await this.deleteToken(token.id);
            return {
              success: false,
              error: `Failed to create attributes: ${attributesError.message}`,
            };
          }

          attributes = attributesResult.map(attr => ({
            id: attr.id,
            tokenId: attr.token_id,
            traitType: attr.trait_type,
            values: attr.values,
            createdAt: attr.created_at,
            updatedAt: attr.updated_at,
          }));
        }

        // Create audit trail
        await AuditService.auditTokenOperation(
          'CREATE',
          token.id,
          null,
          { token, properties, attributes },
          userId,
          {
            standard: 'ERC-721',
            configMode: context.configMode,
            hasProperties: true,
            hasAttributes: !!attributes?.length,
            attributeCount: attributes?.length || 0,
          }
        );

        return {
          success: true,
          data: {
            token,
            properties,
            attributes,
            standardInsertionResults: {
              token_erc721_properties: [properties],
              token_erc721_attributes: attributes || [],
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
   * Get ERC721 token with properties and attributes
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC721TokenWithProperties>> {
    try {
      // Get main token
      const tokenResult = await this.getTokenById(id);
      if (!tokenResult.success || !tokenResult.data) {
        return tokenResult;
      }

      const token = tokenResult.data;

      // Verify it's an ERC721 token
      if (token.standard !== 'ERC-721') {
        return {
          success: false,
          error: 'Token is not an ERC-721 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc721_properties')
        .select('*')
        .eq('token_id', id)
        .single();

      if (propertiesError && propertiesError.code !== 'PGRST116') {
        return {
          success: false,
          error: `Failed to get properties: ${propertiesError.message}`,
        };
      }

      // Get attributes
      const { data: attributesData, error: attributesError } = await supabase
        .from('token_erc721_attributes')
        .select('*')
        .eq('token_id', id);

      if (attributesError) {
        console.warn('Failed to get attributes:', attributesError);
      }

      const properties = propertiesData ? this.propertyMapper.toDomain(propertiesData) : undefined;
      
      const attributes = attributesData?.map(attr => ({
        id: attr.id,
        tokenId: attr.token_id,
        traitType: attr.trait_type,
        values: attr.values,
        createdAt: attr.created_at,
        updatedAt: attr.updated_at,
      })) || [];

      return {
        success: true,
        data: {
          ...token,
          properties,
          attributes,
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
   * Update ERC721 token with properties and attributes
   */
  // Removed decorator in favor of explicit audit call
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC721FormData>,
    attributesData?: TokenERC721Attribute[],
    userId?: string
  ): Promise<ServiceResult<ERC721TokenWithProperties>> {
    try {
      // Get existing data for validation and audit
      const existingResult = await this.getTokenWithProperties(id);
      if (!existingResult.success || !existingResult.data) {
        return existingResult;
      }

      const existingToken = existingResult.data;
      const existingProperties = existingToken.properties;
      const existingAttributes = existingToken.attributes;

      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-721',
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
          .from('token_erc721_properties')
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

      // Update attributes if provided
      let updatedAttributes = existingAttributes;
      if (attributesData) {
        // Delete existing attributes
        await supabase
          .from('token_erc721_attributes')
          .delete()
          .eq('token_id', id);

        // Insert new attributes if any
        if (attributesData.length > 0) {
          const attributeInserts = attributesData.map(attr => ({
            token_id: id,
            trait_type: attr.traitType,
            values: attr.values,
          }));

          const { data: newAttributesData, error: attributesError } = await supabase
            .from('token_erc721_attributes')
            .insert(attributeInserts)
            .select();

          if (attributesError) {
            console.error('Failed to update attributes:', attributesError);
            // Continue execution, don't fail the entire update
          } else {
            updatedAttributes = newAttributesData.map(attr => ({
              id: attr.id,
              tokenId: attr.token_id,
              traitType: attr.trait_type,
              values: attr.values,
              createdAt: attr.created_at,
              updatedAt: attr.updated_at,
            }));
          }
        } else {
          updatedAttributes = [];
        }
      }

      // Create audit trail
      await AuditService.auditTokenOperation(
        'UPDATE',
        id,
        { token: existingToken, properties: existingProperties, attributes: existingAttributes },
        { token: updatedToken, properties: updatedProperties, attributes: updatedAttributes },
        userId,
        {
          updatedFields: {
            token: Object.keys(tokenData),
            properties: Object.keys(propertiesData),
            attributes: attributesData ? 'replaced' : 'unchanged',
          },
          attributeChanges: {
            before: existingAttributes?.length || 0,
            after: updatedAttributes?.length || 0,
          },
        }
      );

      return {
        success: true,
        data: {
          ...updatedToken,
          properties: updatedProperties,
          attributes: updatedAttributes,
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
   * Delete ERC721 token with properties and attributes
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

      // Delete attributes first
      await supabase
        .from('token_erc721_attributes')
        .delete()
        .eq('token_id', id);

      // Delete properties
      if (existingData?.properties) {
        const { error: propertiesError } = await supabase
          .from('token_erc721_properties')
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
          deletedAttributes: existingData?.attributes?.length || 0,
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
   * List ERC721 tokens with properties and attributes
   */
  async listERC721TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC721TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC721 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-721' },
        pagination
      );

      if (!tokensResult.success || !tokensResult.data) {
        return tokensResult;
      }

      const { tokens, total, page, limit } = tokensResult.data;

      // Get properties and attributes for all tokens
      const tokenIds = tokens.map(token => token.id);
      
      if (tokenIds.length === 0) {
        return {
          success: true,
          data: { tokens: [], total, page, limit },
        };
      }

      // Batch fetch properties and attributes
      const [propertiesResult, attributesResult] = await Promise.all([
        supabase
          .from('token_erc721_properties')
          .select('*')
          .in('token_id', tokenIds),
        supabase
          .from('token_erc721_attributes')
          .select('*')
          .in('token_id', tokenIds)
      ]);

      if (propertiesResult.error) {
        console.warn('Failed to load properties:', propertiesResult.error);
      }

      if (attributesResult.error) {
        console.warn('Failed to load attributes:', attributesResult.error);
      }

      // Map properties and attributes to tokens
      const propertiesMap = new Map();
      if (propertiesResult.data) {
        for (const props of propertiesResult.data) {
          propertiesMap.set(props.token_id, this.propertyMapper.toDomain(props));
        }
      }

      const attributesMap = new Map();
      if (attributesResult.data) {
        for (const attr of attributesResult.data) {
          if (!attributesMap.has(attr.token_id)) {
            attributesMap.set(attr.token_id, []);
          }
          attributesMap.get(attr.token_id).push({
            id: attr.id,
            tokenId: attr.token_id,
            traitType: attr.trait_type,
            values: attr.values,
            createdAt: attr.created_at,
            updatedAt: attr.updated_at,
          });
        }
      }

      const tokensWithProperties = tokens.map(token => ({
        ...token,
        properties: propertiesMap.get(token.id),
        attributes: attributesMap.get(token.id) || [],
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
   * Update token attributes only
   */
  async updateTokenAttributes(
    tokenId: string,
    attributes: TokenERC721Attribute[],
    userId?: string
  ): Promise<ServiceResult<TokenERC721Attribute[]>> {
    try {
      // Get existing attributes for audit
      const { data: existingAttrs } = await supabase
        .from('token_erc721_attributes')
        .select('*')
        .eq('token_id', tokenId);

      // Delete existing attributes
      await supabase
        .from('token_erc721_attributes')
        .delete()
        .eq('token_id', tokenId);

      // Insert new attributes
      let newAttributes: TokenERC721Attribute[] = [];
      if (attributes.length > 0) {
        const attributeInserts = attributes.map(attr => ({
          token_id: tokenId,
          trait_type: attr.traitType,
          values: attr.values,
        }));

        const { data: newAttrsData, error: attributesError } = await supabase
          .from('token_erc721_attributes')
          .insert(attributeInserts)
          .select();

        if (attributesError) {
          return {
            success: false,
            error: `Failed to update attributes: ${attributesError.message}`,
          };
        }

        newAttributes = newAttrsData.map(attr => ({
          id: attr.id,
          tokenId: attr.token_id,
          traitType: attr.trait_type,
          values: attr.values,
          createdAt: attr.created_at,
          updatedAt: attr.updated_at,
        }));
      }

      // Create audit trail
      await AuditService.createAuditEntry(
        'erc721_attributes',
        tokenId,
        'UPDATE',
        {
          attributes: {
            old: existingAttrs?.map(attr => ({
              traitType: attr.trait_type,
              values: attr.values,
            })) || [],
            new: attributes.map(attr => ({
              traitType: attr.traitType,
              values: attr.values,
            })),
          },
        },
        { userId }
      );

      return {
        success: true,
        data: newAttributes,
      };

    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate ERC721 configuration
   */
  async validateERC721Configuration(
    tokenData: any,
    propertiesData: ERC721FormData,
    attributesData?: TokenERC721Attribute[],
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[];
    attributeValidation?: ValidationResult;
  }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-721',
        configMode,
        operation: 'create',
      };

      const mergedData = { ...tokenData, ...propertiesData };
      const validation = ValidationService.validateComprehensive(mergedData, context);

      // Validate attributes if provided
      let attributeValidation: ValidationResult | undefined;
      if (attributesData && attributesData.length > 0) {
        const attrErrors: string[] = [];
        const attrWarnings: string[] = [];

        // Check for duplicate trait types
        const traitTypes = attributesData.map(attr => attr.traitType);
        const duplicates = traitTypes.filter((item, index) => traitTypes.indexOf(item) !== index);
        if (duplicates.length > 0) {
          attrWarnings.push(`Duplicate trait types found: ${duplicates.join(', ')}`);
        }

        // Validate each attribute
        for (const attr of attributesData) {
          if (!attr.traitType || attr.traitType.trim().length === 0) {
            attrErrors.push('Trait type cannot be empty');
          }
          if (!attr.values || attr.values.length === 0) {
            attrErrors.push(`Trait "${attr.traitType}" must have at least one value`);
          }
        }

        attributeValidation = {
          valid: attrErrors.length === 0,
          errors: attrErrors,
          warnings: attrWarnings,
        };

        // Add attribute errors to main validation
        if (attrErrors.length > 0) {
          validation.errors.push(...attrErrors);
          validation.valid = false;
        }
        if (attrWarnings.length > 0) {
          validation.warnings = validation.warnings || [];
          validation.warnings.push(...attrWarnings);
        }
      }

      return {
        success: true,
        data: {
          isValid: validation.valid,
          errors: validation.errors || [],
          warnings: validation.warnings || [],
          attributeValidation,
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
   * Get ERC721 token statistics
   */
  async getERC721Statistics(projectId?: string): Promise<ServiceResult<{
    total: number;
    withRoyalties: number;
    withUtility: number;
    withStaking: number;
    withRevealing: number;
    withSales: number;
    soulboundTokens: number;
    crossChainEnabled: number;
    avgAttributesPerToken: number;
    topTraitTypes: Array<{ traitType: string; count: number }>;
    configModeDistribution: Record<string, number>;
    assetTypeDistribution: Record<string, number>;
  }>> {
    try {
      let tokenQuery = supabase
        .from('tokens')
        .select('*')
        .eq('standard', 'ERC-721');

      if (projectId) {
        tokenQuery = tokenQuery.eq('project_id', projectId);
      }

      const { data: tokens, error: tokensError } = await tokenQuery;

      if (tokensError) {
        return {
          success: false,
          error: `Database error: ${tokensError.message}`,
        };
      }

      if (!tokens || tokens.length === 0) {
        return {
          success: true,
          data: {
            total: 0,
            withRoyalties: 0,
            withUtility: 0,
            withStaking: 0,
            withRevealing: 0,
            withSales: 0,
            soulboundTokens: 0,
            crossChainEnabled: 0,
            avgAttributesPerToken: 0,
            topTraitTypes: [],
            configModeDistribution: {},
            assetTypeDistribution: {},
          },
        };
      }

      const tokenIds = tokens.map(token => token.id);

      // Get properties and attributes
      const [propertiesResult, attributesResult] = await Promise.all([
        supabase
          .from('token_erc721_properties')
          .select('*')
          .in('token_id', tokenIds),
        supabase
          .from('token_erc721_attributes')
          .select('trait_type, token_id')
          .in('token_id', tokenIds)
      ]);

      const properties = propertiesResult.data || [];
      const attributes = attributesResult.data || [];

      // Calculate statistics
      const total = tokens.length;
      let withRoyalties = 0;
      let withUtility = 0;
      let withStaking = 0;
      let withRevealing = 0;
      let withSales = 0;
      let soulboundTokens = 0;
      let crossChainEnabled = 0;
      const configModeDistribution: Record<string, number> = {};
      const assetTypeDistribution: Record<string, number> = {};

      // Token statistics
      for (const token of tokens) {
        const configMode = token.config_mode || 'min';
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;
      }

      // Properties statistics
      for (const prop of properties) {
        if (prop.has_royalty) withRoyalties++;
        if (prop.utility_enabled) withUtility++;
        if (prop.staking_enabled) withStaking++;
        if (prop.revealable) withRevealing++;
        if (prop.public_sale_enabled || prop.whitelist_sale_enabled) withSales++;
        if (prop.soulbound) soulboundTokens++;
        if (prop.cross_chain_enabled) crossChainEnabled++;

        const assetType = prop.asset_type || 'unique_asset';
        assetTypeDistribution[assetType] = (assetTypeDistribution[assetType] || 0) + 1;
      }

      // Attributes statistics
      const traitTypeCounts: Record<string, number> = {};
      for (const attr of attributes) {
        traitTypeCounts[attr.trait_type] = (traitTypeCounts[attr.trait_type] || 0) + 1;
      }

      const topTraitTypes = Object.entries(traitTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([traitType, count]) => ({ traitType, count }));

      const avgAttributesPerToken = total > 0 ? attributes.length / total : 0;

      return {
        success: true,
        data: {
          total,
          withRoyalties,
          withUtility,
          withStaking,
          withRevealing,
          withSales,
          soulboundTokens,
          crossChainEnabled,
          avgAttributesPerToken: Math.round(avgAttributesPerToken * 100) / 100,
          topTraitTypes,
          configModeDistribution,
          assetTypeDistribution,
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
   * Clone ERC721 token configuration
   */
  async cloneERC721Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    includeAttributes: boolean = true,
    userId?: string
  ): Promise<ServiceResult<ERC721CreationResult>> {
    try {
      // Get source token with properties and attributes
      const sourceResult = await this.getTokenWithProperties(sourceTokenId);
      if (!sourceResult.success || !sourceResult.data) {
        return {
          success: false,
          error: 'Source token not found',
        };
      }

      const sourceToken = sourceResult.data;
      const sourceProperties = sourceToken.properties;
      const sourceAttributes = sourceToken.attributes;

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

      // Prepare new attributes data
      const clonedAttributesData = includeAttributes && sourceAttributes ? 
        sourceAttributes.map(attr => ({
          ...attr,
          id: undefined,
          tokenId: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        })) : undefined;

      // Create new token
      const createResult = await this.createTokenWithProperties(
        clonedTokenData,
        clonedPropertiesData,
        clonedAttributesData,
        userId
      );

      if (createResult.success) {
        // Create audit trail for cloning
        await AuditService.createAuditEntry(
          'erc721_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              new: {
                sourceTokenId,
                targetTokenId: createResult.data!.token.id,
                clonedProperties: Object.keys(clonedPropertiesData),
                clonedAttributes: includeAttributes ? sourceAttributes?.length || 0 : 0,
                includeAttributes,
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
   * Batch operations for ERC721 tokens
   */
  async batchCreateERC721Tokens(
    tokensData: Array<{ 
      token: any; 
      properties: ERC721FormData; 
      attributes?: TokenERC721Attribute[] 
    }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC721CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC721CreationResult[] = [];
    const failed: Array<{ index: number; error: string; data: any }> = [];

    for (let i = 0; i < tokensData.length; i++) {
      const { token, properties, attributes } = tokensData[i];
      
      try {
        const result = await this.createTokenWithProperties(token, properties, attributes, userId);
        
        if (result.success && result.data) {
          successful.push(result.data);
        } else {
          failed.push({
            index: i,
            error: result.error || result.errors?.join(', ') || 'Unknown error',
            data: { token, properties, attributes },
          });
        }
      } catch (error) {
        failed.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: { token, properties, attributes },
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
   * Generate metadata for ERC721 token
   */
  async generateTokenMetadata(
    tokenId: string,
    tokenNumber?: number
  ): Promise<ServiceResult<{
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
    external_url?: string;
  }>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data) {
        return {
          success: false,
          error: 'Token not found',
        };
      }

      const token = tokenResult.data;
      const properties = token.properties;
      const attributes = token.attributes || [];

      if (!properties) {
        return {
          success: false,
          error: 'Token properties not found',
        };
      }

      // Generate metadata
      const metadata = {
        name: tokenNumber ? `${token.name} #${tokenNumber}` : token.name,
        description: token.description || `${token.name} NFT from the ${token.symbol} collection`,
        image: properties.baseUri && tokenNumber ? 
          `${properties.baseUri}/${tokenNumber}` : 
          properties.placeholderImageUri || '',
        attributes: attributes.flatMap(attr => 
          attr.values.map(value => ({
            trait_type: attr.traitType,
            value: value,
          }))
        ),
        external_url: properties.contractUri,
      };

      return {
        success: true,
        data: metadata,
      };

    } catch (error) {
      return {
        success: false,
        error: `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Export default instance
 */
export const erc721Service = new EnhancedERC721Service();

/**
 * Export individual functions for compatibility with existing hooks
 */
export const getERC721Properties = (tokenId: string, options?: any) => 
  erc721Service.getTokenWithProperties(tokenId);

export const updateERC721Properties = (tokenId: string, updates: any) => 
  erc721Service.updateTokenWithProperties(tokenId, {}, updates);

export const getERC721Attributes = (tokenId: string) => 
  erc721Service.getTokenWithProperties(tokenId).then(result => 
    result.success ? result.data?.attributes || [] : []
  );