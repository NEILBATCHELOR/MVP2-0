import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, ChevronRight, Loader2 } from "lucide-react";
import { Token } from "@/components/wallet/components/swap/types";

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (tokenAddress: string) => void;
  tokens: Token[];
  selectedTokenId?: string;
  excludeTokenId?: string;
  blockchain?: string;
  walletAddress?: string;
}

// Token preference service for favorites and recent tokens
class TokenPreferenceService {
  private static readonly FAVORITES_KEY = 'wallet_favorite_tokens';
  private static readonly RECENT_KEY = 'wallet_recent_tokens';
  
  static getFavorites(blockchain: string = 'ethereum'): string[] {
    const key = `${this.FAVORITES_KEY}_${blockchain}`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static addFavorite(tokenAddress: string, blockchain: string = 'ethereum'): void {
    const key = `${this.FAVORITES_KEY}_${blockchain}`;
    const favorites = this.getFavorites(blockchain);
    if (!favorites.includes(tokenAddress)) {
      favorites.unshift(tokenAddress);
      // Keep only last 20 favorites
      if (favorites.length > 20) {
        favorites.splice(20);
      }
      localStorage.setItem(key, JSON.stringify(favorites));
    }
  }
  
  static removeFavorite(tokenAddress: string, blockchain: string = 'ethereum'): void {
    const key = `${this.FAVORITES_KEY}_${blockchain}`;
    const favorites = this.getFavorites(blockchain);
    const filtered = favorites.filter(addr => addr !== tokenAddress);
    localStorage.setItem(key, JSON.stringify(filtered));
  }
  
  static getRecent(blockchain: string = 'ethereum'): string[] {
    const key = `${this.RECENT_KEY}_${blockchain}`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static addRecent(tokenAddress: string, blockchain: string = 'ethereum'): void {
    const key = `${this.RECENT_KEY}_${blockchain}`;
    const recent = this.getRecent(blockchain);
    // Remove if already exists
    const filtered = recent.filter(addr => addr !== tokenAddress);
    // Add to beginning
    filtered.unshift(tokenAddress);
    // Keep only last 10 recent
    if (filtered.length > 10) {
      filtered.splice(10);
    }
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  tokens,
  selectedTokenId,
  excludeTokenId,
  blockchain = 'ethereum',
  walletAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [favoriteAddresses, setFavoriteAddresses] = useState<string[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load preferences on mount and blockchain change
  useEffect(() => {
    setFavoriteAddresses(TokenPreferenceService.getFavorites(blockchain));
    setRecentAddresses(TokenPreferenceService.getRecent(blockchain));
  }, [blockchain]);
  
  // Filter tokens based on search query and exclude the token that's already selected in the other field
  const filteredTokens = tokens.filter(token => {
    // Exclude the token that's already selected in the other field
    if (token.address === excludeTokenId) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Get favorite tokens based on stored addresses
  const favoriteTokens = filteredTokens.filter(token => 
    favoriteAddresses.includes(token.address)
  );
  
  // Get recent tokens based on stored addresses
  const recentTokens = filteredTokens.filter(token => 
    recentAddresses.includes(token.address)
  );
  
  const handleTokenSelect = (tokenAddress: string) => {
    // Add to recent when selected
    TokenPreferenceService.addRecent(tokenAddress, blockchain);
    setRecentAddresses(TokenPreferenceService.getRecent(blockchain));
    
    onSelectToken(tokenAddress);
    onClose();
  };
  
  const toggleFavorite = (tokenAddress: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (favoriteAddresses.includes(tokenAddress)) {
      TokenPreferenceService.removeFavorite(tokenAddress, blockchain);
    } else {
      TokenPreferenceService.addFavorite(tokenAddress, blockchain);
    }
    
    setFavoriteAddresses(TokenPreferenceService.getFavorites(blockchain));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // If user is searching, automatically switch to "all" tab
    if (e.target.value && activeTab !== "all") {
      setActiveTab("all");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Token</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 relative">
          <Input
            placeholder="Search name, symbol, or paste address"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
            autoFocus
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites
              {favoriteTokens.length > 0 && (
                <span className="ml-1 text-xs bg-muted px-1 rounded">
                  {favoriteTokens.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent
              {recentTokens.length > 0 && (
                <span className="ml-1 text-xs bg-muted px-1 rounded">
                  {recentTokens.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading tokens...</span>
                  </div>
                ) : filteredTokens.length > 0 ? (
                  filteredTokens.map(token => (
                    <TokenRow
                      key={token.address}
                      token={token}
                      onSelect={handleTokenSelect}
                      isSelected={token.address === selectedTokenId}
                      isFavorite={favoriteAddresses.includes(token.address)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? (
                      <>
                        No tokens found matching "{searchQuery}"
                        <div className="text-xs mt-2 text-muted-foreground">
                          Make sure the token address is correct
                        </div>
                      </>
                    ) : (
                      "No tokens available"
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="favorites" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {favoriteTokens.length > 0 ? (
                  favoriteTokens.map(token => (
                    <TokenRow
                      key={token.address}
                      token={token}
                      onSelect={handleTokenSelect}
                      isSelected={token.address === selectedTokenId}
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                      showStar
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>No favorite tokens yet</div>
                    <div className="text-xs mt-1">
                      Click the star icon next to tokens to add them to favorites
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="recent" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {recentTokens.length > 0 ? (
                  recentTokens.map(token => (
                    <TokenRow
                      key={token.address}
                      token={token}
                      onSelect={handleTokenSelect}
                      isSelected={token.address === selectedTokenId}
                      isFavorite={favoriteAddresses.includes(token.address)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <div>No recently used tokens</div>
                    <div className="text-xs mt-1">
                      Recently selected tokens will appear here
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface TokenRowProps {
  token: Token;
  onSelect: (tokenAddress: string) => void;
  isSelected: boolean;
  isFavorite: boolean;
  onToggleFavorite: (tokenAddress: string, event: React.MouseEvent) => void;
  showStar?: boolean;
}

const TokenRow: React.FC<TokenRowProps> = ({ 
  token, 
  onSelect, 
  isSelected, 
  isFavorite,
  onToggleFavorite,
  showStar 
}) => {
  const balance = token.balance || '0';
  const price = token.price || 0;
  const balanceValue = (Number(balance) * price);
  
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start p-3 h-auto ${isSelected ? 'bg-secondary' : ''}`}
      onClick={() => onSelect(token.address)}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative">
          <img 
            src={token.logoURI || '/token-placeholder.svg'} 
            alt={token.symbol} 
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/token-placeholder.svg';
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.symbol}</span>
            <button
              onClick={(e) => onToggleFavorite(token.address, e)}
              className="p-1 hover:bg-muted rounded"
            >
              <Star 
                className={`h-3 w-3 ${
                  isFavorite 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground hover:text-yellow-400'
                }`} 
              />
            </button>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {token.name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {Number(balance).toFixed(balance.includes('.') ? Math.min(6, balance.split('.')[1]?.length || 0) : 0)}
          </div>
          {balanceValue > 0 && (
            <div className="text-xs text-muted-foreground">
              ${balanceValue.toFixed(2)}
            </div>
          )}
        </div>
        {isSelected && <ChevronRight className="h-4 w-4 ml-2" />}
      </div>
    </Button>
  );
};
