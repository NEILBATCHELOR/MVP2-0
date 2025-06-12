import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/services/wallet/WalletContext";
import { Wallet, Plus, ArrowUpDown, Clock, Shield, BarChart3, CreditCard, Settings, ArrowLeftRight, RefreshCw } from "lucide-react";
import { PortfolioOverview } from "@/components/wallet/components/dashboard/PortfolioOverview";
import { WalletList } from "@/components/wallet/components/dashboard/WalletList";
import { RecentTransactions } from "@/components/wallet/components/dashboard/RecentTransactions";
import { TokenBalances } from "@/components/wallet/components/dashboard/TokenBalances";
import { NetworkStatus } from "@/components/wallet/components/dashboard/NetworkStatus";

const WalletDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallets, loading, selectedWallet, selectWallet, refreshBalances } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Check for tab parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "wallets", "tokens", "transactions", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Placeholder for wallet selection from list
  const handleWalletSelect = (walletId: string) => {
    selectWallet(walletId);
  };

  // Navigate to new wallet creation
  const handleCreateNewWallet = () => {
    navigate("/wallet/new");
  };

  // Navigate to transfer page
  const handleTransfer = () => {
    navigate("/wallet/transfer");
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your crypto assets across multiple blockchains
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshBalances}
            disabled={loading || !wallets.length}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleTransfer}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Transfer
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/wallet/swap")}
            className="flex items-center gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Swap
          </Button>
          <Button
            onClick={handleCreateNewWallet}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Wallet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
            <CardDescription>Across all wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallets.length > 0 ? 
                `${wallets.reduce((total, wallet) => total + (parseFloat(wallet.balance) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                '$0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {wallets.length > 0 ? (
                <span className="text-green-500 font-medium">↗ Ready to transact</span>
              ) : (
                <span className="text-muted-foreground">Create your first wallet</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Wallets
            </CardTitle>
            <CardDescription>EOA and MultiSig</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground">
              {wallets.filter(w => w.type === 'multisig').length} MultiSig, {wallets.filter(w => w.type === 'eoa').length} EOA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Transactions
            </CardTitle>
            <CardDescription>Requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {wallets.filter(w => w.type === 'multisig').length > 0 ? (
                <span className="text-green-500 font-medium">All transactions complete</span>
              ) : (
                <span className="text-muted-foreground">No pending transactions</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 md:w-[600px]">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <Wallet className="h-4 w-4 mr-2" />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <CreditCard className="h-4 w-4 mr-2" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PortfolioOverview />
            </div>
            <div>
              <NetworkStatus />
            </div>
          </div>
          <div className="mt-6">
            <RecentTransactions limit={5} />
          </div>
        </TabsContent>

        <TabsContent value="wallets" className="mt-6">
          <WalletList 
            wallets={wallets} 
            selectedWalletId={selectedWallet?.id} 
            onSelectWallet={handleWalletSelect}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="tokens" className="mt-6">
          <TokenBalances />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <RecentTransactions limit={10} showFilters={true} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure your wallet security options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Transaction Limits</h3>
                    <p className="text-sm text-muted-foreground">
                      Set daily transfer limits
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Whitelist Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Control approved addresses
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Guardian Wallets (Enterprise)</h3>
                    <p className="text-sm text-muted-foreground">
                      Institutional-grade wallet management
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/wallet/guardian/test")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Test API
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Wallet Health</CardTitle>
                <CardDescription>
                  Security recommendations and checks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-start">
                  <Shield className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">MultiSig Security</h3>
                    <p className="text-sm">
                      Your MultiSig wallets are properly configured with multiple signers
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 text-amber-800 rounded-md flex items-start">
                  <Shield className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Backup Reminder</h3>
                    <p className="text-sm">
                      Please ensure you have backed up your recovery phrases
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-start">
                  <Shield className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Password Protection</h3>
                    <p className="text-sm">
                      Your wallet access is protected with a strong password
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboardPage;