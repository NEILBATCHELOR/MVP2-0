/**
 * RAMP Asset Selector Component
 * 
 * Allows users to select supported cryptocurrencies for RAMP Network transactions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { Search, Star, TrendingUp, ArrowRight } from 'lucide-react';

import { getRampNetworkDataService } from '@/services/dfns/ramp-network-data-service';
import type { 
  RampAssetInfo, 
  RampNetworkEnhancedConfig,
  RampAssetCacheEntry 
} from '@/types/ramp';

export interface RampAssetSelectorProps {
  /** RAMP Network configuration */
  config: RampNetworkEnhancedConfig;
  
  /** Flow type - determines which assets to show */
  flowType: 'onramp' | 'offramp' | 'both';
  
  /** Currently selected asset */
  selectedAsset?: RampAssetInfo | null;
  
  /** Callback when asset is selected */
  onAssetSelect: (asset: RampAssetInfo) => void;
  
  /** Currency code for pricing */
  currencyCode?: string;
  
  /** Whether to show popular assets first */
  showPopular?: boolean;
  
  /** Whether to show asset prices */
  showPrices?: boolean;
  
  /** Whether to show search functionality */
  showSearch?: boolean;
  
  /** Whether to show chain badges */
  showChains?: boolean;
  
  /** Maximum number of assets to display */
  limit?: number;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom filter function */
  customFilter?: (asset: RampAssetInfo) => boolean;
  
  /** Popular asset symbols to highlight */
  popularAssets?: string[];
}

function RampAssetSelector({
  config,
  flowType,
  selectedAsset,
  onAssetSelect,
  currencyCode = 'USD',
  showPopular = true,
  showPrices = true,
  showSearch = true,
  showChains = true,
  limit = 50,
  className,
  customFilter,
  popularAssets = ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC', 'BNB']
}: RampAssetSelectorProps) {
  // State
  const [assets, setAssets] = useState<RampAssetInfo[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<RampAssetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const dataService = getRampNetworkDataService(config);
  
  // Load assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await dataService.getCachedSupportedAssets({
          flowType,
          enabled: true,
          currencyCode,
          limit
        });
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load assets');
        }
        
        // Convert cache entries to asset info
        const assetList: RampAssetInfo[] = result.data.map((entry: RampAssetCacheEntry) => ({
          symbol: entry.symbol,
          chain: entry.chain,
          name: entry.name,
          decimals: entry.decimals,
          type: entry.type as any,
          address: entry.address,
          logoUrl: entry.logo_url,
          enabled: entry.enabled,
          hidden: entry.hidden,
          price: entry.price_data,
          currencyCode: entry.currency_code,
          minPurchaseAmount: entry.min_purchase_amount || 0,
          maxPurchaseAmount: entry.max_purchase_amount || -1,
          minPurchaseCryptoAmount: entry.min_purchase_crypto_amount || '0',
          networkFee: entry.network_fee || 0
        }));
        
        // Apply custom filter if provided
        const filtered = customFilter ? assetList.filter(customFilter) : assetList;
        
        // Sort assets: popular first, then by name
        const sorted = filtered.sort((a, b) => {
          if (showPopular) {
            const aIsPopular = popularAssets.includes(a.symbol);
            const bIsPopular = popularAssets.includes(b.symbol);
            
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
          }
          
          return a.name.localeCompare(b.name);
        });
        
        setAssets(sorted);
        setFilteredAssets(sorted);
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load assets';
        setError(errorMsg);
        
        toast({
          title: 'Loading Error',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadAssets();
  }, [config, flowType, currencyCode, limit, showPopular, customFilter, toast]);
  
  // Filter assets based on search and chain
  useEffect(() => {
    let filtered = assets;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.chain.toLowerCase().includes(query)
      );
    }
    
    // Apply chain filter
    if (selectedChain) {
      filtered = filtered.filter(asset => asset.chain === selectedChain);
    }
    
    setFilteredAssets(filtered);
  }, [assets, searchQuery, selectedChain]);
  
  // Get unique chains
  const getChains = () => {
    const chains = [...new Set(assets.map(asset => asset.chain))];
    return chains.sort();
  };
  
  // Format price
  const formatPrice = (asset: RampAssetInfo) => {
    const price = asset.price[currencyCode];
    if (!price) return null;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };
  
  // Check if asset is popular
  const isPopular = (symbol: string) => popularAssets.includes(symbol);
  
  // Handle asset selection
  const handleAssetSelect = (asset: RampAssetInfo) => {
    onAssetSelect(asset);
    
    toast({
      title: 'Asset Selected',
      description: `Selected ${asset.symbol} (${asset.name})`,
    });
  };
  
  // Render loading state
  if (loading) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle>Select Asset</CardTitle>
          <CardDescription>Loading supported assets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const chains = getChains();
  
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>Select Asset</CardTitle>
        <CardDescription>
          Choose a cryptocurrency for your {flowType === 'onramp' ? 'purchase' : 'sale'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {/* Chain Filter */}
        {showChains && chains.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedChain === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChain(null)}
            >
              All Chains
            </Button>
            {chains.map(chain => (
              <Button
                key={chain}
                variant={selectedChain === chain ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChain(chain)}
              >
                {chain}
              </Button>
            ))}
          </div>
        )}
        
        {/* Asset List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assets found matching your criteria
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={`${asset.chain}-${asset.symbol}`}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors',
                    selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain
                      ? 'border-primary bg-accent'
                      : 'border-border'
                  )}
                  onClick={() => handleAssetSelect(asset)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={asset.logoUrl} alt={asset.symbol} />
                      <AvatarFallback>
                        {asset.symbol.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.symbol}</span>
                        {isPopular(asset.symbol) && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                        {showChains && (
                          <Badge variant="outline" className="text-xs">
                            {asset.chain}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {showPrices && formatPrice(asset) && (
                      <div className="text-sm font-medium">
                        {formatPrice(asset)}
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Selected Asset Summary */}
        {selectedAsset && (
          <div className="mt-4 p-3 bg-accent rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedAsset.logoUrl} alt={selectedAsset.symbol} />
                  <AvatarFallback className="text-xs">
                    {selectedAsset.symbol.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {selectedAsset.symbol} ({selectedAsset.name})
                </span>
              </div>
              {showPrices && formatPrice(selectedAsset) && (
                <span className="text-sm text-muted-foreground">
                  {formatPrice(selectedAsset)}
                </span>
              )}
            </div>
            
            {/* Limits */}
            <div className="mt-2 text-xs text-muted-foreground">
              Min: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode
              }).format(selectedAsset.minPurchaseAmount)} • 
              Max: {selectedAsset.maxPurchaseAmount === -1 ? 'Unlimited' : 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currencyCode
                }).format(selectedAsset.maxPurchaseAmount)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RampAssetSelector;
