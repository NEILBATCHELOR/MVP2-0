import React, { useState } from "react";
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
import { Search, Star, ChevronRight } from "lucide-react";
import { Token } from "./types";

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (tokenId: string) => void;
  tokens: Token[];
  selectedTokenId?: string;
  excludeTokenId?: string;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  tokens,
  selectedTokenId,
  excludeTokenId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
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
  
  // Get favorite tokens (for demo purposes, we'll consider the first 3 tokens as favorites)
  const favoriteTokens = filteredTokens.slice(0, 3);
  
  // Get recently used tokens (for demo purposes, we'll use a subset of tokens)
  const recentTokens = filteredTokens.slice(1, 5);
  
  // Handle token selection
  const handleSelectToken = (tokenId: string) => {
    onSelectToken(tokenId);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Token</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 relative">
          <Input
            placeholder="Search name or paste address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {filteredTokens.length > 0 ? (
                  filteredTokens.map(token => (
                    <TokenRow
                      key={token.address}
                      token={token}
                      onSelect={handleSelectToken}
                      isSelected={token.address === selectedTokenId}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No tokens found matching "{searchQuery}"
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
                      onSelect={handleSelectToken}
                      isSelected={token.address === selectedTokenId}
                      showStar
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No favorite tokens found
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
                      onSelect={handleSelectToken}
                      isSelected={token.address === selectedTokenId}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No recently used tokens
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
  onSelect: (tokenId: string) => void;
  isSelected: boolean;
  showStar?: boolean;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, onSelect, isSelected, showStar }) => {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start p-3 h-auto ${isSelected ? 'bg-secondary' : ''}`}
      onClick={() => onSelect(token.address)}
    >
      <div className="flex items-center gap-3 w-full">
        <img 
          src={token.logoURI} 
          alt={token.symbol} 
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/generic.svg';
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.symbol}</span>
            {showStar && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
          </div>
          <div className="text-xs text-muted-foreground">{token.name}</div>
        </div>
        <div className="text-right">
          <div className="font-medium">{token.balance || '0.00'}</div>
          <div className="text-xs text-muted-foreground">
            ${((Number(token.balance) || 0) * (token.price || 0)).toFixed(2)}
          </div>
        </div>
        {isSelected && <ChevronRight className="h-4 w-4 ml-2" />}
      </div>
    </Button>
  );
}; 