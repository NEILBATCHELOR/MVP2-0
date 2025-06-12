/**
 * Enhanced ERC1400 Service
 * Security token implementation with comprehensive compliance features
 */

import { BaseTokenService, ServiceResult } from './BaseTokenService';
import { RelationshipService, TOKEN_RELATIONSHIPS } from './RelationshipService';
import { ValidationService, ValidationContext } from './ValidationService';
import { AuditService, auditOperation } from './AuditService';
import { ERC1400PropertyMapper, TokenERC1400Properties, ERC1400FormData } from '../utils/mappers/erc1400/erc1400PropertyMapper';
import { DomainTokenBase } from '../utils/mappers/database/schemaMapper';
import { supabase } from '@/infrastructure/supabaseClient';

export interface ERC1400TokenWithProperties extends DomainTokenBase {
  tokenId: string;
  properties?: TokenERC1400Properties;
}

export interface ERC1400CreationResult {
  token: ERC1400TokenWithProperties;
  properties: TokenERC1400Properties;
  standardInsertionResults?: Record<string, any>;
}

export interface ERC1400Statistics {
  total: number;
  bySecurityType: Record<string, number>;
  byRegulationType: Record<string, number>;
  withKyc: number;
  withWhitelist: number;
  withGeographicRestrictions: number;
  institutionalGrade: number;
  configModeDistribution: Record<string, number>;
}

/**
 * Enhanced ERC1400 Service with security token features
 */
export class EnhancedERC1400Service extends BaseTokenService {
  private propertyMapper = new ERC1400PropertyMapper();
  private relationshipService = new RelationshipService();

