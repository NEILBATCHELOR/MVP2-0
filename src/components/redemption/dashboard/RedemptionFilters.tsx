import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Search,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface FilterState {
  status?: string;
  tokenType?: string;
  investorId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

interface RedemptionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  loading?: boolean;
  className?: string;
}

export const RedemptionFilters: React.FC<RedemptionFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
  className
}) => {
  // Update a specific filter
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Clear specific filter
  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  // Quick date range presets
  const setQuickDateRange = (preset: string) => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (preset) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        from = subDays(now, 1);
        to = subDays(now, 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        from = subDays(now, 7);
        break;
      case 'last30days':
        from = subDays(now, 30);
        break;
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      default:
        return;
    }

    updateFilter('dateRange', { from, to });
  };

  // Count active filters
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof FilterState];
    if (key === 'search') return value && typeof value === 'string' && value.trim().length > 0;
    return value !== undefined && value !== null;
  }).length;

  // Format date range for display
  const formatDateRange = () => {
    if (!filters.dateRange) return 'Select date range';
    const { from, to } = filters.dateRange;
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs text-gray-600">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Request ID, investor..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-8"
                  disabled={loading}
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearFilter('search')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  updateFilter('status', value === 'all' ? undefined : value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Token Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Token Type</Label>
              <Select
                value={filters.tokenType || 'all'}
                onValueChange={(value) => 
                  updateFilter('tokenType', value === 'all' ? undefined : value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All tokens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tokens</SelectItem>
                  <SelectItem value="ERC-20">ERC-20</SelectItem>
                  <SelectItem value="ERC-721">ERC-721</SelectItem>
                  <SelectItem value="ERC-1155">ERC-1155</SelectItem>
                  <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                  <SelectItem value="ERC-3525">ERC-3525</SelectItem>
                  <SelectItem value="ERC-4626">ERC-4626</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('today')}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('yesterday')}
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('last7days')}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('last30days')}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('thisMonth')}
                      >
                        This month
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickDateRange('lastMonth')}
                      >
                        Last month
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilter('dateRange', { from: range.from, to: range.to });
                      } else {
                        updateFilter('dateRange', undefined);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {filters.dateRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('dateRange')}
                  className="w-full text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear date range
                </Button>
              )}
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Amount Range (USD)</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={filters.amountRange?.min || ''}
                  onChange={(e) => {
                    const min = parseFloat(e.target.value) || undefined;
                    updateFilter('amountRange', {
                      ...filters.amountRange,
                      min: min as number
                    });
                  }}
                  disabled={loading}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  value={filters.amountRange?.max || ''}
                  onChange={(e) => {
                    const max = parseFloat(e.target.value) || undefined;
                    updateFilter('amountRange', {
                      ...filters.amountRange,
                      max: max as number
                    });
                  }}
                  disabled={loading}
                />
              </div>
              {filters.amountRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('amountRange')}
                  className="w-full text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear range
                </Button>
              )}
            </div>

            {/* Investor ID */}
            <div className="space-y-2">
              <Label htmlFor="investorId" className="text-xs text-gray-600">
                Investor ID
              </Label>
              <Input
                id="investorId"
                placeholder="Enter investor ID"
                value={filters.investorId || ''}
                onChange={(e) => updateFilter('investorId', e.target.value || undefined)}
                disabled={loading}
              />
              {filters.investorId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('investorId')}
                  className="w-full text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear investor
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('status')}
                  />
                </Badge>
              )}
              {filters.tokenType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Token: {filters.tokenType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('tokenType')}
                  />
                </Badge>
              )}
              {filters.dateRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Date: {format(filters.dateRange.from, 'MMM d')} - {format(filters.dateRange.to, 'MMM d')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('dateRange')}
                  />
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{filters.search}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('search')}
                  />
                </Badge>
              )}
              {filters.investorId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Investor: {filters.investorId}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('investorId')}
                  />
                </Badge>
              )}
              {filters.amountRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Amount: ${filters.amountRange.min || 0} - ${filters.amountRange.max || '∞'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('amountRange')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RedemptionFilters;
