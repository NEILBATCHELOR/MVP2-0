import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Workflow, CheckCircle, AlertCircle } from "lucide-react";
import { TokenStatus } from '@/types/core/centralModels';
import { UnifiedTokenData } from '../utils/token-display-utils';
import { 
  getStatusWorkflowInfo, 
  updateTokenStatus, 
  STATUS_DISPLAY_NAMES, 
  STATUS_DESCRIPTIONS 
} from '../../services/tokenStatusService';

interface StatusTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: UnifiedTokenData;
  onStatusUpdate?: (updatedToken: UnifiedTokenData) => void;
}

const StatusTransitionDialog: React.FC<StatusTransitionDialogProps> = ({
  open,
  onOpenChange,
  token,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TokenStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get workflow information
  const workflowInfo = getStatusWorkflowInfo(token);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      setError('Please select a status to transition to');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateTokenStatus(
        token.id,
        selectedStatus as TokenStatus,
        undefined, // userId - could be passed from auth context
        notes || undefined
      );

      if (result.success) {
        setSuccess(true);
        // Call the parent callback with updated token data
        if (onStatusUpdate && result.data) {
          onStatusUpdate({
            ...token,
            status: selectedStatus as TokenStatus,
            updated_at: new Date().toISOString()
          });
        }
        
        // Auto-close after success
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update token status');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setNotes('');
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  const getStatusIcon = (status: TokenStatus) => {
    switch (status) {
      case TokenStatus.DRAFT:
        return '📝';
      case TokenStatus.REVIEW:
      case TokenStatus.UNDER_REVIEW:
        return '👁️';
      case TokenStatus.APPROVED:
        return '✅';
      case TokenStatus.REJECTED:
        return '❌';
      case TokenStatus.READY_TO_MINT:
        return '🔥';
      case TokenStatus.MINTED:
        return '🪙';
      case TokenStatus.DEPLOYED:
        return '🚀';
      case TokenStatus.PAUSED:
        return '⏸️';
      case TokenStatus.DISTRIBUTED:
        return '📦';
      default:
        return '📋';
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Status Updated Successfully</h3>
            <p className="text-center text-muted-foreground">
              Token status has been updated to {STATUS_DISPLAY_NAMES[selectedStatus as TokenStatus]}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-indigo-600" />
            Update Token Status
          </DialogTitle>
          <DialogDescription>
            Change the status of <strong>{token.name} ({token.symbol})</strong> in the workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Current Status</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{getStatusIcon(workflowInfo.currentStatus)}</span>
              <span className="font-medium">{workflowInfo.displayName}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{workflowInfo.description}</p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status-select">New Status</Label>
            <Select 
              value={selectedStatus} 
              onValueChange={(value: string) => setSelectedStatus(value as TokenStatus | '')}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {workflowInfo.availableTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(status)}</span>
                      <span>{STATUS_DISPLAY_NAMES[status]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Status Description */}
          {selectedStatus && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{STATUS_DISPLAY_NAMES[selectedStatus as TokenStatus]}:</strong>{' '}
                {STATUS_DESCRIPTIONS[selectedStatus as TokenStatus]}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUpdating}
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusTransitionDialog;
