import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Flame, 
  Pause, 
  Key, 
  FileText,
  CreditCard,
  Settings,
  CheckCircle,
  DollarSign,
  RefreshCw,
  Vote,
  Lock,
  Users,
  Eye,
  Layers,
  TrendingUp
} from 'lucide-react';
import { UnifiedTokenData, extractTokenFeatures } from '../utils/token-display-utils';

interface TokenFeaturesProps {
  token: UnifiedTokenData;
  compact?: boolean;
  maxFeatures?: number;
  showAll?: boolean;
}

interface FeatureConfig {
  icon: React.ComponentType<any>;
  label: string;
  className: string;
  description: string;
}

const TokenFeatures: React.FC<TokenFeaturesProps> = ({
  token,
  compact = false,
  maxFeatures,
  showAll = false
}) => {
  // Extract features from token data
  const features = extractTokenFeatures(token);
  // Feature configuration mapping
  const featureConfigs: Record<string, FeatureConfig> = {
    // Basic token features
    isMintable: {
      icon: Shield,
      label: 'Mintable',
      className: 'bg-green-50 text-green-700 border-green-200',
      description: 'New tokens can be created'
    },
    isBurnable: {
      icon: Flame,
      label: 'Burnable',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'Tokens can be permanently destroyed'
    },
    isPausable: {
      icon: Pause,
      label: 'Pausable',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Transfers can be paused'
    },
    permit: {
      icon: CheckCircle,
      label: 'Permit',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Gasless approvals via signatures'
    },
    snapshot: {
      icon: Eye,
      label: 'Snapshot',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Balance snapshots for governance'
    },
    allowanceManagement: {
      icon: Settings,
      label: 'Allowance Management',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Advanced allowance controls'
    },

    // ERC20 specific
    feeOnTransfer: {
      icon: DollarSign,
      label: 'Fee on Transfer',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'Fees charged on transfers'
    },
    rebasing: {
      icon: RefreshCw,
      label: 'Rebasing',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      description: 'Supply adjusts automatically'
    },
    governanceFeatures: {
      icon: Vote,
      label: 'Governance',
      className: 'bg-violet-50 text-violet-700 border-violet-200',
      description: 'On-chain voting capabilities'
    },

    // ERC1400 specific
    requireKyc: {
      icon: Key,
      label: 'KYC Required',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Know Your Customer verification required'
    },
    enforceKyc: {
      icon: Key,
      label: 'KYC Enforced',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'KYC compliance automatically enforced'
    },
    forcedTransfers: {
      icon: Lock,
      label: 'Forced Transfers',
      className: 'bg-red-50 text-red-700 border-red-200',
      description: 'Controllers can force transfers'
    },
    forcedRedemption: {
      icon: Lock,
      label: 'Forced Redemption',
      className: 'bg-red-50 text-red-700 border-red-200',
      description: 'Controllers can force redemptions'
    },
    whitelistEnabled: {
      icon: Users,
      label: 'Whitelist',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Only whitelisted addresses can transact'
    },
    autoCompliance: {
      icon: CheckCircle,
      label: 'Auto Compliance',
      className: 'bg-green-50 text-green-700 border-green-200',
      description: 'Automated compliance checking'
    },
    manualApprovals: {
      icon: FileText,
      label: 'Manual Approvals',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      description: 'Manual approval required for transfers'
    },

    // ERC1155 specific
    batchMintingEnabled: {
      icon: Layers,
      label: 'Batch Minting',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Multiple tokens can be minted in one transaction'
    },
    containerEnabled: {
      icon: Layers,
      label: 'Container Support',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Tokens can be contained within other tokens'
    },
    supplyTracking: {
      icon: Eye,
      label: 'Supply Tracking',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Total supply is tracked for each token type'
    },

    // ERC721 specific
    hasRoyalty: {
      icon: DollarSign,
      label: 'Royalty',
      className: 'bg-green-50 text-green-700 border-green-200',
      description: 'Royalties paid on secondary sales'
    },
    updatableUris: {
      icon: Settings,
      label: 'Updatable URIs',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Token metadata can be updated'
    },
    autoIncrementIds: {
      icon: TrendingUp,
      label: 'Auto Increment IDs',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Token IDs increment automatically'
    },

    // ERC4626 specific
    flashLoans: {
      icon: TrendingUp,
      label: 'Flash Loans',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      description: 'Flash loan functionality available'
    },
    emergencyShutdown: {
      icon: Pause,
      label: 'Emergency Shutdown',
      className: 'bg-red-50 text-red-700 border-red-200',
      description: 'Emergency shutdown capability'
    },
    yieldOptimizationEnabled: {
      icon: TrendingUp,
      label: 'Yield Optimization',
      className: 'bg-green-50 text-green-700 border-green-200',
      description: 'Automated yield optimization strategies'
    },
    automatedRebalancing: {
      icon: RefreshCw,
      label: 'Auto Rebalancing',
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      description: 'Automated portfolio rebalancing'
    },

    // ERC3525 specific
    fractionalOwnershipEnabled: {
      icon: Layers,
      label: 'Fractional Ownership',
      className: 'bg-pink-50 text-pink-700 border-pink-200',
      description: 'Fractional ownership of assets'
    },
    mergable: {
      icon: Layers,
      label: 'Mergable',
      className: 'bg-pink-50 text-pink-700 border-pink-200',
      description: 'Tokens can be merged together'
    },
    splittable: {
      icon: Layers,
      label: 'Splittable',
      className: 'bg-pink-50 text-pink-700 border-pink-200',
      description: 'Tokens can be split into smaller units'
    }
  };

  // Extract enabled features from the features object
  const enabledFeatures = Object.entries(features)
    .filter(([key, value]) => {
      // Handle different value types
      if (typeof value === 'boolean') return value;
      if (typeof value === 'object' && value !== null) return true;
      if (typeof value === 'string') return value !== '' && value !== '0';
      return false;
    })
    .map(([key]) => key)
    .filter(key => featureConfigs[key]); // Only include features we have configs for

  // Limit features if maxFeatures is specified and showAll is false
  const displayFeatures = (!showAll && maxFeatures) 
    ? enabledFeatures.slice(0, maxFeatures)
    : enabledFeatures;

  const remainingCount = enabledFeatures.length - displayFeatures.length;

  if (displayFeatures.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No special features enabled
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayFeatures.map((featureKey) => {
        const config = featureConfigs[featureKey];
        const IconComponent = config.icon;
        
        return (
          <Badge 
            key={featureKey}
            variant="outline" 
            className={`${config.className} flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}
            title={config.description}
          >
            <IconComponent className={compact ? "h-3 w-3" : "h-3 w-3"} />
            <span>{config.label}</span>
          </Badge>
        );
      })}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="bg-gray-50 text-gray-700 border-gray-200"
          title={`${remainingCount} more features`}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};

export default TokenFeatures;