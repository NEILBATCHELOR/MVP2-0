import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  UnifiedTokenData, 
  TokenDisplayConfig, 
  getStandardConfig,
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

interface UnifiedTokenDetailProps {
  token: UnifiedTokenData;
  displayConfig?: Partial<TokenDisplayConfig>;
  onEdit?: (token: UnifiedTokenData) => void;
  onDeploy?: (token: UnifiedTokenData) => void;
  onDelete?: (token: UnifiedTokenData) => void;
  onUpdateStatus?: (token: UnifiedTokenData) => void;
  className?: string;
}

const UnifiedTokenDetail: React.FC<UnifiedTokenDetailProps> = ({
  token,
  displayConfig = {},
  onEdit,
  onDeploy,
  onDelete,
  onUpdateStatus,
  className = ''
}) => {
  // Merge with default configuration
  const config = { ...defaultDisplayConfig, ...displayConfig, mode: 'detail' as const };
  
  // Get standard-specific configuration
  const standardConfig = getStandardConfig(token.standard);
  
  // Get the appropriate data section component
  const getDataSection = () => {
    const commonProps = { token, compact: false };
    
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
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Unsupported token standard: {token.standard}</p>
            <p className="text-sm mt-2">
              This token standard is not currently supported for detailed view.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <Card className={`${standardConfig.bgGradient} ${standardConfig.borderColor}`}>
        <CardContent className="pt-6">
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
          
          <Separator className="my-4" />
          
          {/* Actions Section */}
          {config.showActions && (
            <TokenActions
              token={token}
              onEdit={onEdit}
              onDeploy={onDeploy}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              layout={config.actionsLayout}
              compact={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Main Data Section */}
      {getDataSection()}

      {/* Features Section */}
      {config.showFeatures && (
        <Card>
          <CardContent className="pt-6">
            <TokenFeatures
              token={token}
              compact={false}
              showAll={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Metadata Section */}
      {config.showMetadata && (
        <Card>
          <CardContent className="pt-6">
            <TokenMetadata
              createdAt={token.created_at}
              updatedAt={token.updated_at}
              projectId={token.project_id}
              compact={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedTokenDetail;