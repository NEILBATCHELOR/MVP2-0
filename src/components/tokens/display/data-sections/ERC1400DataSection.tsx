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
  Lock,
  Shield,
  FileText,
  Users,
  Key,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Scale,
  UserCheck
} from 'lucide-react';
import { UnifiedTokenData, formatNumber, formatSecurityType } from '../utils/token-display-utils';

interface ERC1400DataSectionProps {
  token: UnifiedTokenData;
  compact?: boolean;
}

const ERC1400DataSection: React.FC<ERC1400DataSectionProps> = ({
  token,
  compact = false
}) => {
  // Extract ERC1400 properties with fallbacks
  const properties = token.erc1400Properties || {};
  const blocks = token.blocks || {};
  const controllers = token.erc1400Controllers || [];
  const partitions = token.erc1400Partitions || [];
  const documents = token.erc1400Documents || [];
  
  // Basic security token details
  const basicDetails = [
    {
      label: 'Security Type',
      value: formatSecurityType(properties.securityType || blocks.security_type),
      tooltip: 'Type of security this token represents'
    },
    {
      label: 'Initial Supply',
      value: formatNumber(properties.initialSupply || blocks.initial_supply || '0'),
      tooltip: 'Initial number of tokens issued'
    },
    {
      label: 'Max Supply',
      value: properties.cap || blocks.cap ? formatNumber(properties.cap || blocks.cap) : 'Unlimited',
      tooltip: 'Maximum number of tokens that can be issued'
    },
    {
      label: 'Issuing Jurisdiction',
      value: properties.issuingJurisdiction || blocks.issuing_jurisdiction || 'Not Specified',
      tooltip: 'Legal jurisdiction where the token is issued'
    },
    {
      label: 'Issuing Entity',
      value: properties.issuingEntityName || blocks.issuing_entity_name || 'Not Specified',
      tooltip: 'Legal entity issuing the security token'
    },
    {
      label: 'Controllers',
      value: controllers.length.toString(),
      tooltip: 'Number of authorized controllers'
    },
    {
      label: 'Partitions',
      value: partitions.length.toString(),
      tooltip: 'Number of token partitions (classes)'
    },
    {
      label: 'Documents',
      value: documents.length.toString(),
      tooltip: 'Number of legal documents attached'
    }
  ];

  // Compliance features
  const complianceFeatures = [
    {
      key: 'requireKyc',
      label: 'KYC Required',
      icon: Key,
      enabled: properties.requireKyc || properties.enforceKyc || blocks.require_kyc || blocks.enforce_kyc,
      description: 'Know Your Customer verification required'
    },
    {
      key: 'whitelistEnabled', 
      label: 'Whitelist Enabled',
      icon: UserCheck,
      enabled: properties.whitelistEnabled || blocks.whitelist_enabled,
      description: 'Only whitelisted addresses can transact'
    },
    {
      key: 'forcedTransfers',
      label: 'Forced Transfers',
      icon: AlertCircle,
      enabled: properties.forcedTransfers || blocks.forced_transfers,
      description: 'Controllers can force token transfers'
    },
    {
      key: 'forcedRedemption',
      label: 'Forced Redemption',
      icon: AlertCircle,
      enabled: properties.forcedRedemptionEnabled || blocks.forced_redemption_enabled,
      description: 'Controllers can force token redemptions'
    },
    {
      key: 'autoCompliance',
      label: 'Auto Compliance',
      icon: CheckCircle,
      enabled: properties.autoCompliance || blocks.auto_compliance,
      description: 'Automated compliance checking enabled'
    },
    {
      key: 'manualApprovals',
      label: 'Manual Approvals',
      icon: FileText,
      enabled: properties.manualApprovals || blocks.manual_approvals,
      description: 'Manual approval required for transfers'
    }
  ];

  const enabledCompliance = complianceFeatures.filter(feature => feature.enabled);

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Lock className="h-4 w-4 text-green-500" />
            Security Token Details
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

      {/* Compliance Matrix */}
      <Card>
        <CardHeader className={compact ? 'py-3' : 'py-4'}>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Shield className="h-4 w-4 text-blue-500" />
            Compliance Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enabledCompliance.length > 0 ? (
            <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
              {enabledCompliance.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-green-50 border-green-200 cursor-help">
                          <IconComponent className="h-4 w-4 text-green-600" />
                          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-green-800`}>
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
          ) : (
            <p className="text-sm text-gray-500">No compliance features enabled</p>
          )}

          {/* Compliance Automation Level */}
          {(properties.complianceAutomationLevel || blocks.compliance_automation_level) && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-500" />
                <span className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  Automation Level:
                </span>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                  {(properties.complianceAutomationLevel || blocks.compliance_automation_level || 'manual')
                    .charAt(0).toUpperCase() + 
                   (properties.complianceAutomationLevel || blocks.compliance_automation_level || 'manual')
                    .slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partitions */}
      {partitions.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Scale className="h-4 w-4 text-indigo-500" />
              Token Partitions ({partitions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as badges
              <div className="flex flex-wrap gap-2">
                {partitions.slice(0, 4).map((partition, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {partition.name}: {partition.amount ? formatNumber(partition.amount) : 'No amount'}
                    {partition.transferable === false && ' (Non-transferable)'}
                  </Badge>
                ))}
                {partitions.length > 4 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{partitions.length - 4} more
                  </Badge>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partition ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transferable</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partitions.map((partition, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {partition.partition_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {partition.name}
                      </TableCell>
                      <TableCell>
                        {partition.amount ? formatNumber(partition.amount) : 'No amount'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            partition.transferable !== false 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {partition.transferable !== false ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {partition.partition_type || 'Standard'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Controllers */}
      {controllers.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Users className="h-4 w-4 text-orange-500" />
              Controllers ({controllers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show count and first controller
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {controllers.length} authorized controller{controllers.length > 1 ? 's' : ''}
                </p>
                {controllers[0] && (
                  <p className="text-xs font-mono text-gray-500">
                    {controllers[0].address?.slice(0, 10)}...{controllers[0].address?.slice(-8)}
                  </p>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controllers.map((controller, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {controller.address?.slice(0, 10)}...{controller.address?.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {controller.permissions?.map((permission, permIndex) => (
                            <Badge key={permIndex} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          )) || <span className="text-sm text-gray-500">All permissions</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {controller.created_at ? new Date(controller.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legal Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <FileText className="h-4 w-4 text-green-500" />
              Legal Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compact ? (
              // Compact view - show as badges
              <div className="flex flex-wrap gap-2">
                {documents.slice(0, 3).map((doc, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {doc.document_type || doc.name}
                  </Badge>
                ))}
                {documents.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{documents.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              // Full view - show as table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {doc.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type || 'Document'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {doc.document_hash ? 
                          `${doc.document_hash.slice(0, 8)}...${doc.document_hash.slice(-8)}` : 
                          'No hash'
                        }
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Geographic Restrictions */}
      {(properties.geographicRestrictions || blocks.geographic_restrictions) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Globe className="h-4 w-4 text-red-500" />
              Geographic Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(properties.geographicRestrictions || blocks.geographic_restrictions || []).map((restriction, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700">
                  {restriction}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Compliance Info */}
      {(properties.holdingPeriod || properties.maxInvestorCount || properties.investorAccreditation ||
        blocks.holding_period || blocks.max_investor_count || blocks.investor_accreditation) && (
        <Card>
          <CardHeader className={compact ? 'py-3' : 'py-4'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <Scale className="h-4 w-4 text-purple-500" />
              Investment Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
            {(properties.holdingPeriod || blocks.holding_period) && (
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Holding Period
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {properties.holdingPeriod || blocks.holding_period} days
                </p>
              </div>
            )}
            
            {(properties.maxInvestorCount || blocks.max_investor_count) && (
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Max Investors
                </p>
                <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {formatNumber(properties.maxInvestorCount || blocks.max_investor_count)}
                </p>
              </div>
            )}
            
            {(properties.investorAccreditation !== undefined || blocks.investor_accreditation !== undefined) && (
              <div>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Accreditation Required
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    (properties.investorAccreditation || blocks.investor_accreditation)
                      ? 'bg-orange-50 text-orange-700' 
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {(properties.investorAccreditation || blocks.investor_accreditation) ? 'Yes' : 'No'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ERC1400DataSection;