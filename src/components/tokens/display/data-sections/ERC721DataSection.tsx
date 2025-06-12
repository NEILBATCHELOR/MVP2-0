import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Image,
  DollarSign,
  Settings,
  TrendingUp,
  Info,
  Eye,
  Link
} from 'lucide-react';
import { UnifiedTokenData, formatNumber } from '../utils/token-display-utils';

interface ERC721DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC721DataSection: React.FC<ERC721DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC721 properties with fallbacks
  const properties = token.erc721Properties || {};
  const blocks = token.blocks || {};
  const attributes = token.erc721Attributes || [];
  
  // Basic NFT details
  const basicDetails = [
    {
      label: 'Base URI',
      value: properties.baseUri || blocks.base_uri || 'Not Set',
      tooltip: 'Base URI for token metadata',
      truncate: true
    },
    {
      label: 'Max Supply',
      value: properties.maxSupply || blocks.max_supply ? 
        formatNumber(properties.maxSupply || blocks.max_supply) : 'Unlimited',
      tooltip: 'Maximum number of NFTs that can be minted'
    },
    {
      label: 'Asset Type',
      value: (properties.assetType || blocks.asset_type || 'unique_asset')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      tooltip: 'Type of asset represented by this NFT'
    },
    {
      label: 'Minting Method',
      value: (properties.mintingMethod || blocks.minting_method || 'open')
        .charAt(0).toUpperCase() + (properties.mintingMethod || blocks.minting_method || 'open').slice(1),
      tooltip: 'How new tokens can be minted'
    },
    {
      label: 'URI Storage',
      value: (properties.uriStorage || blocks.uri_storage || 'tokenId')
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      tooltip: 'How token URIs are stored and managed'
    },
    {
      label: 'Auto Increment IDs',
      value: (properties.autoIncrementIds ?? blocks.auto_increment_ids ?? true) ? 'Yes' : 'No',
      tooltip: 'Whether token IDs are automatically incremented'
    },
    {
      label: 'Enumerable',
      value: (properties.enumerable ?? blocks.enumerable ?? true) ? 'Yes' : 'No',
      tooltip: 'Whether tokens can be enumerated'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Image className="h-4 w-4 text-purple-500" />
            NFT Details
          </CardTitle>
        </CardHeader>
        <CardContent className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
          {basicDetails.map((detail, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-1 cursor-help">
                    <div className="flex items-center gap-1">
                      <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        {detail.label}
                      </p>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className={`${compact ? 'text-sm' : 'text-base'} font-medium ${
                      detail.truncate ? 'truncate' : ''
                    }`} title={detail.truncate ? detail.value : undefined}>
                      {detail.value}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{detail.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </CardContent>
      </Card>

      {/* Royalty Information */}
      {(properties.hasRoyalty || blocks.has_royalty) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <DollarSign className="h-4 w-4 text-green-500" />
              Royalty Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Royalty Percentage
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {properties.royaltyPercentage || blocks.royalty_percentage || '0'}%
                </p>
              </div>
              
              {(properties.royaltyReceiver || blocks.royalty_receiver) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Royalty Receiver
                  </p>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium font-mono truncate`}>
                    {properties.royaltyReceiver || blocks.royalty_receiver}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Attributes */}
      {attributes.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Settings className="h-4 w-4 text-indigo-500" />
              Token Attributes ({attributes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as badges
              <div className="flex flex-wrap gap-2">
                {attributes.slice(0, 6).map((attr, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {attr.trait_type}: {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values}
                  </Badge>
                ))}
                {attributes.length > 6 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{attributes.length - 6} more
                  </Badge>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trait Type</TableHead>
                    <TableHead>Possible Values</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attributes.map((attr, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {attr.trait_type}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(attr.values) ? (
                          <div className="flex flex-wrap gap-1">
                            {attr.values.slice(0, 3).map((value, valueIndex) => (
                              <Badge key={valueIndex} variant="outline" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                            {attr.values.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                +{attr.values.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          attr.values
                        )}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(attr.values) ? attr.values.length : 1}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Configuration */}
      {(properties.salesConfig || properties.whitelistConfig || properties.permissionConfig || 
        blocks.sales_config || blocks.whitelist_config || blocks.permission_config) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Advanced Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Sales Configuration */}
              {(properties.salesConfig || blocks.sales_config) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                      Sales Configuration
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Configured
                  </Badge>
                </div>
              )}

              {/* Whitelist Configuration */}
              {(properties.whitelistConfig || blocks.whitelist_config) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                      Whitelist Configuration
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    Configured
                  </Badge>
                </div>
              )}

              {/* Permission Configuration */}
              {(properties.permissionConfig || blocks.permission_config) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-purple-500" />
                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                      Permission Configuration
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    Configured
                  </Badge>
                </div>
              )}

              {/* URI Configuration */}
              {(properties.updatableUris || blocks.updatable_uris) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="h-4 w-4 text-orange-500" />
                    <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                      URI Configuration
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                    Updatable URIs Enabled
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC721DataSection;