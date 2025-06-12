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
  Input 
} from '@/components/ui/input';
import { 
  Label 
} from '@/components/ui/label';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  useTokenization 
} from '@/components/tokens/hooks/useTokenization';
import { 
  TokenStandard 
} from '@/types/core/centralModels';
import { 
  TransactionStatusBadge 
} from '@/components/tokens/components/TransactionStatusBadge';
import { 
  Separator 
} from '@/components/ui/separator';
import {
  Badge
} from '@/components/ui/badge';
import { 
  BlockchainBadge 
} from '@/components/tokens/components/BlockchainBadge';
import { 
  getToken 
} from '@/components/tokens/services/tokenService';
import { Json } from '@/types/core/database';
import TokenNavigation from '@/components/tokens/components/TokenNavigation';
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  address?: string;
  blockchain?: string;
  // Additional fields from API
  metadata?: Json;
  decimals?: number;
  total_supply?: string;
  blocks?: Json;
  project_id?: string;
  approvals?: string[];
  reviewers?: string[];
  contract_preview?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

const TokenMintPage: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tokenIdToMint, setTokenIdToMint] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  const { mintTokens, pendingTransactions } = useTokenization();
  
  const fetchTokenData = async () => {
    if (!tokenId || !projectId) {
      setIsLoading(false);
      setError(!tokenId ? "Token ID is undefined. Please select a valid token." : "Project ID is undefined. Please select a valid project.");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const tokenData = await getToken(tokenId);
      
      // Extract metadata and convert to proper format
      let metadataObj: Record<string, any> = {};
      if (tokenData.metadata && typeof tokenData.metadata === 'object') {
        metadataObj = tokenData.metadata as Record<string, any>;
      } else if (tokenData.metadata && typeof tokenData.metadata === 'string') {
        try {
          metadataObj = JSON.parse(tokenData.metadata as string);
        } catch (e) {
          console.error('Failed to parse metadata string', e);
        }
      }
      
      // Process token data to extract address and blockchain from metadata if they exist
      const processedToken: TokenDetails = {
        ...tokenData,
        blockchain: metadataObj.blockchain || undefined,
        address: metadataObj.address || undefined
      };
      
      setToken(processedToken);
      
      // If token is deployed to self, set it as default "to" address
      if (processedToken.address) {
        setToAddress('');
      }
    } catch (err) {
      setError(`Failed to load token: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTokenData();
  }, [tokenId, projectId]);
  
  const handleMint = async () => {
    if (!token || !token.address || !token.blockchain) {
      setError('Token must be deployed before minting');
      return;
    }
    
    if (!walletAddress) {
      setError('Wallet address is required');
      return;
    }
    
    if (!privateKey) {
      setError('Private key is required');
      return;
    }
    
    if (!toAddress) {
      setError('Recipient address is required');
      return;
    }
    
    // Determine token standard from string to enum
    const tokenStandard = token.standard as unknown as TokenStandard;
    
    if (!amount && tokenStandard !== TokenStandard.ERC721) {
      setError('Amount is required');
      return;
    }
    
    try {
      setIsMinting(true);
      setError(null);
      
      // Mint tokens
      const txHash = await mintTokens(
        token.blockchain,
        token.address,
        toAddress,
        amount || '1',
        walletAddress,
        privateKey,
        tokenIdToMint || undefined,
        data || undefined
      );
      
      setTransactionHash(txHash);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsMinting(false);
    }
  };
  
  // Find transaction status if we have a hash
  const getTransactionStatus = () => {
    if (!transactionHash) return 'unknown';
    
    const transaction = pendingTransactions[transactionHash];
    if (!transaction) return 'unknown';
    
    return transaction.status;
  };
  
  const handleTokenChange = (newTokenId: string) => {
    if (projectId) {
      navigate(`/projects/${projectId}/tokens/${newTokenId}/mint`, { replace: true });
    }
  };
  
  // Convert string standard to enum for comparison
  const getTokenStandard = (token: TokenDetails | null) => {
    if (!token) return null;
    
    const standardEnum = token.standard as unknown as TokenStandard;
    return {
      isERC20: standardEnum === TokenStandard.ERC20 || token.standard === 'ERC20',
      isERC721: standardEnum === TokenStandard.ERC721 || token.standard === 'ERC721',
      isERC1155: standardEnum === TokenStandard.ERC1155 || token.standard === 'ERC1155',
      isERC1400: standardEnum === TokenStandard.ERC1400 || token.standard === 'ERC1400',
      isERC3525: standardEnum === TokenStandard.ERC3525 || token.standard === 'ERC3525',
      isERC4626: standardEnum === TokenStandard.ERC4626 || token.standard === 'ERC4626',
    };
  };
  
  return (
    <TokenPageLayout
      title="Mint Tokens"
      description={`Mint tokens for ${token?.name || 'this token'}`}
      onRefresh={fetchTokenData}
      actionButton={
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Token
        </Button>
      }
    >
      {!token && isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
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
      ) : !token.address || !token.blockchain ? (
        <>
          <Alert className="mt-4">
            <AlertTitle>Token Not Deployed</AlertTitle>
            <AlertDescription>
              This token needs to be deployed to a blockchain before you can mint tokens.
              <div className="mt-4">
                <Button
                  onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}/deploy`)}
                >
                  Deploy Token
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader>
              <CardTitle>Mint {token.name} ({token.symbol})</CardTitle>
              <CardDescription>
                Send tokens to any address on the {token.blockchain || 'selected'} network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="walletAddress">Your Wallet Address</Label>
                  <Input 
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={!token.blockchain}
                  />
                </div>
                
                <div>
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input 
                    id="privateKey"
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key"
                    disabled={!token.blockchain}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This is only used locally and never stored
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => navigate(`/projects/${projectId}/tokens/${tokenId}/deploy`)}
              >
                Deploy First
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-6">
            <Card className="overflow-hidden border-none shadow-sm bg-muted/50">
              <CardHeader>
                <CardTitle>Token Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                      Not Deployed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Standard:</span>
                    <span>{token.standard}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader>
              <CardTitle>Mint {token.name} ({token.symbol})</CardTitle>
              <CardDescription>
                Send tokens to any address on the {token.blockchain} network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="walletAddress">Your Wallet Address</Label>
                  <Input 
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input 
                    id="privateKey"
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This is only used locally and never stored
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="toAddress">Recipient Address</Label>
                  <Input 
                    id="toAddress"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                
                {!getTokenStandard(token)?.isERC721 && (
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount"
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1.0"
                    />
                  </div>
                )}
                
                {getTokenStandard(token)?.isERC721 && (
                  <div>
                    <Label htmlFor="tokenId">Token ID</Label>
                    <Input 
                      id="tokenId"
                      type="text"
                      value={tokenIdToMint}
                      onChange={(e) => setTokenIdToMint(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                )}
                
                {getTokenStandard(token)?.isERC1155 && (
                  <div>
                    <Label htmlFor="data">Data (optional)</Label>
                    <Input 
                      id="data"
                      type="text"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <BlockchainBadge blockchain={token.blockchain || ''} />
              </div>
              <Button 
                onClick={handleMint} 
                disabled={isMinting || !token.address || !token.blockchain}
              >
                {isMinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Mint Tokens
              </Button>
            </CardFooter>
          </Card>
          
          {transactionHash && (
            <div className="mt-6">
              <Card className="overflow-hidden border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Transaction Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction Hash:</span>
                      <span className="font-mono text-sm">{transactionHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <TransactionStatusBadge status={getTransactionStatus()} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </TokenPageLayout>
  );
};

export default TokenMintPage;