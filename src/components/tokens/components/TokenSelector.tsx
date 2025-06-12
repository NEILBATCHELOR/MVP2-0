import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getTokens } from "../services/tokenService";
import { Badge } from "@/components/ui/badge";
import { TokenStatus } from "@/types/core/centralModels";

interface TokenSelectorProps {
  projectId: string | null;
  currentTokenId?: string | null;
  onTokenChange?: (tokenId: string) => void;
  className?: string;
  hideRefreshButton?: boolean;
  refreshButtonDataAttr?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  projectId,
  currentTokenId,
  onTokenChange,
  className = "",
  hideRefreshButton = false,
  refreshButtonDataAttr,
}) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string | undefined>(
    currentTokenId || undefined
  );
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && projectId !== "undefined") {
      fetchTokens();
    } else {
      setIsLoading(false);
      setTokens([]);
    }
  }, [projectId]);

  useEffect(() => {
    if (currentTokenId && currentTokenId !== "undefined") {
      setSelectedTokenId(currentTokenId);
    }
  }, [currentTokenId]);

  const fetchTokens = async () => {
    if (!projectId || projectId === "undefined") {
      console.warn("Attempted to fetch tokens with invalid projectId");
      setTokens([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the tokenService to fetch tokens
      const data = await getTokens(projectId);
      
      setTokens(data || []);
      
      // Auto-select the first token if none is selected
      if ((!selectedTokenId || selectedTokenId === "undefined") && data && data.length > 0) {
        setSelectedTokenId(data[0].id);
        
        if (onTokenChange) {
          onTokenChange(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
      toast({
        title: "Error",
        description: "Failed to load tokens. Please try again.",
        variant: "destructive",
      });
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenChange = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    if (onTokenChange) {
      onTokenChange(tokenId);
    }
  };

  const handleRefreshTokens = () => {
    fetchTokens();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading tokens...</span>
      </div>
    );
  }

  if (!projectId || projectId === "undefined") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">No project selected</span>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">No tokens available</span>
        <Button 
          size="sm" 
          onClick={() => navigate(`/projects/${projectId}/tokens/create`)}
        >
          Create Token
        </Button>
        <Button size="sm" variant="outline" onClick={handleRefreshTokens}>
          <Loader2 className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('draft') || statusLower === 'pending') return 'secondary';
    if (statusLower === 'active' || statusLower === 'deployed') return 'success';
    if (statusLower.includes('error') || statusLower === 'failed') return 'destructive';
    return 'default';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedTokenId} onValueChange={handleTokenChange}>
        <SelectTrigger className="w-full h-12">
          <SelectValue placeholder="Select a token" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {tokens.map((token) => (
            <SelectItem key={token.id} value={token.id} className="py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-base">{token.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({token.symbol})</span>
                  </div>
                  {token.status && (
                    <Badge variant={getStatusBadgeColor(token.status)} className="text-xs">
                      {token.status}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-medium">{token.standard}</span>
                </div>
                
                {token.description && (
                  <div className="mt-1 text-sm text-foreground/80 leading-snug">
                    {token.description.length > 100 
                      ? `${token.description.substring(0, 100)}...` 
                      : token.description}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hideRefreshButton && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefreshTokens}
          data-token-selector-refresh={refreshButtonDataAttr ? true : undefined}
          {...(refreshButtonDataAttr ? { 'data-testid': refreshButtonDataAttr } : {})}
        >
          <Loader2 className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      )}
    </div>
  );
};

export default TokenSelector; 