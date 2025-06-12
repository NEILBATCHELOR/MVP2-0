import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw, Coins, Plus, MoreHorizontal, Check, X, Play, Pause, Pencil, FileUp, Trash2, ArrowUpDown, FileText, ClipboardCheck, CheckCircle, Upload, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Pool, PoolType, FactoringToken, TokenizationFormData, Invoice } from "./types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table";
import { EditableCell } from "@/components/ui/editable-cell";
import { format, parseISO } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { debounce, throttle, memoize, processInChunks } from "./utils/performance";
import { walletManager } from "@/services/wallet/WalletManager";
import { TokenStatus } from "@/types/core/centralModels";

// Extend the FactoringToken type to include poolDetails
interface ExtendedFactoringToken extends FactoringToken {
  poolDetails?: Pool;
}

interface TokenizationManagerProps {
  projectId: string;
  projectName?: string;
}

interface TokenFormData {
  poolId: string;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  initialTokenValue: number;
  securityInterestDetails: string;
  tokenStandard: "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626";
}

// Interface for pool value calculation return type
interface PoolValueData {
  faceValue: number;
  discountedValue: number;
  discountAmount: number;
  averageDiscountRate: number;
  totalValue: number;
}

const TokenizationManager: React.FC<TokenizationManagerProps> = ({ projectId, projectName }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [tokens, setTokens] = useState<ExtendedFactoringToken[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tokenFormData, setTokenFormData] = useState<TokenFormData>({
    poolId: "",
    tokenName: "",
    tokenSymbol: "",
    totalTokens: 0,
    initialTokenValue: 0,
    securityInterestDetails: "",
    tokenStandard: "ERC-1155"
  });
  const [editingToken, setEditingToken] = useState<ExtendedFactoringToken | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTokenFormData, setEditTokenFormData] = useState<TokenFormData>({
    poolId: "",
    tokenName: "",
    tokenSymbol: "",
    totalTokens: 0,
    initialTokenValue: 0,
    securityInterestDetails: "",
    tokenStandard: "ERC-1155"
  });
  const { toast } = useToast();

  // Wallet connection state and handlers
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  // Track fully allocated pools
  const [fullyAllocatedPoolIds, setFullyAllocatedPoolIds] = useState<string[]>([]);

  useEffect(() => {
    walletManager.getConnectedAddress().then(addr => setConnectedAddress(addr));
  }, []);

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    const success = await walletManager.connectInjectedWallet();
    if (success) {
      const addr = await walletManager.getConnectedAddress();
      setConnectedAddress(addr);
    } else {
      toast({
        title: "Wallet Connection Failed",
        description: "No injected web3 provider found. Please install MetaMask or another compatible wallet.",
        variant: "destructive",
      });
    }
    setWalletLoading(false);
  };

  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    await walletManager.disconnectInjectedWallet();
    setConnectedAddress(null);
    setWalletLoading(false);
  };

  // Memoize calculation functions - Define these before using them in other hooks
  const getDiscountedPoolValue = useMemo(() => memoize((poolId: string): PoolValueData => {
    if (!poolId) return {
      faceValue: 0,
      discountedValue: 0,
      discountAmount: 0,
      averageDiscountRate: 0,
      totalValue: 0
    };
    
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return {
      faceValue: 0,
      discountedValue: 0,
      discountAmount: 0,
      averageDiscountRate: 0,
      totalValue: 0
    };
    
    // Get all invoices in this pool
    const poolInvoices = invoices.filter(invoice => invoice.poolId === poolId);
    
    // Calculate total face value
    const totalFaceValue = poolInvoices.reduce((sum, invoice) => sum + invoice.netAmountDue, 0);
    
    // Calculate total weighted discount rate
    const totalWeightedDiscount = poolInvoices.reduce((sum, invoice) => {
      const discountRate = invoice.factoringDiscountRate || 0;
      return sum + (invoice.netAmountDue * discountRate);
    }, 0);
    
    // Calculate average discount rate
    const avgDiscountRate = totalFaceValue > 0 ? (totalWeightedDiscount / totalFaceValue) / 100 : 0;
    
    // Calculate discounted value
    const totalDiscountedValue = poolInvoices.reduce((sum, invoice) => {
      const discountRate = invoice.factoringDiscountRate || 0;
      const factoredValue = invoice.netAmountDue * (1 - discountRate / 100);
      return sum + factoredValue;
    }, 0);
    
    // Calculate total discount amount
    const discountAmount = totalFaceValue - totalDiscountedValue;
    
    return {
      faceValue: totalFaceValue,
      discountedValue: totalDiscountedValue,
      discountAmount,
      averageDiscountRate: avgDiscountRate,
      totalValue: totalFaceValue // For backward compatibility
    };
  }), [pools, invoices]);

  // Memoize the calculation functions
  const calculateTokenValue = useMemo(() => memoize((poolId: string, totalTokens: number): number => {
    if (!poolId || totalTokens <= 0) return 0;
    const { faceValue } = getDiscountedPoolValue(poolId);
    return faceValue / totalTokens;
  }), [getDiscountedPoolValue]);

  const calculateTokenQuantity = useMemo(() => memoize((poolId: string, initialTokenValue: number): number => {
    if (!poolId || initialTokenValue <= 0) return 0;
    const { faceValue } = getDiscountedPoolValue(poolId);
    return Math.floor(faceValue / initialTokenValue);
  }), [getDiscountedPoolValue]);

  // Use throttled version of fetchData to prevent rapid consecutive calls
  const throttledFetchData = useMemo(
    () => throttle(async () => {
      try {
        setLoading(true);
        
        // Fetch pools with their data
        const { data: poolData, error: poolError } = await supabase
          .from("pool")
          .select("*")
          .order("creation_timestamp", { ascending: false });

        if (poolError) throw poolError;

        // Fetch invoices to calculate pool values
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoice")
          .select(`
            *,
            provider:provider_id(name),
            payer:payer_id(name),
            pool:pool_id(pool_name)
          `);

        if (invoiceError) throw invoiceError;

        // Process invoice data in chunks to avoid UI freezing
        const processInvoice = (item: any): Invoice => ({
          id: String(item.invoice_id),
          providerId: item.provider_id,
          providerName: item.provider?.name,
          patientName: item.patient_name,
          patientDob: item.patient_dob,
          serviceDates: item.service_dates,
          procedureCodes: item.procedure_codes,
          diagnosisCodes: item.diagnosis_codes,
          billedAmount: item.billed_amount,
          adjustments: item.adjustments,
          netAmountDue: item.net_amount_due,
          payerId: item.payer_id,
          payerName: item.payer?.name,
          policyNumber: item.policy_number,
          invoiceNumber: item.invoice_number,
          invoiceDate: item.invoice_date,
          dueDate: item.due_date,
          factoringDiscountRate: item.factoring_discount_rate,
          factoringTerms: item.factoring_terms,
          uploadTimestamp: item.upload_timestamp,
          poolId: item.pool_id ? String(item.pool_id) : undefined,
          poolName: item.pool?.pool_name,
          createdAt: item.upload_timestamp,
        });

        const formattedInvoices = await processInChunks(
          invoiceData || [],
          processInvoice,
          50 // Process 50 invoices at a time
        );

        // Calculate pool statistics
        const processPool = (item: any): Pool => {
          const poolInvoices = formattedInvoices.filter(invoice => invoice.poolId === String(item.pool_id));
          const totalValue = poolInvoices.reduce((sum, invoice) => sum + invoice.netAmountDue, 0);
          const invoiceCount = poolInvoices.length;
          
          // Calculate average duration between invoice date and due date in days
          const totalDuration = poolInvoices.reduce((sum, invoice) => {
            if (!invoice.invoiceDate || !invoice.dueDate) return sum;
            
            const invoiceDate = new Date(invoice.invoiceDate);
            const dueDate = new Date(invoice.dueDate);
            
            // Skip invalid dates
            if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) return sum;
            
            const durationInDays = Math.floor((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + (durationInDays > 0 ? durationInDays : 0); // Ensure non-negative
          }, 0);
          const averageAge = invoiceCount > 0 ? Math.round(totalDuration / invoiceCount) : 0;
          
          return {
            id: String(item.pool_id),
            poolName: item.pool_name,
            poolType: item.pool_type as PoolType,
            creationTimestamp: item.creation_timestamp,
            totalValue,
            invoiceCount,
            averageAge,
            createdAt: item.creation_timestamp,
          };
        };

        const formattedPools = await processInChunks(
          poolData || [],
          processPool,
          20 // Process 20 pools at a time
        );

        // Fetch tokens from the tokens table
        const { data: tokenData, error: tokenError } = await supabase
          .from("tokens")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        // Process token data in chunks
        const processToken = (item: any): ExtendedFactoringToken | null => {
          // Extract factoring-specific data from the token metadata
          const metadata = item.metadata as any || {};
          const factoringData = metadata.factoring || {};
          
          // Only include tokens that have factoring metadata and were created from this module
          if (!factoringData || factoringData.source !== 'factoring_tokenization') {
            return null;
          }
          
          // Map status from multiple possible sources and normalize it
          let tokenStatus = factoringData.status || 'draft';
          
          // If item.status is set (e.g., "DRAFT", "APPROVED"), use it as is
          if (item.status) {
            tokenStatus = item.status;
          }
          
          return {
            id: item.id,
            poolId: String(factoringData.pool_id || ""), // Ensure pool_id is a string
            tokenName: item.name,
            tokenSymbol: item.symbol,
            totalTokens: factoringData.total_tokens || 0,
            tokenValue: factoringData.token_value || 0,
            totalValue: factoringData.total_value || 0,
            createdAt: item.created_at,
            status: tokenStatus,
            securityInterestDetails: factoringData.security_interest_details || '',
            projectId: item.project_id,
            metadata: item.metadata,
            averageDiscountRate: factoringData.average_discount_rate || 0,
            averageAge: factoringData.average_age || 0,
            discountedValue: factoringData.discounted_value || 0,
            discountAmount: factoringData.discount_amount || 0,
            poolDetails: formattedPools.find(p => p.id === String(factoringData.pool_id)),
          };
        };

        // If no tokens found, it might be an error or there are no tokens yet
        let formattedTokens: ExtendedFactoringToken[] = [];
        if (!tokenError && tokenData) {
          const processedTokens = await processInChunks(
            tokenData,
            processToken,
            30 // Process 30 tokens at a time
          );
          formattedTokens = processedTokens.filter(Boolean) as ExtendedFactoringToken[];
        }

        // Identify pools with 100% allocated and distributed tokens
        const distributedPoolIds = formattedTokens
          .filter(token => token.status === 'distributed')
          .map(token => String(token.poolId));

        setFullyAllocatedPoolIds(distributedPoolIds);

        // Update the state
        setPools(formattedPools);
        setTokens(formattedTokens);
        setInvoices(formattedInvoices);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load tokenization data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [projectId, toast]
  );

  // Replace the useEffect with the throttled version
  useEffect(() => {
    throttledFetchData();
  }, [throttledFetchData]);

  // Debounce the input handlers
  const handleInitialTokenValueChange = useCallback(debounce((value: string) => {
    const initialValue = parseFloat(value) || 0;
    
    setTokenFormData(prev => {
      if (initialValue <= 0 || !prev.poolId) {
        return {
          ...prev,
          initialTokenValue: initialValue,
          totalTokens: 0
        };
      }
      
      // Calculate token quantity based on pool value and initial token value
      const tokenQuantity = calculateTokenQuantity(prev.poolId, initialValue);
      
      return {
        ...prev,
        initialTokenValue: initialValue,
        totalTokens: tokenQuantity
      };
    });
  }, 300), [calculateTokenQuantity]);

  const handleTotalTokensChange = useCallback(debounce((value: string) => {
    const tokenCount = parseInt(value) || 0;
    
    setTokenFormData(prev => {
      if (tokenCount <= 0 || !prev.poolId) {
        return {
          ...prev,
          totalTokens: tokenCount,
          initialTokenValue: 0
        };
      }
      
      // Calculate token value based on pool value and token count
      const tokenValue = calculateTokenValue(prev.poolId, tokenCount);
      
      return {
        ...prev,
        totalTokens: tokenCount,
        initialTokenValue: tokenValue
      };
    });
  }, 300), [calculateTokenValue]);

  const handlePoolSelect = (poolId: string) => {
    const pool = pools.find(p => String(p.id) === String(poolId));
    setSelectedPool(pool || null);
    
    if (pool) {
      // Update form data with pool info
      setTokenFormData(prev => ({
        ...prev,
        poolId: pool.id,
        tokenName: `${projectName || 'Receivables'} ${pool.poolName} Token`,
        tokenSymbol: `RCV${pool.id}`,
      }));
    }
  };

  const handleCreateToken = async () => {
    if (!selectedPool) return;
    
    try {
      setCreatingToken(true);
      
      // Calculate the token value based on pool value and total tokens
      const tokenValue = calculateTokenValue(selectedPool.id, tokenFormData.totalTokens);
      const { faceValue, discountedValue, discountAmount, averageDiscountRate } = getDiscountedPoolValue(selectedPool.id);
      
      // Ensure our data meets the database requirements
      const tokenInsertData = {
        name: tokenFormData.tokenName,
        symbol: tokenFormData.tokenSymbol,
        project_id: projectId,
        standard: tokenFormData.tokenStandard || "ERC-1155" as const, // Force type literal to match acceptable values
        blocks: {},
        decimals: 18,
        total_supply: String(tokenFormData.totalTokens), // Convert number to string
        metadata: {
          factoring: {
            source: 'factoring_tokenization',
            pool_id: parseInt(selectedPool.id),
            total_tokens: tokenFormData.totalTokens,
            token_value: tokenFormData.initialTokenValue,
            total_value: selectedPool.totalValue || 0,
            security_interest_details: tokenFormData.securityInterestDetails,
            status: 'draft' as const, // Force type literal to match acceptable status values
            average_age: selectedPool.averageAge || 0,
            discounted_value: discountedValue,
            discount_amount: discountAmount,
            average_discount_rate: averageDiscountRate,
            pool_name: selectedPool.poolName
          }
        },
        status: "DRAFT" as const, // Force type literal to match acceptable status values
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create the token in the database
      const { data, error } = await supabase
        .from("tokens")
        .insert(tokenInsertData)
        .select("*")
        .single();
        
      if (error) throw error;
      
      setCreateDialogOpen(false);
      toast({
        title: "Token Created",
        description: `Successfully created ${tokenFormData.tokenName} token`,
        variant: "default",
      });
      
      // Reset form
      setTokenFormData({
        poolId: "",
        tokenName: "",
        tokenSymbol: "",
        totalTokens: 0,
        initialTokenValue: 0,
        securityInterestDetails: "",
        tokenStandard: "ERC-1155",
      });
      setSelectedPool(null);
      
      // Refresh tokens
      throttledFetchData();
    } catch (error) {
      console.error("Error creating token:", error);
      toast({
        title: "Error",
        description: "Failed to create token: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Handle opening the edit dialog
  const handleEditTokenClick = async (token: ExtendedFactoringToken) => {
    setEditingToken(token);
    // Get the token's metadata to extract the standard
    const { data } = await supabase
      .from('tokens')
      .select('standard')
      .eq('id', token.id)
      .single();
      
    setEditTokenFormData({
      poolId: String(token.poolId),
      tokenName: token.tokenName,
      tokenSymbol: token.tokenSymbol,
      totalTokens: token.totalTokens,
      initialTokenValue: token.tokenValue,
      securityInterestDetails: token.securityInterestDetails || "",
      tokenStandard: data?.standard as "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626" || "ERC-1155"
    });
    setEditDialogOpen(true);
  };

  // Handle saving token edits
  const handleSaveTokenEdit = async () => {
    if (!editingToken) return;
    
    try {
      setCreatingToken(true); // Reuse the loading state
      
      // Get the current token data to preserve existing metadata
      const { data: currentToken, error: fetchError } = await supabase
        .from("tokens")
        .select("*")
        .eq("id", editingToken.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Extract and update metadata while preserving existing fields
      const metadata = currentToken?.metadata as any || {};
      if (metadata.factoring) {
        // Update factoring fields but preserve any we're not changing, including status
        metadata.factoring = {
          ...metadata.factoring,
          source: 'factoring_tokenization',
          pool_id: parseInt(editTokenFormData.poolId),
          total_tokens: editTokenFormData.totalTokens,
          token_value: editTokenFormData.initialTokenValue,
          security_interest_details: editTokenFormData.securityInterestDetails,
          pool_name: pools.find(p => String(p.id) === String(editTokenFormData.poolId))?.poolName || "Unknown Pool"
        };
      }
      
      // Update the token in the database
      const { error } = await supabase
        .from("tokens")
        .update({
          name: editTokenFormData.tokenName,
          symbol: editTokenFormData.tokenSymbol,
          standard: editTokenFormData.tokenStandard, // Use the selected token standard
          total_supply: String(editTokenFormData.totalTokens), // Convert number to string
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingToken.id);
        
      if (error) throw error;
      
      setEditDialogOpen(false);
      toast({
        title: "Token Updated",
        description: `Successfully updated ${editTokenFormData.tokenName} token`,
        variant: "default",
      });
      
      // Reset form and state
      setEditingToken(null);
      setEditTokenFormData({
        poolId: "",
        tokenName: "",
        tokenSymbol: "",
        totalTokens: 0,
        initialTokenValue: 0,
        securityInterestDetails: "",
        tokenStandard: "ERC-1155",
      });
      
      // Refresh tokens
      throttledFetchData();
    } catch (error) {
      console.error("Error updating token:", error);
      toast({
        title: "Error",
        description: "Failed to update token: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Handle deleting a token
  const handleDeleteToken = async (token: ExtendedFactoringToken) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete the token "${token.tokenName}"?`);
      if (!confirmed) return;
      
      setLoading(true);
      
      const { error } = await supabase
        .from("tokens")
        .delete()
        .eq("id", token.id);
        
      if (error) throw error;
      
      toast({
        title: "Token Deleted",
        description: `Successfully deleted ${token.tokenName} token`,
        variant: "default",
      });
      
      // Refresh tokens
      throttledFetchData();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast({
        title: "Error",
        description: "Failed to delete token: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTokenStatus = async (token: ExtendedFactoringToken, newStatus: string) => {
    try {
      setCreatingToken(true);
      
      // First, we need to get the current token data to preserve its metadata
      const { data: currentToken, error: fetchError } = await supabase
        .from("tokens")
        .select("*")
        .eq("id", token.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Extract and update metadata
      const metadata = currentToken?.metadata as any || {};
      if (metadata.factoring) {
        metadata.factoring.status = newStatus as "DRAFT" | "UNDER REVIEW" | "APPROVED" | "READY TO MINT" | "MINTED" | "DEPLOYED" | "PAUSED" | "DISTRIBUTED" | "REJECTED";
      }
      
      // Update both the status field and the metadata
      // Format the status properly, replacing all underscores with spaces
      const formattedStatus = newStatus.toUpperCase().replace(/_/g, ' ');
      
      const { error } = await supabase
        .from("tokens")
        .update({
          status: formattedStatus as "DRAFT" | "UNDER REVIEW" | "APPROVED" | "READY TO MINT" | "MINTED" | "DEPLOYED" | "PAUSED" | "DISTRIBUTED" | "REJECTED",
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq("id", token.id);
        
      if (error) throw error;
      
      toast({
        title: "Token Status Updated",
        description: `Successfully updated ${token.tokenName} status to ${newStatus}`,
        variant: "default",
      });
      
      // Refresh tokens
      throttledFetchData();
    } catch (error) {
      console.error("Error updating token status:", error);
      toast({
        title: "Error",
        description: "Failed to update token status: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Get status badge based on token status
  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    let statusLabel = "";
    
    // Normalize status to uppercase
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case "DRAFT":
        badgeClass = "bg-slate-100 text-slate-800 border-slate-200";
        statusLabel = "Draft";
        break;
      case "UNDER REVIEW":
        badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
        statusLabel = "Under Review";
        break;
      case "APPROVED":
        badgeClass = "bg-green-100 text-green-800 border-green-200";
        statusLabel = "Approved";
        break;
      case "READY TO MINT":
        badgeClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
        statusLabel = "Ready to Mint";
        break;
      case "MINTED":
        badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
        statusLabel = "Minted";
        break;
      case "DEPLOYED":
        badgeClass = "bg-purple-100 text-purple-800 border-purple-200";
        statusLabel = "Deployed";
        break;
      case "PAUSED":
        badgeClass = "bg-orange-100 text-orange-800 border-orange-200";
        statusLabel = "Paused";
        break;
      case "DISTRIBUTED":
        badgeClass = "bg-teal-100 text-teal-800 border-teal-200";
        statusLabel = "Distributed";
        break;
      case "REJECTED":
        badgeClass = "bg-red-100 text-red-800 border-red-200";
        statusLabel = "Rejected";
        break;
      default:
        // For statuses that don't match any known value
        badgeClass = "bg-gray-100 text-gray-800 border-gray-200";
        statusLabel = status
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
    }
    
    return <Badge variant="outline" className={badgeClass}>{statusLabel}</Badge>;
  };
  
  // Define column definitions for tokens table with proper sorting options
  const tokenColumns = useMemo<ColumnDef<ExtendedFactoringToken, any>[]>(() => [
    {
      accessorKey: "tokenName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Token Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
    },
    {
      accessorKey: "tokenSymbol",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Symbol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
    },
    {
      accessorKey: "poolName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Pool
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
      cell: ({ row }) => {
        const token = row.original;
        const pool = pools.find(p => String(p.id) === String(token.poolId));
        return pool?.poolName || "Unknown Pool";
      },
      accessorFn: (row) => {
        const pool = pools.find(p => String(p.id) === String(row.poolId));
        return pool?.poolName || "Unknown Pool";
      },
    },
    {
      accessorKey: "poolType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Pool Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
      cell: ({ row }) => {
        const token = row.original;
        const pool = pools.find(p => String(p.id) === String(token.poolId));
        return pool?.poolType || "Unknown Type";
      },
      accessorFn: (row) => {
        const pool = pools.find(p => String(p.id) === String(row.poolId));
        return pool?.poolType || "Unknown Type";
      },
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Total Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency', 
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(row.original.totalValue),
    },
    {
      accessorKey: "discountedValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Purchase Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => {
        const token = row.original;
        return (
          <>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 2
            }).format(token.discountedValue || 0)}
            {token.averageDiscountRate ? (
              <span className="text-xs text-muted-foreground ml-1">
                ({(token.averageDiscountRate * 100).toFixed(4)}% discount)
              </span>
            ) : null}
          </>
        );
      },
      accessorFn: (row) => row.discountedValue || 0,
    },
    {
      accessorKey: "discountAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Total Discount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(row.original.discountAmount || 0),
      accessorFn: (row) => row.discountAmount || 0,
    },
    {
      accessorKey: "averageAge",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Avg. Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => `${row.original.averageAge || 0} days`,
      accessorFn: (row) => row.averageAge || 0,
    },
    {
      accessorKey: "totalTokens",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Total Tokens
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => 
        new Intl.NumberFormat('en-US').format(row.original.totalTokens),
    },
    {
      accessorKey: "tokenValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Token Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "right" },
      cell: ({ row }) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        }).format(row.original.tokenValue),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      meta: { alignment: "left" },
      cell: ({ row }) => {
        const token = row.original;
        return getStatusBadge(token.status);
      },
    },
    {
      id: "actions",
      header: "Actions",
      meta: { alignment: "right" },
      cell: ({ row }) => {
        const token = row.original;
        return (
          <div className="flex space-x-1 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditTokenClick(token)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'draft')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'under_review')}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Under Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'approved')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'ready_to_mint')}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Ready to Mint
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'minted')}>
                      <Coins className="h-4 w-4 mr-2" />
                      Minted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'deployed')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Deployed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Paused
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'distributed')}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Distributed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'rejected')}>
                      <X className="h-4 w-4 mr-2" />
                      Rejected
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                {token.status.toLowerCase() === 'draft' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'under_review')}>
                    <Check className="h-4 w-4 mr-2" />
                    Submit for Review
                  </DropdownMenuItem>
                )}
                
                {token.status.toLowerCase() === 'under review' && (
                  <>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'approved')}>
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'rejected')}>
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                
                {token.status.toLowerCase() === 'approved' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'ready_to_mint')}>
                    <FileUp className="h-4 w-4 mr-2" />
                    Mark Ready to Mint
                  </DropdownMenuItem>
                )}
                
                {token.status.toLowerCase() === 'ready to mint' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'minted')}>
                    <Coins className="h-4 w-4 mr-2" />
                    Mark as Minted
                  </DropdownMenuItem>
                )}
                
                {token.status.toLowerCase() === 'minted' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'deployed')}>
                    <Play className="h-4 w-4 mr-2" />
                    Deploy
                  </DropdownMenuItem>
                )}
                
                {token.status.toLowerCase() === 'deployed' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'paused')}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                
                {token.status.toLowerCase() === 'paused' && (
                  <DropdownMenuItem onClick={() => handleChangeTokenStatus(token, 'deployed')}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => handleDeleteToken(token)}
                  className="text-destructive focus:text-destructive"
                  disabled={token.status !== 'draft' && token.status !== 'rejected'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ], [pools, handleEditTokenClick, handleChangeTokenStatus, handleDeleteToken]);

  // Memoize token table rendering for performance
  const renderTokensTable = useMemo(() => () => (
    <EnhancedDataTable
      columns={tokenColumns}
      data={tokens}
      searchKey="tokenName"
      searchPlaceholder="Search tokens..."
      exportFilename={`${projectName || 'project'}-tokens`}
    />
  ), [tokens, tokenColumns, projectName]);

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 space-x-2">
        {connectedAddress ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{connectedAddress}</span>
            <Button size="sm" variant="outline" onClick={handleDisconnectWallet} disabled={walletLoading}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleConnectWallet} disabled={walletLoading}>
            {walletLoading ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={throttledFetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Receivables Token</DialogTitle>
              <DialogDescription>
                Tokenize a pool of invoices to create a receivables token.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="poolId">Select Pool</Label>
                <Select
                  value={selectedPool ? String(selectedPool.id) : ""}
                  onValueChange={handlePoolSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {pools.map((pool) => {
                      const isFullyAllocated = fullyAllocatedPoolIds.includes(String(pool.id));
                      return (
                        <SelectItem 
                          key={pool.id} 
                          value={String(pool.id)}
                          disabled={isFullyAllocated}
                          className={isFullyAllocated ? "text-muted-foreground" : ""}
                        >
                          {pool.poolName} - ${(pool.totalValue || 0).toFixed(2)}
                          {isFullyAllocated && " (Fully allocated)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPool && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Pool Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Pool Type</p>
                        <p className="font-medium">{selectedPool.poolType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="font-medium">${(selectedPool.totalValue || 0).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Invoice Count</p>
                        <p className="font-medium">{selectedPool.invoiceCount || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    value={tokenFormData.tokenName}
                    onChange={(e) => setTokenFormData(prev => ({
                      ...prev,
                      tokenName: e.target.value,
                    }))}
                    placeholder="Enter token name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol">Token Symbol</Label>
                  <Input
                    id="tokenSymbol"
                    value={tokenFormData.tokenSymbol}
                    onChange={(e) => setTokenFormData(prev => ({
                      ...prev,
                      tokenSymbol: e.target.value,
                    }))}
                    placeholder="Enter token symbol"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialTokenValue">Initial Token Value ($)</Label>
                  <Input
                    id="initialTokenValue"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={tokenFormData.initialTokenValue.toFixed(4)}
                    onChange={(e) => handleInitialTokenValueChange(e.target.value)}
                    placeholder="Enter token value"
                  />
                  <p className="text-xs text-muted-foreground">
                    The initial value of each token in USD (affects total quantity)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalTokens">Total Tokens</Label>
                  <Input
                    id="totalTokens"
                    type="number"
                    value={tokenFormData.totalTokens}
                    onChange={(e) => handleTotalTokensChange(e.target.value)}
                    placeholder="Enter total tokens"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of tokens to create (face value ÷ token value)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenStandard">Token Standard</Label>
                <Select
                  value={tokenFormData.tokenStandard}
                  onValueChange={(value) => setTokenFormData(prev => ({
                    ...prev,
                    tokenStandard: value as "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626"
                  }))}
                >
                  <SelectTrigger id="tokenStandard" className="w-full">
                    <SelectValue placeholder="Select token standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC-20">ERC-20 (Fungible)</SelectItem>
                    <SelectItem value="ERC-721">ERC-721 (Non-Fungible)</SelectItem>
                    <SelectItem value="ERC-1155">ERC-1155 (Multi-Token)</SelectItem>
                    <SelectItem value="ERC-1400">ERC-1400 (Security Token)</SelectItem>
                    <SelectItem value="ERC-3525">ERC-3525 (Semi-Fungible)</SelectItem>
                    <SelectItem value="ERC-4626">ERC-4626 (Tokenized Vault)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The blockchain token standard to use for this token
                </p>
              </div>
              
              {selectedPool && (
                <div className="space-y-1 p-4 border rounded-md bg-muted/30">
                  <h4 className="font-medium text-sm">Token Economics</h4>
                  {(() => {
                    const { faceValue, discountedValue, discountAmount, averageDiscountRate } = getDiscountedPoolValue(selectedPool.id);
                    const tokenValue = calculateTokenValue(selectedPool.id, tokenFormData.totalTokens);
                    return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Face Value: </span>
                          <span className="font-medium">${faceValue.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Purchase Price: </span>
                          <span className="font-medium">${discountedValue.toFixed(2)}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({(averageDiscountRate * 100).toFixed(4)}% discount)
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total Discount: </span>
                          <span className="font-medium">${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Token Value: </span>
                          <span className="font-medium">${tokenValue.toFixed(4)}</span>
                          <span className="text-muted-foreground text-xs ml-1">per token</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total Tokens: </span>
                          <span className="font-medium">{tokenFormData.totalTokens.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="securityInterest">Security Interest Details</Label>
                <Textarea
                  id="securityInterest"
                  value={tokenFormData.securityInterestDetails}
                  onChange={(e) => setTokenFormData(prev => ({
                    ...prev,
                    securityInterestDetails: e.target.value,
                  }))}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateToken}
                disabled={creatingToken || !selectedPool || !tokenFormData.tokenName || !tokenFormData.tokenSymbol || tokenFormData.totalTokens <= 0}
              >
                {creatingToken ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Create Token
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Receivables Tokens</CardTitle>
          <CardDescription>
            Manage and view all tokenized receivables pools. Tokens can be distributed to investors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Coins className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Tokens Created</h3>
              <p className="text-muted-foreground mt-2">
                Create your first receivables token by tokenizing a pool.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Token
              </Button>
            </div>
          ) : (
            renderTokensTable()
          )}
        </CardContent>
      </Card>

      {/* Edit Token Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Receivables Token</DialogTitle>
            <DialogDescription>
              Update token information
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poolId">Select Pool</Label>
              <Select
                value={editTokenFormData.poolId.toString()}
                onValueChange={(value) => setEditTokenFormData(prev => ({
                  ...prev,
                  poolId: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pool" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((pool) => (
                    <SelectItem key={pool.id} value={String(pool.id)}>
                      {pool.poolName} - ${(pool.totalValue || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  value={editTokenFormData.tokenName}
                  onChange={(e) => setEditTokenFormData(prev => ({
                    ...prev,
                    tokenName: e.target.value,
                  }))}
                  placeholder="Enter token name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol">Token Symbol</Label>
                <Input
                  id="tokenSymbol"
                  value={editTokenFormData.tokenSymbol}
                  onChange={(e) => setEditTokenFormData(prev => ({
                    ...prev,
                    tokenSymbol: e.target.value,
                  }))}
                  placeholder="Enter token symbol"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialTokenValue">Initial Token Value ($)</Label>
                <Input
                  id="initialTokenValue"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={editTokenFormData.initialTokenValue.toFixed(4)}
                  onChange={(e) => setEditTokenFormData(prev => ({
                    ...prev,
                    initialTokenValue: parseFloat(e.target.value) || 0,
                  }))}
                  placeholder="Enter token value"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalTokens">Total Tokens</Label>
                <Input
                  id="totalTokens"
                  type="number"
                  value={editTokenFormData.totalTokens}
                  onChange={(e) => setEditTokenFormData(prev => ({
                    ...prev,
                    totalTokens: parseInt(e.target.value) || 0,
                  }))}
                  placeholder="Enter total tokens"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="securityInterest">Security Interest Details</Label>
              <Textarea
                id="securityInterest"
                value={editTokenFormData.securityInterestDetails}
                onChange={(e) => setEditTokenFormData(prev => ({
                  ...prev,
                  securityInterestDetails: e.target.value,
                }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editTokenStandard">Token Standard</Label>
              <Select
                value={editTokenFormData.tokenStandard}
                onValueChange={(value) => setEditTokenFormData(prev => ({
                  ...prev,
                  tokenStandard: value as "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626"
                }))}
              >
                <SelectTrigger id="editTokenStandard">
                  <SelectValue placeholder="Select token standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ERC-20">ERC-20 (Fungible)</SelectItem>
                  <SelectItem value="ERC-721">ERC-721 (Non-Fungible)</SelectItem>
                  <SelectItem value="ERC-1155">ERC-1155 (Multi-Token)</SelectItem>
                  <SelectItem value="ERC-1400">ERC-1400 (Security Token)</SelectItem>
                  <SelectItem value="ERC-3525">ERC-3525 (Semi-Fungible)</SelectItem>
                  <SelectItem value="ERC-4626">ERC-4626 (Tokenized Vault)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Change the blockchain token standard for this token
              </p>
            </div>

            {editingToken && (
              <div className="space-y-2">
                <Label htmlFor="tokenStatus">Token Status</Label>
                <Select
                  value={editingToken.status.toLowerCase().replace(/\s+/g, '_')}
                  onValueChange={(value) => {
                    if (editingToken) {
                      handleChangeTokenStatus(editingToken, value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ready_to_mint">Ready to Mint</SelectItem>
                    <SelectItem value="minted">Minted</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="distributed">Distributed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Change the current status of this token.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveTokenEdit}
              disabled={creatingToken || !editTokenFormData.poolId || !editTokenFormData.tokenName || !editTokenFormData.tokenSymbol}
            >
              {creatingToken ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default React.memo(TokenizationManager);