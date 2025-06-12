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

// Components
import TokenDeploymentForm from '@/components/tokens/components/TokenDeploymentForm';
import TokenDeploymentStatusSection from '@/components/tokens/components/deployment/TokenDeploymentStatusSection';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';

// Services
import { 
  getToken, 
  updateTokenDeployment 
} from '@/components/tokens/services/tokenService';
import { 
  useTokenization 
} from '@/components/tokens/hooks/useTokenization';
import { DeploymentService } from '@/services/deployment/DeploymentService';

// Utils
import { formatAddress } from '@/utils/shared/addressUtils';
import { getExplorerUrl } from '@/utils/shared/explorerUtils';

// Types
import { TokenDetails } from '@/components/tokens/interfaces/TokenInterfaces';
import { DeploymentStatus } from '@/types/deployment/deployment';

// Get singleton instance
const deploymentService = DeploymentService.getInstance();

// Add the import for useTokenProjectContext at the top of the file
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';

/**
 * Enhanced TokenDeployPage with real-time deployment status monitoring
 * and integration with TokenDeploymentService
 */
const TokenDeployPageEnhanced: React.FC = () => {
  // Replace direct useParams with useTokenProjectContext
  const { tokenId } = useParams<{ tokenId: string }>();
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  
  // State management
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('configure');
  const [standardInfo, setStandardInfo] = useState<Record<string, any>>({});
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  
  // Standard-specific information for deployment guidance
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
        { name: 'Batching', value: 'Efficient batch transfers' },
        { name: 'Metadata', value: 'URI pattern for metadata' },
        { name: 'Approval', value: 'Operator approval model' }
      ],
      deploymentRequirements: [
        'Name (optional)',
        'Base URI for metadata',
        'Initial token types and balances (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token minting (single and batch)',
        'Token transfers (single and batch)',
        'Metadata resolution'
      ]
    },
    'ERC-3525': {
      title: 'ERC-3525 Semi-Fungible Token',
      description: 'Semi-fungible token standard that combines aspects of ERC-20 and ERC-721',
      features: [
        { name: 'Fungibility', value: 'Semi-fungible (value + uniqueness)' },
        { name: 'Values', value: 'Tokens within same slot can have values' },
        { name: 'Slots', value: 'Tokens categorized by slots' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Decimals for values',
        'Slot configuration'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Token minting',
        'Value transfers',
        'Slot mapping'
      ]
    },
    'ERC-4626': {
      title: 'ERC-4626 Tokenized Vault',
      description: 'Standard for yield-bearing vaults with deposit/withdrawal mechanisms',
      features: [
        { name: 'Asset/Share', value: 'Conversion between assets and shares' },
        { name: 'Accounting', value: 'Standardized accounting functions' },
        { name: 'Limits', value: 'Max deposit/withdrawal limits' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Underlying asset address',
        'Fee structure (optional)',
        'Strategy configuration (optional)'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Asset deposits',
        'Share withdrawals',
        'Yield accrual'
      ]
    },
    'ERC-1400': {
      title: 'ERC-1400 Security Token',
      description: 'Security token standard with compliance and control features',
      features: [
        { name: 'Compliance', value: 'Built-in compliance checks' },
        { name: 'Partitions', value: 'Tokens can be partitioned' },
        { name: 'Controls', value: 'Issuer controls for transfers' }
      ],
      deploymentRequirements: [
        'Name and symbol',
        'Compliance rules',
        'Controller addresses'
      ],
      blockchainInteractions: [
        'Contract deployment',
        'Issuance and redemption',
        'Partition management',
        'Compliance checks'
      ]
    }
  };
  
  /**
   * Helper function to convert string status to DeploymentStatus enum
   */
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
  
  /**
   * Fetch token data and deployment status
   */
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
      const transformedToken: TokenDetails = {
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
      
      // If token is already deployed or has deployment status, switch to status tab
      if ((tokenData as any).address && (tokenData as any).blockchain) {
        setActiveTab('status');
      } else if (transformedToken.deployment_status === DeploymentStatus.DEPLOYING) {
        setActiveTab('status');
        setIsDeploying(true);
      }
    } catch (err) {
      console.error('Error fetching token:', err);
      setError(`Failed to load token: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load token details and set up deployment event listeners
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
          setIsDeploying(false);
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
  
  /**
   * Handle deployment success
   */
  const handleDeploymentSuccess = async (
    tokenAddress: string,
    transactionHash: string
  ) => {
    try {
      // Update database with the new deployment details
      await updateTokenDeployment(tokenId as string, {
        address: tokenAddress,
        blockchain: 'ethereum', // Should get this from the deployment form
        transaction_hash: transactionHash,
        status: 'DEPLOYED'
      });

      // Reload the token data
      fetchTokenData();

      // Switch to the status tab
      setActiveTab('status');
      setDeploymentStatus(DeploymentStatus.SUCCESS);
    } catch (err) {
      console.error('Error updating deployment info:', err);
      setError(`Failed to update deployment details: ${(err as Error).message}`);
    }
  };
  
  /**
   * Handle starting a new deployment
   */
  const handleDeploymentStart = async (blockchain: string, environment: string) => {
    if (!projectId || !tokenId) return;
    
    setIsDeploying(true);
    setDeploymentStatus(DeploymentStatus.DEPLOYING);
    setActiveTab('status');
  };
  
  /**
   * Handle deployment status change
   */
  const handleDeploymentStatusChange = (status: DeploymentStatus) => {
    setDeploymentStatus(status);
    
    if (status === DeploymentStatus.SUCCESS || status === DeploymentStatus.FAILED) {
      setIsDeploying(false);
    }
  };
  
  /**
   * Handle token change (if navigating between tokens)
   */
  const handleTokenChange = (newTokenId: string) => {
    if (projectId) {
      navigate(`/projects/${projectId}/tokens/${newTokenId}/deploy`, { replace: true });
    }
  };
  
  return (
    <TokenPageLayout>
      {/* Loading state */}
      {isLoading ? (
        <div className="flex h-[400px] w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : token ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Deploy {token.name}
              </h1>
              <p className="text-muted-foreground">
                Deploy your token to a blockchain network.
              </p>
            </div>
            {/* Second TokenNavigation removed */}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="configure" disabled={isDeploying}>
                Configure Deployment
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className={deploymentStatus ? "relative" : ""}
              >
                {deploymentStatus && (
                  <div className="absolute -top-1 -right-1">
                    {deploymentStatus === DeploymentStatus.PENDING && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    {deploymentStatus === DeploymentStatus.DEPLOYING && (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                    {deploymentStatus === DeploymentStatus.SUCCESS && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {deploymentStatus === DeploymentStatus.FAILED && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
                Deployment Status
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="configure" className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Configure Deployment</h2>
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deployment Configuration</CardTitle>
                      <CardDescription>Fill in the deployment details below to deploy this token to a blockchain network.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <TokenDeploymentForm
                        tokenConfig={{
                          name: token.name,
                          symbol: token.symbol,
                          decimals: token.decimals,
                          totalSupply: token.total_supply || '0',
                          standard: token.standard,
                          features: token.blocks?.features || {},
                          metadata: token.blocks?.metadata || {}
                        }}
                        onDeploymentSuccess={handleDeploymentSuccess}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>{standardInfo.title || token.standard}</CardTitle>
                      <CardDescription>{standardInfo.description || 'Token standard information'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {standardInfo.features && (
                        <Collapsible defaultOpen>
                          <CollapsibleTrigger className="flex w-full items-center justify-between">
                            <h3 className="text-sm font-medium">Features</h3>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <ul className="space-y-2 text-sm">
                              {standardInfo.features.map((feature: any, index: number) => (
                                <li key={index} className="flex justify-between">
                                  <span className="text-muted-foreground">{feature.name}:</span>
                                  <span>{feature.value}</span>
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {standardInfo.deploymentRequirements && (
                        <Collapsible defaultOpen>
                          <CollapsibleTrigger className="flex w-full items-center justify-between">
                            <h3 className="text-sm font-medium">Deployment Requirements</h3>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <ul className="space-y-1 text-sm">
                              {standardInfo.deploymentRequirements.map((req: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {standardInfo.blockchainInteractions && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex w-full items-center justify-between">
                            <h3 className="text-sm font-medium">Blockchain Interactions</h3>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <ul className="space-y-1 text-sm">
                              {standardInfo.blockchainInteractions.map((interaction: string, index: number) => (
                                <li key={index}>{interaction}</li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Deployment Status</h2>
              <Separator className="my-4" />
              
              {token && (
                <TokenDeploymentStatusSection
                  token={token}
                  projectId={projectId || ''}
                  deploymentStatus={deploymentStatus}
                  onStatusChange={handleDeploymentStatusChange}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Token Not Found</AlertTitle>
          <AlertDescription>
            The requested token could not be found. Please select a valid token.
          </AlertDescription>
        </Alert>
      )}
    </TokenPageLayout>
  );
};

// Helper function to generate status badges with consistent styling
const getStatusBadge = (status: DeploymentStatus | null) => {
  if (!status) return null;
  
  switch (status) {
    case DeploymentStatus.PENDING:
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    case DeploymentStatus.DEPLOYING:
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Deploying</Badge>;
    case DeploymentStatus.SUCCESS:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Deployed</Badge>;
    case DeploymentStatus.FAILED:
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
    case DeploymentStatus.ABORTED:
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Aborted</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default TokenDeployPageEnhanced;
export { getStatusBadge };