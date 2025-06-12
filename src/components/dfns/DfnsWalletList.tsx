/**
 * DFNS Wallet List Component
 * 
 * Displays a comprehensive list of DFNS wallets with filtering, sorting,
 * and management capabilities.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ArrowUpDown,
  Wallet,
  Eye,
  Send,
  Settings,
  Shield
} from 'lucide-react';

import type { DfnsWallet } from '@/types/dfns';
import { formatDate } from '@/utils/date/dateHelpers';
import { formatAddress } from '@/utils/shared/formatAddress';
import { copyToClipboard } from '@/utils/shared/clipboard';

interface DfnsWalletListProps {
  wallets: DfnsWallet[];
  onWalletSelect?: (wallet: DfnsWallet) => void;
  onRefresh?: () => void;
  className?: string;
}

type SortField = 'name' | 'network' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

export function DfnsWalletList({
  wallets,
  onWalletSelect,
  onRefresh,
  className
}: DfnsWalletListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique networks for filter
  const networks = useMemo(() => {
    const uniqueNetworks = Array.from(new Set(wallets.map(w => w.network)));
    return uniqueNetworks.sort();
  }, [wallets]);

  // Filter and sort wallets
  const filteredWallets = useMemo(() => {
    let filtered = wallets.filter(wallet => {
      const matchesSearch = !searchTerm || 
        wallet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.walletId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesNetwork = networkFilter === 'all' || wallet.network === networkFilter;
      const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;

      return matchesSearch && matchesNetwork && matchesStatus;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'name') {
        aValue = a.name || 'Unnamed Wallet';
        bValue = b.name || 'Unnamed Wallet';
      }

      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [wallets, searchTerm, networkFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyAddress = (address: string) => {
    copyToClipboard(address);
  };

  const getNetworkBadgeColor = (network: string) => {
    const colors: Record<string, string> = {
      Ethereum: 'bg-blue-100 text-blue-800',
      Bitcoin: 'bg-orange-100 text-orange-800',
      Polygon: 'bg-purple-100 text-purple-800',
      Solana: 'bg-green-100 text-green-800',
      Arbitrum: 'bg-cyan-100 text-cyan-800',
      Optimism: 'bg-red-100 text-red-800',
    };
    return colors[network] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  if (wallets.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Wallets Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any DFNS wallets yet. Create your first wallet to get started.
          </p>
          <Button onClick={onRefresh}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallets by name, address, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={networkFilter} onValueChange={setNetworkFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Networks</SelectItem>
            {networks.map(network => (
              <SelectItem key={network} value={network}>
                {network}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredWallets.length} of {wallets.length} wallets
        </span>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      {/* Wallets Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold"
                >
                  Wallet Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('network')}
                  className="h-auto p-0 font-semibold"
                >
                  Network
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Address</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 font-semibold"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('createdAt')}
                  className="h-auto p-0 font-semibold"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWallets.map((wallet) => (
              <TableRow 
                key={wallet.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onWalletSelect?.(wallet)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {wallet.name || 'Unnamed Wallet'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {wallet.walletId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary"
                    className={getNetworkBadgeColor(wallet.network)}
                  >
                    {wallet.network}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {formatAddress(wallet.address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(wallet.address);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(wallet.status)}>
                      {wallet.status}
                    </Badge>
                    {wallet.delegated && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Delegated
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(wallet.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onWalletSelect?.(wallet);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onWalletSelect?.(wallet);
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Transfer Assets
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress(wallet.address);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Address
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open block explorer
                          window.open(`#/wallet/${wallet.walletId}`, '_blank');
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Explorer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open wallet settings
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredWallets.length === 0 && wallets.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2" />
          <p>No wallets match your current filters.</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setNetworkFilter('all');
              setStatusFilter('all');
            }}
            className="mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Export the Props interface
export type { DfnsWalletListProps };

export default DfnsWalletList;