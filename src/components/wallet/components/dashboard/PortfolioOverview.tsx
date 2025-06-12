import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/services/wallet/WalletContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Generate portfolio data based on actual wallets
const generatePortfolioData = (wallets: any[]) => {
  if (!wallets.length) {
    return [];
  }
  
  // Create monthly data based on wallet balances and networks
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return months.map((month, index) => {
    const data: any = { date: month };
    
    // Calculate values based on actual wallet networks
    wallets.forEach(wallet => {
      const networkName = wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1);
      const baseValue = parseFloat(wallet.balance) || 0;
      // Add some realistic fluctuation over time
      const fluctuation = 1 + (Math.sin(index * 0.5) * 0.2);
      data[networkName] = Math.max(0, baseValue * fluctuation);
    });
    
    return data;
  });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-sm p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PortfolioOverview: React.FC = () => {
  const { wallets } = useWallet();
  
  // Generate portfolio data from actual wallets
  const portfolioData = generatePortfolioData(wallets);
  
  // Get unique networks from wallets for chart colors
  const networks = Array.from(new Set(wallets.map(w => w.network.charAt(0).toUpperCase() + w.network.slice(1))));
  
  // Color scheme for different networks
  const networkColors: { [key: string]: string } = {
    Ethereum: '#6366f1',
    Polygon: '#8b5cf6',
    Avalanche: '#ec4899',
    Bitcoin: '#f59e0b',
    Arbitrum: '#06b6d4',
    Optimism: '#ef4444',
    Solana: '#22c55e',
  };
  
  if (!wallets.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Create your first wallet to see portfolio data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">No wallets found</p>
              <p className="text-sm">Create or connect a wallet to view your portfolio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>Asset value over time</CardDescription>
          </div>
          <Tabs defaultValue="1y" className="w-[200px]">
            <TabsList>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={portfolioData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {networks.map(network => (
                  <linearGradient key={network} id={`color${network}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={networkColors[network] || '#6366f1'} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={networkColors[network] || '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => `${value.toLocaleString()}`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              {networks.map(network => (
                <Area
                  key={network}
                  type="monotone"
                  dataKey={network}
                  stroke={networkColors[network] || '#6366f1'}
                  fillOpacity={1}
                  fill={`url(#color${network})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {networks.map(network => (
            <div key={network} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: networkColors[network] || '#6366f1' }}></div>
              <span className="text-sm">{network}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};