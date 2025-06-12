import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  UnifiedTokenData, 
  TokenDisplayConfig, 
  getStandardConfig, 
  getStatusBorderColor,
  defaultDisplayConfig 
} from './utils/token-display-utils';

// Import shared components
import TokenHeader from './shared/TokenHeader';
import TokenFeatures from './shared/TokenFeatures';
import TokenActions from './shared/TokenActions';
import TokenMetadata from './shared/TokenMetadata';

// Import data section components
import ERC20DataSection from './data-sections/ERC20DataSection';
import ERC721DataSection from './data-sections/ERC721DataSection';
import ERC1155DataSection from './data-sections/ERC1155DataSection';
import ERC1400DataSection from './data-sections/ERC1400DataSection';
import ERC3525DataSection from './data-sections/ERC3525DataSection';
import ERC4626DataSection from './data-sections/ERC4626DataSection';

interface UnifiedTokenCardProps {
  token: UnifiedTokenData;
  displayConfig?: Partial<TokenDisplayConfig>;
  onView?: (token: UnifiedTokenData) => void;
  onEdit?: (token: UnifiedTokenData) => void;
  onDeploy?: (token: UnifiedTokenData) => void;
  onDelete?: (token: UnifiedTokenData) => void;
  onUpdateStatus?: (token: UnifiedTokenData) => void;
  className?: string;
}

const UnifiedTokenCard: React.FC<UnifiedTokenCardProps> = ({
  token,
  displayConfig = {},
  onView,
  onEdit,
  onDeploy,
  onDelete,
  onUpdateStatus,
  className = ''
}) => {
  // Merge with default configuration
  const config = { ...defaultDisplayConfig, ...displayConfig, mode: 'card' as const };
  
  // Get standard-specific configuration
  const standardConfig = getStandardConfig(token.standard);
  const statusBorderColor = getStatusBorderColor(token.status);
  
  // Get the appropriate data section component
  const getDataSection = () => {
    const commonProps = { token, compact: config.layout === 'compact' };
    
    switch (token.standard) {
      case 'ERC-20':
        return <ERC20DataSection {...commonProps} />;
      case 'ERC-721':
        return <ERC721DataSection {...commonProps} />;
      case 'ERC-1155':
        return <ERC1155DataSection {...commonProps} />;
      case 'ERC-1400':
        return <ERC1400DataSection {...commonProps} />;
      case 'ERC-3525':
        return <ERC3525DataSection {...commonProps} />;
      case 'ERC-4626':
        return <ERC4626DataSection {...commonProps} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unsupported token standard: {token.standard}</p>
          </div>
        );
    }
  };

  return (
    <Card 
      className={`
        ${className}
        ${standardConfig.bgGradient}
        ${standardConfig.borderColor}
        ${standardConfig.hoverShadow}
        ${statusBorderColor}
        border-l-4
        transition-all duration-200 hover:shadow-lg cursor-pointer
        ${config.layout === 'compact' ? 'h-fit' : 'min-h-[300px]'}
      `}
      onClick={() => onView?.(token)}
    >
      <CardHeader className={config.layout === 'compact' ? 'pb-3' : 'pb-4'}>
        <TokenHeader
          name={token.name}
          symbol={token.symbol}
          standard={token.standard}
          status={token.status}
          blockchain={token.blockchain}
          configMode={token.config_mode}
          tokenTier={token.tokenTier}
          address={token.address}
          showDeployedIndicator={true}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features Section */}
        {config.showFeatures && (
          <TokenFeatures
            token={token}
            maxFeatures={config.maxFeatures}
            compact={config.layout === 'compact'}
          />
        )}

        {/* Data Section - Standard-specific content */}
        <div className={config.layout === 'compact' ? 'max-h-[200px] overflow-y-auto' : ''}>
          {getDataSection()}
        </div>

        {/* Metadata Section */}
        {config.showMetadata && (
          <TokenMetadata
            createdAt={token.created_at}
            updatedAt={token.updated_at}
            projectId={token.project_id}
            compact={config.layout === 'compact'}
          />
        )}

        {/* Actions Section */}
        {config.showActions && (
          <TokenActions
            token={token}
            onView={onView}
            onEdit={onEdit}
            onDeploy={onDeploy}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
            layout={config.actionsLayout}
            compact={config.layout === 'compact'}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedTokenCard;