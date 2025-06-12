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
  Tag,
  Layers,
  BarChart3,
  DollarSign,
  Settings,
  TrendingUp,
  Info,
  Coins,
  Split,
  Merge,
  Link,
  FileText
} from 'lucide-react';
import { UnifiedTokenData, formatNumber } from '../utils/token-display-utils';

interface ERC3525DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC3525DataSection: React.FC<ERC3525DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC3525 properties with fallbacks
  const properties = token.erc3525Properties || {};
  const blocks = token.blocks || {};
  const slots = token.erc3525Slots || [];
  const allocations = token.erc3525Allocations || [];
  
  // Basic semi-fungible token details
  const basicDetails = [
    {
      label: 'Value Decimals',
      value: (properties.valueDecimals ?? blocks.value_decimals ?? 0).toString(),
      tooltip: 'Number of decimal places for token values'
    },
    {
      label: 'Base URI',
      value: properties.baseUri || blocks.base_uri || 'Not Set',
      tooltip: 'Base URI for token metadata',
      truncate: true
    },
    {
      label: 'Slot Type',
      value: (properties.slotType || blocks.slot_type || 'generic')
        .charAt(0).toUpperCase() + (properties.slotType || blocks.slot_type || 'generic').slice(1),
      tooltip: 'Type of slots supported by this token'
    },
    {
      label: 'Metadata Storage',
      value: (properties.metadataStorage || blocks.metadata_storage || 'ipfs').toUpperCase(),
      tooltip: 'Where token metadata is stored'
    },
    {
      label: 'Total Slots',
      value: slots.length.toString(),
      tooltip: 'Number of defined slots'
    },
    {
      label: 'Total Allocations',
      value: allocations.length.toString(),
      tooltip: 'Number of token allocations'
    },
    {
      label: 'Value Transfers',
      value: (properties.valueTransfersEnabled ?? blocks.value_transfers_enabled ?? true) ? 'Enabled' : 'Disabled',
      tooltip: 'Whether value can be transferred between tokens'
    },
    {
      label: 'Slot Enumeration',
      value: (properties.allowsSlotEnumeration ?? blocks.allows_slot_enumeration ?? true) ? 'Enabled' : 'Disabled',
      tooltip: 'Whether slots can be enumerated'
    }
  ];

  // Advanced features
  const advancedFeatures = [
    {
      key: 'fractionalOwnership',
      label: 'Fractional Ownership',
      icon: Layers,
      enabled: properties.fractionalOwnershipEnabled || blocks.fractional_ownership_enabled,
      description: 'Supports fractional ownership of assets'
    },
    {
      key: 'mergable',
      label: 'Mergable',
      icon: Merge,
      enabled: properties.mergable || blocks.mergable,
      description: 'Tokens can be merged together'
    },
    {
      key: 'splittable',
      label: 'Splittable',
      icon: Split,
      enabled: properties.splittable || blocks.splittable,
      description: 'Tokens can be split into smaller units'
    },
    {
      key: 'valueAggregation',
      label: 'Value Aggregation',
      icon: BarChart3,
      enabled: properties.valueAggregation || blocks.value_aggregation,
      description: 'Token values can be aggregated'
    },
    {
      key: 'dynamicMetadata',
      label: 'Dynamic Metadata',
      icon: Settings,
      enabled: properties.dynamicMetadata || blocks.dynamic_metadata,
      description: 'Token metadata can change dynamically'
    },
    {
      key: 'permissioning',
      label: 'Permissioning',
      icon: Settings,
      enabled: properties.permissioningEnabled || blocks.permissioning_enabled,
      description: 'Advanced permission controls enabled'
    },
    {
      key: 'supplyTracking',
      label: 'Supply Tracking',
      icon: BarChart3,
      enabled: properties.supplyTracking || blocks.supply_tracking,
      description: 'Token supply is tracked per slot'
    },
    {
      key: 'updatableValues',
      label: 'Updatable Values',
      icon: TrendingUp,
      enabled: properties.updatableValues || blocks.updatable_values,
      description: 'Token values can be updated'
    }
  ];

  const enabledFeatures = advancedFeatures.filter(feature => feature.enabled);

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Tag className="h-4 w-4 text-pink-500" />
            Semi-Fungible Token Details
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

      {/* Slots */}
      {slots.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Coins className="h-4 w-4 text-pink-500" />
              Token Slots ({slots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as grid of cards
              <div className="grid grid-cols-2 gap-2">
                {slots.slice(0, 4).map((slot, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{slot.name || `Slot ${slot.slot_id}`}</span>
                      {slot.slot_transferable !== false && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Transferable
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      ID: {slot.slot_id}
                    </p>
                    {slot.value_units && (
                      <p className="text-xs text-gray-500">
                        Units: {slot.value_units}
                      </p>
                    )}
                  </div>
                ))}
                {slots.length > 4 && (
                  <div className="p-2 border rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      +{slots.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Value Units</TableHead>
                    <TableHead>Transferable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {slot.slot_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {slot.name || `Slot ${slot.slot_id}`}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {slot.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        {slot.value_units || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            slot.slot_transferable !== false 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {slot.slot_transferable !== false ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Allocations */}
      {allocations.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Token Allocations ({allocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show summary
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {allocations.length} allocation{allocations.length > 1 ? 's' : ''} across {
                    new Set(allocations.map(a => a.slot_id)).size
                  } slot{new Set(allocations.map(a => a.slot_id)).size > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {allocations.slice(0, 3).map((allocation, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      Slot {allocation.slot_id}: {formatNumber(allocation.value)}
                    </Badge>
                  ))}
                  {allocations.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      +{allocations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slot ID</TableHead>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {allocation.slot_id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {allocation.token_id_within_slot}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatNumber(allocation.value)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {allocation.recipient ? 
                          `${allocation.recipient.slice(0, 10)}...${allocation.recipient.slice(-8)}` : 
                          'Not specified'
                        }
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {allocation.created_at ? new Date(allocation.created_at).toLocaleDateString() : 'Unknown'}
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

      {/* Advanced Features */}
      {enabledFeatures.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
              {enabledFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-blue-50 border-blue-200 cursor-help">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-blue-800`}>
                            {feature.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{feature.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Configuration */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Settings className="h-4 w-4 text-purple-500" />
            Approval Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Slot Approvals
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  (properties.slotApprovals ?? blocks.slot_approvals ?? true)
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {(properties.slotApprovals ?? blocks.slot_approvals ?? true) ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Value Approvals
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  (properties.valueApprovals ?? blocks.value_approvals ?? true)
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {(properties.valueApprovals ?? blocks.value_approvals ?? true) ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Updatable URIs
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  (properties.updatableUris || blocks.updatable_uris)
                    ? 'bg-orange-50 text-orange-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                {(properties.updatableUris || blocks.updatable_uris) ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Updatable Slots
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  (properties.updatableSlots || blocks.updatable_slots)
                    ? 'bg-orange-50 text-orange-700' 
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                {(properties.updatableSlots || blocks.updatable_slots) ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Extensions */}
      {(properties.customExtensions || blocks.custom_extensions) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <FileText className="h-4 w-4 text-gray-500" />
              Custom Extensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Custom extensions are configured for this token.</p>
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 mt-2">
                Extensions Available
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC3525DataSection;