import React, { useMemo, ReactElement } from 'react';
import { FinancialProductCategory } from '@/components/tokens/types';
import { TokenStandard } from '@/types/core/centralModels';

interface AssetSpecificConfig {
  // Fields that may be auto-populated based on the asset type
  fields?: Record<string, any>;
  // Default blocks configuration for the token
  blocks?: Record<string, any>;
  // User guidance for this asset type + standard combination
  guidance?: string;
  // Advanced features to enable by default
  enabledFeatures?: string[];
  // Advanced features to disable by default
  disabledFeatures?: string[];
}

interface AssetTypeConfigAdapterProps {
  children: ReactElement;
  assetCategory: FinancialProductCategory | null;
  tokenStandard: TokenStandard;
  blocks: Record<string, any>;
  onChange: (blocks: Record<string, any>) => void;
}

/**
 * A Higher-Order Component that adapts token configuration forms based on the
 * selected asset type and token standard.
 */
const AssetTypeConfigAdapter: React.FC<AssetTypeConfigAdapterProps> = ({
  children,
  assetCategory,
  tokenStandard,
  blocks,
  onChange,
}) => {
  const assetSpecificConfig = useMemo(() => {
    if (!assetCategory) return null;

    // Define asset-specific configurations for each standard
    const configMap: Partial<Record<FinancialProductCategory, Partial<Record<TokenStandard, AssetSpecificConfig>>>> = {
      // EQUITY configurations
      [FinancialProductCategory.EQUITY]: {
        [TokenStandard.ERC20]: {
          fields: {
            tokenType: 'share',
            accessControl: 'roles',
          },
          enabledFeatures: ['snapshot', 'permit'],
          guidance: 'This configuration is suitable for equity tokens with basic corporate actions like voting and dividends.',
        },
        [TokenStandard.ERC1400]: {
          fields: {
            documentUri: 'ipfs://',
            issuanceAmount: '1000000',
            controllerAddress: '',
          },
          enabledFeatures: ['transferVerifier', 'documentRegistry'],
          guidance: 'Security tokens require transfer controls and document attachments for regulatory compliance.',
        },
      },
      
      // BOND configurations
      [FinancialProductCategory.BOND]: {
        [TokenStandard.ERC20]: {
          fields: {
            tokenType: 'bond',
            cap: '1000000',
          },
          enabledFeatures: ['snapshot'],
          guidance: 'Simple bond tokens with fixed supply. Consider ERC1400 for more complex bond structures.',
        },
        [TokenStandard.ERC1400]: {
          fields: {
            partitions: [
              { name: 'senior', amount: '500000', partitionType: 'debt' },
              { name: 'junior', amount: '500000', partitionType: 'debt' },
            ],
          },
          guidance: 'Bond tokens with tranches benefit from partitions feature in ERC1400.',
        },
        [TokenStandard.ERC3525]: {
          fields: {
            slots: [
              { id: '1', name: '6-month', description: '6-month maturity bonds' },
              { id: '2', name: '12-month', description: '12-month maturity bonds' },
              { id: '3', name: '24-month', description: '24-month maturity bonds' },
            ],
          },
          guidance: 'Use slots to represent different bond maturities with the same face value.',
        },
      },
      
      // FUND configurations
      [FinancialProductCategory.FUND]: {
        [TokenStandard.ERC20]: {
          fields: {
            tokenType: 'share',
            isMintable: true,
            isBurnable: true,
          },
          guidance: 'Simple fund tokens with basic functionality.',
        },
        [TokenStandard.ERC4626]: {
          fields: {
            fee: {
              enabled: true,
              managementFee: '2.0',
              performanceFee: '20.0',
            },
            vaultType: 'fund',
          },
          guidance: 'ERC4626 provides standardized accounting for deposits, withdrawals, and yield calculations.',
        },
      },
      
      // REAL ESTATE configurations
      [FinancialProductCategory.REAL_ESTATE]: {
        [TokenStandard.ERC1400]: {
          fields: {
            regulationType: 'reg_d',
            transferRestrictions: true,
          },
          guidance: 'Real estate securities typically require compliance with securities regulations.',
        },
        [TokenStandard.ERC721]: {
          fields: {
            baseUri: 'ipfs://',
            hasRoyalty: true,
            royaltyPercentage: '1.0',
            assetType: 'real_estate',
          },
          guidance: 'Use for whole property ownership with detailed metadata.',
        },
      },
      
      // COLLECTIBLE configurations
      [FinancialProductCategory.COLLECTIBLE]: {
        [TokenStandard.ERC721]: {
          fields: {
            baseUri: 'ipfs://',
            hasRoyalty: true,
            royaltyPercentage: '5.0',
            assetType: 'unique_asset',
          },
          guidance: 'Perfect for unique collectibles with creator royalties.',
        },
        [TokenStandard.ERC1155]: {
          fields: {
            baseUri: 'ipfs://',
            batchMinting: true,
            hasRoyalty: true,
            royaltyPercentage: '5.0',
            productCategory: 'semi_fungible',
          },
          guidance: 'Ideal for collectibles with multiple editions or items in a collection.',
        },
      },
    };

    // Return the asset-specific configuration if available
    return configMap[assetCategory]?.[tokenStandard] || null;
  }, [assetCategory, tokenStandard]);

  // Apply asset-specific configuration to the blocks if available
  React.useEffect(() => {
    if (assetSpecificConfig && Object.keys(blocks).length === 0) {
      // Only apply defaults if blocks is empty (initial configuration)
      const updatedBlocks = { ...blocks };

      // Apply field defaults
      if (assetSpecificConfig.fields) {
        Object.entries(assetSpecificConfig.fields).forEach(([key, value]) => {
          updatedBlocks[key] = value;
        });
      }

      // Apply block defaults
      if (assetSpecificConfig.blocks) {
        Object.entries(assetSpecificConfig.blocks).forEach(([key, value]) => {
          updatedBlocks[key] = value;
        });
      }

      // Apply feature settings
      if (assetSpecificConfig.enabledFeatures?.length) {
        assetSpecificConfig.enabledFeatures.forEach(feature => {
          updatedBlocks[feature] = true;
        });
      }

      if (assetSpecificConfig.disabledFeatures?.length) {
        assetSpecificConfig.disabledFeatures.forEach(feature => {
          updatedBlocks[feature] = false;
        });
      }

      onChange(updatedBlocks);
    }
  }, [assetSpecificConfig, blocks, onChange]);

  // Clone and enhance child component with asset-specific props
  const enhancedChild = React.cloneElement(children, {
    assetGuidance: assetSpecificConfig?.guidance,
    assetCategory,
  });

  return (
    <>
      {assetSpecificConfig?.guidance && (
        <div className="mb-4 p-4 bg-muted rounded-md text-sm">
          <strong>Asset-Specific Guidance:</strong> {assetSpecificConfig.guidance}
        </div>
      )}
      {enhancedChild}
    </>
  );
};

export default AssetTypeConfigAdapter; 