import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowUpDown, Globe, CreditCard, Activity, History } from "lucide-react";

// Import our new components
import BlockchainTransfer from "./components/transfer/BlockchainTransfer";
import UniswapV4Swap from "./components/swap/UniswapV4Swap";
import RipplePayments from "./components/ripple/RipplePayments";
import MoonpayIntegration from "./components/moonpay/MoonpayIntegration";
import { TransactionHistory } from "./components/TransactionHistory";

// Import existing components
import { WalletRiskCheck } from "./components/WalletRiskCheck";
import { useWallet } from "@/services/wallet/WalletContext";

interface EnhancedWalletInterfaceProps {
  defaultTab?: string;
}

export const EnhancedWalletInterface: React.FC<EnhancedWalletInterfaceProps> = ({ 
  defaultTab = "transfer" 
}) => {
  const { wallets } = useWallet();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const handleTransactionComplete = (txHash: string, type: string) => {
    // Add to recent transactions
    const newTransaction = {
      id: Date.now().toString(),
      hash: txHash,
      type,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
  };

  const tabItems = [
    {
      value: "transfer",
      label: "Send",
      icon: <Send className="w-4 h-4" />,
      description: "Send crypto across chains",
      component: <BlockchainTransfer onTransferComplete={(result) => 
        handleTransactionComplete(result.txHash, 'transfer')
      } />
    },
    {
      value: "swap",
      label: "Swap",
      icon: <ArrowUpDown className="w-4 h-4" />,
      description: "Trade with Uniswap V4",
      badge: "V4",
      component: <UniswapV4Swap onSwapComplete={(txHash) => 
        handleTransactionComplete(txHash, 'swap')
      } />
    },
    {
      value: "ripple",
      label: "Payments",
      icon: <Globe className="w-4 h-4" />,
      description: "Cross-border with Ripple",
      badge: "ODL",
      component: <RipplePayments onPaymentComplete={(result) => 
        handleTransactionComplete(result.hash, 'ripple_payment')
      } />
    },
    {
      value: "moonpay",
      label: "Buy/Sell",
      icon: <CreditCard className="w-4 h-4" />,
      description: "Fiat gateway with Moonpay",
      badge: "Fiat",
      component: <MoonpayIntegration onTransactionComplete={(transaction) => 
        handleTransactionComplete(transaction.id, 'moonpay_transaction')
      } />
    },
    {
      value: "history",
      label: "History",
      icon: <History className="w-4 h-4" />,
      description: "Transaction history",
      component: <TransactionHistory walletAddress={wallets[0]?.address || ''} />
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enterprise Blockchain Wallet</h1>
        <p className="text-muted-foreground">
          Complete crypto operations with real blockchain integration
        </p>
        
        {/* Wallet Status */}
        {wallets.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-green-500" />
            <span>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">Multi-Chain</div>
                <div className="text-sm text-muted-foreground">7+ Networks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-purple-500" />
              <div>
                <div className="font-medium">Uniswap V4</div>
                <div className="text-sm text-muted-foreground">Hooks + MEV Protection</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium">Ripple ODL</div>
                <div className="text-sm text-muted-foreground">Cross-Border</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <div>
                <div className="font-medium">Moonpay</div>
                <div className="text-sm text-muted-foreground">Fiat On/Off Ramp</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  {tabItems.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {tab.badge}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {tabItems.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-medium">{tab.label}</h3>
                        <p className="text-sm text-muted-foreground">{tab.description}</p>
                      </div>
                      {tab.component}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Security Check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {wallets.length > 0 ? (
                <WalletRiskCheck 
                  walletAddress={wallets[0].address} 
                  onRiskLevelChange={(level) => console.log('Risk level:', level)}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Connect a wallet to see security status
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium capitalize">{tx.type.replace('_', ' ')}</div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {tx.hash.slice(0, 8)}...
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No recent transactions
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Features</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multi-chain transfers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Uniswap V4 swaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ripple cross-border</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Moonpay fiat gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real blockchain execution</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWalletInterface;
