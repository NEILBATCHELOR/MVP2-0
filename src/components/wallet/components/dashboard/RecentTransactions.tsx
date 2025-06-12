import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, MoreHorizontal, Search, Filter } from "lucide-react";

// Placeholder transaction data - would come from an API or context in a real application
const mockTransactions = [
  {
    id: '1',
    hash: '0x3d016d979f9e5a9f96ed9e4eb0c6cd16e3731e89',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0x3Ab2f5d67890bCdE9D1c',
    amount: '0.54',
    token: 'ETH',
    status: 'confirmed',
    timestamp: '2023-07-15T12:34:56Z',
    network: 'ethereum',
    type: 'send'
  },
  {
    id: '2',
    hash: '0x2f5fe7c884a1d57349b39c21f5e8e5529ac4a3a9',
    from: '0x3Ab2f5d67890bCdE9D1c',
    to: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    amount: '123.45',
    token: 'USDC',
    status: 'confirmed',
    timestamp: '2023-07-14T15:22:33Z',
    network: 'polygon',
    type: 'receive'
  },
  {
    id: '3',
    hash: '0x9f8c7b5e4d3a2c1f0e9d8b7a6c5f4e3d2c1b0a9f',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0x5f4E3d2C1B0a9F8c7b5E4d3A2c1F0e9D8b7A6c5F',
    amount: '0.05',
    token: 'ETH',
    status: 'pending',
    timestamp: '2023-07-13T08:45:12Z',
    network: 'ethereum',
    type: 'send'
  },
  {
    id: '4',
    hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0x9c0D1e2F3a4B5c6D7e8F9a0B1a2B3c4D5e6F7a8B',
    amount: '1.75',
    token: 'AVAX',
    status: 'confirmed',
    timestamp: '2023-07-12T20:15:43Z',
    network: 'avalanche',
    type: 'send'
  },
  {
    id: '5',
    hash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    from: '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b',
    to: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    amount: '0.08',
    token: 'ETH',
    status: 'confirmed',
    timestamp: '2023-07-11T11:23:45Z',
    network: 'optimism',
    type: 'receive'
  },
  {
    id: '6',
    hash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    from: '0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0',
    to: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    amount: '500',
    token: 'USDT',
    status: 'failed',
    timestamp: '2023-07-10T14:55:22Z',
    network: 'polygon',
    type: 'receive'
  },
  {
    id: '7',
    hash: '0xd1c2b3a4e5f6d7c8b9a0f1e2d3c4b5a6e7f8d9c0',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0xD1c2B3a4E5f6D7c8B9a0F1e2D3c4B5a6E7f8D9c0',
    amount: '0.12',
    token: 'ETH',
    status: 'confirmed',
    timestamp: '2023-07-09T17:44:11Z',
    network: 'ethereum',
    type: 'send'
  },
  {
    id: '8',
    hash: '0x5e6f7d8c9b0a1d2e3f4c5b6a7d8e9f0c1b2a3d4',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0x5E6f7D8c9B0a1D2e3F4c5B6a7D8e9F0c1B2a3D4',
    amount: '25',
    token: 'MATIC',
    status: 'confirmed',
    timestamp: '2023-07-08T09:33:21Z',
    network: 'polygon',
    type: 'send'
  },
  {
    id: '9',
    hash: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    from: '0x2A3b4C5d6E7f8A9b0C1d2E3f4A5b6C7d8E9f0A1',
    to: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    amount: '100',
    token: 'USDC',
    status: 'confirmed',
    timestamp: '2023-07-07T14:22:05Z',
    network: 'arbitrum',
    type: 'receive'
  },
  {
    id: '10',
    hash: '0xf9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0',
    from: '0x7Fc98a135E7107396C53f3aFbBe271ab82A54D8F',
    to: '0xF9e8D7c6B5a4F3e2D1c0B9a8F7e6D5c4B3a2F1e0',
    amount: '1.5',
    token: 'ETH',
    status: 'pending',
    timestamp: '2023-07-06T20:11:45Z',
    network: 'ethereum',
    type: 'send'
  }
];

interface RecentTransactionsProps {
  limit?: number;
  showFilters?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  limit = 5,
  showFilters = false,
}) => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState(mockTransactions.slice(0, limit));

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600">
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600">
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Get network badge
  const getNetworkBadge = (network: string) => {
    const networkColors: Record<string, { bg: string, text: string }> = {
      ethereum: { bg: 'bg-blue-50', text: 'text-blue-600' },
      polygon: { bg: 'bg-purple-50', text: 'text-purple-600' },
      avalanche: { bg: 'bg-red-50', text: 'text-red-600' },
      arbitrum: { bg: 'bg-sky-50', text: 'text-sky-600' },
      optimism: { bg: 'bg-rose-50', text: 'text-rose-600' },
    };
    
    const colors = networkColors[network.toLowerCase()] || { bg: 'bg-gray-50', text: 'text-gray-600' };
    
    return (
      <Badge variant="outline" className={`${colors.bg} ${colors.text}`}>
        {network.charAt(0).toUpperCase() + network.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              History of your wallet transactions
            </CardDescription>
          </div>

          {showFilters && (
            <div className="flex flex-col md:flex-row gap-2">
              <Tabs defaultValue="all" className="w-[300px]">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="received">Received</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="relative grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, hash, token..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">From/To</TableHead>
                <TableHead className="hidden md:table-cell">Network</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.type === 'send' ? (
                        <div className="bg-orange-100 p-1 rounded-full">
                          <ArrowUpRight className="h-4 w-4 text-orange-500" />
                        </div>
                      ) : (
                        <div className="bg-green-100 p-1 rounded-full">
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {tx.amount} {tx.token}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatAddress(tx.type === 'send' ? tx.to : tx.from)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getNetworkBadge(tx.network)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(tx.timestamp)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tx.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Copy Transaction Hash</DropdownMenuItem>
                          <DropdownMenuItem>Copy Address</DropdownMenuItem>
                          <DropdownMenuItem>Export Receipt</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {transactions.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline">View All Transactions</Button>
          </div>
        )}

        {transactions.length === 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};