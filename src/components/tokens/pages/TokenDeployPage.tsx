import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TokenPageLayout from '../layout/TokenPageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertCircle, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Server,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { 
  Separator 
} from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import TokenDeploymentForm from '@/components/tokens/components/TokenDeploymentForm';
import DeploymentStatusCard from '@/components/tokens/components/deployment/DeploymentStatusCard';
import DeploymentHistoryView from '@/components/tokens/components/deployment/DeploymentHistoryView';
import { 
  getToken, 
  updateTokenDeployment 
} from '@/components/tokens/services/tokenService';
import { 
  useTokenization 
} from '@/components/tokens/hooks/useTokenization';
import { DeploymentService } from '@/services/deployment/DeploymentService';
import { DeploymentStatus } from '@/types/deployment/deployment';
import { formatAddress } from '@/utils/wallet/blockchain';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';

// Get singleton instance
const deploymentService = DeploymentService.getInstance();

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  blocks?: Record<string, any>;
  address?: string;
  blockchain?: string;
  decimals: number;
  total_supply?: string;
  deployment_status?: DeploymentStatus;
  deployment_transaction?: string;
  deployment_block?: number;
  deployment_timestamp?: string;
  deployment_environment?: string;
}

// Helper function to convert string status to DeploymentStatus enum
const stringToDeploymentStatus = (status: string): DeploymentStatus => {
  const statusMap: Record<string, DeploymentStatus> = {
    'PENDING': DeploymentStatus.PENDING,
    'pending': DeploymentStatus.PENDING,
    'DEPLOYING': DeploymentStatus.DEPLOYING,
    'deploying': DeploymentStatus.DEPLOYING,
    'SUCCESS': DeploymentStatus.SUCCESS,
    'success': DeploymentStatus.SUCCESS,
    'FAILED': DeploymentStatus.FAILED,
    'failed': DeploymentStatus.FAILED,
    'ABORTED': DeploymentStatus.ABORTED,
    'aborted': DeploymentStatus.ABORTED,
    'VERIFYING': DeploymentStatus.VERIFYING,
    'verifying': DeploymentStatus.VERIFYING,
    'VERIFIED': DeploymentStatus.VERIFIED,
    'verified': DeploymentStatus.VERIFIED,
    'VERIFICATION_FAILED': DeploymentStatus.VERIFICATION_FAILED,
    'verification_failed': DeploymentStatus.VERIFICATION_FAILED
  };
  
  return statusMap[status] || DeploymentStatus.PENDING;
};

