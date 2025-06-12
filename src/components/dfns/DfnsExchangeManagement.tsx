/**
 * DFNS Exchange Management Component - UI for managing exchange integrations
 * 
 * This component provides a comprehensive interface for:
 * - Creating and configuring exchange accounts (Kraken, Binance, Coinbase Prime)
 * - Managing deposits and withdrawals
 * - Monitoring exchange balances and assets
 * - Trading operations and order management
 * - Exchange performance analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DfnsExchangeManager,
  ExchangeWithdrawal,
  ExchangeType,
  ExchangeStatus,
  DepositStatus,
  WithdrawalStatus
} from '@/infrastructure/dfns/exchange-manager';
import type {
  ExchangeAccount,
  ExchangeAsset,
  ExchangeDeposit
} from '@/types/dfns/domain';
import { DfnsAuthenticator } from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { 
  Building, 
  Plus, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Edit,
  Eye,
  BarChart,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

// ===== Types =====

interface ExchangeManagementProps {
  authenticator?: DfnsAuthenticator;
  onExchangeCreated?: (exchange: ExchangeAccount) => void;
  onExchangeDeleted?: (exchangeId: string) => void;
  defaultView?: 'exchanges' | 'assets' | 'transactions' | 'analytics';
}

interface ExchangeFormData {
  exchangeType: ExchangeType;
  name: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  sandbox: boolean;
  tradingEnabled: boolean;
  allowedAssets: string[];
}

interface TransactionFormData {
  exchangeId: string;
  type: 'deposit' | 'withdrawal';
  asset: string;
  amount: string;
  walletId?: string;
  destination?: string;
  memo?: string;
}

// ===== Main Component =====

export const DfnsExchangeManagement: React.FC<ExchangeManagementProps> = ({
  authenticator,
  onExchangeCreated,
  onExchangeDeleted,
  defaultView = 'exchanges'
}) => {
  // ===== State Management =====
  const [exchangeManager] = useState(() => 
    new DfnsExchangeManager(DEFAULT_CLIENT_CONFIG, authenticator)
  );
  
  const [exchanges, setExchanges] = useState<ExchangeAccount[]>([]);
  const [assets, setAssets] = useState<Record<string, ExchangeAsset[]>>({});
  const [deposits, setDeposits] = useState<ExchangeDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<ExchangeWithdrawal[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState(defaultView);

  // ===== Data Loading =====

  const loadExchanges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const exchangeList = await exchangeManager.listExchangeAccounts();
      setExchanges(exchangeList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [exchangeManager]);

  const loadExchangeAssets = useCallback(async (exchangeId: string) => {
    try {
      setIsLoading(true);
      const assetList = await exchangeManager.listExchangeAssets(exchangeId, 'primary');
      setAssets(prev => ({ ...prev, [exchangeId]: assetList }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [exchangeManager]);

  // ===== Effects =====

  useEffect(() => {
    loadExchanges();
  }, [loadExchanges]);

  useEffect(() => {
    if (selectedExchange) {
      loadExchangeAssets(selectedExchange.id);
    }
  }, [selectedExchange, loadExchangeAssets]);

  // ===== Exchange Operations =====

  const handleCreateExchange = async (formData: ExchangeFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let exchangeConfig;
      
      switch (formData.exchangeType) {
        case ExchangeType.Kraken:
          exchangeConfig = exchangeManager.createKrakenConfig(
            formData.apiKey,
            formData.apiSecret,
            {
              tradingEnabled: formData.tradingEnabled,
              sandbox: formData.sandbox,
              allowedAssets: formData.allowedAssets
            }
          );
          break;
          
        case ExchangeType.Binance:
          exchangeConfig = exchangeManager.createBinanceConfig(
            formData.apiKey,
            formData.apiSecret,
            {
              tradingEnabled: formData.tradingEnabled,
              sandbox: formData.sandbox,
              allowedAssets: formData.allowedAssets
            }
          );
          break;
          
        case ExchangeType.CoinbasePrime:
          if (!formData.passphrase) {
            throw new Error('Passphrase is required for Coinbase Prime');
          }
          exchangeConfig = exchangeManager.createCoinbasePrimeConfig(
            formData.apiKey,
            formData.apiSecret,
            formData.passphrase,
            {
              tradingEnabled: formData.tradingEnabled,
              sandbox: formData.sandbox,
              allowedAssets: formData.allowedAssets
            }
          );
          break;
          
        default:
          throw new Error('Unsupported exchange type');
      }
      
      exchangeConfig.name = formData.name;
      
      const newExchange = await exchangeManager.createExchangeAccount(exchangeConfig);
      setExchanges(prev => [...prev, newExchange]);
      setIsCreateDialogOpen(false);
      onExchangeCreated?.(newExchange);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExchange = async (exchangeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await exchangeManager.deleteExchangeAccount(exchangeId);
      setExchanges(prev => prev.filter(e => e.id !== exchangeId));
      
      if (selectedExchange?.id === exchangeId) {
        setSelectedExchange(null);
      }
      
      onExchangeDeleted?.(exchangeId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (exchangeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await exchangeManager.testExchangeConnection(exchangeId);
      
      if (result.success) {
        // Show success message
        console.log(`Connection test successful (${result.latency}ms)`);
      } else {
        setError(`Connection test failed: ${result.error}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (formData: TransactionFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (formData.type === 'deposit') {
        if (!formData.walletId) {
          throw new Error('Wallet ID is required for deposits');
        }
        
        const deposit = await exchangeManager.createExchangeDeposit({
          exchangeId: formData.exchangeId,
          asset: formData.asset,
          amount: formData.amount,
          walletId: formData.walletId,
          memo: formData.memo
        });
        
        setDeposits(prev => [...prev, deposit]);
      } else {
        if (!formData.destination || !formData.walletId) {
          throw new Error('Destination and wallet ID are required for withdrawals');
        }
        
        const withdrawal = await exchangeManager.createExchangeWithdrawal({
          exchangeId: formData.exchangeId,
          asset: formData.asset,
          amount: formData.amount,
          walletId: formData.walletId,
          destination: formData.destination,
          memo: formData.memo
        });
        
        setWithdrawals(prev => [...prev, withdrawal]);
      }
      
      setIsTransactionDialogOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Render Helpers =====

  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  const getStatusBadge = (status: ExchangeStatus) => {
    const variants = {
      [ExchangeStatus.Active]: 'default',
      [ExchangeStatus.Inactive]: 'secondary',
      [ExchangeStatus.Suspended]: 'destructive',
      [ExchangeStatus.Error]: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getDepositStatusBadge = (status: DepositStatus) => {
    const variants = {
      [DepositStatus.Pending]: 'secondary',
      [DepositStatus.Confirmed]: 'default',
      [DepositStatus.Failed]: 'destructive',
      [DepositStatus.Cancelled]: 'secondary'
    } as const;
    
    const icons = {
      [DepositStatus.Pending]: Clock,
      [DepositStatus.Confirmed]: CheckCircle,
      [DepositStatus.Failed]: XCircle,
      [DepositStatus.Cancelled]: XCircle
    };
    
    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // ===== Main Render =====

  return (
    <div className="space-y-6">
      {renderError()}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exchange Management</h2>
          <p className="text-gray-600">Configure and monitor exchange integrations</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Exchange
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ExchangeCreateDialog
                onSubmit={handleCreateExchange}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <TransactionDialog
                exchanges={exchanges}
                onSubmit={handleTransaction}
                onCancel={() => setIsTransactionDialogOpen(false)}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={currentView} onValueChange={(value: string) => setCurrentView(value as typeof currentView)}>
        <TabsList>
          <TabsTrigger value="exchanges">
            <Building className="h-4 w-4 mr-2" />
            Exchanges
          </TabsTrigger>
          <TabsTrigger value="assets">
            <DollarSign className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Activity className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exchanges" className="space-y-4">
          <ExchangeListView
            exchanges={exchanges}
            selectedExchange={selectedExchange}
            onSelectExchange={setSelectedExchange}
            onDeleteExchange={handleDeleteExchange}
            onTestConnection={handleTestConnection}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <ExchangeAssetsView
            exchanges={exchanges}
            assets={assets}
            selectedExchange={selectedExchange}
            onSelectExchange={setSelectedExchange}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <ExchangeTransactionsView
            deposits={deposits}
            withdrawals={withdrawals}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ExchangeAnalyticsView
            exchanges={exchanges}
            assets={assets}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ===== Sub-components =====

interface ExchangeCreateDialogProps {
  onSubmit: (data: ExchangeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ExchangeCreateDialog: React.FC<ExchangeCreateDialogProps> = ({
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<ExchangeFormData>({
    exchangeType: ExchangeType.Kraken,
    name: '',
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    sandbox: true,
    tradingEnabled: true,
    allowedAssets: ['BTC', 'ETH', 'USDT', 'USDC']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const requiresPassphrase = formData.exchangeType === ExchangeType.CoinbasePrime;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Exchange Account</DialogTitle>
        <DialogDescription>
          Configure a new exchange integration for trading and asset management.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Exchange Type</Label>
          <Select 
            value={formData.exchangeType} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, exchangeType: value as ExchangeType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ExchangeType.Kraken}>Kraken</SelectItem>
              <SelectItem value={ExchangeType.Binance}>Binance</SelectItem>
              <SelectItem value={ExchangeType.CoinbasePrime}>Coinbase Prime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="exchange-name">Name</Label>
          <Input
            id="exchange-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Exchange Account"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="Enter API key"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="api-secret">API Secret</Label>
          <Input
            id="api-secret"
            type="password"
            value={formData.apiSecret}
            onChange={(e) => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))}
            placeholder="Enter API secret"
            required
          />
        </div>
        
        {requiresPassphrase && (
          <div>
            <Label htmlFor="passphrase">Passphrase</Label>
            <Input
              id="passphrase"
              type="password"
              value={formData.passphrase}
              onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
              placeholder="Enter passphrase"
              required
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id="sandbox"
            checked={formData.sandbox}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sandbox: checked }))}
          />
          <Label htmlFor="sandbox">Sandbox Mode</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="trading"
            checked={formData.tradingEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tradingEnabled: checked }))}
          />
          <Label htmlFor="trading">Enable Trading</Label>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.name || !formData.apiKey || !formData.apiSecret}>
            {isLoading ? 'Creating...' : 'Create Exchange Account'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// Additional sub-components would be implemented here...
// (ExchangeListView, ExchangeAssetsView, etc.)

// ExchangeListView Component
interface ExchangeListViewProps {
  exchanges: ExchangeAccount[];
  selectedExchange: ExchangeAccount | null;
  onSelectExchange: (exchange: ExchangeAccount) => void;
  onDeleteExchange: (exchangeId: string) => void;
  onTestConnection: (exchangeId: string) => void;
  isLoading: boolean;
}

const ExchangeListView: React.FC<ExchangeListViewProps> = ({
  exchanges,
  selectedExchange,
  onSelectExchange,
  onDeleteExchange,
  onTestConnection,
  isLoading
}) => {
  if (isLoading && exchanges.length === 0) {
    return <div className="flex justify-center p-4">Loading exchanges...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exchange Accounts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exchanges.map((exchange) => (
          <Card 
            key={exchange.id} 
            className={`cursor-pointer transition-colors ${selectedExchange?.id === exchange.id ? 'bg-muted' : ''}`}
            onClick={() => onSelectExchange(exchange)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{exchange.name}</CardTitle>
                  <CardDescription>{exchange.type}</CardDescription>
                </div>
                <Badge variant={exchange.status === ExchangeStatus.Active ? 'default' : 'secondary'}>
                  {exchange.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Trading:</span>
                  <span>{exchange.tradingEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sandbox:</span>
                  <span>{exchange.sandbox ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestConnection(exchange.id);
                    }}
                  >
                    Test
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteExchange(exchange.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ExchangeAssetsView Component
interface ExchangeAssetsViewProps {
  exchanges: ExchangeAccount[];
  assets: Record<string, ExchangeAsset[]>;
  selectedExchange: ExchangeAccount | null;
  onSelectExchange: (exchange: ExchangeAccount) => void;
  isLoading: boolean;
}

const ExchangeAssetsView: React.FC<ExchangeAssetsViewProps> = ({
  exchanges,
  assets,
  selectedExchange,
  onSelectExchange,
  isLoading
}) => {
  const exchangeAssets = selectedExchange ? assets[selectedExchange.id] || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Exchange Assets</h3>
        <Select 
          value={selectedExchange?.id || ''} 
          onValueChange={(value) => {
            const exchange = exchanges.find(e => e.id === value);
            if (exchange) onSelectExchange(exchange);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select exchange" />
          </SelectTrigger>
          <SelectContent>
            {exchanges.map((exchange) => (
              <SelectItem key={exchange.id} value={exchange.id}>
                {exchange.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">Loading assets...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>On Hold</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Value (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exchangeAssets.map((asset) => (
              <TableRow key={asset.symbol}>
                <TableCell className="font-medium">{asset.symbol}</TableCell>
                <TableCell>{asset.available}</TableCell>
                <TableCell>{asset.onHold}</TableCell>
                <TableCell>{asset.total}</TableCell>
                <TableCell>${asset.usdValue || '0.00'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

// ExchangeTransactionsView Component
interface ExchangeTransactionsViewProps {
  deposits: ExchangeDeposit[];
  withdrawals: ExchangeWithdrawal[];
  isLoading: boolean;
}

const ExchangeTransactionsView: React.FC<ExchangeTransactionsViewProps> = ({
  deposits,
  withdrawals,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exchange Transactions</h3>
      
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList>
          <TabsTrigger value="deposits">
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Deposits ({deposits.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Withdrawals ({withdrawals.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposits">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>{deposit.asset}</TableCell>
                  <TableCell>{deposit.amount}</TableCell>
                  <TableCell>
                    <Badge variant={deposit.status === DepositStatus.Confirmed ? 'default' : 'secondary'}>
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{deposit.exchangeId}</TableCell>
                  <TableCell>{new Date(deposit.dateCreated).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{withdrawal.asset}</TableCell>
                  <TableCell>{withdrawal.amount}</TableCell>
                  <TableCell>
                    <Badge variant={withdrawal.status === WithdrawalStatus.Completed ? 'default' : 'secondary'}>
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{withdrawal.destination}</TableCell>
                  <TableCell>{new Date(withdrawal.dateCreated).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ExchangeAnalyticsView Component
interface ExchangeAnalyticsViewProps {
  exchanges: ExchangeAccount[];
  assets: Record<string, ExchangeAsset[]>;
  isLoading: boolean;
}

const ExchangeAnalyticsView: React.FC<ExchangeAnalyticsViewProps> = ({
  exchanges,
  assets,
  isLoading
}) => {
  const totalValue = Object.values(assets).flat().reduce((sum, asset) => sum + (parseFloat(asset.usdValue || '0')), 0);
  const activeExchanges = exchanges.filter(e => e.status === ExchangeStatus.Active).length;

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Exchange Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all exchanges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exchanges</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeExchanges}</div>
            <p className="text-xs text-muted-foreground">
              Connected and operational
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(assets).flat().length}</div>
            <p className="text-xs text-muted-foreground">
              Unique asset holdings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// TransactionDialog Component
interface TransactionDialogProps {
  exchanges: ExchangeAccount[];
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  exchanges,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    exchangeId: '',
    type: 'deposit',
    asset: 'BTC',
    amount: '',
    walletId: '',
    destination: '',
    memo: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Exchange Transaction</DialogTitle>
        <DialogDescription>
          Create a deposit or withdrawal transaction.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Exchange</Label>
          <Select 
            value={formData.exchangeId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, exchangeId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exchange" />
            </SelectTrigger>
            <SelectContent>
              {exchanges.map((exchange) => (
                <SelectItem key={exchange.id} value={exchange.id}>
                  {exchange.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Transaction Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'deposit' | 'withdrawal' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="asset">Asset</Label>
          <Input
            id="asset"
            value={formData.asset}
            onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value }))}
            placeholder="BTC, ETH, USDT..."
            required
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="wallet-id">Wallet ID</Label>
          <Input
            id="wallet-id"
            value={formData.walletId}
            onChange={(e) => setFormData(prev => ({ ...prev, walletId: e.target.value }))}
            placeholder="Enter wallet ID"
            required
          />
        </div>
        
        {formData.type === 'withdrawal' && (
          <div>
            <Label htmlFor="destination">Destination Address</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="Enter destination address"
              required
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Input
            id="memo"
            value={formData.memo}
            onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
            placeholder="Transaction memo"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.exchangeId || !formData.asset || !formData.amount || !formData.walletId}>
            {isLoading ? 'Processing...' : `Create ${formData.type}`}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// ===== Export =====

export default DfnsExchangeManagement;
