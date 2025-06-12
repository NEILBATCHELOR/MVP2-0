import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { TokenStandard } from '@/types/core/centralModels';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SecurityFinding {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

interface TokenSecurityAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findings: SecurityFinding[];
  tokenStandard: TokenStandard;
  onProceed: () => void;
  onModify: () => void;
}

const TokenSecurityAlertDialog: React.FC<TokenSecurityAlertDialogProps> = ({
  open,
  onOpenChange,
  findings,
  tokenStandard,
  onProceed,
  onModify
}) => {
  const highSeverityFindings = findings.filter(f => f.severity === 'high');
  const mediumSeverityFindings = findings.filter(f => f.severity === 'medium');
  const lowSeverityFindings = findings.filter(f => f.severity === 'low');
  
  const hasHighSeverity = highSeverityFindings.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Security Analysis for {tokenStandard} Token
          </DialogTitle>
          <DialogDescription>
            We've identified potential security considerations in your token configuration.
            Review these findings before proceeding with deployment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
          {findings.length === 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>No security issues found</AlertTitle>
              <AlertDescription>
                Your token configuration appears to follow security best practices.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {highSeverityFindings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    High Severity Issues
                  </h3>
                  {highSeverityFindings.map((finding, index) => (
                    <Alert key={index} className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertTitle>{finding.issue}</AlertTitle>
                      <AlertDescription>
                        {finding.recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
              
              {mediumSeverityFindings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Medium Severity Issues
                  </h3>
                  {mediumSeverityFindings.map((finding, index) => (
                    <Alert key={index} className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertTitle>{finding.issue}</AlertTitle>
                      <AlertDescription>
                        {finding.recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
              
              {lowSeverityFindings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-600 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Low Severity Issues
                  </h3>
                  {lowSeverityFindings.map((finding, index) => (
                    <Alert key={index} className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertTitle>{finding.issue}</AlertTitle>
                      <AlertDescription>
                        {finding.recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onModify}>
            Modify Configuration
          </Button>
          <Button 
            onClick={onProceed} 
            variant={hasHighSeverity ? "destructive" : "default"}
            disabled={hasHighSeverity && findings.length > 3}
          >
            {hasHighSeverity ? "Proceed Anyway (Not Recommended)" : "Proceed with Deployment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSecurityAlertDialog;