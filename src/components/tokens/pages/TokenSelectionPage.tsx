import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TokenPageLayout from "../layout/TokenPageLayout";
import TokenSelector from "../components/TokenSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Filter } from "lucide-react";
import { getTokens } from "../services/tokenService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenStandard, TokenStatus } from "@/types/core/centralModels";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import useTokenProjectContext from '@/hooks/project/useTokenProjectContext';

interface TokenSelectionPageProps {
  actionType: "details" | "deploy" | "mint";
}

const TokenSelectionPage: React.FC<TokenSelectionPageProps> = ({ actionType }) => {
  const { projectId, project, isLoading: projectLoading } = useTokenProjectContext();
  const navigate = useNavigate();
  const [selectedTokenId, setSelectedTokenId] = useState<string | undefined>();
  const [tokens, setTokens] = useState<any[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (projectId) {
      fetchTokens();
    }
  }, [projectId]);

  // Apply filters whenever tokens, filters, or search query changes
  useEffect(() => {
    applyFilters();
  }, [tokens, standardFilter, statusFilter, searchQuery]);
  
  // Filter tokens based on selected filters and search query
  const applyFilters = () => {
    let result = [...tokens];
    
    // Apply standard filter
    if (standardFilter !== "all") {
      result = result.filter(token => token.standard === standardFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(token => {
        const tokenStatus = token.status?.toLowerCase();
        return tokenStatus === statusFilter.toLowerCase();
      });
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(token => 
        token.name?.toLowerCase().includes(query) || 
        token.symbol?.toLowerCase().includes(query) ||
        token.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredTokens(result);
    
    // Auto-select first token in filtered results if available
    if (result.length > 0 && (!selectedTokenId || !result.find(t => t.id === selectedTokenId))) {
      setSelectedTokenId(result[0].id);
    }
  };

  const fetchTokens = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTokens(projectId!);
      setTokens(data || []);
      setFilteredTokens(data || []);
      
      // Auto-select the first token if available
      if (data && data.length > 0) {
        setSelectedTokenId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError("Failed to load tokens. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenChange = (tokenId: string) => {
    setSelectedTokenId(tokenId);
  };

  const handleContinue = () => {
    if (selectedTokenId) {
      switch (actionType) {
        case "details":
          navigate(`/projects/${projectId}/tokens/${selectedTokenId}`);
          break;
        case "deploy":
          navigate(`/projects/${projectId}/tokens/${selectedTokenId}/deploy`);
          break;
        case "mint":
          navigate(`/projects/${projectId}/tokens/${selectedTokenId}/mint`);
          break;
      }
    }
  };

  const getPageTitle = () => {
    switch (actionType) {
      case "details":
        return "View Token Details";
      case "deploy":
        return "Deploy Token";
      case "mint":
        return "Mint Token";
    }
  };

  const getPageDescription = () => {
    switch (actionType) {
      case "details":
        return "Select a token to view its details";
      case "deploy":
        return "Select a token to deploy to the blockchain";
      case "mint":
        return "Select a token to mint new tokens";
    }
  };

  // Get unique standards from tokens
  const uniqueStandards = [...new Set(tokens.map(token => token.standard))].filter(Boolean);
  
  // Get unique statuses from tokens
  const uniqueStatuses = [...new Set(tokens.map(token => token.status))].filter(Boolean);
  
  return (
    <TokenPageLayout
      title={getPageTitle()}
      description={getPageDescription()}
      showRefreshButton={true}
      onRefresh={fetchTokens}
    >
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Select a Token</CardTitle>
          <CardDescription>
            Choose a token to {actionType === "details" ? "view" : actionType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading tokens...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : tokens.length === 0 ? (
            <div className="text-center p-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Tokens Available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You don't have any tokens yet. Create a token first.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate(`/projects/${projectId}/tokens/create`)}
              >
                Create Token
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter section */}
              <div className="bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Filter Tokens</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search input */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Search</label>
                    <Input
                      placeholder="Search by name or symbol"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Standard filter */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Standard</label>
                    <Select value={standardFilter} onValueChange={setStandardFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Standards" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Standards</SelectItem>
                        {uniqueStandards.map(standard => (
                          <SelectItem key={standard} value={standard}>
                            {standard}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Status filter */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Results count */}
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {filteredTokens.length} of {tokens.length} tokens
                </div>
              </div>
              
              {/* Token selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Token</label>
                {filteredTokens.length > 0 ? (
                  <TokenSelector
                    projectId={projectId!}
                    currentTokenId={selectedTokenId}
                    onTokenChange={handleTokenChange}
                    className="w-full"
                  />
                ) : (
                  <div className="p-4 border rounded-md text-center text-muted-foreground">
                    No tokens match your filter criteria
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}/tokens`)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={!selectedTokenId}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TokenPageLayout>
  );
};

export default TokenSelectionPage;