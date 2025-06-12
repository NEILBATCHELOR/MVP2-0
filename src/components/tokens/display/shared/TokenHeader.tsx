import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import { TokenStatus } from '@/types/core/centralModels';

interface TokenHeaderProps {
  name: string;
  symbol: string;
  standard: string;
  status: TokenStatus | string;
  blockchain?: string;
  configMode?: 'min' | 'max' | 'basic' | 'advanced';
  tokenTier?: 'primary' | 'secondary' | 'tertiary';
  address?: string;
  showDeployedIndicator?: boolean;
}

const TokenHeader: React.FC<TokenHeaderProps> = ({
  name,
  symbol,
  standard,
  status,
  blockchain,
  configMode,
  tokenTier,
  address,
  showDeployedIndicator = true
}) => {
  // Status badge configuration
  const getStatusBadge = (tokenStatus: TokenStatus | string) => {
    const statusStr = tokenStatus?.toString().toUpperCase();
    
    const statusConfig = {
      DRAFT: { variant: 'outline' as const, className: 'bg-slate-50 text-slate-700 border-slate-300' },
      REVIEW: { variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
      APPROVED: { variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-300' },
      READY_TO_MINT: { variant: 'outline' as const, className: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
      MINTED: { variant: 'default' as const, className: 'bg-blue-500 text-white' },
      DEPLOYED: { variant: 'default' as const, className: 'bg-green-500 text-white' },
      PAUSED: { variant: 'outline' as const, className: 'bg-orange-50 text-orange-700 border-orange-300' },
      DISTRIBUTED: { variant: 'default' as const, className: 'bg-teal-500 text-white' },
      REJECTED: { variant: 'outline' as const, className: 'bg-red-50 text-red-700 border-red-300' },
    };

    const config = statusConfig[statusStr as keyof typeof statusConfig] || statusConfig.DRAFT;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {statusStr}
      </Badge>
    );
  };

  // Standard badge configuration
  const getStandardBadge = (tokenStandard: string) => {
    const standardConfig = {
      'ERC-20': { className: 'bg-blue-100 text-blue-800' },
      'ERC-721': { className: 'bg-purple-100 text-purple-800' },
      'ERC-1155': { className: 'bg-amber-100 text-amber-800' },
      'ERC-1400': { className: 'bg-green-100 text-green-800' },
      'ERC-3525': { className: 'bg-pink-100 text-pink-800' },
      'ERC-4626': { className: 'bg-cyan-100 text-cyan-800' },
    };

    const config = standardConfig[tokenStandard as keyof typeof standardConfig] || 
      { className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="secondary" className={config.className}>
        {tokenStandard}
      </Badge>
    );
  };

  // Token tier badge configuration
  const getTokenTierBadge = () => {
    if (!tokenTier) return null;
    
    const tierConfig = {
      primary: { className: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'Primary' },
      secondary: { className: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Secondary' },
      tertiary: { className: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Tertiary' },
    };

    const config = tierConfig[tokenTier];
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      {/* Left side - Token identity */}
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {name}
            {showDeployedIndicator && status === TokenStatus.DEPLOYED && (
              <Circle className="h-3 w-3 text-green-500 fill-green-500" />
            )}
          </h3>
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span>{symbol}</span>
            <span>•</span>
            <span>{standard}</span>
            {blockchain && (
              <>
                <span>•</span>
                <span>{blockchain}</span>
              </>
            )}
            {address && (
              <>
                <span>•</span>
                <span className="truncate max-w-[100px]" title={address}>
                  {address}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {getStandardBadge(standard)}
        {getStatusBadge(status)}
        {getTokenTierBadge()}
        {configMode && (
          <Badge variant="outline" className="text-xs bg-gray-100 capitalize">
            {configMode}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TokenHeader;