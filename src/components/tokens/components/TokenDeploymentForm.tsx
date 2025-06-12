import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowRight, CheckCircle, ExternalLink, Info, Loader2, ShieldAlert } from 'lucide-react';
import BlockchainSelector from '@/components/tokens/components/BlockchainSelector';
import { useTokenization } from '@/components/tokens/hooks/useTokenization';
import { NetworkEnvironment, providerManager } from '@/infrastructure/web3/ProviderManager';
import type { SupportedChain, NetworkType } from '@/infrastructure/web3/adapters/IBlockchainAdapter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionStatusBadge } from '@/components/tokens/components/TransactionStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { BlockchainFactory } from '@/infrastructure/web3/factories/BlockchainFactory';

// Utility function for conditional class names
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Define better types for token configuration
export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  standard?: string;
  initialHolderAddress?: string;
  features?: {
    isBurnable?: boolean;
    isMintable?: boolean;
    isPausable?: boolean;
    isUpgradeable?: boolean;
  };
  metadata?: Record<string, string>;
}

interface TokenDeploymentFormProps {
  tokenConfig: TokenConfig;
  onDeploymentSuccess: (tokenAddress: string, transactionHash: string) => void;
}

interface TransactionDetails {
  token: string;
  status: 'pending' | 'success' | 'failed' | 'unknown';
  timestamp: number;
  hash?: string;
  confirmations?: number;
  blockNumber?: number;
  error?: string;
}

