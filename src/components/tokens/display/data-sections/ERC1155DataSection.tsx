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
  Layers,
  DollarSign,
  Settings,
  Eye,
  Info,
  Package,
  BarChart3,
  Grid3X3
} from 'lucide-react';
import { UnifiedTokenData, formatNumber } from '../utils/token-display-utils';

interface ERC1155DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC1155DataSection: React.FC<ERC1155DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC1155 properties with fallbacks
  const properties = token.erc1155Properties || {};
  const blocks = token.blocks || {};
  const tokenTypes = token.erc1155Types || [];
  const balances = token.erc1155Balances || [];
  const uriMappings = token.erc1155UriMappings || [];
  
  // Function to get badge color based on fungibility type
  const getFungibilityBadgeClass = (type?: string) => {
    switch(type?.toLowerCase()) {
      case 'fungible':
        return 'bg-blue-100 text-blue-800';
      case 'semi-fungible':
        return 'bg-purple-100 text-purple-800';
      case 'non-fungible':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Basic ERC1155 details
  const basicDetails = [
    {
      label: 'Base URI',
      value: properties.baseUri || blocks.base_uri || 'Not Set',
      tooltip: 'Base URI for token metadata',
      truncate: true
    },
    {
      label: 'Metadata Storage',
      value: (properties.metadataStorage || blocks.metadata_storage || 'ipfs').toUpperCase(),
      tooltip: 'Where token metadata is stored'
    },
    {
      label: 'Token Types',
      value: tokenTypes.length > 0 ? tokenTypes.length.toString() : 'None',
      tooltip: 'Number of different token types defined'
    },
    {
      label: 'URI Mappings',
      value: uriMappings.length > 0 ? uriMappings.length.toString() : 'None',
      tooltip: 'Number of custom URI mappings'
    },
    {
      label: 'Balance Records',
      value: balances.length > 0 ? balances.length.toString() : 'None',
      tooltip: 'Number of address balance records'
    },
    {
      label: 'Supply Tracking',
      value: (properties.supplyTracking ?? blocks.supply_tracking ?? true) ? 'Enabled' : 'Disabled',
      tooltip: 'Whether total supply is tracked for each token type'
    },
    {
      label: 'Approval for All',
      value: (properties.enableApprovalForAll ?? blocks.enable_approval_for_all ?? true) ? 'Enabled' : 'Disabled',
      tooltip: 'Whether operators can be approved for all tokens'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Layers className="h-4 w-4 text-amber-500" />
            Multi-Token Details
          </CardTitle>
        </CardHeader>
        <CardContent className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
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

      {/* Token Types */}
      {tokenTypes.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Grid3X3 className="h-4 w-4 text-amber-500" />
              Token Types{tokenTypes.length > 0 ? ` (${tokenTypes.length})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as grid of badges
              <div className="grid grid-cols-2 gap-2">
                {tokenTypes.slice(0, 4).map((type, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{type.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getFungibilityBadgeClass(type.fungibility_type)}`}
                      >
                        {type.fungibility_type === 'fungible' ? 'F' : 
                         type.fungibility_type === 'semi-fungible' ? 'SF' : 'NF'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      ID: {type.token_type_id}
                    </p>
                    {type.max_supply && (
                      <p className="text-xs text-gray-500">
                        Max: {formatNumber(type.max_supply)}
                      </p>
                    )}
                  </div>
                ))}
                {tokenTypes.length > 4 && (
                  <div className="p-2 border rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      +{tokenTypes.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Fungibility</TableHead>
                    <TableHead>Max Supply</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenTypes.map((type, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {type.token_type_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {type.name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFungibilityBadgeClass(type.fungibility_type)}`}
                        >
                          {type.fungibility_type || 'non-fungible'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {type.max_supply ? formatNumber(type.max_supply) : 'Unlimited'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {type.description || 'No description'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Batch Operations & Advanced Features */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Package className="h-4 w-4 text-blue-500" />
            Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Batch Minting */}
            {(properties.batchMintingEnabled || properties.batchMintingConfig || 
              blocks.batch_minting_enabled || blocks.batch_minting_config) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    Batch Minting
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                  Enabled
                </Badge>
              </div>
            )}

            {/* Container Support */}
            {(properties.containerEnabled || properties.containerConfig || 
              blocks.container_enabled || blocks.container_config) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    Container Support
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Enabled
                </Badge>
              </div>
            )}

            {/* Dynamic URIs */}
            {(properties.updatableUris || properties.dynamicUriConfig || 
              blocks.updatable_uris || blocks.dynamic_uri_config) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-500" />
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    Dynamic URIs
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                  Updatable
                </Badge>
              </div>
            )}

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

            {/* Transfer Restrictions */}
            {(properties.transferRestrictions || blocks.transfer_restrictions) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-red-500" />
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    Transfer Restrictions
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                  Configured
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance Overview */}
      {balances.length > 0 && !compact && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Balance Overview{balances.length > 0 ? ` (${balances.length} addresses)` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Token Type ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.slice(0, 5).map((balance, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {balance.address?.slice(0, 10)}...{balance.address?.slice(-8)}
                    </TableCell>
                    <TableCell>
                      {balance.token_type_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(balance.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {balance.updated_at ? new Date(balance.updated_at).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {balances.length > 5 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                ...and {balances.length - 5} more addresses
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC1155DataSection;