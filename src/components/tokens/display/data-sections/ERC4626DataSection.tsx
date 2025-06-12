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
  BarChart3,
  DollarSign,
  TrendingUp,
  Settings,
  Shield,
  RefreshCw,
  Zap,
  Info,
  Target,
  Coins,
  PieChart,
  AlertTriangle
} from 'lucide-react';
import { UnifiedTokenData, formatNumber } from '../utils/token-display-utils';

interface ERC4626DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC4626DataSection: React.FC<ERC4626DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC4626 properties with fallbacks
  const properties = token.erc4626Properties || {};
  const blocks = token.blocks || {};
  const strategyParams = token.erc4626StrategyParams || [];
  const assetAllocations = token.erc4626AssetAllocations || [];
  
  // Basic vault token details
  const basicDetails = [
    {
      label: 'Underlying Asset',
      value: properties.assetName || blocks.asset_name || 'Not Specified',
      tooltip: 'The underlying asset that this vault manages'
    },
    {
      label: 'Asset Symbol',
      value: properties.assetSymbol || blocks.asset_symbol || 'Unknown',
      tooltip: 'Symbol of the underlying asset'
    },
    {
      label: 'Asset Decimals',
      value: (properties.assetDecimals ?? blocks.asset_decimals ?? 18).toString(),
      tooltip: 'Number of decimal places for the underlying asset'
    },
    {
      label: 'Vault Type',
      value: (properties.vaultType || blocks.vault_type || 'yield')
        .charAt(0).toUpperCase() + (properties.vaultType || blocks.vault_type || 'yield').slice(1),
      tooltip: 'Type of vault strategy employed'
    },
    {
      label: 'Strategy',
      value: (properties.vaultStrategy || blocks.vault_strategy || 'simple')
        .charAt(0).toUpperCase() + (properties.vaultStrategy || blocks.vault_strategy || 'simple').slice(1),
      tooltip: 'Investment strategy used by the vault'
    },
    {
      label: 'Yield Source',
      value: (properties.yieldSource || blocks.yield_source || 'external')
        .charAt(0).toUpperCase() + (properties.yieldSource || blocks.yield_source || 'external').slice(1),
      tooltip: 'Source of yield generation'
    },
    {
      label: 'Strategy Params',
      value: strategyParams.length.toString(),
      tooltip: 'Number of strategy parameters configured'
    },
    {
      label: 'Asset Allocations',
      value: assetAllocations.length.toString(),
      tooltip: 'Number of asset allocation rules'
    }
  ];

  // Vault features
  const vaultFeatures = [
    {
      key: 'yieldOptimization',
      label: 'Yield Optimization',
      icon: TrendingUp,
      enabled: properties.yieldOptimizationEnabled || blocks.yield_optimization_enabled,
      description: 'Automated yield optimization strategies'
    },
    {
      key: 'automatedRebalancing',
      label: 'Auto Rebalancing',
      icon: RefreshCw,
      enabled: properties.automatedRebalancing || blocks.automated_rebalancing,
      description: 'Automated portfolio rebalancing'
    },
    {
      key: 'flashLoans',
      label: 'Flash Loans',
      icon: Zap,
      enabled: properties.flashLoans || blocks.flash_loans,
      description: 'Flash loan functionality available'
    },
    {
      key: 'emergencyShutdown',
      label: 'Emergency Shutdown',
      icon: AlertTriangle,
      enabled: properties.emergencyShutdown || blocks.emergency_shutdown,
      description: 'Emergency shutdown capability'
    },
    {
      key: 'performanceTracking',
      label: 'Performance Tracking',
      icon: BarChart3,
      enabled: properties.performanceTracking || blocks.performance_tracking,
      description: 'Performance metrics tracking'
    },
    {
      key: 'customStrategy',
      label: 'Custom Strategy',
      icon: Settings,
      enabled: properties.customStrategy || blocks.custom_strategy,
      description: 'Custom investment strategy implemented'
    }
  ];

  const enabledFeatures = vaultFeatures.filter(feature => feature.enabled);

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <BarChart3 className="h-4 w-4 text-cyan-500" />
            Vault Token Details
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
                    <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
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

      {/* Asset Information */}
      {(properties.assetAddress || blocks.asset_address) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Coins className="h-4 w-4 text-blue-500" />
              Underlying Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Asset Address
                </p>
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium font-mono truncate`}>
                  {properties.assetAddress || blocks.asset_address}
                </p>
              </div>
              
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Asset Name
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {properties.assetName || blocks.asset_name || 'Unknown Asset'}
                </p>
              </div>

              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Asset Symbol
                </p>
                <Badge variant="outline" className="text-xs">
                  {properties.assetSymbol || blocks.asset_symbol || 'N/A'}
                </Badge>
              </div>

              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Decimals
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {properties.assetDecimals ?? blocks.asset_decimals ?? 18}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Structure */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <DollarSign className="h-4 w-4 text-green-500" />
            Fee Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
            {/* Deposit Fee */}
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Deposit Fee
              </p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                {properties.depositFee || blocks.deposit_fee || '0'}%
              </p>
            </div>

            {/* Withdrawal Fee */}
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Withdrawal Fee
              </p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                {properties.withdrawalFee || blocks.withdrawal_fee || '0'}%
              </p>
            </div>

            {/* Management Fee */}
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Management Fee
              </p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                {properties.managementFee || blocks.management_fee || '0'}%
              </p>
            </div>

            {/* Performance Fee */}
            <div>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                Performance Fee
              </p>
              <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                {properties.performanceFee || blocks.performance_fee || '0'}%
              </p>
            </div>
          </div>

          {/* Fee Recipient */}
          {(properties.feeRecipient || blocks.fee_recipient) && (
            <div className="mt-4 pt-3 border-t">
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mb-1`}>
                Fee Recipient
              </p>
              <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium font-mono truncate`}>
                {properties.feeRecipient || blocks.fee_recipient}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit & Withdrawal Limits */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Target className="h-4 w-4 text-indigo-500" />
            Limits & Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
            {/* Deposit Limits */}
            {(properties.minDeposit || properties.maxDeposit || blocks.min_deposit || blocks.max_deposit) && (
              <>
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Min Deposit
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.minDeposit || blocks.min_deposit ? 
                      formatNumber(properties.minDeposit || blocks.min_deposit) : 'No limit'}
                  </p>
                </div>

                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Max Deposit
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.maxDeposit || blocks.max_deposit ? 
                      formatNumber(properties.maxDeposit || blocks.max_deposit) : 'No limit'}
                  </p>
                </div>
              </>
            )}

            {/* Withdrawal Limits */}
            {(properties.minWithdrawal || properties.maxWithdrawal || blocks.min_withdrawal || blocks.max_withdrawal) && (
              <>
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Min Withdrawal
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.minWithdrawal || blocks.min_withdrawal ? 
                      formatNumber(properties.minWithdrawal || blocks.min_withdrawal) : 'No limit'}
                  </p>
                </div>

                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Max Withdrawal
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.maxWithdrawal || blocks.max_withdrawal ? 
                      formatNumber(properties.maxWithdrawal || blocks.max_withdrawal) : 'No limit'}
                  </p>
                </div>
              </>
            )}

            {/* Other Limits */}
            {(properties.depositLimit || blocks.deposit_limit) && (
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Total Deposit Limit
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {formatNumber(properties.depositLimit || blocks.deposit_limit)}
                </p>
              </div>
            )}

            {(properties.withdrawalLimit || blocks.withdrawal_limit) && (
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Total Withdrawal Limit
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {formatNumber(properties.withdrawalLimit || blocks.withdrawal_limit)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Configuration */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Settings className="h-4 w-4 text-purple-500" />
            Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Strategy Info */}
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
              {(properties.rebalanceThreshold || blocks.rebalance_threshold) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Rebalance Threshold
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.rebalanceThreshold || blocks.rebalance_threshold}%
                  </p>
                </div>
              )}

              {(properties.liquidityReserve || blocks.liquidity_reserve) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Liquidity Reserve
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.liquidityReserve || blocks.liquidity_reserve}%
                  </p>
                </div>
              )}

              {(properties.maxSlippage || blocks.max_slippage) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Max Slippage
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.maxSlippage || blocks.max_slippage}%
                  </p>
                </div>
              )}
            </div>

            {/* Strategy Controller */}
            {(properties.strategyController || blocks.strategy_controller) && (
              <div className="pt-3 border-t">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mb-1`}>
                  Strategy Controller
                </p>
                <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium font-mono truncate`}>
                  {properties.strategyController || blocks.strategy_controller}
                </p>
              </div>
            )}

            {/* Strategy Documentation */}
            {(properties.strategyDocumentation || blocks.strategy_documentation) && (
              <div className="pt-3 border-t">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mb-1`}>
                  Strategy Documentation
                </p>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Documentation Available
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vault Features */}
      {enabledFeatures.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Shield className="h-4 w-4 text-blue-500" />
              Vault Features
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
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-cyan-50 border-cyan-200 cursor-help">
                          <IconComponent className="h-4 w-4 text-cyan-600" />
                          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-cyan-800`}>
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

      {/* Strategy Parameters */}
      {strategyParams.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Settings className="h-4 w-4 text-indigo-500" />
              Strategy Parameters ({strategyParams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as badges
              <div className="flex flex-wrap gap-2">
                {strategyParams.slice(0, 4).map((param, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {param.name}: {param.value}
                  </Badge>
                ))}
                {strategyParams.length > 4 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{strategyParams.length - 4} more
                  </Badge>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategyParams.map((param, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {param.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {param.value}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {param.param_type || 'string'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            param.is_required ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {param.is_required ? 'Required' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {param.description || 'No description'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Asset Allocations */}
      {assetAllocations.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <PieChart className="h-4 w-4 text-orange-500" />
              Asset Allocations ({assetAllocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show summary
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {assetAllocations.length} allocation rule{assetAllocations.length > 1 ? 's' : ''} configured
                </p>
                <div className="flex flex-wrap gap-1">
                  {assetAllocations.slice(0, 3).map((allocation, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {allocation.asset}: {allocation.percentage}%
                    </Badge>
                  ))}
                  {assetAllocations.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      +{assetAllocations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Expected APY</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetAllocations.map((allocation, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {allocation.asset}
                      </TableCell>
                      <TableCell className="font-medium">
                        {allocation.percentage}%
                      </TableCell>
                      <TableCell>
                        {allocation.protocol || 'Direct'}
                      </TableCell>
                      <TableCell>
                        {allocation.expected_apy ? `${allocation.expected_apy}%` : 'Variable'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {allocation.description || 'No description'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC4626DataSection;