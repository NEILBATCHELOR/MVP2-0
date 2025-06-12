/**
 * DFNS Activity Log Component
 * 
 * Displays comprehensive activity tracking for all DFNS operations
 * including wallet creation, transfers, policy approvals, and system events.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  Wallet,
  Send,
  Shield,
  Key,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

import type { DfnsActivityLog as DfnsActivityLogType } from '@/types/dfns';
import { dfnsService } from '@/services/dfns/dfnsService';
import { formatDate, formatDistanceToNow } from '@/utils/date/dateHelpers';

interface DfnsActivityLogProps {
  className?: string;
  walletId?: string; // Optional filter for specific wallet
  limit?: number;
}

type ActivityType = 'all' | 'wallet' | 'transfer' | 'policy' | 'key' | 'auth';
type ActivityStatus = 'all' | 'success' | 'failed' | 'pending';

const ACTIVITY_ICONS = {
  wallet: Wallet,
  transfer: Send,
  policy: Shield,
  key: Key,
  auth: Settings,
  default: Activity
};

const ACTIVITY_COLORS = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

export function DfnsActivityLog({ 
  className, 
  walletId, 
  limit = 50 
}: DfnsActivityLogProps) {
  const [activities, setActivities] = useState<DfnsActivityLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType>('all');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus>('all');

  useEffect(() => {
    loadActivityLog();
  }, [walletId, limit]);

  const loadActivityLog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dfnsService.getActivityLog({
        walletId,
        limit,
        offset: 0
      });
      
      if (response.success) {
        setActivities(response.activities);
      } else {
        throw new Error(response.error || 'Failed to load activities');
      }
    } catch (err) {
      console.error('Failed to load activity log:', err);
      setError('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activityType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || activity.activityType === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getActivityIcon = (activityType: string) => {
    const IconComponent = ACTIVITY_ICONS[activityType as keyof typeof ACTIVITY_ICONS] || ACTIVITY_ICONS.default;
    return IconComponent;
  };

  const getStatusBadge = (status: string) => {
    const colorClass = ACTIVITY_COLORS[status as keyof typeof ACTIVITY_COLORS] || 'bg-gray-100 text-gray-800';
    
    const StatusIcon = status === 'success' ? CheckCircle : 
                      status === 'failed' ? XCircle : 
                      status === 'pending' ? Clock : AlertTriangle;

    return (
      <Badge variant="secondary" className={colorClass}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getActivityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      wallet: 'Wallet',
      transfer: 'Transfer',
      policy: 'Policy',
      key: 'Key Management',
      auth: 'Authentication',
      webhook: 'Webhook',
      exchange: 'Exchange',
      staking: 'Staking'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading activity log...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadActivityLog}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ActivityType)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="key">Key Management</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActivityStatus)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={loadActivityLog}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredActivities.length} of {activities.length} activities
        </span>
        <span>
          Last updated: {formatDistanceToNow(new Date())} ago
        </span>
      </div>

      {/* Activity Table */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activities Found</h3>
            <p className="text-muted-foreground">
              {activities.length === 0 
                ? "No activities have been recorded yet."
                : "No activities match your current filters."
              }
            </p>
            {activities.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.activityType);
                
                return (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-5">
                            {activity.description}
                          </p>
                          {activity.metadata && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {activity.entityId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getActivityTypeLabel(activity.activityType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {activity.entityType}
                      </code>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDistanceToNow(new Date(activity.createdAt))} ago</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              console.log('Activity details:', activity);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          {activity.entityType === 'wallet' && (
                            <DropdownMenuItem
                              onClick={() => {
                                // Navigate to wallet details
                                window.location.hash = `/wallets/${activity.entityId}`;
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Wallet
                            </DropdownMenuItem>
                          )}
                          {activity.entityType === 'transfer' && (
                            <DropdownMenuItem
                              onClick={() => {
                                // Navigate to transfer details
                                window.location.hash = `/transfers/${activity.entityId}`;
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Transfer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              // Copy activity ID to clipboard
                              navigator.clipboard.writeText(activity.entityId);
                            }}
                          >
                            Copy ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Load More Button */}
      {activities.length >= limit && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // Load more activities
              // This would require updating the limit and re-fetching
            }}
          >
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
}

// Export the Props interface
export type { DfnsActivityLogProps };

export default DfnsActivityLog;