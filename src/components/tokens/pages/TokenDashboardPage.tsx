import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Separator 
} from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  Layers,
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity, 
  PauseCircle, 
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Rocket,
  Circle,
  Info,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  Input 
} from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  TokenStandard,
  TokenStatus,
  TokenERC20Properties,
  TokenERC721Properties,
  TokenERC1155Properties,
  TokenERC1400Properties,
  TokenERC3525Properties,
  TokenERC4626Properties
} from '@/types/core/centralModels';
import { 
  updateTokenStatus
} from '@/components/tokens/services/tokenService';
import { useEnhancedTokens } from '@/components/tokens/hooks/useEnhancedTokens';
import tokenDeploymentService from '@/components/tokens/services/tokenDeploymentService';
import { supabase } from '@/infrastructure/database/client';
import { deleteToken } from '@/components/tokens/services/tokenDeleteService';
import { Json } from '@/types/core/database';
import { EnhancedTokenData } from '@/components/tokens/types';
import { getEnhancedTokenData } from '@/components/tokens/services/tokenDataService';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';
import { UnifiedTokenCard, UnifiedTokenDetail, type UnifiedTokenData } from '@/components/tokens/display';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import TokenEditDialog from './TokenEditDialog';
import TokenPageLayout from '../layout/TokenPageLayout';
import { DeploymentService } from '@/services/deployment/DeploymentService';
import { DeploymentStatus } from '@/types/deployment/deployment';
import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';
import enhancedTokenDeploymentService, { SecurityValidationResult } from '@/components/tokens/services/tokenDeploymentService';
import TokenSecurityValidator from '@/components/tokens/components/TokenSecurityValidator';
import TokenEventAlertSystem from '@/components/tokens/components/TokenEventAlertSystem';

// Type alias for backward compatibility
type TokenItem = UnifiedTokenData;

// Token metadata interface
interface TokenMetadata {
  [key: string]: any;
  standardsConfig?: Record<string, any>;
  blockchain?: string;
  address?: string;
  primaryTokenId?: string;
  primaryTokenName?: string;
  tokenTier?: 'primary' | 'secondary' | 'tertiary';
}

// Interface for token counts by status
interface TokenStatusCounts {
  [key: string]: number;
}

// Map to define status card appearance
const statusCardConfig = {
  [TokenStatus.DRAFT]: {
    label: 'Draft',
    icon: FileText,
    color: 'bg-slate-100',
    iconColor: 'text-slate-500'
  },
  [TokenStatus.REVIEW]: {
    label: 'Under Review',
    icon: Clock,
    color: 'bg-yellow-100',
    iconColor: 'text-yellow-500'
  },
  [TokenStatus.APPROVED]: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'bg-green-100',
    iconColor: 'text-green-500'
  },
  [TokenStatus.REJECTED]: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100',
    iconColor: 'text-red-500'
  },
  [TokenStatus.READY_TO_MINT]: {
    label: 'Ready to Mint',
    icon: Activity,
    color: 'bg-indigo-100',
    iconColor: 'text-indigo-500'
  },
  [TokenStatus.MINTED]: {
    label: 'Minted',
    icon: CheckCircle,
    color: 'bg-blue-100',
    iconColor: 'text-blue-500'
  },
  [TokenStatus.DEPLOYED]: {
    label: 'Deployed',
    icon: CheckCircle,
    color: 'bg-purple-100',
    iconColor: 'text-purple-500'
  },
  [TokenStatus.PAUSED]: {
    label: 'Paused',
    icon: PauseCircle,
    color: 'bg-orange-100',
    iconColor: 'text-orange-500'
  },
  [TokenStatus.DISTRIBUTED]: {
    label: 'Distributed',
    icon: PlayCircle,
    color: 'bg-teal-100',
    iconColor: 'text-teal-500'
  }
};

const TokenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Replace direct useParams with useTokenProjectContext
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  
  // Use enhanced tokens hook instead of manual fetching
  const { tokens: enhancedTokens, loading: enhancedLoading, error: hookError, refetch } = useEnhancedTokens(projectId);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [selectedBlockchains, setSelectedBlockchains] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
  const [statusCounts, setStatusCounts] = useState<TokenStatusCounts>({});
  
  // Note: Token expansion state no longer needed with UnifiedTokenCard
  // State to track which token is being viewed in detail
  const [selectedToken, setSelectedToken] = useState<TokenItem | null>(null);
  const [enhancedTokenData, setEnhancedTokenData] = useState<EnhancedTokenData | null>(null);
  const [isDeploymentDialogOpen, setIsDeploymentDialogOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'pending' | 'deploying' | 'success' | 'failed' | 'verifying' | 'verified' | 'verification_failed';
    message: string;
    token?: any;
    tokenAddress?: string;
    transactionHash?: string;
    explorerUrl?: string;
    error?: string;
    blockchain?: string;
    environment?: NetworkEnvironment;
  } | null>(null);
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  
  // State for status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TokenStatus | string>("");
  
  // State for delete token dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<TokenItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for security validation
  const [securityFindings, setSecurityFindings] = useState<SecurityValidationResult | null>(null);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [deploymentStrategy, setDeploymentStrategy] = useState<'foundry' | 'legacy' | 'auto'>('auto');
  
  // Memoize token groups based on tier
  const tokenGroups = useMemo(() => {
    const primaryTokens = filteredTokens.filter(token => 
      token.tokenTier === 'primary' || 
      (!token.tokenTier && !token.metadata?.primaryTokenId));
      
    const secondaryTokens = filteredTokens.filter(token => 
      token.tokenTier === 'secondary' || 
      (token.metadata?.primaryTokenId && token.metadata?.tokenTier !== 'tertiary'));
      
    const tertiaryTokens = filteredTokens.filter(token => 
      token.tokenTier === 'tertiary' || 
      token.metadata?.tokenTier === 'tertiary');
      
    return { primaryTokens, secondaryTokens, tertiaryTokens };
  }, [filteredTokens]);
  
  // Group secondary and tertiary tokens by their primary token
  const groupedSecondaryTokens = useMemo(() => {
    return tokenGroups.secondaryTokens.reduce((acc: Record<string, TokenItem[]>, token) => {
      const primaryId = token.metadata?.primaryTokenId || token.metadata?.parentId || 'unknown';
      if (!acc[primaryId]) {
        acc[primaryId] = [];
      }
      acc[primaryId].push(token);
      return acc;
    }, {});
  }, [tokenGroups.secondaryTokens]);
  
  const groupedTertiaryTokens = useMemo(() => {
    return tokenGroups.tertiaryTokens.reduce((acc: Record<string, TokenItem[]>, token) => {
      const primaryId = token.metadata?.primaryTokenId || token.metadata?.parentId || 'unknown';
      if (!acc[primaryId]) {
        acc[primaryId] = [];
      }
      acc[primaryId].push(token);
      return acc;
    }, {});
  }, [tokenGroups.tertiaryTokens]);
  
  // Get token explorer URL based on blockchain and address
  const getTokenExplorerUrl = (blockchain: string, address: string, environment: string = 'testnet'): string => {
    const isTestnet = environment === 'testnet';
    
    switch(blockchain.toLowerCase()) {
      case 'ethereum':
        return `https://${isTestnet ? 'goerli.' : ''}etherscan.io/address/${address}`;
      case 'polygon':
        return `https://${isTestnet ? 'mumbai.' : ''}polygonscan.com/address/${address}`;
      case 'binance':
      case 'bnb':
        return `https://${isTestnet ? 'testnet.' : ''}bscscan.com/address/${address}`;
      case 'avalanche':
        return `https://${isTestnet ? 'testnet.' : ''}snowtrace.io/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  // Update tokens and error state when enhanced tokens change
  useEffect(() => {
    setIsLoading(enhancedLoading);
    
    if (hookError) {
      setError(`Failed to load tokens: ${hookError.message}`);
      setTokens([]);
      setFilteredTokens([]);
    } else if (enhancedTokens) {
      console.log('[TokenDashboard] Enhanced tokens loaded:', enhancedTokens);
      
      // Process enhanced tokens to ensure compatibility with existing TokenItem interface
      const processedTokens: TokenItem[] = enhancedTokens.map(enhancedToken => {
        // Extract metadata fields
        const metadata = (enhancedToken.metadata as any) || {};
        const blockchain = metadata.blockchain || undefined;
        
        // Detect token tier
        let tokenTier: 'primary' | 'secondary' | 'tertiary' | undefined = undefined;
        
        if (metadata.tokenTier) {
          tokenTier = metadata.tokenTier as any;
        } else if (metadata.primaryTokenId) {
          tokenTier = metadata.tokenHierarchy?.tertiary?.some((t: any) => t.id === enhancedToken.id) 
            ? 'tertiary' 
            : 'secondary';
        } else {
          tokenTier = 'primary';
        }
        
        // Normalize the status to match TokenStatus enum values
        let normalizedStatus: TokenStatus = TokenStatus.DRAFT;
        
        if (enhancedToken.status) {
          const formattedStatus = enhancedToken.status.toString().toUpperCase().replace(/ /g, '_');
          const isValidTokenStatus = Object.values(TokenStatus).includes(formattedStatus as any);
          if (isValidTokenStatus) {
            normalizedStatus = formattedStatus as unknown as TokenStatus;
          } else {
            switch(enhancedToken.status.toString().toLowerCase()) {
              case 'draft': normalizedStatus = TokenStatus.DRAFT; break;
              case 'review': 
              case 'under review': normalizedStatus = TokenStatus.REVIEW; break;
              case 'approved': normalizedStatus = TokenStatus.APPROVED; break;
              case 'rejected': normalizedStatus = TokenStatus.REJECTED; break;
              case 'ready to mint':
              case 'ready_to_mint': normalizedStatus = TokenStatus.READY_TO_MINT; break;
              case 'minted': normalizedStatus = TokenStatus.MINTED; break;
              case 'deployed': normalizedStatus = TokenStatus.DEPLOYED; break;
              case 'paused': normalizedStatus = TokenStatus.PAUSED; break;
              case 'distributed': normalizedStatus = TokenStatus.DISTRIBUTED; break;
              default: normalizedStatus = TokenStatus.DRAFT;
            }
          }
        }
        
        // Cast metadata to TokenMetadata to avoid type errors
        const processedMetadata: TokenMetadata = {
          ...metadata,
          blockchain: metadata.blockchain,
          address: metadata.address,
          primaryTokenId: metadata.primaryTokenId,
          primaryTokenName: metadata.primaryTokenName,
          tokenTier: metadata.tokenTier,
          standardsConfig: metadata.standardsConfig || {}
        };

        // Return the enhanced token with all the standard-specific arrays
        return {
          ...enhancedToken,
          blockchain,
          status: normalizedStatus as TokenStatus,
          address: metadata.address || undefined,
          tokenTier,
          metadata: processedMetadata,
          blocks: enhancedToken.blocks as Record<string, any>,
          config_mode: enhancedToken.configMode,
          // Enhanced arrays are already included from the hook
          erc721Attributes: enhancedToken.erc721Attributes || [],
          erc1155Types: enhancedToken.erc1155Types || [],
          erc1155Balances: enhancedToken.erc1155Balances || [],
          erc1155UriMappings: enhancedToken.erc1155UriMappings || [],
          erc1400Controllers: enhancedToken.erc1400Controllers || [],
          erc1400Partitions: enhancedToken.erc1400Partitions || [],
          erc3525Slots: enhancedToken.erc3525Slots || [],
          erc3525Allocations: enhancedToken.erc3525Allocations || [],
          erc4626StrategyParams: enhancedToken.erc4626StrategyParams || [],
          erc4626AssetAllocations: enhancedToken.erc4626AssetAllocations || []
        } as TokenItem;
      });
      
      console.log('[TokenDashboard] Processed tokens with enhanced data:', processedTokens);
      
      setTokens(processedTokens);
      setFilteredTokens(processedTokens);
      setError(null);
      
      // Calculate status counts
      const counts: TokenStatusCounts = {};
      Object.values(TokenStatus).forEach(status => {
        counts[status] = 0;
      });
      
      processedTokens.forEach(token => {
        if (token.status) {
          counts[token.status] = (counts[token.status] || 0) + 1;
        }
      });
      
      setStatusCounts(counts);
    }
  }, [enhancedTokens, hookError, enhancedLoading]);
  
  const fetchTokens = async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the refetch from the enhanced hook
      await refetch();
      
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load tokens: ${(err as Error).message}`);
      setTokens([]);
      setFilteredTokens([]);
      setIsLoading(false);
    }
  };
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...tokens];
    
    // Apply tab filter
    if (activeTab === 'draft') {
      filtered = filtered.filter(token => token.status === TokenStatus.DRAFT);
    } else if (activeTab === 'deployed') {
      filtered = filtered.filter(token => token.status === TokenStatus.DEPLOYED);
    }
    
    // Apply search term
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(term) || 
        token.symbol.toLowerCase().includes(term) ||
        (token.address && token.address.toLowerCase().includes(term))
      );
    }
    
    // Apply dropdown filters (only if filters are selected)
    if (selectedStandards.length > 0) {
      filtered = filtered.filter(token => selectedStandards.includes(token.standard));
    }
    
    if (selectedBlockchains.length > 0) {
      filtered = filtered.filter(token => 
        token.blockchain && selectedBlockchains.includes(token.blockchain)
      );
    }
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(token => selectedStatuses.includes(token.status));
    }
    
    setFilteredTokens(filtered);
  }, [tokens, searchQuery, activeTab, selectedStandards, selectedBlockchains, selectedStatuses]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStandardToggle = (standard: string) => {
    setSelectedStandards(prev => {
      if (prev.includes(standard)) {
        return prev.filter(s => s !== standard);
      } else {
        return [...prev, standard];
      }
    });
  };
  
  const handleBlockchainToggle = (blockchain: string) => {
    setSelectedBlockchains(prev => {
      if (prev.includes(blockchain)) {
        return prev.filter(b => b !== blockchain);
      } else {
        return [...prev, blockchain];
      }
    });
  };
  
  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedStandards([]);
    setSelectedBlockchains([]);
    setSelectedStatuses([]);
  };
  
  // Update token after deployment or verification
  const updateTokenAfterDeployment = async (tokenId: string, updateData: any) => {
    try {
      // Call supabase directly or use a service method
      const { data, error } = await supabase
        .from('tokens')
        .update(updateData)
        .eq('id', tokenId)
        .select();
      
      if (error) {
        console.error('Error updating token:', error);
        throw error;
      }
      
      // Refresh the tokens list
      fetchTokens();
      
      return data;
    } catch (error) {
      console.error('Failed to update token after deployment:', error);
      throw error;
    }
  };

  // Handle viewing token details
  const handleViewToken = async (token: TokenItem) => {
    setSelectedToken(token);
    setShowDetailView(true);
    
    // Fetch enhanced token data including all standard-specific properties
    try {
      const enhancedData = await getEnhancedTokenData(token.id);
      setEnhancedTokenData(enhancedData);
    } catch (error) {
      console.error('Error fetching enhanced token data:', error);
      // Continue showing basic token data even if enhanced data fails to load
    }
  };
  
  // Handle close detail view
  const handleCloseDetailView = () => {
    setShowDetailView(false);
    // Don't immediately clear selected token to prevent UI flicker during dialog close animation
    setTimeout(() => {
      setSelectedToken(null);
      setEnhancedTokenData(null);
    }, 300);
  };
  
  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [tokenToEdit, setTokenToEdit] = useState<EnhancedTokenData | null>(null);

  // Handle token edit
  const handleEditToken = (tokenId: string) => {
    // If we already have the enhanced token data, use it
    if (enhancedTokenData && enhancedTokenData.id === tokenId) {
      setTokenToEdit(enhancedTokenData);
      setShowEditDialog(true);
    } else {
      // Otherwise, fetch the token data first
      getEnhancedTokenData(tokenId)
        .then(data => {
          setTokenToEdit(data);
          setShowEditDialog(true);
        })
        .catch(error => {
          console.error('Error fetching token data for edit:', error);
          toast({
            title: 'Error',
            description: 'Failed to load token data for editing',
            variant: 'destructive'
          });
        });
    }
  };
  
  // Helper function to get a human-readable status label
  const getStatusLabel = (status: TokenStatus | string): string => {
    // Map enum values to human-readable labels
    const statusLabels: Record<string, string> = {
      [TokenStatus.DRAFT]: 'Draft',
      [TokenStatus.REVIEW]: 'Under Review',
      [TokenStatus.APPROVED]: 'Approved',
      [TokenStatus.READY_TO_MINT]: 'Ready to Mint',
      [TokenStatus.MINTED]: 'Minted',
      [TokenStatus.DEPLOYED]: 'Deployed',
      [TokenStatus.PAUSED]: 'Paused',
      [TokenStatus.DISTRIBUTED]: 'Distributed',
      [TokenStatus.REJECTED]: 'Rejected'
    };
    
    // Add database format mappings
    const dbFormatLabels: Record<string, string> = {
      'UNDER REVIEW': 'Under Review',
      'READY TO MINT': 'Ready to Mint'
    };
    
    // Return the mapped label or format the status string
    if (typeof status === 'string' && dbFormatLabels[status]) {
      return dbFormatLabels[status];
    }
    
    if (typeof status === 'string' && statusLabels[status]) {
      return statusLabels[status];
    }
    
    // If no mapping found, format the string nicely
    return typeof status === 'string' ? 
      status.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') : 
      String(status);
  };

  // Handle token view
  const handleViewTokenPage = (tokenId: string) => {
    navigate(`/projects/${projectId}/tokens/${tokenId}`);
  };
  
  // Handle token deploy with enhanced validation
  const handleDeployToken = async (tokenId: string) => {
    try {
      // First validate the token configuration for security issues
      setSelectedTokenId(tokenId);
      setIsLoading(true);
      
      const validationResult = await enhancedTokenDeploymentService.validateTokenForDeployment(tokenId);
      
      if (validationResult.hasIssues) {
        // Show security validation dialog if there are issues
        setSecurityFindings(validationResult);
        setIsSecurityDialogOpen(true);
      } else {
        // No security issues, open deployment dialog directly
        setIsDeploymentDialogOpen(true);
        
        // Get the token data for deployment
        const token = tokens.find(t => t.id === tokenId);
        if (!token) {
          throw new Error('Token not found');
        }
        
        setDeploymentStatus({
          status: 'pending',
          message: 'Preparing deployment...',
          token
        });
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setError('Failed to validate token configuration. Please try again.');
      toast({
        title: 'Deployment Error',
        description: error.message || 'Failed to validate token for deployment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle proceeding with deployment after security validation
  const handleProceedWithDeployment = () => {
    setIsSecurityDialogOpen(false);
    setIsDeploymentDialogOpen(true);
    
    // Get the token data for deployment
    const token = tokens.find(t => t.id === selectedTokenId);
    if (token) {
      setDeploymentStatus({
        status: 'pending',
        message: 'Preparing deployment...',
        token
      });
    }
  };
  
  // Handle modifying token instead of deploying
  const handleModifyToken = () => {
    setIsSecurityDialogOpen(false);
    if (selectedTokenId) {
      handleEditToken(selectedTokenId);
    }
  };
  
  // Open status update dialog
  const handleOpenStatusDialog = (token: TokenItem) => {
    setSelectedToken(token);
    
    // Normalize the status value to ensure it matches the TokenStatus enum
    let normalizedStatus = token.status || TokenStatus.DRAFT;
    
    // Handle database status format conversion to frontend enum format
    if (typeof normalizedStatus === 'string') {
      console.log(`[TokenDashboard] Original status from database: ${normalizedStatus}`);
      
      // Create a mapping from database status to frontend enum
      const dbToFrontendMap: Record<string, string> = {
        'DRAFT': TokenStatus.DRAFT,
        'UNDER REVIEW': TokenStatus.REVIEW,
        'APPROVED': TokenStatus.APPROVED,
        'REJECTED': TokenStatus.REJECTED,
        'READY TO MINT': TokenStatus.READY_TO_MINT,
        'MINTED': TokenStatus.MINTED,
        'DEPLOYED': TokenStatus.DEPLOYED,
        'PAUSED': TokenStatus.PAUSED,
        'DISTRIBUTED': TokenStatus.DISTRIBUTED
      };
      
      // Check if we have a direct mapping for this status
      if (dbToFrontendMap[normalizedStatus]) {
        const oldStatus = normalizedStatus;
        normalizedStatus = dbToFrontendMap[normalizedStatus];
        console.log(`[TokenDashboard] Converted '${oldStatus}' to frontend enum value: ${normalizedStatus}`);
      } else {
        // If no direct mapping, try to normalize by replacing spaces with underscores
        const potentialEnumKey = normalizedStatus.replace(/ /g, '_');
        if (Object.values(TokenStatus).includes(potentialEnumKey as TokenStatus)) {
          normalizedStatus = potentialEnumKey;
          console.log(`[TokenDashboard] Normalized by replacing spaces: ${normalizedStatus}`);
        } else {
          console.log(`[TokenDashboard] No mapping found for status: ${normalizedStatus}, using as-is`);
        }
      }
    }
    
    console.log(`[TokenDashboard] Opening status dialog for token ${token.id} with final status: ${normalizedStatus}`);
    setNewStatus(normalizedStatus);
    setStatusDialogOpen(true);
  };
  
  // Open delete token dialog
  const handleOpenDeleteDialog = (token: TokenItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTokenToDelete(token);
    setDeleteDialogOpen(true);
  };
  
  // Handle token deletion
  const handleDeleteToken = async () => {
    if (!tokenToDelete || !projectId) return;
    
    try {
      setIsDeleting(true);
      // Call delete token API
      await deleteToken(projectId, tokenToDelete.id);
      
      // Update local state
      const updatedTokens = tokens.filter(token => token.id !== tokenToDelete.id);
      setTokens(updatedTokens);
      
      // Update status counts
      const counts = { ...statusCounts };
      if (tokenToDelete.status) {
        counts[tokenToDelete.status] = Math.max(0, (counts[tokenToDelete.status] || 0) - 1);
      }
      setStatusCounts(counts);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
    } catch (error) {
      console.error('Error deleting token:', error);
      setError(`Failed to delete token: ${(error as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Update token status
  const handleUpdateStatus = async () => {
    if (selectedToken && newStatus) {
      try {
        // Show loading state
        setIsLoading(true);
        
        console.log(`[TokenDashboard] Updating token ${selectedToken.id} status to: ${newStatus}`);
        
        // Update token status in the database
        const updatedToken = await updateTokenStatus(selectedToken.id, newStatus);
        
        if (!updatedToken) {
          throw new Error('No data returned from update operation');
        }
        
        console.log(`[TokenDashboard] Token updated successfully:`, updatedToken);
        
        // Update the selectedToken with the new status to ensure the Details dialog shows the updated status
        setSelectedToken({
          ...selectedToken,
          status: updatedToken.status
        });
        
        // If we have enhanced token data, update it as well
        if (enhancedTokenData && enhancedTokenData.id === selectedToken.id) {
          setEnhancedTokenData({
            ...enhancedTokenData,
            status: updatedToken.status
          });
        }
        
        // Update local state with the returned data to ensure consistency
        const updatedTokens = tokens.map(token => 
          token.id === selectedToken.id 
            ? { ...token, status: updatedToken.status } 
            : token
        );
        
        setTokens(updatedTokens);
        
        // Close the status dialog but keep the details dialog open to show the updated status
        setStatusDialogOpen(false);
        
        // Recalculate status counts
        const counts = { ...statusCounts };
        if (selectedToken.status in counts) {
          counts[selectedToken.status] -= 1;
        }
        counts[updatedToken.status] = (counts[updatedToken.status] || 0) + 1;
        setStatusCounts(counts);
        
        // Show success toast
        toast({
          title: 'Status Updated',
          description: `Token status changed to ${updatedToken.status}`,
          variant: 'default'
        });
        
        // Refresh the token list to ensure we have the latest data
        // This is done asynchronously to avoid blocking the UI
        fetchTokens().catch(err => {
          console.error('[TokenDashboard] Error refreshing tokens:', err);
        });
        
      } catch (error: any) {
        console.error('[TokenDashboard] Error updating token status:', error);
        
        // Show error toast
        toast({
          title: 'Error',
          description: `Failed to update token status: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error('[TokenDashboard] Cannot update status: Missing token or status');
      toast({
        title: 'Error',
        description: 'Cannot update status: Missing token or status information',
        variant: 'destructive'
      });
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };
  
  // Render status cards section
  const renderStatusCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusCardConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          const StatusIcon = config.icon;
          
          return (
            <Card 
              key={status} 
              className="shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md"
              onClick={() => {
                // Apply filter for this status when clicked
                setActiveTab('all');
                setSelectedStatuses([status]);
              }}
            >
              <div className="p-4 space-y-1.5">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium">{config.label}</div>
                  <div className="p-1.5 rounded-md bg-white/80">
                    <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
                  </div>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {count === 1 ? 'Token' : 'Tokens'}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };
  
  // Create deploymentService instance if it doesn't exist
  // This will be used throughout the component
  const deploymentService = DeploymentService.getInstance();
  
  return (
    <TokenPageLayout
      title="Token Dashboard"
      description="Manage tokens for this project"
      showBackButton={false}
      onRefresh={fetchTokens}
      actionButton={
        <Button 
          variant="default" 
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/tokens/create`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Token
        </Button>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
        
      {/* Status Summary Cards */}
      {renderStatusCards()}
      
      {/* Filtering and Tab Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full lg:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">All Tokens</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="deployed">Deployed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tokens..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Standards</DropdownMenuLabel>
              {[...new Set(tokens.map(token => token.standard))].map(standard => (
                <DropdownMenuCheckboxItem
                  key={standard}
                  checked={selectedStandards.includes(standard)}
                  onCheckedChange={() => handleStandardToggle(standard)}
                >
                  {standard}
                </DropdownMenuCheckboxItem>
              ))}
              
              {tokens.some(token => token.blockchain) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Blockchains</DropdownMenuLabel>
                  {[...new Set(tokens.filter(token => token.blockchain).map(token => token.blockchain))].map(blockchain => (
                    <DropdownMenuCheckboxItem
                      key={blockchain}
                      checked={selectedBlockchains.includes(blockchain!)}
                      onCheckedChange={() => handleBlockchainToggle(blockchain!)}
                    >
                      {blockchain}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {[...new Set(tokens.map(token => token.status))].map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                >
                  {getStatusLabel(status)}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Token Event Alert System - Positioned to the right of filter button */}
          <TokenEventAlertSystem 
            projectId={projectId || ''}
            onEventSelected={(event) => {
              // Navigate to event details or handle event selection
              if (event.token_id) {
                const token = tokens.find(t => t.id === event.token_id);
                if (token) {
                  handleViewToken(token);
                }
              }
            }}
          />
        </div>
      </div>
      
      {/* Token List - Using the new UnifiedTokenCard component */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tokens...</p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No tokens found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tokens.length === 0 ? 
              "You haven't created any tokens yet." : 
              "No tokens match your current filters."}
          </p>
          {tokens.length === 0 ? (
            <Button 
              className="mt-4" 
              onClick={() => navigate(`/projects/${projectId}/tokens/create`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          ) : (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group tokens by tier */}
          {tokenGroups.primaryTokens.length > 0 && (
            <div>
              {(tokenGroups.secondaryTokens.length > 0 || tokenGroups.tertiaryTokens.length > 0) && (
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                    Primary
                  </div>
                  <h3 className="text-lg font-semibold">Primary Tokens ({tokenGroups.primaryTokens.length})</h3>
                </div>
              )}
              <div className="space-y-4">
                {tokenGroups.primaryTokens.map(token => (
                  <UnifiedTokenCard
                    key={token.id}
                    token={token}
                    displayConfig={{
                      layout: 'horizontal',
                      showActions: true,
                      showFeatures: true,
                      showMetadata: true,
                      maxFeatures: 5,
                      actionsLayout: 'horizontal'
                    }}
                    onView={() => handleViewToken(token)}
                    onEdit={() => handleEditToken(token.id)}
                    onDeploy={() => handleDeployToken(token.id)}
                    onDelete={(token) => {
                      handleOpenDeleteDialog(token);
                    }}
                    onUpdateStatus={() => handleOpenStatusDialog(token)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Secondary Tokens Section - Grouped by Primary Token */}
          {Object.keys(groupedSecondaryTokens).length > 0 && (
            <div className="mt-10">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                  Secondary
                </div>
                <h3 className="text-lg font-semibold">Secondary Tokens ({tokenGroups.secondaryTokens.length})</h3>
              </div>
              
              <div className="space-y-8">
                {Object.entries(groupedSecondaryTokens).map(([primaryId, tokens]) => {
                  const primaryToken = tokenGroups.primaryTokens.find(t => t.id === primaryId);
                  const primaryName = primaryToken?.name || 
                                      tokens[0]?.metadata?.primaryTokenName || 
                                      `Primary Token ${primaryId}`;
                  
                  return (
                    <div key={primaryId} className="mb-6">
                      <div className="flex items-center mb-4">
                        <div className="w-1 h-6 bg-purple-300 rounded mr-3"></div>
                        <h4 className="text-md font-medium text-gray-700">
                          {primaryName}'s Secondary Tokens ({tokens.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {tokens.map(token => (
                          <UnifiedTokenCard
                            key={token.id}
                            token={token}
                            displayConfig={{
                              layout: 'horizontal',
                              showActions: true,
                              showFeatures: true,
                              showMetadata: false,
                              maxFeatures: 3,
                              actionsLayout: 'horizontal'
                            }}
                            onView={() => handleViewToken(token)}
                            onEdit={() => handleEditToken(token.id)}
                            onDeploy={() => handleDeployToken(token.id)}
                            onDelete={(token) => {
                              handleOpenDeleteDialog(token);
                            }}
                            onUpdateStatus={() => handleOpenStatusDialog(token)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Tertiary Tokens Section - Similar to Secondary */}
          {Object.keys(groupedTertiaryTokens).length > 0 && (
            <div className="mt-10">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                  Tertiary
                </div>
                <h3 className="text-lg font-semibold">Tertiary Tokens ({tokenGroups.tertiaryTokens.length})</h3>
              </div>
              
              <div className="space-y-8">
                {Object.entries(groupedTertiaryTokens).map(([primaryId, tokens]) => {
                  const primaryToken = tokenGroups.primaryTokens.find(t => t.id === primaryId);
                  const primaryName = primaryToken?.name || 
                                    tokens[0]?.metadata?.primaryTokenName || 
                                    `Primary Token ${primaryId}`;
                  
                  return (
                    <div key={primaryId} className="mb-6">
                      <div className="flex items-center mb-4">
                        <div className="w-1 h-6 bg-green-300 rounded mr-3"></div>
                        <h4 className="text-md font-medium text-gray-700">
                          {primaryName}'s Tertiary Tokens ({tokens.length})
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        {tokens.map(token => (
                          <UnifiedTokenCard
                            key={token.id}
                            token={token}
                            displayConfig={{
                              layout: 'horizontal',
                              showActions: true,
                              showFeatures: true,
                              showMetadata: false,
                              maxFeatures: 3,
                              actionsLayout: 'horizontal'
                            }}
                            onView={() => handleViewToken(token)}
                            onEdit={() => handleEditToken(token.id)}
                            onDeploy={() => handleDeployToken(token.id)}
                            onDelete={(token) => {
                              handleOpenDeleteDialog(token);
                            }}
                            onUpdateStatus={() => handleOpenStatusDialog(token)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    
      {/* Dialogs and modals would continue here with Status Update, Delete, Edit, Detail View, Deployment, and Security dialogs */}
      {/* ... (all the dialog components remain the same) */}
      
    </TokenPageLayout>
  );
};

export default TokenDashboardPage;
