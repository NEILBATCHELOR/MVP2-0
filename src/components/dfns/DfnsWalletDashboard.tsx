/**
 * DFNS Wallet Dashboard - Main entry point for DFNS functionality
 * 
 * Provides comprehensive wallet management, asset tracking, and transaction monitoring
 * for DFNS (Digital Finance) custody platform integration.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Plus, 
  ArrowUpDown, 
  Shield, 
  Settings, 
  Activity,
  TrendingUp,
  Users,
  Key,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Import DFNS types
import type { DfnsWallet, DfnsWalletBalance, DfnsTransfer } from '@/types/dfns';

// Import DFNS service
import { dfnsService } from '@/services/dfns/dfnsService';

// Import sub-components (to be created)
import { DfnsWalletList } from './DfnsWalletList';
import { DfnsWalletCreation } from './DfnsWalletCreation';
import { DfnsTransferDialog } from './DfnsTransferDialog';
import { DfnsActivityLog } from './DfnsActivityLog';
import { DfnsPolicyManagement } from './DfnsPolicyManagement';

interface DfnsWalletDashboardProps {
  className?: string;
}

interface DashboardStats {
  totalWallets: number;
  totalValue: string;
  activeTransfers: number;
  pendingApprovals: number;
  networksSupported: number;
}

export function DfnsWalletDashboard({ className }: DfnsWalletDashboardProps) {
  // State management
  const [wallets, setWallets] = useState<DfnsWallet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWallets: 0,
    totalValue: '$0.00',
    activeTransfers: 0,
    pendingApprovals: 0,
    networksSupported: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<DfnsWallet | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load wallets and compute stats
      const walletsResponse = await dfnsService.getWallets();
      const walletsData = walletsResponse.success ? walletsResponse.wallets : [];
      setWallets(walletsData);

      // Calculate dashboard statistics
      const dashboardStats = await calculateDashboardStats(walletsData);
      setStats(dashboardStats);

    } catch (err) {
      console.error('Failed to load DFNS dashboard data:', err);
      setError('Failed to load wallet data. Please check your DFNS connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = async (wallets: DfnsWallet[]): Promise<DashboardStats> => {
    // Get unique networks
    const networks = new Set(wallets.map(w => w.network));
    
    // Calculate total value (would need balance data)
    let totalValue = '$0.00';
    try {
      // This would require aggregating balances across all wallets
      // For now, show placeholder
      totalValue = '$0.00';
    } catch (err) {
      console.warn('Could not calculate total value:', err);
    }

    // Get active transfers count
    let activeTransfers = 0;
    try {
      const transfersResponse = await dfnsService.getTransfers();
      if (transfersResponse.success) {
        activeTransfers = transfersResponse.transfers.filter(t => 
          ['Pending', 'Broadcasted'].includes(t.status)
        ).length;
      }
    } catch (err) {
      console.warn('Could not get transfers:', err);
    }

    // Get pending approvals count
    let pendingApprovals = 0;
    try {
      const approvalsResponse = await dfnsService.getPolicyApprovals();
      if (approvalsResponse.success) {
        pendingApprovals = approvalsResponse.approvals.filter(a => a.status === 'Pending').length;
      }
    } catch (err) {
      console.warn('Could not get approvals:', err);
    }

    return {
      totalWallets: wallets.length,
      totalValue,
      activeTransfers,
      pendingApprovals,
      networksSupported: networks.size
    };
  };

  const handleWalletCreated = (wallet: DfnsWallet) => {
    setWallets(prev => [...prev, wallet]);
    setIsCreateWalletOpen(false);
    loadDashboardData(); // Refresh stats
  };

  const handleTransferInitiated = () => {
    setIsTransferOpen(false);
    loadDashboardData(); // Refresh to show new transfer
  };

  const handleWalletSelect = (wallet: DfnsWallet) => {
    setSelectedWallet(wallet);
    setIsTransferOpen(true);
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">DFNS Wallet Management</h1>
              <p className="text-muted-foreground">Loading your digital asset custody dashboard...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={loadDashboardData}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            DFNS Wallet Management
          </h1>
          <p className="text-muted-foreground">
            Institutional-grade digital asset custody and management platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateWalletOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Wallet
          </Button>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Wallets</p>
                <p className="text-2xl font-bold">{stats.totalWallets}</p>
              </div>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{stats.totalValue}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Transfers</p>
                <p className="text-2xl font-bold">{stats.activeTransfers}</p>
              </div>
              <ArrowUpDown className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
              {stats.pendingApprovals > 0 ? (
                <Clock className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Networks</p>
                <p className="text-2xl font-bold">{stats.networksSupported}</p>
              </div>
              <Key className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Wallets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Recent Wallets
                </CardTitle>
                <CardDescription>
                  Your most recently created wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wallets.slice(0, 5).map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{wallet.name || 'Unnamed Wallet'}</p>
                      <p className="text-sm text-muted-foreground">
                        {wallet.network} • {wallet.address.slice(0, 10)}...
                      </p>
                    </div>
                    <Badge variant={wallet.status === 'Active' ? 'default' : 'secondary'}>
                      {wallet.status}
                    </Badge>
                  </div>
                ))}
                {wallets.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No wallets created yet. Create your first wallet to get started.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common DFNS management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setIsCreateWalletOpen(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Wallet
                </Button>
                <Button
                  onClick={() => setActiveTab('transfers')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Transfer Assets
                </Button>
                <Button
                  onClick={() => setActiveTab('policies')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Policies
                </Button>
                <Button
                  onClick={() => setActiveTab('activity')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity Log
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>
                Create, manage, and monitor your DFNS wallets across multiple networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DfnsWalletList
                wallets={wallets}
                onWalletSelect={handleWalletSelect}
                onRefresh={loadDashboardData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Management</CardTitle>
              <CardDescription>
                View and manage asset transfers across your DFNS wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Transfer management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Policy Management</CardTitle>
              <CardDescription>
                Configure approval workflows and compliance policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DfnsPolicyManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Monitor all DFNS platform activities and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DfnsActivityLog />
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        
        {/* Dialogs */}
        {isCreateWalletOpen && (
          <DfnsWalletCreation
            isOpen={isCreateWalletOpen}
            onClose={() => setIsCreateWalletOpen(false)}
            onWalletCreated={handleWalletCreated}
          />
        )}

        {isTransferOpen && selectedWallet && (
          <DfnsTransferDialog
            isOpen={isTransferOpen}
            onClose={() => {
              setIsTransferOpen(false);
              setSelectedWallet(null);
            }}
            wallet={selectedWallet}
            onTransferInitiated={handleTransferInitiated}
          />
        )}
      </div>
    </div>
  );
}

// Export the Props interface
export type { DfnsWalletDashboardProps };

export default DfnsWalletDashboard;