const TokenDeploymentForm: React.FC<TokenDeploymentFormProps> = ({
  tokenConfig,
  onDeploymentSuccess
}) => {
  const { deployToken, environment, setEnvironment, pendingTransactions } = useTokenization();
  
  const [blockchain, setBlockchain] = useState<string>('ethereum-goerli');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [networkDetails, setNetworkDetails] = useState<any>(null);
  const [isProviderAvailable, setIsProviderAvailable] = useState<boolean>(true);
  
  // Get network details when blockchain or environment changes
  React.useEffect(() => {
    try {
      // Extract base blockchain name
      const baseBlockchain = blockchain.split('-')[0];
      console.log(`Getting network details for ${baseBlockchain} (${environment})`);
      
      // Get network configuration based on blockchain and environment
      const chainId = BlockchainFactory.getChainId(baseBlockchain as SupportedChain, environment as NetworkType);
      const explorerUrl = BlockchainFactory.getExplorerUrl(baseBlockchain as SupportedChain, environment as NetworkType);
      const networkConfig = {
        name: `${baseBlockchain} ${environment}`,
        chainId,
        explorerUrl
      };
      console.log('Network config:', networkConfig);
      setNetworkDetails(networkConfig);
    } catch (err) {
      console.error("Error getting network details:", err);
      setNetworkDetails(null);
    }
  }, [blockchain, environment]);
  
  // Log available blockchains on mount
  React.useEffect(() => {
    try {
      const supportedBlockchains = BlockchainFactory.getSupportedChains();
      console.log('Supported blockchains:', supportedBlockchains);
      
      // Get EVM chains by filtering supported chains
      const evmChains = supportedBlockchains.filter(chain => 
        ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'].includes(chain)
      );
      console.log('EVM chains:', evmChains);
      
      // Check if providers are available
      evmChains.forEach(chain => {
        try {
          const provider = providerManager.getProviderForEnvironment(chain as SupportedChain, environment);
          console.log(`Provider for ${chain} (${environment}):`, provider ? 'Available' : 'Not available');
        } catch (err) {
          console.error(`Error getting provider for ${chain}:`, err);
        }
      });
    } catch (err) {
      console.error("Error getting blockchain information:", err);
    }
  }, [environment]);
  
  // Check if provider is available for the selected blockchain
  React.useEffect(() => {
    try {
      const baseBlockchain = blockchain.split('-')[0];
      const provider = providerManager.getProviderForEnvironment(baseBlockchain as SupportedChain, environment);
      setIsProviderAvailable(!!provider);
    } catch (err) {
      console.error(`Error checking provider for ${blockchain}:`, err);
      setIsProviderAvailable(false);
    }
  }, [blockchain, environment]);
  
  const handleBlockchainChange = (value: string) => {
    setBlockchain(value);
    setValidationErrors({});
  };
  
  const handleEnvironmentChange = async (value: string) => {
    await setEnvironment(value as NetworkEnvironment);
    setValidationErrors({});
  };
  
  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!walletAddress) {
      errors.walletAddress = 'Wallet address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      errors.walletAddress = 'Invalid Ethereum address format';
    }
    
    if (!privateKey) {
      errors.privateKey = 'Private key is required';
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey) && !/^[a-fA-F0-9]{64}$/.test(privateKey)) {
      errors.privateKey = 'Invalid private key format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleDeploymentConfirmation = () => {
    if (validateInputs()) {
      setShowConfirmation(true);
    }
  };
  
  const handleDeploy = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setShowConfirmation(false);
    
    try {
      setIsDeploying(true);
      setError(null);
      
      console.log(`Deploying token to ${blockchain} (${environment})`);
      
      // Create a temporary transaction hash for UI updates
      const tempTxHash = `pending-${Date.now()}`;
      setTransactionHash(tempTxHash);
      
      // Deploy token
      const tokenAddress = await deployToken(
        blockchain,
        tokenConfig,
        walletAddress,
        privateKey
      );
      
      console.log(`Token deployed successfully at address: ${tokenAddress}`);
      setDeployedTokenAddress(tokenAddress);
      
      // Find the actual transaction hash from pending transactions
      const actualTxHash = Object.keys(pendingTransactions).find(
        hash => pendingTransactions[hash].token === tokenAddress
      );
      
      if (actualTxHash) {
        setTransactionHash(actualTxHash);
        console.log(`Transaction hash: ${actualTxHash}`);
      }
      
      onDeploymentSuccess(tokenAddress, actualTxHash || tempTxHash);
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error(`Error deploying token:`, err);
      console.error(`Blockchain: ${blockchain}, Environment: ${environment}`);
      setError(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };
  
  // Find transaction status if we have a hash
  const getTransactionDetails = (): TransactionDetails | undefined => {
    if (!transactionHash) return undefined;
    
    const transaction = pendingTransactions[transactionHash];
    if (!transaction) return undefined;
    
    return transaction as TransactionDetails;
  };
  
  const getExplorerLink = (): string | null => {
    if (!transactionHash || !networkDetails?.explorerUrl) return null;
    
    // Check if it's a temporary hash (pending-timestamp)
    if (transactionHash.startsWith('pending-')) return null;
    
    return `${networkDetails.explorerUrl}/tx/${transactionHash}`;
  };
  
  const transactionDetails = getTransactionDetails();
  const explorerLink = getExplorerLink();
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Deploy Token</CardTitle>
          <CardDescription>
            Deploy your configured token to a blockchain network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isProviderAvailable && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">Provider Not Available</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                No provider is available for the selected blockchain ({blockchain}). 
                The token manager will attempt to use a fallback provider, but deployment may fail.
                Please select a different blockchain or check your network configuration.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="environment">Network Environment</Label>
            <Select 
              value={environment} 
              onValueChange={handleEnvironmentChange}
              disabled={isDeploying}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NetworkEnvironment.TESTNET}>Testnet</SelectItem>
                <SelectItem value={NetworkEnvironment.MAINNET}>Mainnet</SelectItem>
              </SelectContent>
            </Select>
            
            {environment === NetworkEnvironment.MAINNET && (
              <Alert variant="destructive" className="mt-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  You are deploying to MAINNET. This will incur real costs.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="blockchain">Blockchain Network</Label>
            <BlockchainSelector
              value={blockchain}
              onChange={handleBlockchainChange}
              disabled={isDeploying}
            />
            
            {networkDetails && (
              <div className="mt-2 text-sm flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {networkDetails.name}
                </Badge>
                {networkDetails.chainId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center text-muted-foreground">
                          <Info className="h-3 w-3 mr-1" />
                          Chain ID: {networkDetails.chainId}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Network Chain ID</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="walletAddress" className={cn(validationErrors.walletAddress && "text-destructive")}>
              Wallet Address
            </Label>
            <Input
              id="walletAddress"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
                if (validationErrors.walletAddress) {
                  setValidationErrors({...validationErrors, walletAddress: ''});
                }
              }}
              disabled={isDeploying}
              className={cn(validationErrors.walletAddress && "border-destructive")}
            />
            {validationErrors.walletAddress && (
              <p className="text-xs text-destructive">{validationErrors.walletAddress}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="privateKey" className={cn(validationErrors.privateKey && "text-destructive")}>
              Private Key
            </Label>
            <Input
              id="privateKey"
              type="password"
              placeholder="Enter private key"
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                if (validationErrors.privateKey) {
                  setValidationErrors({...validationErrors, privateKey: ''});
                }
              }}
              disabled={isDeploying}
              className={cn(validationErrors.privateKey && "border-destructive")}
            />
            {validationErrors.privateKey && (
              <p className="text-xs text-destructive">{validationErrors.privateKey}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your private key is never stored or sent to our servers
            </p>
          </div>
          
          {deployedTokenAddress && (
            <Alert className={cn(
              "border",
              transactionDetails?.status === "success" ? "border-green-600 bg-green-50 dark:bg-green-950/20" : 
              transactionDetails?.status === "failed" ? "border-red-600 bg-red-50 dark:bg-red-950/20" : 
              "border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
            )}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {transactionDetails?.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : transactionDetails?.status === "failed" ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                  )}
                  <AlertTitle>
                    {transactionDetails?.status === "success" ? "Token Deployed" : 
                     transactionDetails?.status === "failed" ? "Deployment Failed" : 
                     "Deploying Token"}
                  </AlertTitle>
                </div>
                
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground">Address:</span> 
                      <span className="font-mono text-sm">{deployedTokenAddress}</span>
                    </p>
                    
                    {transactionDetails && (
                      <div className="flex items-center gap-2">
                        <TransactionStatusBadge 
                          status={transactionDetails.status as any}
                          txHash={transactionHash || undefined}
                        />
                        
                        {explorerLink && (
                          <a 
                            href={explorerLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View on Explorer
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                    
                    {transactionDetails?.confirmations !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Confirmations: {transactionDetails.confirmations}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {/* Token Configuration Summary */}
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Token Configuration
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>Name:</div>
                <div className="font-medium">{tokenConfig.name}</div>
                
                <div>Symbol:</div>
                <div className="font-medium">{tokenConfig.symbol}</div>
                
                <div>Decimals:</div>
                <div className="font-medium">{tokenConfig.decimals}</div>
                
                <div>Total Supply:</div>
                <div className="font-medium">{tokenConfig.totalSupply}</div>
                
                {tokenConfig.features && (
                  <>
                    <div>Features:</div>
                    <div className="font-medium flex flex-wrap gap-1">
                      {tokenConfig.features.isBurnable && <Badge variant="secondary">Burnable</Badge>}
                      {tokenConfig.features.isMintable && <Badge variant="secondary">Mintable</Badge>}
                      {tokenConfig.features.isPausable && <Badge variant="secondary">Pausable</Badge>}
                      {tokenConfig.features.isUpgradeable && <Badge variant="secondary">Upgradeable</Badge>}
                    </div>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleDeploymentConfirmation} 
            disabled={isDeploying || !blockchain || !walletAddress || !privateKey}
            className="w-full"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                Deploy Token
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Token Deployment</DialogTitle>
            <DialogDescription>
              You are about to deploy a token to {networkDetails?.name || blockchain}. This action cannot be undone.
              {environment === NetworkEnvironment.MAINNET && (
                <p className="text-red-500 mt-2">
                  Warning: You are deploying to MAINNET. This will incur real costs.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2 text-sm py-4">
            <div className="font-medium">Token Name:</div>
            <div>{tokenConfig.name}</div>
            
            <div className="font-medium">Symbol:</div>
            <div>{tokenConfig.symbol}</div>
            
            <div className="font-medium">Total Supply:</div>
            <div>{tokenConfig.totalSupply}</div>
            
            <div className="font-medium">Network:</div>
            <div>{networkDetails?.name || blockchain}</div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Cancel</Button>
            <Button onClick={handleDeploy}>Confirm & Deploy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TokenDeploymentForm;