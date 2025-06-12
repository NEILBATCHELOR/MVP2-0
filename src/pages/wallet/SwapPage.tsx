import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/services/wallet/WalletContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ethers } from "ethers";
import { z } from "zod";
import { 
  ArrowDown, 
  ArrowLeftRight, 
  RefreshCw, 
  Settings, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  BarChart3, 
  AlertTriangle,
  Clock,
  Wallet,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ExternalLink,
  ChevronsRight,
  Zap,
  AlertCircle,
  ArrowUpDown
} from "lucide-react";
import { SwapSettings } from "@/components/wallet/components/swap/SwapSettings";
import { SwapConfirmation } from "@/components/wallet/components/swap/SwapConfirmation";
import { SwapRouteInfo } from "@/components/wallet/components/swap/SwapRouteInfo";
import { TokenSelector } from "@/components/wallet/components/swap/TokenSelector";
import { VersionSelector } from "@/components/wallet/components/swap/VersionSelector";
import { HookSelector } from "@/components/wallet/components/swap/HookSelector";
import { 
  swapFormSchema, 
  SwapFormValues, 
  Token, 
  Quote, 
  TransactionResult, 
  SwapRouteStep,
  SwapState, 
  SwapProvider, 
  GasOption, 
  UniswapVersion 
} from "@/components/wallet/components/swap/types";
import { SwapService } from "@/services/wallet/SwapService";
import { Spinner } from "@/components/Spinner";
import { TransactionConfirmation } from "@/components/wallet/components/TransactionConfirmation";
import { ErrorDisplay } from "@/components/wallet/components/ErrorDisplay";
import { MultiSigTransactionConfirmation } from "@/components/wallet/components/multisig/MultiSigTransactionConfirmation";
import { 
  getSwapQuote, 
  QuoteResponseData, 
  RouteSummary, 
  SwapParams,
  SwapResult
} from "@/services/wallet/SwapService";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshLink } from "@/components/ui/refresh-link";
import { BrowserProvider } from 'ethers';

// Initialize SwapService
const swapService = new SwapService();

// Updated TokenSelector import with correct props
interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (tokenAddress: string) => void; // Changed from tokenId to tokenAddress
  tokens: Token[];
  selectedTokenId?: string;
  excludeTokenId?: string;
}

