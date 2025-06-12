import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DollarSign,
  RefreshCw,
  Vote,
  Info
} from 'lucide-react';
import { UnifiedTokenData, formatNumber } from '../utils/token-display-utils';

interface ERC20DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC20DataSection: React.FC<ERC20DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC20 properties with fallbacks
  const properties = token.erc20Properties || {};
  const blocks = token.blocks || {};
  
  // Format token supply and cap
  const formattedSupply = formatNumber(token.total_supply || properties.initialSupply || blocks.initial_supply || '0');
  const formattedCap = properties.cap || blocks.cap ? formatNumber(properties.cap || blocks.cap) : 'Unlimited';
  
  // Get token type with proper capitalization
  const tokenType = properties.tokenType || blocks.token_type
    ? (properties.tokenType || blocks.token_type).charAt(0).toUpperCase() + 
      (properties.tokenType || blocks.token_type).slice(1)
    : 'Utility';
  
  // Get access control with proper capitalization
  const accessControl = properties.accessControl || blocks.access_control
    ? properties.accessControl === 'ownable' || blocks.access_control === 'ownable'
      ? 'Ownable'
      : properties.accessControl === 'roles' || blocks.access_control === 'roles'
        ? 'Role-Based'
        : 'None'
    : 'Ownable';

  // Basic token details
  const basicDetails = [
    {
      label: 'Decimals',
      value: token.decimals?.toString() || '18',
      tooltip: 'Number of decimal places for token amounts'
    },
    {
      label: 'Total Supply',
      value: formattedSupply,
      tooltip: 'Current total supply of tokens in circulation'
    },
    {
      label: 'Maximum Supply',
      value: formattedCap,
      tooltip: 'Maximum number of tokens that can ever exist'
    },
    {
      label: 'Token Type',
      value: tokenType,
      tooltip: 'Classification of token purpose (utility, security, governance, etc.)'
    },
    {
      label: 'Access Control',
      value: accessControl,
      tooltip: 'Permission system used to control token operations'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={compact ? 'text-base' : 'text-lg'}>
            Token Details
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

      {/* Fee on Transfer Configuration */}
      {(properties.feeOnTransfer || blocks.fee_on_transfer) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <DollarSign className="h-4 w-4 text-orange-500" />
              Fee on Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Fee Amount
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {(properties.feeOnTransfer?.fee || blocks.fee_on_transfer?.fee || '0')}
                  {(properties.feeOnTransfer?.feeType || blocks.fee_on_transfer?.feeType) === 'percentage' ? '%' : ' tokens'}
                </p>
              </div>
              
              {(properties.feeOnTransfer?.recipient || blocks.fee_on_transfer?.recipient) && (
                <div className={compact ? 'col-span-1' : 'col-span-2'}>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Fee Recipient
                  </p>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium font-mono truncate`}>
                    {properties.feeOnTransfer?.recipient || blocks.fee_on_transfer?.recipient}
                  </p>
                </div>
              )}
              
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Fee Type
                </p>
                <Badge variant="outline" className="text-xs">
                  {(properties.feeOnTransfer?.feeType || blocks.fee_on_transfer?.feeType || 'percentage').charAt(0).toUpperCase() + 
                   (properties.feeOnTransfer?.feeType || blocks.fee_on_transfer?.feeType || 'percentage').slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rebasing Configuration */}
      {(properties.rebasing || blocks.rebasing) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <RefreshCw className="h-4 w-4 text-cyan-500" />
              Rebasing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Mode
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {(properties.rebasing?.mode || blocks.rebasing?.mode) === 'automatic' 
                    ? 'Automatic' 
                    : 'Governance Controlled'}
                </p>
              </div>
              
              {(properties.rebasing?.targetSupply || blocks.rebasing?.targetSupply) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Target Supply
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {formatNumber(properties.rebasing?.targetSupply || blocks.rebasing?.targetSupply)}
                  </p>
                </div>
              )}
              
              {(properties.rebasing?.rebaseFrequency || blocks.rebasing?.rebaseFrequency) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Rebase Frequency
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {properties.rebasing?.rebaseFrequency || blocks.rebasing?.rebaseFrequency}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governance Configuration */}
      {(properties.governanceFeatures || blocks.governance_features) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Vote className="h-4 w-4 text-violet-500" />
              Governance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
              {(properties.governanceFeatures?.votingPeriod || blocks.governance_features?.votingPeriod) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Voting Period
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.governanceFeatures?.votingPeriod || blocks.governance_features?.votingPeriod} days
                  </p>
                </div>
              )}
              
              {(properties.governanceFeatures?.votingThreshold || blocks.governance_features?.votingThreshold) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Voting Threshold
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.governanceFeatures?.votingThreshold || blocks.governance_features?.votingThreshold}%
                  </p>
                </div>
              )}
              
              {(properties.governanceFeatures?.proposalThreshold || blocks.governance_features?.proposalThreshold) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Proposal Threshold
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {formatNumber(properties.governanceFeatures?.proposalThreshold || blocks.governance_features?.proposalThreshold)}
                  </p>
                </div>
              )}
              
              {(properties.governanceFeatures?.quorum || blocks.governance_features?.quorum) && (
                <div>
                  <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Quorum
                  </p>
                  <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                    {properties.governanceFeatures?.quorum || blocks.governance_features?.quorum}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC20DataSection;