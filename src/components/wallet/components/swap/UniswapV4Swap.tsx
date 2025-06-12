import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUpDown, Settings, Zap, TrendingUp, Info } from "lucide-react";
import { 
  Token, 
  Quote, 
  SwapFormValues, 
  UniswapVersion, 
  HookInfo 
} from "../swap/types";
import { SwapService } from "@/services/wallet/SwapService";
import { useWallet } from "@/services/wallet/WalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UniswapV4SwapProps {
  onSwapComplete?: (txHash: string) => void;
}

const POPULAR_TOKENS: Token[] = [
  {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    price: 3500
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
    price: 1
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    price: 65000
  },
  {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    symbol: "UNI",
    name: "Uniswap",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
    price: 10
  },
  {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png",
    price: 14
  }
];

const SAMPLE_HOOKS: HookInfo[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    name: "No Hook",
    description: "Standard swap without hooks",
    isVerified: true,
    implementedHooks: []
  },
  {
    address: "0x1234567890123456789012345678901234567890",
    name: "MEV Protection Hook",
    description: "Protects against MEV attacks and sandwich attacks",
    features: ["Anti-MEV", "Sandwich Protection"],
    isVerified: true,
    implementedHooks: ["BeforeSwap", "AfterSwap"],
    gasEstimate: 15000
  },
  {
    address: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
    name: "Dynamic Fee Hook", 
    description: "Automatically adjusts fees based on volatility",
    features: ["Dynamic Fees", "Volatility Based"],
    isVerified: true,
    implementedHooks: ["BeforeSwap"],
    gasEstimate: 8000
  },
  {
    address: "0x9876543210987654321098765432109876543210",
    name: "Limit Order Hook",
    description: "Enables limit orders within pools",
    features: ["Limit Orders", "TWAP"],
    isVerified: true,
    implementedHooks: ["BeforeSwap", "AfterSwap"],
    gasEstimate: 25000
  }
];

