/**
 * RAMP Quote Widget Component
 * 
 * Provides real-time cryptocurrency price quotes from RAMP Network
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calculator,
  Clock,
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';

import { RampNetworkManager } from '@/infrastructure/dfns/fiat/ramp-network-manager';
import type { 
  RampNetworkEnhancedConfig, 
  RampQuote, 
  RampQuoteRequest,
  RampPaymentMethod 
} from '@/types/ramp';

export interface RampQuoteWidgetProps {
  /** RAMP Network configuration */
  config: RampNetworkEnhancedConfig;
  
  /** Quote type */
  type: 'onramp' | 'offramp';
  
  /** Default crypto asset */
  defaultAsset?: string;
  
  /** Default fiat currency */
  defaultCurrency?: string;
  
  /** Default amount */
  defaultAmount?: string;
  
  /** Available payment methods */
  paymentMethods?: RampPaymentMethod[];
  
  /** Whether to auto-refresh quotes */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Whether to show payment method selection */
  showPaymentMethods?: boolean;
  
  /** Whether to show fee breakdown */
  showFeeBreakdown?: boolean;
  
  /** Whether to show exchange rate */
  showExchangeRate?: boolean;
  
  /** Callback when quote is generated */
  onQuote?: (quote: RampQuote) => void;
  
  /** Callback when proceed is clicked */
  onProceed?: (request: RampQuoteRequest, quote: RampQuote) => void;
  
  /** Additional CSS classes */
  className?: string;
}

