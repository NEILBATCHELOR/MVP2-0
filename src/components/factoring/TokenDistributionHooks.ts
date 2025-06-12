// TokenDistributionHooks.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { FactoringToken, TokenAllocation as BaseTokenAllocation, TokenDistributionFormData } from "./types";
import { BaseModel } from "@/types/core/centralModels";
import { calculateInvestmentAmount, calculateTokenAmount, calculateTokenStats } from "./TokenDistributionUtils";

// Extend the TokenAllocation type to include tokenDetails
export interface TokenAllocation extends BaseTokenAllocation {
  tokenDetails?: {
    discount_rate?: number;
    investment_amount?: number;
    face_value?: number;
    name?: string;
    symbol?: string;
    value?: number;
  };
}

export interface Investor extends BaseModel {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  type: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  count?: number;
}

// Hook for fetching and managing token distribution data
export function useTokenDistributionData(projectId: string) {
  const [tokens, setTokens] = useState<FactoringToken[]>([]);
  const [allocations, setAllocations] = useState<TokenAllocation[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from("tokens")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (tokenError) throw tokenError;

      // Format token data
      const formattedTokens: FactoringToken[] = (tokenData || []).map(item => {
        const metadata = item.metadata as any || {};
        const factoringData = metadata.factoring || {};
        
        return {
          id: item.id,
          poolId: factoringData.pool_id || 0,
          tokenName: item.name,
          tokenSymbol: item.symbol,
          totalTokens: factoringData.total_tokens || 0,
          tokenValue: factoringData.token_value || 0,
          totalValue: factoringData.total_value || 0,
          createdAt: item.created_at,
          status: factoringData.status || 'draft',
          securityInterestDetails: factoringData.security_interest_details || '',
          projectId: item.project_id,
          metadata: item.metadata,
          averageDiscountRate: factoringData.average_discount_rate,
          averageAge: factoringData.average_age,
        };
      });

      // Fetch investors
      const { data: investorData, error: investorError } = await supabase
        .from("investors")
        .select("*")
        .order("name", { ascending: true });

      if (investorError) throw investorError;

      // Format investor data
      const formattedInvestors: Investor[] = (investorData || []).map(item => ({
        id: item.investor_id,
        name: item.name || item.company,
        email: item.email,
        walletAddress: item.wallet_address,
        type: 'investor',
        createdAt: item.created_at || new Date().toISOString(),
      }));

      // First get subscriptions to access token information
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (subscriptionError) throw subscriptionError;

      // Fetch token allocations with related investor data
      const { data: allocationData, error: allocationError } = await supabase
        .from("token_allocations")
        .select("*, investor:investor_id(name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (allocationError) throw allocationError;

      // Format allocation data
      const formattedAllocations: TokenAllocation[] = (allocationData || []).map(item => {
        // Find subscription associated with this allocation
        const subscription = subscriptionData.find(sub => sub.id === item.subscription_id);
        
        if (!subscription) {
          console.error(`No subscription found for token allocation ${item.id}`);
          return null; // Will be filtered out later
        }
        
        // Extract the actual token ID from the subscription_id string
        const tokenIdMatch = subscription.subscription_id.match(/^token-(.+)$/);
        const actualTokenId = tokenIdMatch ? tokenIdMatch[1] : subscription.subscription_id;
        
        // Find the token using the extracted token ID
        const token = formattedTokens.find(t => t.id === actualTokenId);
        
        // Calculate discount rate from token metadata if available
        let discountRate = 0;
        if (token) {
          const metadata = token.metadata as any || {};
          const factoringData = metadata.factoring || {};
          const averageDiscountRate = factoringData.average_discount_rate;
          if (averageDiscountRate !== undefined) {
            discountRate = averageDiscountRate * 100;
          }
        }
        
        return {
          id: item.id,
          investorId: item.investor_id,
          investorName: item.investor?.name || "Unknown Investor",
          tokenId: actualTokenId,
          tokenName: token?.tokenName || "Unknown Token",
          tokenAmount: item.token_amount || 0,
          allocationDate: item.created_at,
          distributionStatus: item.distributed ? 'completed' as const : 'pending' as const,
          distributionDate: item.distribution_date,
          transactionHash: item.distribution_tx_hash,
          createdAt: item.created_at,
          tokenDetails: {
            discount_rate: discountRate,
            investment_amount: subscription.fiat_amount || 0,
            face_value: item.token_amount || 0,
            name: token?.tokenName,
            symbol: token?.tokenSymbol,
            value: token?.tokenValue || 0,
          },
        };
      }).filter(Boolean);

      // Only include factoring token allocations
      const factoringAllocations = formattedAllocations.filter(allocation => {
        return formattedTokens.some(token => token.id === allocation.tokenId);
      });
      
      setTokens(formattedTokens);
      setInvestors(formattedInvestors);
      setAllocations(factoringAllocations);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch distribution data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Token distribution functionality
  const handleDistributeTokens = async (allocation: TokenAllocation) => {
    try {
      setLoading(true);
      
      const token = tokens.find(t => t.id === allocation.tokenId);
      const investor = investors.find(i => i.id === allocation.investorId);
      
      if (!token || !investor) {
        throw new Error("Token or investor not found");
      }
      
      if (!investor.walletAddress) {
        toast({
          title: "Error",
          description: "Investor does not have a wallet address",
          variant: "destructive",
        });
        return;
      }
      
      // Generate a proper UUID v4 format string
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      // Update the token allocation
      const { error } = await supabase
        .from("token_allocations")
        .update({
          distributed: true,
          distribution_date: new Date().toISOString(),
          distribution_tx_hash: generateUUID(),
          token_id: allocation.tokenId,
          symbol: token.tokenSymbol,
          standard: token.metadata?.standard || null,
        })
        .eq("id", allocation.id);

      if (error) throw error;
      
      // Get the subscription ID and notes for distribution record
      const { data: allocationRecord, error: allocationError } = await supabase
        .from("token_allocations")
        .select("subscription_id, notes")
        .eq("id", allocation.id)
        .single();
        
      if (allocationError) throw allocationError;
      
      // Get the subscription record
      const { data: subscriptionRecord, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("subscription_id")
        .eq("id", allocationRecord.subscription_id)
        .single();
        
      if (subscriptionError) throw subscriptionError;
      
      const txHash = generateUUID();
      
      // Create a distribution record
      const distributionData = {
        investor_id: investor.id,
        token_allocation_id: allocation.id,
        subscription_id: allocationRecord.subscription_id,
        blockchain: "ethereum",
        token_type: "factoring",
        token_amount: allocation.tokenAmount,
        token_symbol: token.tokenSymbol,
        remaining_amount: allocation.tokenAmount,
        to_address: investor.walletAddress,
        distribution_date: new Date().toISOString(),
        distribution_tx_hash: txHash,
        status: "completed",
        fully_redeemed: false,
        project_id: projectId,
        notes: allocationRecord.notes || ""
      };
      
      await supabase
        .from("distributions")
        .insert(distributionData);
      
      // Log in wallet_transactions
      const transactionData = {
        from_address: "0x0000000000000000000000000000000000000000", // Treasury
        to_address: investor.walletAddress,
        value: allocation.tokenAmount,
        token_symbol: token.tokenSymbol,
        token_address: token.id,
        tx_hash: txHash,
        status: "confirmed",
        data: {
          allocation_id: allocation.id,
          token_name: token.tokenName,
          token_value: token.tokenValue,
          total_value: allocation.tokenAmount * token.tokenValue,
          subscription_id: subscriptionRecord.subscription_id,
        },
      };
      
      await supabase
        .from("wallet_transactions")
        .insert(transactionData);
        
      // Update token status to DISTRIBUTED
      const { error: tokenUpdateError } = await supabase
        .from("tokens")
        .update({
          status: "DISTRIBUTED",
          metadata: {
            ...token.metadata,
            factoring: {
              ...token.metadata?.factoring,
              status: 'distributed'
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", token.id);
        
      if (tokenUpdateError) throw tokenUpdateError;

      toast({
        title: "Success",
        description: `Tokens distributed to ${allocation.investorName}`,
        variant: "default",
      });
      
      await fetchData();
    } catch (error) {
      console.error("Error distributing tokens:", error);
      toast({
        title: "Error",
        description: "Failed to distribute tokens: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update allocation handler
  const handleUpdateAllocation = async (allocation: TokenAllocation, column: string, value: string | number) => {
    try {
      setLoading(true);
      
      // Find the token for this allocation to get standard and symbol
      const token = tokens.find(t => t.id === allocation.tokenId);
      
      // Update the allocation in database
      const updateData: Record<string, any> = {
        [column]: value,
      };

      // Make sure we're not wiping out these fields if they exist
      if (token && !updateData.token_id) {
        updateData.token_id = allocation.tokenId || token.id;
      }
      
      if (token && !updateData.symbol) {
        updateData.symbol = token.tokenSymbol;
      }
      
      if (token && !updateData.standard) {
        updateData.standard = token.metadata?.standard || null;
      }
      
      const { error } = await supabase
        .from('token_allocations')
        .update(updateData)
        .eq('id', allocation.id);
      
      if (error) throw error;
      
      // Refresh allocations
      await fetchData();
      
      toast({
        title: "Allocation Updated",
        description: "Token allocation successfully updated",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating allocation:", error);
      toast({
        title: "Error",
        description: "Failed to update allocation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    tokens,
    allocations,
    investors,
    loading,
    fetchData,
    handleDistributeTokens,
    handleUpdateAllocation,
    setLoading
  };
}

// Hook for allocation form state management
export function useAllocationForm(
  tokens: FactoringToken[], 
  investors: Investor[], 
  allocations: TokenAllocation[],
  projectId: string,
  fetchData: () => Promise<void>
) {
  const [selectedToken, setSelectedToken] = useState<FactoringToken | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [allocationMode, setAllocationMode] = useState<'tokens' | 'investment'>('investment');
  const [allocating, setAllocating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [allocationFormData, setAllocationFormData] = useState<TokenDistributionFormData>({
    tokenId: "",
    investorId: "",
    tokenAmount: 0,
    investmentAmount: 0,
    discountRate: 0,
  });
  const { toast } = useToast();

  const handleTokenSelect = useCallback((tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    setSelectedToken(token || null);
    
    setAllocationFormData(prev => {
      // Get discount rate from token metadata
      const metadata = token?.metadata as any || {};
      const factoringData = metadata.factoring || {};
      const averageDiscountRate = factoringData.average_discount_rate;
      
      let discountRate = 0;
      if (averageDiscountRate !== undefined) {
        discountRate = averageDiscountRate * 100;
      }
      
      return {
        ...prev,
        tokenId,
        discountRate: discountRate,
        tokenAmount: 0,
        investmentAmount: 0,
      };
    });
  }, [tokens]);

  const handleInvestorSelect = useCallback((investorId: string) => {
    const investor = investors.find(i => i.id === investorId);
    setSelectedInvestor(investor || null);
    
    setAllocationFormData(prev => ({
      ...prev,
      investorId,
    }));
  }, [investors]);

  const handleInvestmentAmountChange = useCallback((value: string) => {
    const amount = parseFloat(value) || 0;
    
    setAllocationFormData(prev => {
      if (amount <= 0) {
        return {
          ...prev,
          investmentAmount: 0
        };
      }
      
      const tokenAmount = calculateTokenAmount(amount, prev.discountRate);
      
      return {
        ...prev,
        investmentAmount: amount,
        tokenAmount
      };
    });
  }, []);

  const handleTokenAmountChange = useCallback((value: string) => {
    const amount = parseInt(value) || 0;
    
    setAllocationFormData(prev => {
      if (amount <= 0) {
        return {
          ...prev,
          tokenAmount: 0
        };
      }
      
      const investmentAmount = calculateInvestmentAmount(amount, prev.discountRate);
      
      return {
        ...prev,
        tokenAmount: amount,
        investmentAmount
      };
    });
  }, []);

  const handlePctToggle = useCallback((pct: number) => {
    if (!selectedToken) return;
    
    const stats = calculateTokenStats(selectedToken.id, allocations, tokens);
    const remaining = stats.remainingTokens;
    const rate = allocationFormData.discountRate;
    
    if (allocationMode === 'tokens') {
      const newTokens = Math.floor(remaining * pct / 100);
      const newInvestment = calculateInvestmentAmount(newTokens, rate);
      setAllocationFormData(prev => ({
        ...prev,
        tokenAmount: newTokens,
        investmentAmount: newInvestment,
      }));
    } else {
      const maxInvest = calculateInvestmentAmount(remaining, rate);
      const newInvest = maxInvest * pct / 100;
      const newTokens = calculateTokenAmount(newInvest, rate);
      setAllocationFormData(prev => ({
        ...prev,
        investmentAmount: newInvest,
        tokenAmount: newTokens,
      }));
    }
  }, [selectedToken, allocationFormData.discountRate, allocationMode, allocations, tokens]);

  const handleCreateAllocation = useCallback(async () => {
    if (!selectedToken || !selectedInvestor) {
      toast({
        title: "Validation Error",
        description: "Please select a token and an investor",
        variant: "destructive",
      });
      return;
    }

    if (allocationFormData.tokenAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Token amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Check if allocation exceeds total tokens
    const stats = calculateTokenStats(selectedToken.id, allocations, tokens);
    
    if (allocationFormData.tokenAmount > stats.remainingTokens) {
      toast({
        title: "Validation Error",
        description: `Cannot allocate more than the remaining ${stats.remainingTokens} tokens`,
        variant: "destructive",
      });
      return;
    }

    try {
      setAllocating(true);
      
      // Calculate investment details
      const discountRate = allocationFormData.discountRate || 
                         (selectedToken ? 
                           (() => {
                             const metadata = selectedToken.metadata as any || {};
                             const factoringData = metadata.factoring || {};
                             const averageDiscountRate = factoringData.average_discount_rate;
                             return averageDiscountRate !== undefined
                               ? averageDiscountRate * 100
                               : 1.0000;
                           })() : 1.0000);
                          
      const tokenAmount = allocationFormData.tokenAmount;
      const investmentAmount = allocationFormData.investmentAmount || 
                              calculateInvestmentAmount(tokenAmount, discountRate);
      
      // Create subscription record
      const subscriptionData = {
        investor_id: selectedInvestor.id,
        subscription_id: `token-${selectedToken.id}`,
        fiat_amount: investmentAmount,
        currency: "USD",
        confirmed: true,
        allocated: true,
        project_id: projectId,
        notes: `Factoring token allocation with ${discountRate.toFixed(4)}% discount rate`,
      };
      
      const { data: subscriptionResult, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert(subscriptionData)
        .select("id")
        .single();

      if (subscriptionError) throw subscriptionError;
      
      if (!subscriptionResult || !subscriptionResult.id) {
        throw new Error("Failed to create subscription record");
      }
      
      // Create token allocation
      const allocationData = {
        project_id: projectId,
        investor_id: selectedInvestor.id,
        subscription_id: subscriptionResult.id,
        token_amount: tokenAmount, 
        token_type: "factoring",
        token_id: selectedToken.id,
        symbol: selectedToken.tokenSymbol,
        standard: selectedToken.metadata?.standard || null,
        distributed: false,
        notes: `Face Value: $${tokenAmount}, Investment: $${investmentAmount.toFixed(2)}, Discount: ${discountRate.toFixed(4)}%`,
      };
      
      const { error } = await supabase
        .from("token_allocations")
        .insert(allocationData)
        .select("id")
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Token allocation created successfully",
        variant: "default",
      });
      
      // Reset form and close dialog
      setAllocationFormData({
        tokenId: "",
        investorId: "",
        tokenAmount: 0,
        investmentAmount: 0,
        discountRate: 0,
      });
      setSelectedToken(null);
      setSelectedInvestor(null);
      setCreateDialogOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error creating allocation:", error);
      toast({
        title: "Error",
        description: "Failed to create allocation: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setAllocating(false);
    }
  }, [selectedToken, selectedInvestor, allocationFormData, allocations, tokens, projectId, fetchData, toast]);

  return {
    selectedToken,
    selectedInvestor,
    allocationMode,
    allocating,
    createDialogOpen,
    allocationFormData,
    setSelectedToken,
    setSelectedInvestor,
    setAllocationMode,
    setAllocating,
    setCreateDialogOpen,
    setAllocationFormData,
    handleTokenSelect,
    handleInvestorSelect,
    handleInvestmentAmountChange,
    handleTokenAmountChange,
    handlePctToggle,
    handleCreateAllocation
  };
}

// Hook for selection management
export function useSelectionManagement(allocations: TokenAllocation[], fetchData: () => Promise<void>) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const { toast } = useToast();

  const handleRowSelectionChange = useCallback((rowId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRows(prev => [...prev, rowId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
    }
  }, []);

  const handleSelectAll = useCallback((allocations: TokenAllocation[], isChecked: boolean) => {
    if (isChecked) {
      const allIds = allocations.map(allocation => allocation.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const getSelectedAllocations = useCallback((allocations: TokenAllocation[]) => {
    return allocations.filter(allocation => selectedRows.includes(allocation.id));
  }, [selectedRows]);

  const handleBulkDeleteSelected = useCallback(async () => {
    try {
      setBulkDeleteLoading(true);
      const toDelete = allocations
        .filter(a => selectedRows.includes(a.id) && a.distributionStatus === 'pending')
        .map(a => a.id);
      const completedCount = selectedRows.length - toDelete.length;
      if (completedCount > 0) {
        toast({ 
          title: 'Error', 
          description: `Cannot delete ${completedCount} allocation(s) that have already been distributed.`, 
          variant: 'destructive' 
        });
        return;
      }
      const { error } = await supabase.from('token_allocations').delete().in('id', toDelete);
      if (error) throw error;
      toast({ 
        title: 'Success', 
        description: `Deleted ${toDelete.length} allocation(s)` 
      });
      setSelectedRows([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete allocations', 
        variant: 'destructive' 
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  }, [allocations, selectedRows, fetchData, toast]);

  return {
    selectedRows,
    bulkDeleteLoading,
    handleRowSelectionChange,
    handleSelectAll,
    handleClearSelection,
    getSelectedAllocations,
    handleBulkDeleteSelected,
    setBulkDeleteLoading
  };
}