  /**
   * Create ERC1400 security token with properties
   */
  async createTokenWithProperties(
    tokenData: any,
    propertiesData: ERC1400FormData,
    userId?: string
  ): Promise<ServiceResult<ERC1400CreationResult>> {
    try {
      // Validation context
      const context: ValidationContext = {
        standard: 'ERC-1400',
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
        const propertiesDbData = this.propertyMapper.fromForm(propertiesData, token.id);

        const { data: insertedPropertiesData, error: propertiesError } = await supabase
          .from('token_erc1400_properties')
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
            standard: 'ERC-1400',
            configMode: context.configMode,
            hasProperties: true,
            securityType: properties.securityType,
            issuingJurisdiction: properties.issuingJurisdiction,
          }
        );

        return {
          success: true,
          data: {
            token: { ...token, tokenId: token.id },
            properties,
            standardInsertionResults: {
              token_erc1400_properties: [properties],
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
   * Get ERC1400 token with properties
   */
  async getTokenWithProperties(id: string): Promise<ServiceResult<ERC1400TokenWithProperties>> {
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

      // Verify it's an ERC1400 token
      if (token.standard !== 'ERC-1400') {
        return {
          success: false,
          error: 'Token is not an ERC-1400 token',
        };
      }

      // Get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('token_erc1400_properties')
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
   * Update ERC1400 token with properties
   */
  async updateTokenWithProperties(
    id: string,
    tokenData: Partial<any>,
    propertiesData: Partial<ERC1400FormData>,
    userId?: string
  ): Promise<ServiceResult<ERC1400TokenWithProperties>> {
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
        standard: 'ERC-1400',
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
          .from('token_erc1400_properties')
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
          securityType: updatedProperties?.securityType,
          complianceChange: propertiesData.complianceAutomationLevel !== existingProperties?.complianceAutomationLevel,
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
   * Delete ERC1400 token with properties
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
          .from('token_erc1400_properties')
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
          securityType: existingData?.properties?.securityType,
          hadCompliance: !!existingData?.properties?.complianceSettings,
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
   * List ERC1400 tokens with properties
   */
  async listERC1400TokensWithProperties(
    filters: any = {},
    pagination: any = {}
  ): Promise<ServiceResult<{
    tokens: ERC1400TokenWithProperties[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      // Get ERC1400 tokens
      const tokensResult = await this.listTokens(
        { ...filters, standard: 'ERC-1400' },
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
        .from('token_erc1400_properties')
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

      const tokensWithProperties: ERC1400TokenWithProperties[] = tokens.map(token => ({
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
   * Validate ERC1400 configuration
   */
  async validateERC1400Configuration(
    tokenData: any,
    propertiesData: ERC1400FormData,
    configMode: 'min' | 'max' = 'min'
  ): Promise<ServiceResult<{ isValid: boolean; errors: string[]; warnings: string[] }>> {
    try {
      const context: ValidationContext = {
        standard: 'ERC-1400',
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
   * Get ERC1400 token statistics
   */
  async getERC1400Statistics(projectId?: string): Promise<ServiceResult<ERC1400Statistics>> {
    try {
      // Create query without chaining to avoid TypeScript deep instantiation issues
      const baseQuery = supabase.from('token_erc1400_view').select('*');

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
      let withKyc = 0;
      let withWhitelist = 0;
      let withGeographicRestrictions = 0;
      let institutionalGrade = 0;
      const bySecurityType: Record<string, number> = {};
      const byRegulationType: Record<string, number> = {};
      const configModeDistribution: Record<string, number> = {};

      for (const token of data) {
        // Safe property access with type casting
        const tokenData = token as any;
        
        // Config mode distribution
        const configMode = tokenData.config_mode || 'min';
        configModeDistribution[configMode] = (configModeDistribution[configMode] || 0) + 1;

        // Security type distribution
        const securityType = tokenData.security_type || 'equity';
        bySecurityType[securityType] = (bySecurityType[securityType] || 0) + 1;

        // Regulation type distribution
        const regulationType = tokenData.regulation_type || 'reg-d';
        byRegulationType[regulationType] = (byRegulationType[regulationType] || 0) + 1;

        // Feature counts with safe property access
        if (tokenData.require_kyc) withKyc++;
        if (tokenData.whitelist_enabled) withWhitelist++;
        if (tokenData.use_geographic_restrictions) withGeographicRestrictions++;
        if (tokenData.institutional_grade) institutionalGrade++;
      }

      return {
        success: true,
        data: {
          total,
          bySecurityType,
          byRegulationType,
          withKyc,
          withWhitelist,
          withGeographicRestrictions,
          institutionalGrade,
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
   * Clone ERC1400 token configuration
   */
  async cloneERC1400Token(
    sourceTokenId: string,
    newTokenData: Partial<any>,
    userId?: string
  ): Promise<ServiceResult<ERC1400CreationResult>> {
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

      // Prepare new properties data - remove sensitive data that shouldn't be cloned
      const clonedPropertiesData = this.propertyMapper.toForm({
        ...sourceProperties,
        id: undefined,
        tokenId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        // Reset security-sensitive fields that should be reconfigured
        controllerAddress: undefined,
        thirdPartyCustodyAddresses: [],
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
          'erc1400_token',
          createResult.data!.token.id,
          'CREATE',
          {
            cloned: {
              new: {
                sourceTokenId,
                targetTokenId: createResult.data!.token.id,
                clonedProperties: Object.keys(clonedPropertiesData),
                securityType: createResult.data!.properties.securityType,
                issuingJurisdiction: createResult.data!.properties.issuingJurisdiction,
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
   * Batch operations for ERC1400 tokens
   */
  async batchCreateERC1400Tokens(
    tokensData: Array<{ token: any; properties: ERC1400FormData }>,
    userId?: string
  ): Promise<ServiceResult<{
    successful: ERC1400CreationResult[];
    failed: Array<{ index: number; error: string; data: any }>;
    summary: { total: number; success: number; failed: number };
  }>> {
    const successful: ERC1400CreationResult[] = [];
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
   * Security token specific compliance operations
   */

  /**
   * Check compliance status for token
   */
  async checkComplianceStatus(tokenId: string): Promise<ServiceResult<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
    lastChecked: string;
  }>> {
    try {
      const tokenResult = await this.getTokenWithProperties(tokenId);
      if (!tokenResult.success || !tokenResult.data?.properties) {
        return {
          success: false,
          error: 'Token not found or missing properties',
        };
      }

      const properties = tokenResult.data.properties;
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check KYC compliance
      if (properties.requireKyc && !properties.enforceKyc) {
        issues.push('KYC required but not enforced');
        recommendations.push('Enable KYC enforcement for better compliance');
      }

      // Check geographic restrictions
      if (properties.useGeographicRestrictions && !properties.geographicRestrictions) {
        issues.push('Geographic restrictions enabled but not configured');
        recommendations.push('Configure geographic restrictions or disable the feature');
      }

      // Check regulatory compliance
      if (!properties.issuingJurisdiction) {
        issues.push('Missing issuing jurisdiction');
        recommendations.push('Specify the issuing jurisdiction for regulatory compliance');
      }

      // Check documentation
      if (!properties.documentUri && !properties.documentHash) {
        issues.push('Missing legal documentation');
        recommendations.push('Upload legal documentation and set document URI/hash');
      }

      // Check institutional features
      if (properties.institutionalGrade && !properties.custodyIntegrationEnabled) {
        recommendations.push('Consider enabling custody integration for institutional-grade tokens');
      }

      const isCompliant = issues.length === 0;

      return {
        success: true,
        data: {
          isCompliant,
          issues,
          recommendations,
          lastChecked: new Date().toISOString(),
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Compliance check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update compliance settings
   */
  async updateComplianceSettings(
    tokenId: string,
    complianceData: {
      complianceAutomationLevel?: string;
      complianceSettings?: any;
      kycSettings?: any;
      geographicRestrictions?: any;
    },
    userId?: string
  ): Promise<ServiceResult<TokenERC1400Properties>> {
    try {
      const updateResult = await this.updateTokenWithProperties(
        tokenId,
        {},
        complianceData,
        userId
      );

      if (!updateResult.success || !updateResult.data?.properties) {
        if (!updateResult.success || !updateResult.data?.properties) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update compliance settings',
        };
      }

      return {
        success: true,
        data: updateResult.data.properties,
      };
      }

      // Create specific compliance audit entry
      await AuditService.createAuditEntry(
        'erc1400_compliance',
        tokenId,
        'UPDATE',
        {
          complianceUpdate: {
            old: {},
            new: complianceData,
          },
        },
        { userId }
      );

      return {
        success: true,
        data: updateResult.data.properties,
      };

    } catch (error) {
      return {
        success: false,
        error: `Compliance update error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Export default instance
 */
export const erc1400Service = new EnhancedERC1400Service();
