'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/utils';
import { useRedemptionApprovals } from '../hooks';

interface ApproverDashboardProps {
  approverId: string;
  className?: string;
}

export const ApproverDashboard: React.FC<ApproverDashboardProps> = ({
  approverId,
  className
}) => {
  const { 
    pendingApprovals, 
    approveRedemption, 
    rejectRedemption, 
    loading,
    isProcessing
  } = useRedemptionApprovals({ approverId });

  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  const handleApprove = async (redemptionId: string) => {
    try {
      await approveRedemption(redemptionId, 'Approved by approver dashboard');
    } catch (error) {
      console.error('Failed to approve redemption:', error);
    }
  };

  const handleReject = async (redemptionId: string, reason?: string) => {
    try {
      await rejectRedemption(redemptionId, reason || 'Rejected by approver');
    } catch (error) {
      console.error('Failed to reject redemption:', error);
    }
  };

  const toggleSelection = (redemptionId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(redemptionId)) {
        newSet.delete(redemptionId);
      } else {
        newSet.add(redemptionId);
      }
      return newSet;
    });
  };

  const handleBulkApprove = async () => {
    const promises = Array.from(selectedRequests).map(id => handleApprove(id));
    await Promise.all(promises);
    setSelectedRequests(new Set());
  };

  const metrics = {
    total: pendingApprovals.length,
    highValue: pendingApprovals.filter(req => req.usdcAmount > 10000).length,
    urgent: pendingApprovals.filter(req => {
      const submittedDays = Math.floor(
        (Date.now() - new Date(req.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return submittedDays > 2;
    }).length
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              Requests awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.highValue}</div>
            <p className="text-xs text-muted-foreground">
              Requests over $10,000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.urgent}</div>
            <p className="text-xs text-muted-foreground">
              Pending over 2 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Redemption Approvals</CardTitle>
              <CardDescription>
                Review and approve redemption requests assigned to you
              </CardDescription>
            </div>
            {selectedRequests.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {selectedRequests.size} selected
                </Badge>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={loading || Array.from(selectedRequests).some(id => isProcessing(id))}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {Array.from(selectedRequests).some(id => isProcessing(id)) ? 'Processing...' : 'Approve Selected'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">All caught up!</p>
              <p className="text-sm">No pending redemption requests require your approval.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === pendingApprovals.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(new Set(pendingApprovals.map(req => req.id)));
                        } else {
                          setSelectedRequests(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>USDC Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((request) => {
                  const daysPending = Math.floor(
                    (Date.now() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(request.id)}
                          onChange={() => toggleSelection(request.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.investorName || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.investorId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-medium">{request.tokenAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{request.tokenType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-right font-medium">
                          ${request.usdcAmount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.redemptionType === 'standard' ? 'default' : 'secondary'}>
                          {request.redemptionType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </span>
                          {daysPending > 2 && (
                            <Badge variant="destructive" className="ml-2">
                              {daysPending}d
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id)}
                            disabled={isProcessing(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {isProcessing(request.id) ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {isProcessing(request.id) ? 'Processing...' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApproverDashboard;