export default function SwapPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallets, selectedWallet } = useWallet(); // Removed connectWallet
  
  // State management
  const [swapState, setSwapState] = useState<SwapState>("input");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState<"from" | "to" | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<"pending" | "confirmed" | "failed" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<SwapProvider>("auto");
  const [selectedGasOption, setSelectedGasOption] = useState<GasOption>("medium");
  const [isPriceImpactWarningOpen, setIsPriceImpactWarningOpen] = useState(false);
  
  // V4 specific state
  const [selectedVersion, setSelectedVersion] = useState<UniswapVersion>("auto");
  const [selectedHook, setSelectedHook] = useState<string>("0x0000000000000000000000000000000000000000");
  const [versionComparison, setVersionComparison] = useState<Record<UniswapVersion, Quote | null> | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  // Form for swap settings
  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapFormSchema),
    defaultValues: {
      fromToken: "",
      toToken: "",
      fromAmount: "",
      slippage: "0.5",
      deadline: 20,
      autoRouter: true
    },
  });

  // Create a connect wallet function if not provided by context
  const connectWallet = useCallback(async () => {
    try {
      // Basic implementation to request wallet connection
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new  BrowserProvider(window.ethereum);
        swapService.initializeProvider(provider);
        toast({
          title: "Wallet connected",
          description: "Your wallet has been connected successfully."
        });
      } else {
        toast({
          variant: "destructive",
          title: "No wallet found",
          description: "Please install a Web3 wallet like MetaMask."
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect to your wallet."
      });
    }
  }, [toast]);

  // Fetch tokens on component mount
  useEffect(() => {
    async function fetchTokens() {
      try {
        // In a real implementation, you would fetch tokens from a token list API
        // or blockchain directly. For now, we'll use a mock list
        const response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
        if (!response.ok) throw new Error('Failed to fetch token list');
        
        const data = await response.json();
        
        // Add balance information (this would come from wallet in production)
        const tokensWithBalance = data.tokens.slice(0, 30).map((token: any) => ({
          ...token,
          balance: (Math.random() * 10).toFixed(4),
          price: Math.random() * 100
        }));
        
        setAvailableTokens(tokensWithBalance);
        
        // Set default from and to tokens
        const eth = tokensWithBalance.find((t: Token) => t.symbol === 'ETH' || t.symbol === 'WETH');
        const usdc = tokensWithBalance.find((t: Token) => t.symbol === 'USDC');
        
        if (eth) setFromToken(eth);
        if (usdc) setToToken(usdc);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast({
          variant: "destructive",
          title: "Failed to load tokens",
          description: "Please try refreshing the page."
        });
      }
    }
    
    fetchTokens();
    
    // Initialize wallet connection
    if (selectedWallet) {
      try {
        const provider = new  BrowserProvider(window.ethereum);
        swapService.initializeProvider(provider);
      } catch (error) {
        console.error('Error initializing wallet provider:', error);
      }
    }
  }, [toast, selectedWallet]);

  // Fetch quote when tokens or amount changes
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote();
    } else {
      setSwapState("input");
      setQuote(null);
    }
  }, [fromToken, toToken, fromAmount, form.watch("slippage"), selectedProvider]);
  
  // Monitor transaction status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (txHash && transactionStatus === "pending") {
      intervalId = setInterval(async () => {
        try {
          const status = await swapService.getTransactionStatus(txHash);
          setTransactionStatus(status);
          
          if (status === "confirmed") {
            setSwapState("success");
            clearInterval(intervalId);
          } else if (status === "failed") {
            setSwapState("error");
            setErrorMessage("Transaction failed on the blockchain");
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [txHash, transactionStatus]);

  // Function to fetch quote based on current version setting
  const fetchQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }
    
    setIsQuoteLoading(true);
    setError(null);
    
    try {
      const slippage = parseFloat(form.getValues("slippage") || "1.0");
      
      // Use version-aware quote method
      const newQuote = await swapService.getQuoteWithVersion(
        fromToken,
        toToken,
        fromAmount,
        slippage,
        selectedVersion,
        selectedHook,
        selectedProvider
      );
      
      setQuote(newQuote);
      setToAmount(newQuote.toAmount);
      setSwapState("quote");
    } catch (error) {
      console.error("Error fetching quote:", error);
      setError(error.message || "Failed to get quote");
      setQuote(null);
    } finally {
      setIsQuoteLoading(false);
    }
  };
  
  // Compare quotes across different Uniswap versions
  const compareVersions = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }
    
    setIsComparing(true);
    
    try {
      const slippage = parseFloat(form.getValues("slippage") || "1.0");
      const comparison = await swapService.compareVersions(
        fromToken,
        toToken,
        fromAmount,
        slippage
      );
      
      setVersionComparison(comparison);
    } catch (error) {
      console.error("Error comparing versions:", error);
      toast({
        variant: "destructive",
        title: "Comparison failed",
        description: "Failed to compare Uniswap versions."
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (parseFloat(value) > 0 && fromToken && toToken) {
      fetchQuote();
    }
  };

  const handleFromTokenSelect = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setFromToken(token);
      setIsTokenSelectOpen(null);
      if (fromAmount && parseFloat(fromAmount) > 0 && toToken) {
        fetchQuote();
      }
    }
  };

  const handleToTokenSelect = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setToToken(token);
      setIsTokenSelectOpen(null);
      if (fromAmount && parseFloat(fromAmount) > 0 && fromToken) {
        fetchQuote();
      }
    }
  };

  const handleSwapTokens = () => {
    if (fromToken && toToken) {
      const tempFromToken = fromToken;
      const tempToAmount = toAmount;
      
      setFromToken(toToken);
      setToToken(tempFromToken);
      
      // Don't switch the amounts - instead refetch a quote
      if (toAmount && parseFloat(toAmount) > 0) {
        setFromAmount(toAmount);
        fetchQuote();
      }
    }
  };

  const handleConfirmSwap = () => {
    setSwapState("confirmation");
  };
  
  // Handle version change
  const handleVersionChange = (version: UniswapVersion) => {
    setSelectedVersion(version);
    // Reset version comparison when manually selecting a version
    setVersionComparison(null);
    
    // Re-fetch quote with new version
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote();
    }
  };
  
  // Handle hook selection
  const handleHookSelect = (hookAddress: string) => {
    setSelectedHook(hookAddress);
    
    // Re-fetch quote with new hook
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && selectedVersion === "v4") {
      fetchQuote();
    }
  };

  // Properly fix the performSwap function
  const performSwap = async () => {
    try {
      setSwapState("processing");
      
      if (!selectedWallet?.address) {
        throw new Error("No wallet selected");
      }
      
      // Mock successful transaction result
      // In a real implementation, this would call the API
      // const result = await apiExecuteSwap(swapParams);
      const mockResult: SwapResult = {
        txHash: `0x${Array.from({ length: 64 }).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`
      };
      
      setTxHash(mockResult.txHash);
      setSwapState("processing");
      
      // Monitor transaction
      const interval = setInterval(async () => {
        try {
          const status = await swapService.getTransactionStatus(mockResult.txHash);
          
          if (status === "confirmed") {
            clearInterval(interval);
            setSwapState("success");
          } else if (status === "failed") {
            clearInterval(interval);
            setErrorMessage("Transaction failed on the blockchain");
            setSwapState("error");
          }
        } catch (e) {
          console.error("Error checking transaction status:", e);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Swap execution error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      setSwapState("error");
    }
  };
  
  const resetSwap = () => {
    setSwapState("input");
    setToAmount("");
    setQuote(null);
    setError(null);
    setTxHash(null);
    setTransactionStatus(null);
    setErrorMessage(null);
    // Keep the tokens and fromAmount for user convenience
  };
  
  const openTokenSelector = (side: "from" | "to") => {
    setIsTokenSelectOpen(side);
  };

  // Render the token selection dropdown
  const renderTokenSelector = (
    selectedToken: Token | null,
    onSelect: (tokenAddress: string) => void,
    side: "from" | "to"
  ) => {
    return (
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-card px-2 py-1 ring-1 ring-border hover:ring-primary"
          onClick={() => openTokenSelector(side)}
        >
          {selectedToken ? (
            <>
              <img
                src={selectedToken.logoURI}
                alt={selectedToken.name}
                className="h-6 w-6 rounded-full"
                onError={(e) => {
                  // Fallback if token image fails to load
                  (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/generic.svg';
                }}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select token</span>
          )}
        </button>
      </div>
    );
  };

  // Render version comparison results
  const renderVersionComparison = () => {
    if (!versionComparison || isComparing) {
      return null;
    }
    
    const versionsWithQuotes = Object.entries(versionComparison)
      .filter(([version, quote]) => quote !== null && version !== "auto")
      .sort(([, quoteA], [, quoteB]) => 
        parseFloat((quoteB?.toAmount || "0")) - parseFloat((quoteA?.toAmount || "0"))
      );
    
    if (versionsWithQuotes.length === 0) {
      return (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">No quotes available for comparison</p>
        </div>
      );
    }
    
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Version Comparison</CardTitle>
          <CardDescription>
            Comparing output across Uniswap versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {versionsWithQuotes.map(([version, versionQuote]) => (
              <div 
                key={version} 
                className={`p-3 rounded-md flex justify-between items-center ${
                  version === selectedVersion ? "bg-primary/10 border border-primary" : "bg-muted"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      Uniswap {version.toUpperCase()}
                    </span>
                    {version === versionsWithQuotes[0][0] && (
                      <Badge variant="default" className="bg-green-500">Best</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {versionQuote?.gasCost?.eth && `~${versionQuote.gasCost.eth} ETH gas`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-right">
                    {versionQuote?.toAmount} {toToken?.symbol}
                  </div>
                  {version !== selectedVersion && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleVersionChange(version as UniswapVersion)}
                      className="h-7 px-2 text-xs"
                    >
                      Use this version
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Determine what content to render based on swap state
  const renderContent = () => {
    switch (swapState) {
      case "input":
      case "quote":
        return (
          <div className="space-y-4">
            {/* Version selector */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Swap</h2>
              <VersionSelector
                currentVersion={selectedVersion}
                onVersionChange={handleVersionChange}
                showBadges={true}
              />
            </div>
            
            {/* Token inputs */}
            <div className="space-y-4 relative">
              {/* From token */}
              <div className="p-4 rounded-lg border bg-card/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">From</span>
                  <span className="text-sm text-muted-foreground">
                    {fromToken?.balance && `Balance: ${fromToken.balance}`}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <Input
                    type="text"
                    placeholder="0.0"
                    className="text-2xl border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="min-w-32 flex items-center justify-between"
                    onClick={() => openTokenSelector("from")}
                  >
                    {fromToken ? (
                      <>
                        <div className="flex items-center">
                          <img
                            src={fromToken.logoURI}
                            alt={fromToken.symbol}
                            className="w-5 h-5 mr-2"
                          />
                          <span>{fromToken.symbol}</span>
                        </div>
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </>
                    ) : (
                      <>Select token <ChevronRight className="ml-2 w-4 h-4" /></>
                    )}
                  </Button>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {fromToken?.price && fromAmount
                      ? `~$${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}`
                      : " "}
                  </span>
                </div>
              </div>
              
              {/* Swap direction button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute rounded-full bg-background border shadow-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5"
                onClick={handleSwapTokens}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>

              {/* To token */}
              <div className="p-4 rounded-lg border bg-card/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">To</span>
                  <span className="text-sm text-muted-foreground">
                    {toToken?.balance && `Balance: ${toToken.balance}`}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <Input
                    type="text"
                    placeholder="0.0"
                    className="text-2xl border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                    value={toAmount}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    className="min-w-32 flex items-center justify-between"
                    onClick={() => openTokenSelector("to")}
                  >
                    {toToken ? (
                      <>
                        <div className="flex items-center">
                          <img
                            src={toToken.logoURI}
                            alt={toToken.symbol}
                            className="w-5 h-5 mr-2"
                          />
                          <span>{toToken.symbol}</span>
                        </div>
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </>
                    ) : (
                      <>Select token <ChevronRight className="ml-2 w-4 h-4" /></>
                    )}
                  </Button>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {toToken?.price && toAmount
                      ? `~$${(parseFloat(toAmount) * toToken.price).toFixed(2)}`
                      : " "}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hook selector when V4 is selected */}
            {selectedVersion === "v4" && (
              <HookSelector
                fromToken={fromToken}
                toToken={toToken}
                selectedHook={selectedHook}
                onHookSelect={handleHookSelect}
                isEnabled={selectedVersion === "v4"}
              />
            )}
            
            {/* Version comparison */}
            {!versionComparison && !isComparing && fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={compareVersions}
                disabled={isQuoteLoading}
              >
                {isComparing ? (
                  <>
                    <Spinner size="sm" /> Comparing versions...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Compare Uniswap versions
                  </>
                )}
              </Button>
            )}
            
            {renderVersionComparison()}
            
            {/* Quote information */}
            {quote && swapState === "quote" && (
              <>
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span>
                      1 {fromToken?.symbol} = {parseFloat(quote.exchangeRate).toFixed(6)} {toToken?.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Price Impact
                    </span>
                    <span className={parseFloat(quote.priceImpact) > 5 ? "text-destructive" : ""}>
                      {quote.priceImpact}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Min. Received
                    </span>
                    <span>
                      {quote.minimumReceived} {toToken?.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Network Fee
                    </span>
                    <span>
                      ~{quote.gasCost.eth} ETH (${quote.gasCost.usd})
                    </span>
                  </div>
                </div>
                
                {quote.routes && quote.routes.length > 0 && (
                  <SwapRouteInfo 
                    route={quote.routes.map(route => ({
                      protocol: route.name,
                      tokenIn: {
                        address: route.hops[0].address,
                        symbol: route.hops[0].symbol,
                        logoURI: route.hops[0].logoURI
                      },
                      tokenOut: {
                        address: route.hops[route.hops.length - 1].address,
                        symbol: route.hops[route.hops.length - 1].symbol,
                        logoURI: route.hops[route.hops.length - 1].logoURI
                      }
                    }))}
                    tokens={availableTokens.reduce((acc, token) => {
                      acc[token.address] = token;
                      return acc;
                    }, {} as Record<string, Token>)}
                  />
                )}
              </>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action button */}
            {selectedWallet ? (
              <Button 
                className="w-full" 
                size="lg"
                disabled={isQuoteLoading || !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0}
                onClick={swapState === "quote" ? handleConfirmSwap : fetchQuote}
              >
                {isQuoteLoading ? (
                  <><Spinner size="sm" /> Loading...</>
                ) : !fromToken || !toToken ? (
                  "Select tokens"
                ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                  "Enter amount"
                ) : swapState === "quote" ? (
                  "Confirm Swap"
                ) : (
                  "Get Quote"
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={connectWallet}>
                  Connect Wallet
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Or <a href="/wallet/new" className="text-primary hover:underline">create a new wallet</a>
                </p>
              </div>
            )}
          </div>
        );
        
      case "confirmation":
        // Make sure we have all required props before rendering SwapConfirmation
        if (!fromToken || !toToken || !quote) {
          // If any required prop is missing, go back to quote state
          setSwapState("quote");
          return null;
        }
        
        return (
          <SwapConfirmation 
            quote={quote} 
            fromToken={fromToken}
            toToken={toToken}
            slippage={parseFloat(form.getValues("slippage") || "0.5")}
            onConfirm={performSwap} 
            onCancel={() => setSwapState("quote")} 
          />
        );
        
      case "processing":
        return (
          <TransactionConfirmation 
            txHash={txHash}
            status="pending"
            title="Swap Processing"
            description="Your swap transaction is being processed on the blockchain"
            details={{
              from: fromToken?.symbol,
              to: toToken?.symbol,
              amount: fromAmount,
              expectedAmount: toAmount,
              timestamp: new Date().toISOString(),
            }}
            onBack={() => setSwapState("confirmation")}
          />
        );
      case "success":
        return (
          <TransactionConfirmation 
            txHash={txHash}
            status="confirmed"
            title="Swap Successful"
            description="Your swap has been successfully completed"
            details={{
              from: fromToken?.symbol,
              to: toToken?.symbol,
              amount: fromAmount,
              receivedAmount: toAmount,
              timestamp: new Date().toISOString(),
            }}
            onBack={resetSwap}
          />
        );
      case "error":
        return (
          <ErrorDisplay
            errorCode={errorMessage?.includes("insufficient funds") ? "INSUFFICIENT_FUNDS" : 
                      errorMessage?.includes("user rejected") ? "REJECTED_BY_USER" : 
                      errorMessage?.includes("network") ? "NETWORK_ERROR" : "UNKNOWN"}
            error={errorMessage || "An error occurred during the swap."}
            onRetry={() => {
              setSwapState("confirmation");
              setErrorMessage(null);
            }}
            onBack={resetSwap}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Swap</CardTitle>
          <div className="flex space-x-2">
            <Select
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value as SwapProvider)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Best)</SelectItem>
                <SelectItem value="0x">0x Protocol</SelectItem>
                <SelectItem value="1inch">1inch</SelectItem>
                <SelectItem value="paraswap">ParaSwap</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Trade tokens instantly with the best rates across multiple DEXes.
        </CardDescription>
      </CardHeader>

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SwapSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          form={form}
        />
      )}

      {/* Token Selector Dialog */}
      {isTokenSelectOpen && (
        <TokenSelector
          isOpen={isTokenSelectOpen !== null}
          onClose={() => setIsTokenSelectOpen(null)}
          tokens={availableTokens}
          onSelectToken={isTokenSelectOpen === "from" ? handleFromTokenSelect : handleToTokenSelect}
          selectedTokenId={isTokenSelectOpen === "from" ? fromToken?.address : toToken?.address}
          excludeTokenId={isTokenSelectOpen === "from" ? toToken?.address : fromToken?.address}
        />
      )}

      <Card>
        <CardContent className="pt-6">{renderContent()}</CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Wallet</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedWallet ? 
                      `${selectedWallet.address.substring(0, 6)}...${selectedWallet.address.substring(selectedWallet.address.length - 4)}` : 
                      "Not connected"}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectedWallet ? navigate("/wallet") : connectWallet()}
              >
                {selectedWallet ? "Change" : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 