const TokenDeployPage: React.FC = () => {
  const { projectId, tokenId } = useParams<{ projectId: string, tokenId: string }>();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('configure');
  const [standardInfo, setStandardInfo] = useState<Record<string, any>>({});
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  
  // Standard-specific information for deployment
  const standardInfoMap: Record<string, any> = {
    'ERC-20': {
      title: 'ERC-20 Token Standard',
      description: 'Fungible token standard for currencies and assets',
      features: [
        { name: 'Fungibility', value: 'Fully fungible' },
        { name: 'Divisibility', value: 'Divisible (configurable decimals)' },
        { name: 'Transfer', value: 'Standard transfer and transferFrom' },
        { name: 'Approval', value: 'Delegated spending via approve/allowance' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Decimals (typically 18)',
        'Initial supply (optional)',
        'Cap (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token minting',
        'Token transfers'
      ]
    },
    'ERC-721': {
      title: 'ERC-721 Token Standard',
      description: 'Non-fungible token standard for unique assets',
      features: [
        { name: 'Fungibility', value: 'Non-fungible (each token is unique)' },
        { name: 'Divisibility', value: 'Indivisible' },
        { name: 'Metadata', value: 'URI for off-chain metadata' },
        { name: 'Enumeration', value: 'Optional token enumeration' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Base URI for metadata',
        'Royalty configuration (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token minting',
        'Token transfers',
        'Metadata resolution'
      ]
    },
    'ERC-1155': {
      title: 'ERC-1155 Multi-Token Standard',
      description: 'Multi-token standard supporting both fungible and non-fungible tokens',
      features: [
        { name: 'Fungibility', value: 'Mixed (supports both fungible and non-fungible)' },
        { name: 'Batch Operations', value: 'Efficient batch transfers and minting' },
        { name: 'Metadata', value: 'URI for off-chain metadata' },
        { name: 'Gas Efficiency', value: 'Optimized for gas efficiency' }
      ],
      deploymentRequirements: [
        'Base URI for metadata',
        'Token types configuration',
        'Royalty configuration (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token minting (single or batch)',
        'Token transfers (single or batch)',
        'Metadata resolution'
      ]
    },
    'ERC-1400': {
      title: 'ERC-1400 Security Token Standard',
      description: 'Security token standard with compliance and regulatory features',
      features: [
        { name: 'Fungibility', value: 'Fungible with restrictions' },
        { name: 'Compliance', value: 'Built-in transfer restrictions and compliance' },
        { name: 'Partitioning', value: 'Token partitioning for different classes' },
        { name: 'Documents', value: 'On-chain document management' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Decimals',
        'Controller address',
        'Document URI',
        'Compliance configuration'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token issuance',
        'Compliant transfers',
        'Document management'
      ]
    },
    'ERC-3525': {
      title: 'ERC-3525 Semi-Fungible Token',
      description: 'Semi-fungible token standard with slot-based value',
      features: [
        { name: 'Fungibility', value: 'Semi-fungible (slot-based)' },
        { name: 'Divisibility', value: 'Divisible values within slots' },
        { name: 'Slot', value: 'Classification mechanism for tokens' },
        { name: 'Value', value: 'Quantitative property for tokens' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Slot decimals',
        'Value decimals',
        'Slot configuration'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Slot creation',
        'Token minting',
        'Value transfers'
      ]
    },
    'ERC-4626': {
      title: 'ERC-4626 Tokenized Vault Standard',
      description: 'Standardized tokenized vault for yield-bearing tokens',
      features: [
        { name: 'Fungibility', value: 'Fungible (yield-bearing)' },
        { name: 'Asset Management', value: 'Deposit/withdrawal of underlying assets' },
        { name: 'Yield', value: 'Standardized yield accrual' },
        { name: 'Accounting', value: 'Consistent accounting methods' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Underlying asset address',
        'Yield strategy configuration',
        'Fee configuration (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Asset deposits',
        'Share minting',
        'Asset withdrawals'
      ]
    }
  };

  const fetchTokenData = async () => {
    // Check if we have valid IDs
    if (!tokenId) {
      setIsLoading(false);
      setError("Token ID is undefined. Please select a valid token.");
      navigate(`/projects/${projectId}/tokens/select/deploy`);
      return;
    }
    
    if (!projectId) {
      setIsLoading(false);
      setError("Project ID is undefined. Please select a valid project.");
      navigate('/projects');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tokenData = await getToken(tokenId);
      
      // Transform database token into the TokenDetails structure
      const transformedToken = {
        id: tokenData.id,
        name: tokenData.name || 'Unnamed Token',
        symbol: tokenData.symbol || 'UNKNOWN',
        standard: tokenData.standard || 'Unknown Standard',
        decimals: tokenData.decimals || 18,
        blocks: typeof tokenData.blocks === 'object' && tokenData.blocks !== null ? 
          tokenData.blocks as Record<string, any> : {},
        address: (tokenData as any).address,
        blockchain: (tokenData as any).blockchain,
        total_supply: tokenData.total_supply || '0',
        deployment_status: (tokenData as any).deployment_status,
        deployment_transaction: (tokenData as any).deployment_transaction,
        deployment_block: (tokenData as any).deployment_block,
        deployment_timestamp: (tokenData as any).deployment_timestamp,
        deployment_environment: (tokenData as any).deployment_environment
      };
      
      setToken(transformedToken);
      
      // Set deployment status from token data or service
      if (transformedToken.deployment_status) {
        const statusValue = typeof transformedToken.deployment_status === 'string' 
          ? stringToDeploymentStatus(transformedToken.deployment_status)
          : transformedToken.deployment_status;
        setDeploymentStatus(statusValue);
      } else {
        // Try to get deployment status from service
        const status = await deploymentService.getDeploymentStatus(tokenId);
        if (status) {
          const statusValue = typeof status === 'string' 
            ? stringToDeploymentStatus(status)
            : status;
          setDeploymentStatus(statusValue);
        }
      }
      
      // Set standard-specific information
      if (transformedToken.standard && standardInfoMap[transformedToken.standard]) {
        setStandardInfo(standardInfoMap[transformedToken.standard]);
      } else {
        setStandardInfo({});
      }
      
      // If token is already deployed, switch to status tab
      if ((tokenData as any).address && (tokenData as any).blockchain) {
        setActiveTab('status');
      }
    } catch (err) {
      console.error('Error fetching token:', err);
      setError(`Failed to load token: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTokenData();
    
    // Set up listeners for deployment events
    const setupDeploymentListeners = () => {
      // Success listener
      const successListener = (data: any) => {
        if (data.tokenId === tokenId) {
          setDeploymentStatus(DeploymentStatus.SUCCESS);
          // Reload token to get updated details
          fetchTokenData();
        }
      };
      
      // Failed listener
      const failedListener = (data: any) => {
        if (data.tokenId === tokenId) {
          setDeploymentStatus(DeploymentStatus.FAILED);
          setError(data.error || 'Deployment failed');
        }
      };
      
      // Status listener
      const statusListener = (data: any) => {
        if (data.tokenId === tokenId) {
          setDeploymentStatus(data.status);
          if (data.status === DeploymentStatus.DEPLOYING) {
            setIsDeploying(true);
          } else if (data.status === DeploymentStatus.SUCCESS || 
                     data.status === DeploymentStatus.FAILED) {
            setIsDeploying(false);
          }
        }
      };
      
      deploymentService.registerCallback('success', successListener);
      deploymentService.registerCallback('failed', failedListener);
      deploymentService.registerCallback('status', statusListener);
      
      return () => {
        deploymentService.unregisterCallback('success', successListener);
        deploymentService.unregisterCallback('failed', failedListener);
        deploymentService.unregisterCallback('status', statusListener);
      };
    };
    
    const cleanupListeners = setupDeploymentListeners();
    return cleanupListeners;
  }, [tokenId, projectId]);
  
  const handleDeploymentSuccess = async (
    tokenAddress: string,
    transactionHash: string
  ) => {
    if (!token) return;
    
    try {
      setIsSaving(true);
      
      // Update token with deployment details
      await updateTokenDeployment(token.id, {
        address: tokenAddress,
        blockchain: token.blockchain || '',
        transaction_hash: transactionHash,
        status: 'deployed'
      });
      
      // Update local state
      setToken({
        ...token,
        address: tokenAddress
      });
      
      // Switch to details tab
      setActiveTab('details');
    } catch (err) {
      setError(`Failed to update token: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTokenChange = (newTokenId: string) => {
    navigate(`/projects/${projectId}/tokens/${newTokenId}/deploy`);
  };
  
  return (
    <TokenPageLayout
      title="Deploy Token"
      description={`Configure deployment for ${token?.name || 'this token'}`}
      onRefresh={fetchTokenData}
      actionButton={
        token?.address ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}/mint`)}
          >
            Mint Tokens
          </Button>
        ) : null
      }
    >
        {!token && isLoading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !token && error ? (
          <Alert variant="destructive" className="mb-6 border-none">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="mb-1">Error loading token</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
            <Button
              variant="outline"
              onClick={fetchTokenData}
              className="gap-1.5 mt-4"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </Alert>
        ) : !token ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token not found</AlertTitle>
            <AlertDescription>The requested token could not be found.</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* The header is now handled by TokenPageLayout in the parent component */}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="configure">Configure Deployment</TabsTrigger>
                <TabsTrigger value="details" disabled={!token.address}>
                  Deployment Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="configure" className="space-y-6">
                <Card className="overflow-hidden border-none shadow-sm w-full">
                  <CardHeader className="pb-2">
                    <CardTitle>{standardInfo.title || `${token.standard} Token Configuration`}</CardTitle>
                    <CardDescription>
                      {standardInfo.description || 'Review token configuration before deployment'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Token Basic Information */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-lg font-semibold">{token.name}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Symbol</p>
                        <p className="text-lg font-semibold">{token.symbol}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Decimals</p>
                        <p className="text-lg font-semibold">{token.decimals}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Standard-specific information */}
                    {standardInfo.features && standardInfo.features.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">Standard Features</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {standardInfo.features.map((feature: any, index: number) => (
                            <div key={index} className="flex space-x-2">
                              <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                              <div>
                                <p className="text-sm font-medium">{feature.name}</p>
                                <p className="text-sm text-muted-foreground">{feature.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    {/* Configuration Blocks */}
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Configuration Blocks</h3>
                      {token.blocks && Object.keys(token.blocks).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(token.blocks).map(([blockName, blockConfig]) => {
                            // Count non-empty properties
                            const propertyCount = Object.values(blockConfig as Record<string, any>)
                              .filter(value => value !== null && value !== undefined && value !== '').length;
                            
                            return (
                              <Collapsible key={blockName} className="border rounded-lg overflow-hidden">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 bg-muted/30">
                                  <div className="flex items-center">
                                    <Server className="h-4 w-4 mr-2 text-primary" />
                                    <h4 className="text-sm font-medium">
                                      {blockName.charAt(0).toUpperCase() + blockName.replace(/([A-Z])/g, ' $1').slice(1)}
                                    </h4>
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center">
                                    <ChevronDown className="h-4 w-4" />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-4 border-t bg-background">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {Object.entries(blockConfig as Record<string, any>).map(([key, value]) => {
                                        // Skip empty values
                                        if (value === null || value === undefined || value === '') return null;
                                        
                                        // Format the key for better readability
                                        const formattedKey = key
                                          .replace(/([A-Z])/g, ' $1')
                                          .replace(/^./, (str) => str.toUpperCase());
                                        
                                        // Format the value based on its type
                                        let formattedValue = '';
                                        let valueClassName = 'text-sm font-medium break-words';
                                        
                                        if (typeof value === 'boolean') {
                                          formattedValue = value ? 'Yes' : 'No';
                                          valueClassName += value ? ' text-green-600' : ' text-gray-600';
                                        } else if (typeof value === 'object' && value !== null) {
                                          try {
                                            formattedValue = JSON.stringify(value, null, 2);
                                            valueClassName += ' font-mono text-xs';
                                          } catch {
                                            formattedValue = 'Complex configuration';
                                          }
                                        } else {
                                          formattedValue = String(value);
                                        }
                                        
                                        return (
                                          <div key={key} className="space-y-1 p-2 bg-muted/10 rounded border">
                                            <p className="text-xs font-medium text-muted-foreground">{formattedKey}</p>
                                            <p className={valueClassName}>{formattedValue}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 bg-muted/30 text-center">
                          <p className="text-muted-foreground">No configuration blocks found</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Deployment Requirements */}
                    {standardInfo.deploymentRequirements && standardInfo.deploymentRequirements.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <h3 className="text-base font-medium">Deployment Requirements</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {standardInfo.deploymentRequirements.map((req: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <p className="text-sm">{req}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Blockchain Interactions */}
                    {standardInfo.blockchainInteractions && standardInfo.blockchainInteractions.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <h3 className="text-base font-medium">Blockchain Interactions</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {standardInfo.blockchainInteractions.map((interaction: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <p className="text-sm">{interaction}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-sm w-full">
                  <CardHeader className="pb-2">
                    <CardTitle>Deployment Configuration</CardTitle>
                    <CardDescription>
                      Configure blockchain and deployment parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TokenDeploymentForm 
                      tokenConfig={{
                        name: token.name,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        totalSupply: token.total_supply || '0',
                        features: token.blocks?.features as any,
                        standard: token.standard
                      }}
                      onDeploymentSuccess={handleDeploymentSuccess}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6">
                {token.address ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="overflow-hidden border-none shadow-sm">
                      <CardHeader>
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <CardTitle>Deployment Successful</CardTitle>
                        </div>
                        <CardDescription>
                          Your token has been successfully deployed to the blockchain
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Token Address</p>
                            <code className="bg-muted px-3 py-2 rounded block overflow-x-auto text-sm">
                              {token.address}
                            </code>
                          </div>
                          
                          {token.blockchain && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">Blockchain</p>
                              <div className="flex items-center space-x-2">
                                <Server className="h-4 w-4 text-primary" />
                                <p className="font-medium">
                                  {token.blockchain.charAt(0).toUpperCase() + token.blockchain.slice(1)}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Deployment Status</p>
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <p className="font-medium">Active</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/token/${token.address}`, '_blank')}
                        >
                          View on Etherscan
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}/mint`)}
                        >
                          Mint Tokens
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="overflow-hidden border-none shadow-sm">
                      <CardHeader>
                        <CardTitle>Token Information</CardTitle>
                        <CardDescription>
                          Details about your deployed token
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="font-medium">{token.name}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Symbol</p>
                            <p className="font-medium">{token.symbol}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Standard</p>
                            <p className="font-medium">{token.standard}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Decimals</p>
                            <p className="font-medium">{token.decimals}</p>
                          </div>
                          {token.total_supply && (
                            <div className="space-y-2 col-span-2">
                              <p className="text-sm font-medium text-muted-foreground">Total Supply</p>
                              <p className="font-medium">{token.total_supply}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}`)}
                          className="w-full"
                        >
                          View Full Token Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ) : (
                  <Alert>
                    <Server className="h-4 w-4" />
                    <AlertTitle>Not Deployed</AlertTitle>
                    <AlertDescription>
                      This token has not been deployed to a blockchain network yet.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
    </TokenPageLayout>
  );
};

export default TokenDeployPage;