export function RampQuoteWidget({
  config,
  type,
  defaultAsset = 'ETH',
  defaultCurrency = 'USD',
  defaultAmount = '100',
  paymentMethods = ['CARD_PAYMENT', 'APPLE_PAY', 'GOOGLE_PAY'],
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showPaymentMethods = true,
  showFeeBreakdown = true,
  showExchangeRate = true,
  onQuote,
  onProceed,
  className
}: RampQuoteWidgetProps) {
  // State
  const [cryptoAsset, setCryptoAsset] = useState(defaultAsset);
  const [fiatCurrency, setFiatCurrency] = useState(defaultCurrency);
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<RampPaymentMethod>(paymentMethods[0]);
  const [quote, setQuote] = useState<RampQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Refs
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const rampManagerRef = React.useRef<RampNetworkManager | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Initialize RAMP manager
  useEffect(() => {
    const manager = new RampNetworkManager(config);
    rampManagerRef.current = manager;
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config]);
  
  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !quote) return;
    
    const startAutoRefresh = () => {
      refreshIntervalRef.current = setInterval(() => {
        if (!loading) {
          fetchQuote(true);
        }
      }, refreshInterval);
    };
    
    startAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, quote, loading]);
  
  // Fetch quote
  const fetchQuote = useCallback(async (isRefresh = false) => {
    const manager = rampManagerRef.current;
    if (!manager || !amount || parseFloat(amount) <= 0) return;
    
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const request: RampQuoteRequest = {
        cryptoAssetSymbol: cryptoAsset,
        fiatCurrency,
        paymentMethodType: paymentMethod,
        ...(type === 'onramp' 
          ? { fiatValue: parseFloat(amount) }
          : { cryptoAmount: amount }
        )
      };
      
      // Convert RampQuoteRequest to FiatQuoteRequest format for the manager
      const fiatRequest = {
        amount: amount,
        fromCurrency: type === 'onramp' ? fiatCurrency : cryptoAsset,
        toCurrency: type === 'onramp' ? cryptoAsset : fiatCurrency,
        type: type as 'onramp' | 'offramp'
      };
      
      const result = await manager.getQuote(fiatRequest);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get quote');
      }
      
      setQuote(result.data);
      setLastUpdated(new Date());
      onQuote?.(result.data);
      
      if (!isRefresh) {
        toast({
          title: 'Quote Updated',
          description: 'Latest price quote has been fetched.',
        });
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get quote';
      setError(errorMsg);
      
      if (!isRefresh) {
        toast({
          title: 'Quote Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [cryptoAsset, fiatCurrency, amount, paymentMethod, type, onQuote, toast]);
  
  // Fetch quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && parseFloat(amount) > 0) {
        fetchQuote();
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timer);
  }, [fetchQuote]);
  
  // Handle proceed
  const handleProceed = () => {
    if (!quote) return;
    
    const request: RampQuoteRequest = {
      cryptoAssetSymbol: cryptoAsset,
      fiatCurrency,
      paymentMethodType: paymentMethod,
      ...(type === 'onramp' 
        ? { fiatValue: parseFloat(amount) }
        : { cryptoAmount: amount }
      )
    };
    
    onProceed?.(request, quote);
  };
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };
  
  // Format crypto amount
  const formatCrypto = (amount: string, symbol: string) => {
    const num = parseFloat(amount);
    return `${num.toFixed(6)} ${symbol}`;
  };
  
  // Get quote age in seconds
  const getQuoteAge = () => {
    if (!lastUpdated) return null;
    return Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  };
  
  // Check if quote is stale (older than 60 seconds)
  const isQuoteStale = () => {
    const age = getQuoteAge();
    return age !== null && age > 60;
  };
  
  const quoteAge = getQuoteAge();
  const isStale = isQuoteStale();
  
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {type === 'onramp' ? 'Buy' : 'Sell'} Quote
        </CardTitle>
        <CardDescription>
          Get real-time prices for your cryptocurrency transaction
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="cryptoAsset">Cryptocurrency</Label>
            <Select value={cryptoAsset} onValueChange={setCryptoAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="fiatCurrency">Currency</Label>
            <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({type === 'onramp' ? fiatCurrency : cryptoAsset})
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={type === 'onramp' ? '100' : '0.1'}
              min="0"
              step="0.000001"
            />
          </div>
          
          {/* Payment Method */}
          {showPaymentMethods && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as RampPaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Quote Section */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : quote ? (
          <div className="space-y-4">
            {/* Quote Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isStale ? 'destructive' : 'default'}>
                  {isStale ? 'Stale Quote' : 'Live Quote'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchQuote(true)}
                  disabled={loading}
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  {quoteAge}s ago
                </span>
              )}
            </div>
            
            {/* Exchange Rate */}
            {showExchangeRate && quote.assetExchangeRate && (
              <div className="p-3 bg-accent rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exchange Rate</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      1 {cryptoAsset} = {formatCurrency(quote.assetExchangeRate, fiatCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quote Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>
                  {type === 'onramp' 
                    ? formatCurrency(quote.fiatValue, quote.fiatCurrency)
                    : formatCrypto(quote.cryptoAmount, cryptoAsset)
                  }
                </span>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span>
                  {type === 'onramp' 
                    ? formatCrypto(quote.cryptoAmount, cryptoAsset)
                    : formatCurrency(quote.fiatValue, quote.fiatCurrency)
                  }
                </span>
              </div>
              
              {/* Fee Breakdown */}
              {showFeeBreakdown && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fee:</span>
                    <span>{formatCurrency(quote.baseRampFee, quote.fiatCurrency)}</span>
                  </div>
                  {quote.networkFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Fee:</span>
                      <span>{formatCurrency(quote.networkFee, quote.fiatCurrency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Fee:</span>
                    <span>{formatCurrency(quote.appliedFee, quote.fiatCurrency)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quote Warning */}
            {isStale && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  This quote is stale. Refresh for the latest pricing.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Proceed Button */}
            <Button 
              onClick={handleProceed}
              className="w-full"
              disabled={isStale}
            >
              <Zap className="h-4 w-4 mr-2" />
              {type === 'onramp' ? 'Buy' : 'Sell'} {cryptoAsset}
            </Button>
            
            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  Quotes are valid for 60 seconds. Final exchange rate may vary slightly due to market conditions.
                </p>
              </div>
              <p>
                Payment method: {paymentMethod.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter an amount to get a quote</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RampQuoteWidget;