export const UniswapV4Swap: React.FC<UniswapV4SwapProps> = ({ onSwapComplete }) => {
  const { wallets } = useWallet();
  const [swapService] = useState(() => new SwapService());
  
  // Form state
  const [fromToken, setFromToken] = useState<Token>(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(POPULAR_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  
  // Uniswap V4 specific state
  const [version, setVersion] = useState<UniswapVersion>("auto");
  const [selectedHook, setSelectedHook] = useState<HookInfo>(SAMPLE_HOOKS[0]);
  const [availableHooks, setAvailableHooks] = useState<HookInfo[]>(SAMPLE_HOOKS);
  
  // UI state
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Version comparison
  const [versionComparison, setVersionComparison] = useState<Record<UniswapVersion, Quote | null>>({
    auto: null,
    v2: null,
    v3: null,
    v4: null
  });

  useEffect(() => {
    if (fromAmount && fromToken && toToken && selectedWallet) {
      debouncedGetQuote();
    }
  }, [fromAmount, fromToken, toToken, slippage, version, selectedHook]);

  const debouncedGetQuote = debounce(getQuote, 500);

  async function getQuote() {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setIsLoadingQuote(true);
    setError("");

    try {
      const quoteResult = await swapService.getQuoteWithVersion(
        fromToken,
        toToken,
        fromAmount,
        slippage,
        version,
        selectedHook.address
      );
      
      setQuote(quoteResult);
      setToAmount(quoteResult.toAmount);
    } catch (err) {
      setError(err.message);
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount("");
    setQuote(null);
  };

  const handleExecuteSwap = async () => {
    if (!quote || !selectedWallet) return;

    setIsSwapping(true);
    setError("");

    try {
      const txHash = await swapService.executeSwapWithVersion(
        fromToken,
        toToken,
        fromAmount,
        slippage,
        selectedWallet,
        version,
        selectedHook.address
      );

      if (onSwapComplete) {
        onSwapComplete(txHash);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCompareVersions = async () => {
    if (!fromAmount || !fromToken || !toToken) return;

    setIsLoadingQuote(true);
    try {
      const comparison = await swapService.compareVersions(
        fromToken,
        toToken,
        fromAmount,
        slippage
      );
      setVersionComparison(comparison);
    } catch (err) {
      console.error("Version comparison failed:", err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const renderTokenSelector = (
    token: Token,
    onSelect: (token: Token) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={token.address}
        onValueChange={(address) => {
          const selectedToken = POPULAR_TOKENS.find(t => t.address === address);
          if (selectedToken) onSelect(selectedToken);
        }}
      >
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
              <span>{token.symbol}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {POPULAR_TOKENS.map((t) => (
            <SelectItem key={t.address} value={t.address}>
              <div className="flex items-center gap-2">
                <img src={t.logoURI} alt={t.symbol} className="w-6 h-6 rounded-full" />
                <div>
                  <div className="font-medium">{t.symbol}</div>
                  <div className="text-sm text-muted-foreground">{t.name}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderVersionSelector = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Uniswap Version</label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCompareVersions}
          disabled={isLoadingQuote}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Compare
        </Button>
      </div>
      
      <Select
        value={version}
        onValueChange={(value: UniswapVersion) => setVersion(value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Recommended</Badge>
              <span>Auto-select best version</span>
            </div>
          </SelectItem>
          <SelectItem value="v4">
            <div className="flex items-center gap-2">
              <Badge variant="default">V4</Badge>
              <span>Uniswap V4 (Hooks + Gas Efficient)</span>
            </div>
          </SelectItem>
          <SelectItem value="v3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">V3</Badge>
              <span>Uniswap V3 (Concentrated Liquidity)</span>
            </div>
          </SelectItem>
          <SelectItem value="v2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">V2</Badge>
              <span>Uniswap V2 (Classic AMM)</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderHookSelector = () => (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        V4 Hooks
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Hooks add custom logic to swaps like MEV protection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </label>
      
      <Select
        value={selectedHook.address}
        onValueChange={(address) => {
          const hook = availableHooks.find(h => h.address === address);
          if (hook) setSelectedHook(hook);
        }}
      >
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{selectedHook.name}</span>
              {selectedHook.isVerified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableHooks.map((hook) => (
            <SelectItem key={hook.address} value={hook.address}>
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{hook.name}</span>
                  <div className="flex gap-1">
                    {hook.isVerified && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                    {hook.gasEstimate && (
                      <Badge variant="outline" className="text-xs">
                        +{(hook.gasEstimate / 1000).toFixed(0)}k gas
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {hook.description}
                </div>
                {hook.features && (
                  <div className="flex gap-1 mt-1">
                    {hook.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderVersionComparison = () => (
    versionComparison.v3 || versionComparison.v4 ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Version Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(versionComparison).map(([ver, quote]) => (
              quote && (
                <div key={ver} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={ver === 'v4' ? 'default' : 'outline'}>
                      {ver.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{quote.toAmount} {toToken.symbol}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {quote.gasCost.eth} ETH gas
                  </div>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    ) : null
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Uniswap V4 Swap</span>
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet</label>
            <Select value={selectedWallet} onValueChange={setSelectedWallet}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.address}>
                    <div className="flex items-center gap-2">
                      <span>{wallet.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          {renderTokenSelector(fromToken, setFromToken, "From")}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full p-2"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* To Token */}
          {renderTokenSelector(toToken, setToToken, "To")}

          {/* To Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">You receive</label>
            <Input
              type="text"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              {renderVersionSelector()}
              
              {version === 'v4' && renderHookSelector()}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Slippage Tolerance</label>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((pct) => (
                    <Button
                      key={pct}
                      variant={slippage === pct ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSlippage(pct)}
                    >
                      {pct}%
                    </Button>
                  ))}
                  <Input
                    type="number"
                    placeholder="Custom"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quote Display */}
          {quote && (
            <Card className="bg-muted">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Exchange Rate</span>
                  <span>{quote.exchangeRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price Impact</span>
                  <span className={parseFloat(quote.priceImpact) > 3 ? "text-red-500" : "text-green-500"}>
                    {quote.priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Network Fee</span>
                  <span>{quote.gasCost.eth} ETH (${quote.gasCost.usd})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minimum Received</span>
                  <span>{quote.minimumReceived} {toToken.symbol}</span>
                </div>
                {quote.provider && (
                  <div className="flex justify-between text-sm">
                    <span>Route</span>
                    <Badge variant="outline">{quote.provider}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleExecuteSwap}
            disabled={!quote || isSwapping || !selectedWallet}
            className="w-full"
          >
            {isSwapping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : isLoadingQuote ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Version Comparison */}
      {renderVersionComparison()}
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

export default UniswapV4Swap;
