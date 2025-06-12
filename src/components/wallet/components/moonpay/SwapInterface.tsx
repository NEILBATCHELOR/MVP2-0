import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  ArrowUpDown, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  RefreshCw, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Route,
  Settings,
  ExternalLink
} from 'lucide-react';
import { 
  swapService, 
  SwapRouteAnalysis, 
  SwapPortfolioBalance, 
  SwapHistory,
  SwapSlippageSettings 
} from '@/services/wallet/moonpay/core/SwapService';
import { 
  MoonpaySwapPair, 
  MoonpaySwapQuote, 
  MoonpaySwapTransaction,
  MoonpayService 
} from '@/services/wallet/MoonpayService';
import { useWallet } from '@/services/wallet/WalletContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SwapInterfaceProps {
  onSwapCompleted?: (transaction: MoonpaySwapTransaction) => void;
}

type SwapStep = 'input' | 'route' | 'confirm' | 'executing' | 'complete';

const POPULAR_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
  { symbol: 'USDT', name: 'Tether', icon: '💰' },
  { symbol: 'ADA', name: 'Cardano', icon: '🟦' },
  { symbol: 'DOT', name: 'Polkadot', icon: '🔴' },
  { symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
  { symbol: 'SOL', name: 'Solana', icon: '🟡' }
];

