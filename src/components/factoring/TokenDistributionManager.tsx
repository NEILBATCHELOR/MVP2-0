// TokenDistributionManager.tsx - Main component
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, FileText, Users, Wallet, ArrowRight } from "lucide-react";
import { FactoringToken } from "./types";
import { 
  useTokenDistributionData, 
  useAllocationForm, 
  useSelectionManagement,
  Investor
} from "./TokenDistributionHooks";
import { 
  StatusMessage, 
  NavigationCards,
  BulkActions,
  createNavigationItems
} from "./TokenDistributionHelpers";
import { 
  AllocationTable, 
  DistributedTable, 
  InvestorsTable
} from "./TokenDistributionTables";
import { CreateAllocationDialog } from "./TokenDistributionDialogs";
import { walletManager } from "@/services/wallet/WalletManager";

interface TokenDistributionManagerProps {
  projectId: string;
  projectName?: string;
}

const TokenDistributionManager: React.FC<TokenDistributionManagerProps> = ({ projectId, projectName }) => {
  // Get data and state from hooks
  const { 
    tokens, 
    allocations, 
    investors, 
    loading, 
    fetchData,
    handleDistributeTokens,
    handleUpdateAllocation,
    setLoading
  } = useTokenDistributionData(projectId);
  
  // Local state for UI
  const [activeTab, setActiveTab] = useState<string>("allocations");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Allocation form state management
  const {
    selectedToken,
    selectedInvestor,
    allocationMode,
    allocating,
    createDialogOpen,
    allocationFormData,
    setSelectedToken,
    setSelectedInvestor,
    setCreateDialogOpen,
    handleTokenSelect,
    handleInvestorSelect,
    handleTokenAmountChange,
    handleInvestmentAmountChange,
    handlePctToggle,
    handleCreateAllocation,
    setAllocationMode
  } = useAllocationForm(tokens, investors, allocations, projectId, fetchData);
  
  // Selection management for bulk actions
  const {
    selectedRows,
    bulkDeleteLoading,
    handleRowSelectionChange,
    handleSelectAll,
    handleClearSelection,
    getSelectedAllocations,
    handleBulkDeleteSelected
  } = useSelectionManagement(allocations, fetchData);
  
  // Memoized derived values
  const pendingAllocations = useMemo(() => {
    return allocations.filter(a => a.distributionStatus === 'pending');
  }, [allocations]);
  
  const completedAllocations = useMemo(() => {
    return allocations.filter(a => a.distributionStatus === 'completed');
  }, [allocations]);
  
  // Calculate total value of allocations
  const totalAllocationValue = useMemo(() => {
    const tokenMap = new Map(tokens.map(token => [token.id, token]));
    
    return allocations.reduce((sum, allocation) => {
      const token = tokenMap.get(allocation.tokenId);
      return sum + (allocation.tokenAmount * (token?.tokenValue || 0));
    }, 0);
  }, [allocations, tokens]);

  // Navigation items
  const navigationItems = useMemo(() => 
    createNavigationItems(
      pendingAllocations.length,
      completedAllocations.length,
      investors.length
    ), 
    [pendingAllocations.length, completedAllocations.length, investors.length]
  );

  // Wallet connection state and handlers
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  useEffect(() => {
    walletManager.getConnectedAddress().then(addr => setConnectedAddress(addr));
  }, []);

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    const success = await walletManager.connectInjectedWallet();
    if (success) {
      const addr = await walletManager.getConnectedAddress();
      setConnectedAddress(addr);
    }
    setWalletLoading(false);
  };

  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    await walletManager.disconnectInjectedWallet();
    setConnectedAddress(null);
    setWalletLoading(false);
  };

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

      <StatusMessage message={successMessage} />

      <div className="flex flex-col space-y-6">
        <NavigationCards 
          items={navigationItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingAllocations.length}
          distributedCount={completedAllocations.length}
          totalAllocationValue={totalAllocationValue}
        />

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{
              navigationItems.find(item => item.id === activeTab)?.label
            }</h2>
            
            {activeTab === "allocations" && selectedRows.length > 0 && (
              <BulkActions 
                selectedRows={selectedRows}
                bulkDeleteLoading={bulkDeleteLoading}
                handleClearSelection={handleClearSelection}
                handleBulkDeleteSelected={handleBulkDeleteSelected}
                getSelectedAllocations={getSelectedAllocations}
                allocations={allocations}
                fetchData={fetchData}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Allocation
            </Button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "allocations" && (
          <AllocationTable
            allocations={pendingAllocations}
            tokens={tokens}
            loading={loading}
            selectedRows={selectedRows}
            handleRowSelectionChange={handleRowSelectionChange}
            handleSelectAll={handleSelectAll}
            handleDistributeTokens={handleDistributeTokens}
            handleUpdateAllocation={handleUpdateAllocation}
          />
        )}
        
        {activeTab === "distributed" && (
          <DistributedTable
            allocations={completedAllocations}
            tokens={tokens}
            investors={investors}
            loading={loading}
          />
        )}
        
        {activeTab === "investors" && (
          <InvestorsTable
            investors={investors}
            allocations={allocations}
            tokens={tokens}
            loading={loading}
            setSelectedInvestor={setSelectedInvestor}
            setCreateDialogOpen={setCreateDialogOpen}
          />
        )}
        
        {/* Dialogs */}
        <CreateAllocationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          tokens={tokens}
          investors={investors}
          selectedToken={selectedToken}
          selectedInvestor={selectedInvestor}
          allocationFormData={allocationFormData}
          allocationMode={allocationMode}
          allocating={allocating}
          allocations={allocations}
          handleTokenSelect={handleTokenSelect}
          handleInvestorSelect={handleInvestorSelect}
          handlePctToggle={handlePctToggle}
          handleTokenAmountChange={handleTokenAmountChange}
          handleInvestmentAmountChange={handleInvestmentAmountChange}
          setAllocationMode={setAllocationMode}
          handleCreateAllocation={handleCreateAllocation}
        />
      </div>
    </div>
  );
};

export default TokenDistributionManager;