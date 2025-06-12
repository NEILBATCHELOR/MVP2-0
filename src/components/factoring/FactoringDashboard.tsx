import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  CreditCard, 
  Package, 
  Coins, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  FileText,
  BarChart3,
  ChartPie,
  TrendingUp,
  Building2,
  Landmark,
  Building
} from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import { PostgrestResponse } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { Invoice, Pool, FactoringToken, TokenAllocation } from "./types";
import PoolValueChart from "./charts/PoolValueChart";
import TokenAllocationChart from "./charts/TokenAllocationChart";
import InvoiceMetricsChart from "./charts/InvoiceMetricsChart";
import { getRecentFactoringLogs } from "./utils/auditLogger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface FactoringDashboardProps {
  projectId: string;
}

interface TopPerformer {
  id: string;
  investorId: string;
  investorName: string;
  investorType: string;
  totalValue: number;
  returnAmount: number;
  investmentAmount: number;
}

const FactoringDashboard: React.FC<FactoringDashboardProps> = ({ projectId }) => {
  console.log("%c FACTORING DASHBOARD MOUNTED ", "background: #ff0000; color: white; font-size: 20px");
  console.log("ProjectID:", projectId);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [tokens, setTokens] = useState<FactoringToken[]>([]);
  const [allocations, setAllocations] = useState<TokenAllocation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log("FactoringDashboard rendered with projectId:", projectId);

  useEffect(() => {
    console.log("FactoringDashboard useEffect triggered for projectId:", projectId);
    fetchDashboardData();
    fetchTopPerformers();
  }, [projectId]);

  const fetchDashboardData = async () => {
    console.log("Fetching dashboard data for project:", projectId);
    
    if (!projectId) {
      console.error("No project ID provided to FactoringDashboard");
      setError("No project ID provided");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch invoices
      console.log("Fetching invoices...");
      // @ts-ignore - Suppress deep type instantiation errors
      const invoiceResponse = await supabase
        .from("invoice")
        .select(`
          *,
          provider:provider_id(name),
          payer:payer_id(name),
          pool:pool_id(pool_name)
        `)
        .order("upload_timestamp", { ascending: false });
        
      const invoiceData = invoiceResponse.data;
      const invoiceError = invoiceResponse.error;

      if (invoiceError) {
        console.error("Error fetching invoice data:", invoiceError);
        throw invoiceError;
      }

      console.log(`Fetched ${invoiceData?.length || 0} invoices`);

      // Format invoice data
      const formattedInvoices: Invoice[] = (invoiceData || []).map(item => ({
        id: String(item.invoice_id),
        providerId: item.provider_id,
        providerName: item.provider?.name,
        patientName: item.patient_name,
        patientDob: item.patient_dob,
        serviceDates: item.service_dates,
        procedureCodes: item.procedure_codes,
        diagnosisCodes: item.diagnosis_codes,
        billedAmount: item.billed_amount || 0,
        adjustments: item.adjustments || 0,
        netAmountDue: item.net_amount_due || 0,
        payerId: item.payer_id,
        payerName: item.payer?.name,
        policyNumber: item.policy_number,
        invoiceNumber: item.invoice_number,
        invoiceDate: item.invoice_date,
        dueDate: item.due_date,
        factoringDiscountRate: item.factoring_discount_rate || 0,
        factoringTerms: item.factoring_terms || '',
        uploadTimestamp: item.upload_timestamp,
        poolId: item.pool_id ? String(item.pool_id) : undefined,
        poolName: item.pool?.pool_name,
        createdAt: item.upload_timestamp,
      }));
      
      setInvoices(formattedInvoices);

      // Fetch pools
      console.log("Fetching pools...");
      // @ts-ignore - Suppress deep type instantiation errors
      const poolResponse = await supabase
        .from("pool")
        .select("*")
        .order("creation_timestamp", { ascending: false });
        
      const poolData = poolResponse.data;
      const poolError = poolResponse.error;

      if (poolError) {
        console.error("Error fetching pool data:", poolError);
        throw poolError;
      }

      console.log(`Fetched ${poolData?.length || 0} pools`);

      // Calculate pool statistics
      const formattedPools: Pool[] = (poolData || []).map(item => {
        const poolInvoices = formattedInvoices.filter(invoice => invoice.poolId === String(item.pool_id));
        const totalValue = poolInvoices.reduce((sum, invoice) => sum + (invoice.netAmountDue || 0), 0);
        const invoiceCount = poolInvoices.length;
        
        // Calculate average duration between invoice date and due date in days
        const totalDuration = poolInvoices.reduce((sum, invoice) => {
          try {
            if (!invoice.invoiceDate || !invoice.dueDate) return sum;
            
            const invoiceDate = new Date(invoice.invoiceDate);
            const dueDate = new Date(invoice.dueDate);
            
            // Skip invalid dates
            if (isNaN(invoiceDate.getTime()) || isNaN(dueDate.getTime())) return sum;
            
            const durationInDays = Math.floor((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + (durationInDays > 0 ? durationInDays : 0); // Ensure non-negative
          } catch (err) {
            console.warn("Error calculating invoice duration", err);
            return sum;
          }
        }, 0);
        const averageAge = invoiceCount > 0 ? Math.round(totalDuration / invoiceCount) : 0;
        
        return {
          id: String(item.pool_id),
          poolName: item.pool_name || `Pool ${item.pool_id}`,
          poolType: item.pool_type as any,
          creationTimestamp: item.creation_timestamp,
          totalValue,
          invoiceCount,
          averageAge,
          createdAt: item.creation_timestamp,
        };
      });
      
      setPools(formattedPools);

      // Fetch allocations first - this is the data we want to display
      console.log("Fetching token allocations for project:", projectId);
      // @ts-ignore - Suppress deep type instantiation errors
      const allocationResponse = await supabase
        .from("token_allocations")
        .select(`
          id, 
          investor_id, 
          token_amount, 
          allocation_date, 
          distributed, 
          distribution_date, 
          distribution_tx_hash, 
          created_at, 
          subscription_id, 
          project_id,
          token_type,
          notes,
          investor:investor_id (name)
        `)
        .eq("project_id", projectId)
        .eq("token_type", "factoring")
        .order("created_at", { ascending: false });
        
      const allocationData = allocationResponse.data || [];
      const allocationError = allocationResponse.error;

      if (allocationError) {
        console.error("Error fetching allocation data:", allocationError);
        throw allocationError;
      }

      console.log(`Fetched ${allocationData.length} token allocations`);

      // Group allocations by token ID
      const tokenMap = new Map<string, {
        id: string,
        name: string,
        symbol: string,
        allocations: any[]
      }>();

      allocationData.forEach(allocation => {
        const tokenId = allocation.subscription_id;
        if (!tokenMap.has(tokenId)) {
          tokenMap.set(tokenId, {
            id: tokenId,
            name: `Token ${tokenId.substring(0, 8)}`,
            symbol: 'TPB',
            allocations: []
          });
        }
        
        tokenMap.get(tokenId)!.allocations.push(allocation);
      });

      // Convert map to array for easier state management
      const tokensFromAllocations = Array.from(tokenMap.values()).map(item => {
        // Calculate total amount for this token
        const totalAmount = item.allocations.reduce((sum, alloc) => 
          sum + parseFloat(String(alloc.token_amount || '0')), 0);
        
        // Determine if this is a factoring token by checking the token_type
        const isFactoringToken = item.allocations.some(alloc => 
          alloc.token_type === 'factoring');
        
        return {
          id: item.id,
          poolId: '0',
          tokenName: isFactoringToken ? 'Factoring Token' : item.name,
          tokenSymbol: isFactoringToken ? 'FACT' : item.symbol,
          totalTokens: totalAmount,
          tokenValue: 1.0,
          totalValue: totalAmount,
          createdAt: item.allocations[0]?.created_at || new Date().toISOString(),
          status: 'distributed' as const, // All tokens with allocations are treated as distributed
          securityInterestDetails: '',
          projectId: projectId,
          tokenType: isFactoringToken ? "factoring" : item.allocations[0]?.token_type || "ERC-20"
        };
      });

      // Special handling for factoring tokens - ENSURE we have a factoring token in the list
      const hasFactoringToken = tokensFromAllocations.some(token => token.tokenType === "factoring");
      
      // If we have factoring allocations but no factoring token, create one
      const factoringAllocations = allocationData.filter(a => a.token_type === 'factoring');
      if (factoringAllocations.length > 0 && !hasFactoringToken) {
        const totalFactoringAmount = factoringAllocations.reduce((sum, alloc) => 
          sum + parseFloat(String(alloc.token_amount || '0')), 0);
          
        tokensFromAllocations.push({
          id: 'factoring-master-token',
          poolId: '0',
          tokenName: 'Factoring Token',
          tokenSymbol: 'FACT',
          totalTokens: totalFactoringAmount,
          tokenValue: 1.0,
          totalValue: totalFactoringAmount,
          createdAt: factoringAllocations[0]?.created_at || new Date().toISOString(),
          status: 'distributed' as const,
          securityInterestDetails: '',
          projectId: projectId,
          tokenType: "factoring"
        });
      }

      // Now fetch tokens from the tokens table to get any additional metadata
      console.log("Fetching tokens for project:", projectId);
      // @ts-ignore - Suppress deep type instantiation errors
      const tokenResponse = await supabase
        .from("tokens")
        .select("id, name, symbol, created_at, project_id, metadata, status")
        .eq("project_id", projectId)
        .contains("metadata", { factoring: { source: "factoring_tokenization" } })
        .order("created_at", { ascending: false });
        
      const tokenData = tokenResponse.data || [];
      const tokenError = tokenResponse.error;

      if (tokenError) {
        console.error("Error fetching token data:", tokenError);
        throw tokenError;
      }

      console.log(`Fetched ${tokenData.length} factoring tokens from tokens table`);

      // Set tokens and selected token
      const allFactoringTokens = tokensFromAllocations;
      setTokens(allFactoringTokens);
      
      // Set selected token
      if (allFactoringTokens.length > 0) {
        setSelectedToken(allFactoringTokens[0].id);
      }
      
      // Process and format allocations
      const formattedAllocations: TokenAllocation[] = allocationData.map(item => {
        // Find associated token
        const tokenInfo = tokenMap.get(item.subscription_id);
        const tokenName = tokenInfo?.name || `Token ${item.subscription_id.substring(0, 8)}`;
        
        return {
          id: item.id,
          investorId: item.investor_id,
          investorName: item.investor?.name || "Unknown Investor",
          tokenId: item.subscription_id,
          tokenName,
          tokenAmount: parseFloat(String(item.token_amount || '0')),
          allocationDate: item.allocation_date || item.created_at,
          distributionStatus: item.distributed ? 'completed' : 'pending',
          distributionDate: item.distribution_date,
          transactionHash: item.distribution_tx_hash || "",
          tokenType: item.token_type || "",
          createdAt: item.created_at,
          notes: item.notes || ""
        };
      });
      
      setAllocations(formattedAllocations);

      // Fetch recent activities with more comprehensive data (not just audit logs)
      console.log("Fetching comprehensive activity data for project:", projectId);
      
      // Define necessary interfaces for the data we're working with to help with type checking
      interface PoolData {
        pool_id: number;
        pool_name: string;
        pool_type: string;
        creation_timestamp: string;
      }

      interface TokenData {
        id: string;
        name: string;
        symbol: string;
        created_at: string;
        project_id: string;
        metadata: any;
        status: string;
      }

      interface AllocationData {
        id: string;
        investor_id: string;
        token_amount: number;
        allocation_date: string;
        distributed: boolean;
        distribution_date: string | null;
        distribution_tx_hash: string | null;
        created_at: string;
        subscription_id: string;
        project_id: string;
        token_type: string;
        investor?: {
          name: string;
          email: string;
        };
      }

      // 1. Get recent pool activities with proper fields
      const recentPoolsResponse = await supabase
        .from("pool")
        .select(`
          pool_id,
          pool_name,
          pool_type,
          creation_timestamp
        `)
        .order("creation_timestamp", { ascending: false })
        .limit(10);
      
      // Cast data to the proper type to avoid TypeScript errors
      const recentPools = (recentPoolsResponse.data || []) as PoolData[];
      
      // 2. Get recent token activities
      const recentTokensResponse = await supabase
        .from("tokens")
        .select("id, name, symbol, created_at, project_id, metadata, status")
        .eq("project_id", projectId)
        .contains("metadata", { factoring: { source: "factoring_tokenization" } })
        .order("created_at", { ascending: false })
        .limit(10);
      
      const recentTokens = (recentTokensResponse.data || []) as TokenData[];
      
      // 3. Get recent allocations
      let recentAllocations: AllocationData[] = [];
      try {
        const recentAllocationsResponse = await supabase
          .from("token_allocations")
          .select(`
            id, 
            investor_id, 
            token_amount, 
            allocation_date, 
            distributed, 
            distribution_date, 
            distribution_tx_hash, 
            created_at, 
            subscription_id, 
            project_id,
            token_type,
            notes,
            investor:investor_id (name, email)
          `)
          .eq("project_id", projectId)
          .eq("token_type", "factoring")
          .order("created_at", { ascending: false })
          .limit(15);
        
        recentAllocations = (recentAllocationsResponse.data || []) as AllocationData[];
        console.log("Recent allocations:", recentAllocations.length);
      } catch (error) {
        console.error("Error fetching allocations:", error);
      }
      
      // 4. Get recent distribution activities
      const recentDistributionsResponse = await supabase
        .from("token_allocations")
        .select(`
          id, 
          investor_id, 
          token_amount, 
          allocation_date, 
          distributed, 
          distribution_date, 
          distribution_tx_hash, 
          created_at, 
          subscription_id, 
          project_id,
          token_type,
          notes,
          investor:investor_id (name, email)
        `)
        .eq("project_id", projectId)
        .eq("token_type", "factoring")
        .eq("distributed", true)
        .not("distribution_date", "is", null)
        .order("distribution_date", { ascending: false })
        .limit(10);
      
      const recentDistributions = (recentDistributionsResponse.data || []) as AllocationData[];
      
      // 5. Combine and format all activities
      const combinedActivities: any[] = [];
      
      // Add pool activities
      recentPools.forEach(pool => {
        combinedActivities.push({
          id: `pool-${pool.pool_id}`,
          timestamp: pool.creation_timestamp,
          action: "POOL_CREATE",
          action_type: "POOL_CREATE",
          entity_type: "pool",
          entity_id: String(pool.pool_id),
          details: `Pool "${pool.pool_name}" created`,
          user_email: "System",
          metadata: { 
            type: "pool", 
            poolName: pool.pool_name, 
            poolType: pool.pool_type,
            poolId: String(pool.pool_id)
          }
        });
      });
      
      // Add token activities
      recentTokens.forEach(token => {
        combinedActivities.push({
          id: `token-${token.id}`,
          timestamp: token.created_at,
          action: "TOKEN_CREATE",
          action_type: "TOKEN_CREATE",
          entity_type: "token",
          entity_id: String(token.id),
          details: `Token "${token.name}" (${token.symbol}) created with status ${token.status}`,
          user_email: "System",
          metadata: { 
            type: "token", 
            tokenName: token.name, 
            tokenSymbol: token.symbol, 
            status: token.status,
            tokenId: token.id
          }
        });
      });
      
      // Add allocation activities
      recentAllocations.forEach(allocation => {
        combinedActivities.push({
          id: `allocation-${allocation.id}`,
          timestamp: allocation.created_at,
          action: "TOKEN_ALLOCATION",
          action_type: "TOKEN_ALLOCATION",
          entity_type: "allocation",
          entity_id: String(allocation.id),
          details: `${allocation.token_amount} tokens allocated to ${allocation.investor?.name || 'Unknown'}`,
          user_email: allocation.investor?.email || "System",
          metadata: { 
            type: "allocation", 
            tokenAmount: allocation.token_amount, 
            investorName: allocation.investor?.name,
            tokenId: allocation.subscription_id
          }
        });
      });
      
      // Add distribution activities
      recentDistributions.forEach(distribution => {
        combinedActivities.push({
          id: `distribution-${distribution.id}`,
          timestamp: distribution.distribution_date || distribution.created_at,
          action: "TOKEN_DISTRIBUTION",
          action_type: "TOKEN_DISTRIBUTION",
          entity_type: "distribution",
          entity_id: String(distribution.id),
          details: `${distribution.token_amount} tokens distributed to ${distribution.investor?.name || 'Unknown'}`,
          user_email: distribution.investor?.email || "System",
          metadata: { 
            type: "distribution", 
            tokenAmount: distribution.token_amount, 
            investorName: distribution.investor?.name,
            tokenId: distribution.subscription_id,
            txHash: distribution.distribution_tx_hash
          }
        });
      });
      
      // Sort by timestamp descending
      const sortedActivities = combinedActivities.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Define a type for our activity log
      interface ActivityLog {
        id: string;
        timestamp: string;
        action: string;
        action_type: string;
        entity_type: string;
        entity_id: string;
        details: string;
        user_email: string;
        metadata: any;
      }
      
      // Still fetch audit logs as a fallback for any missing activities
      const logsResult = await getRecentFactoringLogs(projectId, undefined, 10);
      
      let finalActivities: ActivityLog[] = [...sortedActivities];
      
      if (logsResult.success) {
        console.log(`Fetched ${logsResult.data?.length || 0} audit logs`);
        
        // Combine with sorted activities, removing duplicates
        const existingIds = new Set(sortedActivities.map((a: any) => `${a.action_type}-${a.entity_id}`));
        
        const uniqueAuditLogs = (logsResult.data || []).filter((log: any) => 
          !existingIds.has(`${log.action_type}-${log.entity_id}`)
        );
        
        // Add unique audit logs to activities in a type-safe way
        uniqueAuditLogs.forEach((log: any) => {
          finalActivities.push({
            id: log.id || `audit-${log.entity_id}-${new Date(log.timestamp).getTime()}`,
            timestamp: log.timestamp,
            action: log.action,
            action_type: log.action_type,
            entity_type: log.entity_type,
            entity_id: String(log.entity_id || ''),
            details: log.details || '',
            user_email: log.user_email || "System",
            metadata: log.metadata || {}
          });
        });
        
        // Resort
        finalActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } else {
        console.error("Error fetching audit logs:", logsResult.error);
      }
      
      setAuditLogs(finalActivities.slice(0, 25));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch top performing investors
  const fetchTopPerformers = async () => {
    try {
      // Get token allocation data for investors
      const { data, error } = await supabase
        .from("token_allocations")
        .select(`
          id,
          investor_id,
          investor:investor_id (name, type),
          token_amount
        `)
        .eq("project_id", projectId)
        .eq("token_type", "factoring")
        .order("token_amount", { ascending: false });

      if (error) {
        console.error("Error fetching top performers:", error);
        return;
      }

      // Process and format investor data
      const investorMap = new Map<string, TopPerformer>();
      
      if (data) {
        data.forEach(allocation => {
          const investorId = allocation.investor_id;
          
          if (!investorMap.has(investorId)) {
            // Initialize new investor data
            investorMap.set(investorId, {
              id: `investor-${investorId}`,
              investorId,
              investorName: allocation.investor?.name || "Unknown Investor",
              investorType: allocation.investor?.type || "Institutional",
              totalValue: 0,
              returnAmount: 0,
              investmentAmount: 0
            });
          }
          
          // Update investor totals
          const investor = investorMap.get(investorId)!;
          const tokenAmount = parseFloat(String(allocation.token_amount || '0'));
          
          // For the purposes of this dashboard, we'll estimate the investment amount
          // as a percentage of the token amount (e.g., 80%)
          // This is a placeholder calculation - adjust based on your business logic
          const estimatedInvestmentAmount = tokenAmount * 0.8;
          const estimatedReturnAmount = tokenAmount - estimatedInvestmentAmount;
          
          investor.investmentAmount += estimatedInvestmentAmount;
          investor.returnAmount += estimatedReturnAmount;
          investor.totalValue += tokenAmount;
        });
      }
      
      // Convert to array and sort by total value
      const topInvestors = Array.from(investorMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5); // Limit to top 5
      
      setTopPerformers(topInvestors);
      
    } catch (error) {
      console.error("Error processing top performers:", error);
    }
  };

  // Get selected token data for allocation chart
  const selectedTokenData = tokens.find(token => token.id === selectedToken);
  
  // When dealing with factoring tokens, include ALL distributed factoring allocations
  const tokenAllocations = selectedTokenData && selectedTokenData.tokenType === "factoring"
    ? allocations.filter(allocation => 
        allocation.tokenType === "factoring" && 
        allocation.distributionStatus === "completed")
    : selectedTokenData 
    ? allocations.filter(allocation => allocation.tokenId === selectedTokenData.id)
    : [];

  // Log detailed information about the allocations
  console.log("Selected token:", selectedTokenData);
  console.log(`Token allocations for chart: ${tokenAllocations.length} of ${allocations.length} total allocations`);
  console.log("Factoring allocations:", allocations.filter(a => a.tokenType === "factoring"));
  console.log("Distributed factoring allocations:", allocations.filter(a => 
    a.tokenType === "factoring" && a.distributionStatus === "completed"));
  console.log("TokenAllocations for display:", tokenAllocations);

  // Calculate summary statistics - with safety checks
  const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + (invoice.netAmountDue || 0), 0);
  const totalPoolValue = pools.reduce((sum, pool) => sum + (pool.totalValue || 0), 0);
  const totalTokenValue = tokens.reduce((sum, token) => sum + (token.totalValue || 0), 0);
  const totalAllocations = allocations.length;

  // If there's an error, display it prominently
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-6 border-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="mb-1">Error loading dashboard</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading skeleton during initial load
  if (loading && !error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Skeleton className="h-[400px] w-full rounded-xl" />
        
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    );
  }

  console.log("Rendering dashboard with data", {
    invoiceCount: invoices.length,
    poolCount: pools.length,
    tokenCount: tokens.length,
    allocationCount: allocations.length,
    logCount: auditLogs.length
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Factoring Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of factoring operations and metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="p-4 pb-2 space-y-1.5">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                <CreditCard className="h-4 w-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Value: ${totalInvoiceValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="p-4 pb-2 space-y-1.5">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium">Pools & Tranches</CardTitle>
              <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                <Package className="h-4 w-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{pools.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Value: ${totalPoolValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="p-4 pb-2 space-y-1.5">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium">Tokens</CardTitle>
              <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                <Coins className="h-4 w-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{tokens.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Active Tokens: {tokens.filter(t => t.status === 'active' || t.status === 'distributed').length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="p-4 pb-2 space-y-1.5">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium">Allocations</CardTitle>
              <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                <Users className="h-4 w-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalAllocations}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Distributed Tokens: {tokens.filter(t => t.status === 'distributed').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="pools" className="mb-6 space-y-4">
        <TabsList className="w-full max-w-md grid grid-cols-3">
          <TabsTrigger value="pools" className="gap-1.5">
            <Package className="h-4 w-4" />
            <span>Pools</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-1.5">
            <Coins className="h-4 w-4" />
            <span>Tokens</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pools" className="space-y-0 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PoolValueChart pools={pools} />
            
            {/* Pool stats card */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pool Details</CardTitle>
                    <CardDescription>
                      Information about all pools and tranches
                    </CardDescription>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {pools.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No pool data available</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {pools.map(pool => (
                        <div key={pool.id} className="p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{pool.poolName}</h3>
                            <Badge variant="secondary" className="font-normal">
                              {pool.poolType}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Value</p>
                              <p className="font-medium">${(pool.totalValue || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Invoices</p>
                              <p className="font-medium">{pool.invoiceCount}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg. Duration</p>
                              <p className="font-medium">{pool.averageAge} days</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-0 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoice Amounts</CardTitle>
                    <CardDescription>
                      Total invoice amounts by date
                    </CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <InvoiceMetricsChart invoices={invoices} metric="amount" />
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Invoice Age</CardTitle>
                    <CardDescription>
                      Distribution of invoices by age range
                    </CardDescription>
                  </div>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <InvoiceMetricsChart invoices={invoices} metric="age" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tokens" className="space-y-0 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token distribution chart */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Token Distribution</CardTitle>
                    <CardDescription>
                      Distribution of factoring tokens to investors
                    </CardDescription>
                  </div>
                  <ChartPie className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {selectedTokenData ? (
                  <TokenAllocationChart 
                    token={selectedTokenData} 
                    allocations={tokenAllocations}
                    title="Token Distribution"
                    description="Distribution of factoring tokens to investors"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No token data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Token selection card */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Token Selection</CardTitle>
                    <CardDescription>
                      Select a factoring token to view its allocation
                    </CardDescription>
                  </div>
                  <Coins className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {tokens.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No factoring tokens available</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {tokens.map(token => (
                        <div 
                          key={token.id} 
                          className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                            selectedToken === token.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50 hover:bg-primary/5'
                          }`}
                          onClick={() => setSelectedToken(token.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{token.tokenName}</h3>
                            <Badge variant="outline" className="font-normal border-primary/25 text-primary">
                              {token.tokenSymbol}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
                              <p className="font-medium">{token.totalTokens.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Value</p>
                              <p className="font-medium">${(token.tokenValue as number).toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
                              <p className="font-medium capitalize">{token.status?.toLowerCase()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                  Recent operations from pools, tokens, allocations and distributions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">

            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                  {auditLogs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute left-0 inset-y-0 flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                      </div>
                    </div>
                    <div className="ml-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatAction(log.action)}</p>
                        <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 px-1.5 rounded-sm">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details || `Action on ${log.entity_type} ${log.entity_id || ''}`}</p>
                        {log.metadata && (
                          <div className="text-xs">
                            {log.metadata.type === 'pool' && (
                              <Badge variant="outline" className="bg-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/20 mr-2">
                                Type: {log.metadata.poolType}
                              </Badge>
                            )}
                            {log.metadata.type === 'token' && (
                              <Badge variant="outline" className="bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20 mr-2">
                                Status: {log.metadata.status}
                              </Badge>
                            )}
                            {log.metadata.type === 'allocation' && (
                              <Badge variant="outline" className="bg-[#2563eb]/15 text-[#2563eb] border-[#2563eb]/20 mr-2">
                                Tokens: {parseFloat(String(log.metadata.tokenAmount || '0')).toLocaleString()}
                              </Badge>
                            )}
                            {log.metadata.type === 'distribution' && log.metadata.txHash && (
                              <Badge variant="outline" className="bg-[#2563eb]/20 text-[#2563eb] border-[#2563eb]/20 mr-2">
                                TX: {log.metadata.txHash.substring(0, 10)}...
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground mt-1.5">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <Separator orientation="vertical" className="h-3 mx-2" />
                        <Users className="h-3 w-3 mr-1" />
                        <span>{log.user_email || "System"}</span>
                      </div>
                          {log.metadata && log.metadata.type && (
                            <div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2 py-0"
                                onClick={() => {
                                  if (log.metadata.type === 'pool') {
                                    navigate(`/projects/${projectId}/factoring/pools`);
                                  } else if (log.metadata.type === 'token') {
                                    navigate(`/projects/${projectId}/factoring/tokenization`);
                                  } else if (log.metadata.type === 'allocation') {
                                    navigate(`/projects/${projectId}/factoring/distribution?tab=allocations`);
                                  } else if (log.metadata.type === 'distribution') {
                                    navigate(`/projects/${projectId}/factoring/distribution?tab=distributed`);
                                  }
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
        
        {/* Investment Metrics Card - Updated Version */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Investment Metrics</CardTitle>
                <CardDescription>
                  Summary of key investment performance indicators
                </CardDescription>
              </div>
              <div className="p-1.5 rounded-md bg-[#2563eb]/10">
                <TrendingUp className="h-5 w-5 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allocations.length === 0 ? (
              <div className="text-center py-8 border rounded-lg border-dashed">
                <p className="text-muted-foreground">No investment data available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Investment Metrics Section */}
                <div className="p-6 border rounded-lg bg-background/50">
                  <h3 className="font-medium text-xl mb-6 text-[#2563eb]">Overall Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      // Calculate totals using data from allocation records
                      const factoringAllocations = allocations.filter(a => a.tokenType === "factoring");
                      
                      // Initialize totals
                      let totalFaceValue = 0;
                      let totalInvestment = 0;
                      
                      // Extract values from notes field in each allocation
                      factoringAllocations.forEach(allocation => {
                        // Get the notes field if it exists in the allocation
                        const notes = allocation.notes || '';
                        
                        // Extract Face Value using regex
                        const faceValueMatch = notes.match(/Face Value: \$([0-9,.]+)/);
                        if (faceValueMatch && faceValueMatch[1]) {
                          const faceValue = parseFloat(faceValueMatch[1].replace(/,/g, ''));
                          if (!isNaN(faceValue)) {
                            totalFaceValue += faceValue;
                          }
                        }
                        
                        // Extract Investment using regex
                        const investmentMatch = notes.match(/Investment: \$([0-9,.]+)/);
                        if (investmentMatch && investmentMatch[1]) {
                          const investment = parseFloat(investmentMatch[1].replace(/,/g, ''));
                          if (!isNaN(investment)) {
                            totalInvestment += investment;
                          }
                        }
                      });
                      
                      // If we couldn't extract from notes, fall back to token amounts
                      if (totalFaceValue === 0) {
                        totalFaceValue = factoringAllocations.reduce((sum, a) => sum + a.tokenAmount, 0);
                      }
                      
                      // Calculate Total Return
                      const totalReturn = totalFaceValue - totalInvestment;
                      
                      return (
                        <>
                          <div className="p-6 bg-white rounded-xl border shadow-sm transition-all hover:shadow-md">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Total Value ($)</p>
                            <p className="font-bold text-[#2563eb] text-3xl mb-1">
                              ${totalFaceValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                            </p>
                            <p className="text-sm text-muted-foreground">Face value of all factoring tokens</p>
                          </div>
                          <div className="p-6 bg-white rounded-xl border shadow-sm transition-all hover:shadow-md">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Total Investment ($)</p>
                            <p className="font-medium text-3xl mb-1">
                              ${totalInvestment.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                            </p>
                            <p className="text-sm text-muted-foreground">Amount invested by all investors</p>
                          </div>
                          <div className="p-6 bg-white rounded-xl border shadow-sm transition-all hover:shadow-md">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Total Return ($)</p>
                            <p className="font-medium text-[#2563eb] text-3xl mb-1">
                              ${totalReturn.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                            </p>
                            <p className="text-sm text-muted-foreground">Total face value minus investment</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-center">

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to get icon for action type
const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "INVOICE_UPLOAD":
    case "INVOICE_UPDATE":
    case "INVOICE_DELETE":
      return <CreditCard className="h-4 w-4" />;
    case "POOL_CREATE":
    case "POOL_UPDATE":
    case "POOL_DELETE":
      return <Package className="h-4 w-4" />;
    case "TOKEN_CREATE":
    case "TOKEN_UPDATE":
    case "TOKEN_DELETE":
      return <Coins className="h-4 w-4" />;
    case "TOKEN_ALLOCATION":
    case "TOKEN_DISTRIBUTION":
      return <Users className="h-4 w-4" />;
    default:
      return <RefreshCw className="h-4 w-4" />;
  }
};

// Helper function to get background color for action type
const getActionColor = (actionType: string) => {
  // Use bright blue color for all actions
  return "bg-[#2563eb]";
};

// Helper function to format action for display
const formatAction = (action: string) => {
  if (!action) return "Unknown Action";
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

export default FactoringDashboard;