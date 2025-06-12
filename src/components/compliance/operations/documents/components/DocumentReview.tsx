import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, FileText, AlertTriangle, Search, Brain } from "lucide-react";
import { KycDocument, KycDocumentStatus } from '@/types/domain/compliance/compliance';

interface DocumentReviewProps {
  document: KycDocument;
  onApprove: (documentId: string, notes?: string) => Promise<void>;
  onReject: (documentId: string, rejectionReason: string) => Promise<void>;
  onAiAssist: (documentId: string) => Promise<{
    valid: boolean;
    confidence: number;
    extractedData?: Record<string, any>;
    warnings?: string[];
  }>;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  document,
  onApprove,
  onReject,
  onAiAssist,
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    isLoading: boolean;
    results?: {
      valid: boolean;
      confidence: number;
      extractedData?: Record<string, any>;
      warnings?: string[];
    };
    error?: string;
  }>({ isLoading: false });
  const [useAiSuggestion, setUseAiSuggestion] = useState(false);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle document approval
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(document.id, reviewNotes);
    } catch (error) {
      console.error('Error approving document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle document rejection
  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(document.id, rejectionReason);
    } catch (error) {
      console.error('Error rejecting document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Run AI document analysis
  const runAiAnalysis = async () => {
    setAiAnalysis({ isLoading: true });
    try {
      const results = await onAiAssist(document.id);
      setAiAnalysis({ isLoading: false, results });
      
      // If AI suggests rejection, pre-populate the rejection reason
      if (!results.valid && results.warnings && results.warnings.length > 0) {
        setRejectionReason(results.warnings.join('\n'));
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      setAiAnalysis({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error during analysis' 
      });
    }
  };
  
  // Get status badge color
  const getStatusBadge = () => {
    switch (document.status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline">Pending Review</Badge>;
    }
  };
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Document Review</CardTitle>
            <CardDescription>
              Review and verify the submitted document
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Document Type</Label>
              <p className="font-medium">{formatDocumentType(document.type)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted On</Label>
              <p className="font-medium">{formatDate(document.createdAt.toString())}</p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="preview">Document Preview</TabsTrigger>
              <TabsTrigger value="details">Document Details</TabsTrigger>
              <TabsTrigger value="ai" onClick={() => !aiAnalysis.results && !aiAnalysis.isLoading && runAiAnalysis()}>
                AI Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4">
              <div className="aspect-[3/4] rounded-md border overflow-hidden bg-muted/20">
                {document.fileUrl ? (
                  document.fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={`${document.fileUrl}#toolbar=0`} 
                      className="w-full h-full"
                      title="Document preview"
                    />
                  ) : (
                    <img 
                      src={document.fileUrl} 
                      alt="Document" 
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">Document preview not available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Document ID</Label>
                    <p className="font-medium">{document.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Provider</Label>
                    <p className="font-medium">{document.provider}</p>
                  </div>
                </div>
                
                {document.status === 'REJECTED' && (
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <p className="font-medium text-destructive">{document.rejectionReason}</p>
                  </div>
                )}
                
                {document.reviewedBy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Reviewed By</Label>
                      <p className="font-medium">{document.reviewedBy}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Reviewed On</Label>
                      <p className="font-medium">{document.reviewedAt && formatDate(document.reviewedAt.toString())}</p>
                    </div>
                  </div>
                )}
                
                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Additional Metadata</Label>
                    <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">
                      {JSON.stringify(document.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="mt-4">
              {aiAnalysis.isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Spinner size="lg" />
                  <p className="text-muted-foreground">Analyzing document...</p>
                </div>
              ) : aiAnalysis.error ? (
                <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
                  <p className="text-destructive flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {aiAnalysis.error}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={runAiAnalysis}
                    className="mt-2"
                  >
                    Retry Analysis
                  </Button>
                </div>
              ) : aiAnalysis.results ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {aiAnalysis.results.valid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <p className="font-medium">
                        {aiAnalysis.results.valid ? 'Document appears valid' : 'Document may have issues'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Confidence: {Math.round(aiAnalysis.results.confidence)}%
                    </Badge>
                  </div>
                  
                  {aiAnalysis.results.warnings && aiAnalysis.results.warnings.length > 0 && (
                    <div className="p-3 border border-amber-200 bg-amber-50 rounded-md">
                      <p className="font-medium text-amber-700 mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Warnings
                      </p>
                      <ul className="list-disc list-inside text-sm text-amber-700 pl-2">
                        {aiAnalysis.results.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiAnalysis.results.extractedData && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Extracted Information</Label>
                      <div className="border rounded-md divide-y">
                        {Object.entries(aiAnalysis.results.extractedData).map(([key, value]) => (
                          <div key={key} className="flex p-2">
                            <span className="font-medium w-1/3">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="w-2/3">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {document.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 pt-4">
                      <Switch
                        id="use-ai-suggestion"
                        checked={useAiSuggestion}
                        onCheckedChange={setUseAiSuggestion}
                      />
                      <Label htmlFor="use-ai-suggestion">
                        Use AI suggestion for {aiAnalysis.results.valid ? 'approval' : 'rejection'}
                      </Label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Brain className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">AI Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to analyze this document with AI assistance
                    </p>
                  </div>
                  <Button onClick={runAiAnalysis}>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Document
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {document.status === 'PENDING' && (
            <div className="pt-4 space-y-4">
              <div>
                <Label htmlFor="notes">Review Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this document..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className={activeTab === 'reject' ? 'block' : 'hidden'}>
                <Label htmlFor="rejection-reason" className="text-destructive">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this document is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="border-destructive"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {document.status === 'PENDING' && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('reject')}
            disabled={isSubmitting || (useAiSuggestion && aiAnalysis.results?.valid)}
          >
            Reject Document
          </Button>
          
          <div className="flex gap-2">
            {activeTab === 'reject' && (
              <Button 
                variant="default" 
                onClick={() => setActiveTab('preview')}
                disabled={isSubmitting}
              >
                Back to Review
              </Button>
            )}
            
            {activeTab === 'reject' ? (
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={handleApprove}
                disabled={isSubmitting || (useAiSuggestion && !aiAnalysis.results?.valid)}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Approving...
                  </>
                ) : (
                  'Approve Document'
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DocumentReview;