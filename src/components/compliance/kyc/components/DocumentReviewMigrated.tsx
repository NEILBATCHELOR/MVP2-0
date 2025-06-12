import React, { useState } from 'react';
import { InvestorDocument, InvestorDocumentStatus } from '@/types/core/centralModels';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface DocumentReviewProps {
  document: InvestorDocument;
  onApprove: (document: InvestorDocument) => void;
  onReject: (document: InvestorDocument, reason: string) => void;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  document,
  onApprove,
  onReject,
}) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleApprove = () => {
    onApprove(document);
  };

  const handleRejectDialogOpen = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
    setError('');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    onReject(document, rejectionReason);
    handleRejectDialogClose();
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InvestorDocumentStatus) => {
    switch (status) {
      case InvestorDocumentStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case InvestorDocumentStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case InvestorDocumentStatus.PENDING:
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">Pending</Badge>;
      case InvestorDocumentStatus.EXPIRED:
        return <Badge variant="destructive">Expired</Badge>;
      case InvestorDocumentStatus.REQUIRES_UPDATE:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Update Required</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">
              {document.name}
            </h2>
            {getStatusBadge(document.status)}
          </div>
          <p className="text-gray-500 text-sm">
            {document.description || 'No description available'}
          </p>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Document Type
              </p>
              <p className="font-medium">
                {document.documentType}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Uploaded On
              </p>
              <p className="font-medium">
                {formatDate(document.createdAt)}
              </p>
            </div>

            {document.reviewedBy && (
              <>
                <div>
                  <p className="text-sm text-gray-500">
                    Reviewed By
                  </p>
                  <p className="font-medium">
                    {document.reviewedBy}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Reviewed On
                  </p>
                  <p className="font-medium">
                    {formatDate(document.reviewedAt)}
                  </p>
                </div>
              </>
            )}

            {document.expiresAt && (
              <div>
                <p className="text-sm text-gray-500">
                  Expires On
                </p>
                <p className="font-medium">
                  {formatDate(document.expiresAt)}
                </p>
              </div>
            )}
          </div>

          {document.status === InvestorDocumentStatus.REJECTED && document.rejectionReason && (
            <div className="mt-4">
              <p className="text-sm text-red-600 font-medium">
                Rejection Reason
              </p>
              <div className="border border-red-200 p-4 rounded-md bg-red-50 mt-1">
                <p className="text-sm">
                  {document.rejectionReason}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="border rounded-md p-1 h-[400px] overflow-auto">
              {document.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={document.documentUrl} 
                  width="100%" 
                  height="100%" 
                  title={document.name} 
                  className="border-none"
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <img 
                    src={document.documentUrl} 
                    alt={document.name} 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {document.status === InvestorDocumentStatus.PENDING && (
        <CardFooter className="justify-end p-6 pt-2">
          <Button 
            variant="outline"
            className="mr-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleRejectDialogOpen}
          >
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
          >
            Approve
          </Button>
        </CardFooter>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. This information will be shared with the investor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Textarea
              autoFocus
              id="rejection-reason"
              placeholder="Enter rejection reason"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleRejectDialogClose}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};