const SwapInterface: React.FC<SwapInterfaceProps> = ({ onSwapCompleted }) => {
  const { wallets } = useWallet();
  
  // State management
  const [step, setStep] = useState<SwapStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Swap form state
  const [fromToken, setFromToken] = useState<string>('BTC');
  const [toToken, setToToken] = useState<string>('ETH');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [fromAddress, setFromAddress] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');

  // Advanced settings
  const [slippageSettings, setSlippageSettings] = useState<SwapSlippageSettings>({
    auto: true,
    maxSlippage: 3
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Data state
  const [swapPairs, setSwapPairs] = useState<MoonpaySwapPair[]>([]);
  const [currentQuote, setCurrentQuote] = useState<MoonpaySwapQuote | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<SwapRouteAnalysis | null>(null);
  const [portfolioBalances, setPortfolioBalances] = useState<SwapPortfolioBalance[]>([]);
  const [swapHistory, setSwapHistory] = useState<SwapHistory | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<MoonpaySwapTransaction | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (wallets.length > 0) {
      setFromAddress(wallets[0].address);
      setToAddress(wallets[0].address);
      loadPortfolioData();
    }
  }, [wallets]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      debouncedGetQuote();
    }
  }, [fromToken, toToken, fromAmount, fromAddress, toAddress]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const pairs = await swapService.getSwapPairs();
      setSwapPairs(pairs);
    } catch (err) {
      setError('Failed to load swap pairs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortfolioData = async () => {
    if (!wallets[0]?.address) return;
    
    try {
      const [balances, history] = await Promise.all([
        swapService.getPortfolioBalances(wallets[0].address),
        swapService.getSwapHistory(wallets[0].address, 20, 0)
      ]);
      
      setPortfolioBalances(balances);
      setSwapHistory(history);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    }
  };

  const debouncedGetQuote = debounce(getQuoteAndAnalysis, 1000);

  async function getQuoteAndAnalysis() {
    if (!fromAmount || !fromAddress || !toAddress) return;

    setIsLoading(true);
    setError('');

    try {
      // Get route analysis
      const analysis = await swapService.analyzeSwapRoute(
        fromToken,
        toToken,
        parseFloat(fromAmount)
      );
      setRouteAnalysis(analysis);

      // Get quote
      const quoteWithAnalysis = await swapService.getSwapQuote(
        fromToken,
        toToken,
        parseFloat(fromAmount),
        fromAddress,
        toAddress,
        slippageSettings
      );
      
      // Extract the quote without slippageAnalysis for state
      const { slippageAnalysis, ...quote } = quoteWithAnalysis;
      setCurrentQuote(quote as MoonpaySwapQuote);
      setToAmount(quote.quoteAmount.toString());
    } catch (err) {
      setError(err.message);
      setCurrentQuote(null);
      setRouteAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleProceedToRoute = () => {
    if (!currentQuote || !routeAnalysis) {
      setError('Please get a quote first');
      return;
    }
    setStep('route');
  };

  const handleConfirmSwap = () => {
    setStep('confirm');
  };

  const handleExecuteSwap = async () => {
    if (!currentQuote) return;

    setStep('executing');
    setIsLoading(true);

    try {
      const transaction = await swapService.executeSwap(
        currentQuote.id,
        slippageSettings.maxSlippage
      );
      
      setCurrentTransaction(transaction);
      setStep('complete');
      
      if (onSwapCompleted) {
        onSwapCompleted(transaction);
      }
      
      // Refresh portfolio data
      await loadPortfolioData();
    } catch (err) {
      setError(err.message);
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSwap = () => {
    setStep('input');
    setFromAmount('');
    setToAmount('');
    setCurrentQuote(null);
    setRouteAnalysis(null);
    setCurrentTransaction(null);
    setError('');
  };

  const setMaxAmount = (currency: string) => {
    const balance = portfolioBalances.find(b => b.currency === currency);
    if (balance) {
      setFromAmount(balance.balance.toString());
    }
  };

  const renderTokenSelector = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    showBalance: boolean = false
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{POPULAR_TOKENS.find(t => t.symbol === value)?.icon}</span>
              <span>{value}</span>
              <span className="text-muted-foreground">
                {POPULAR_TOKENS.find(t => t.symbol === value)?.name}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {POPULAR_TOKENS.map((token) => (
            <SelectItem key={token.symbol} value={token.symbol}>
              <div className="flex items-center gap-2">
                <span>{token.icon}</span>
                <span>{token.symbol}</span>
                <span className="text-muted-foreground">{token.name}</span>
                {showBalance && portfolioBalances.find(b => b.currency === token.symbol) && (
                  <Badge variant="outline" className="ml-auto">
                    {portfolioBalances.find(b => b.currency === token.symbol)?.balance.toFixed(4)}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderInputStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Swap Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* From Token */}
        <div className="space-y-4">
          {renderTokenSelector('From', fromToken, setFromToken, true)}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount</Label>
              {portfolioBalances.find(b => b.currency === fromToken) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMaxAmount(fromToken)}
                >
                  Use Max
                </Button>
              )}
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
            {portfolioBalances.find(b => b.currency === fromToken) && (
              <div className="text-sm text-muted-foreground">
                Balance: {portfolioBalances.find(b => b.currency === fromToken)?.balance.toFixed(4)} {fromToken}
              </div>
            )}
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapTokens}
            className="rounded-full p-2"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-4">
          {renderTokenSelector('To', toToken, setToToken)}
          
          <div className="space-y-2">
            <Label>You'll receive (estimated)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        {/* Quote Summary */}
        {currentQuote && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exchange Rate</span>
              <span>1 {fromToken} = {currentQuote.rate.toFixed(6)} {toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Network Fee</span>
              <span>{currentQuote.fees.network} {fromToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Moonpay Fee</span>
              <span>{currentQuote.fees.moonpay} {fromToken}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Total Fee</span>
              <span>{currentQuote.fees.total} {fromToken}</span>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Settings
            </span>
            <RefreshCw className={`w-4 h-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
          </Button>
          
          {showAdvancedSettings && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Slippage Tolerance</Label>
                <div className="flex gap-2">
                  <Button
                    variant={slippageSettings.auto ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlippageSettings(prev => ({ ...prev, auto: true }))}
                  >
                    Auto
                  </Button>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="3.0"
                      value={slippageSettings.customPercentage || ''}
                      onChange={(e) => setSlippageSettings(prev => ({
                        ...prev,
                        auto: false,
                        customPercentage: parseFloat(e.target.value)
                      }))}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Address</Label>
                  <Input
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Address</Label>
                  <Input
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleProceedToRoute}
          disabled={!currentQuote || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Route className="mr-2 h-4 w-4" />
          )}
          Review Swap Route
        </Button>
      </CardContent>
    </Card>
  );

  const renderRouteStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Swap Route Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {routeAnalysis && (
          <>
            {/* Route Recommendation */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Recommended Route</span>
              </div>
              <p className="text-blue-800">{routeAnalysis.recommendation}</p>
            </div>

            {/* Direct Route */}
            {routeAnalysis.directRoute && (
              <div className={`p-4 rounded-lg border-2 ${
                routeAnalysis.bestRoute === 'direct' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Direct Route</h3>
                  {routeAnalysis.bestRoute === 'direct' && (
                    <Badge className="bg-green-500">Best Route</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Expected Output</div>
                    <div className="font-medium">
                      {routeAnalysis.directRoute.expectedOutput.toFixed(6)} {toToken}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Price Impact</div>
                    <div className="font-medium">
                      {(routeAnalysis.directRoute.priceImpact * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fees</div>
                    <div className="font-medium">
                      {routeAnalysis.directRoute.fees} {fromToken}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-4 h-4" />
                  <span>{fromToken}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>{toToken}</span>
                </div>
              </div>
            )}

            {/* Indirect Routes */}
            {routeAnalysis.indirectRoutes && routeAnalysis.indirectRoutes.length > 0 && (
              <div className={`p-4 rounded-lg border-2 ${
                routeAnalysis.bestRoute === 'indirect' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Best Indirect Route</h3>
                  {routeAnalysis.bestRoute === 'indirect' && (
                    <Badge className="bg-green-500">Best Route</Badge>
                  )}
                </div>
                
                {routeAnalysis.indirectRoutes[0] && (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Expected Output</div>
                        <div className="font-medium">
                          {routeAnalysis.indirectRoutes[0].expectedOutput.toFixed(6)} {toToken}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Price Impact</div>
                        <div className="font-medium">
                          {(routeAnalysis.indirectRoutes[0].priceImpact * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Fees</div>
                        <div className="font-medium">
                          {routeAnalysis.indirectRoutes[0].fees} {fromToken}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-4 h-4" />
                      <span>{fromToken}</span>
                      {routeAnalysis.indirectRoutes[0].intermediaryTokens.map((token, index) => (
                        <React.Fragment key={index}>
                          <ArrowRight className="w-4 h-4" />
                          <span>{token}</span>
                        </React.Fragment>
                      ))}
                      <ArrowRight className="w-4 h-4" />
                      <span>{toToken}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
            Back to Input
          </Button>
          <Button onClick={handleConfirmSwap} className="flex-1">
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Confirm Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span>You're swapping</span>
            <span className="font-medium">{fromAmount} {fromToken}</span>
          </div>
          <div className="flex justify-between">
            <span>You'll receive</span>
            <span className="font-medium">{toAmount} {toToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Exchange rate</span>
            <span>1 {fromToken} = {currentQuote?.rate.toFixed(6)} {toToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Network fee</span>
            <span>{currentQuote?.fees.network} {fromToken}</span>
          </div>
          <div className="flex justify-between">
            <span>Processing time</span>
            <span>~{currentQuote?.estimatedProcessingTime || 10} minutes</span>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This swap will be executed immediately and cannot be reversed. Please verify all details are correct.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('route')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleExecuteSwap} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Execute Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderExecutingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 animate-pulse" />
          Executing Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-6">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <div className="space-y-2">
            <div className="font-medium">Processing your swap...</div>
            <div className="text-sm text-muted-foreground">
              This may take a few minutes to complete
            </div>
          </div>
        </div>

        <Progress value={33} className="w-full" />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Transaction submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Awaiting confirmation...</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Settlement pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Swap Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <div className="space-y-2">
            <div className="text-xl font-medium">Swap Successful!</div>
            <div className="text-sm text-muted-foreground">
              Your tokens have been swapped successfully
            </div>
          </div>
        </div>

        {currentTransaction && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Transaction ID</span>
            </div>
            <div className="font-mono text-sm break-all">
              {currentTransaction.id}
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <Badge className="bg-green-500">{currentTransaction.status}</Badge>
            </div>
            {currentTransaction.txHash && (
              <div className="flex justify-between">
                <span>Tx Hash</span>
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={`https://etherscan.io/tx/${currentTransaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleStartNewSwap} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Start New Swap
        </Button>
      </CardContent>
    </Card>
  );

  const renderPortfolioSummary = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {portfolioBalances.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No portfolio data available
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              ${portfolioBalances.reduce((sum, balance) => sum + balance.valueUSD, 0).toFixed(2)}
            </div>
            
            <div className="space-y-2">
              {portfolioBalances.slice(0, 5).map((balance) => (
                <div key={balance.currency} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{POPULAR_TOKENS.find(t => t.symbol === balance.currency)?.icon}</span>
                    <span>{balance.currency}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{balance.balance.toFixed(4)}</div>
                    <div className="text-sm text-muted-foreground">
                      {balance.allocation.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSwapHistory = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Swaps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!swapHistory || swapHistory.transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No swap history available
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
                <div className="font-medium">${swapHistory.totalVolume.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Fees</div>
                <div className="font-medium">${swapHistory.totalFees.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {swapHistory.transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-sm">{tx.baseCurrency} → {tx.quoteCurrency}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{tx.baseAmount}</div>
                    <Badge 
                      variant={tx.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Token Swap</h1>
          <p className="text-muted-foreground">Exchange cryptocurrencies with best rates</p>
        </div>
        
        <Button variant="outline" onClick={loadInitialData}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Swap Interface */}
        <div className="lg:col-span-2">
          {step === 'input' && renderInputStep()}
          {step === 'route' && renderRouteStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'executing' && renderExecutingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {renderPortfolioSummary()}
          {renderSwapHistory()}
        </div>
      </div>
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export default SwapInterface;
