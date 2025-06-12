import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, AlertCircle } from 'lucide-react';
import { TokenStandard } from '@/types/core/centralModels';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { checkTokenSecurityVulnerabilities } from '../utils/tokenConfigValidator';

export interface SecurityFinding {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

export interface SecurityValidationResult {
  hasIssues: boolean;
  findings: SecurityFinding[];
}

export interface TokenSecurityValidatorProps {
  onDeploy?: (tokenId: string) => void;
  onEdit?: (tokenId: string) => void;
  validationResult?: SecurityValidationResult;
  onProceed?: () => void;
  onModify?: () => void;
  showActions?: boolean;
}

const TokenSecurityValidator: React.FC<TokenSecurityValidatorProps> = ({
  onDeploy,
  onEdit,
  validationResult,
  onProceed,
  onModify,
  showActions = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>(validationResult?.findings || []);
  const [tokenStandard, setTokenStandard] = useState<TokenStandard>(TokenStandard.ERC20);

  // Update findings when validationResult changes
  useEffect(() => {
    if (validationResult) {
      setFindings(validationResult.findings);
    }
  }, [validationResult]);

  const validateToken = (token: any) => {
    if (!token) return [];
    
    // Check for security vulnerabilities in the token configuration
    const securityCheck = checkTokenSecurityVulnerabilities(
      token.configuration || {}, 
      token.standard as TokenStandard
    );
    
    return securityCheck.findings;
  };

  const handleTokenDeployment = (token: any) => {
    const tokenId = token.id;
    const findings = validateToken(token);
    
    if (findings.length > 0) {
      // Show security alert dialog
      setTokenId(tokenId);
      setFindings(findings);
      setTokenStandard(token.standard as TokenStandard);
      setIsOpen(true);
    } else {
      // No security issues, proceed with deployment
      onDeploy(tokenId);
    }
  };

  const handleProceedWithDeployment = () => {
    setIsOpen(false);
    if (onProceed) {
      onProceed();
    } else if (tokenId && onDeploy) {
      onDeploy(tokenId);
    }
  };

  const handleModifyToken = () => {
    setIsOpen(false);
    if (onModify) {
      onModify();
    } else if (tokenId && onEdit) {
      onEdit(tokenId);
    }
  };

  const hasHighSeverity = findings.some(f => f.severity === 'high');

  return (
    <>
      {isOpen ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              {findings.map((finding, index) => (
                <Alert 
                  key={index} 
                  className={`border ${
                    finding.severity === 'high' 
                      ? 'border-red-200 bg-red-50' 
                      : finding.severity === 'medium' 
                        ? 'border-amber-200 bg-amber-50' 
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <AlertCircle className={`h-4 w-4 ${
                    finding.severity === 'high' 
                      ? 'text-red-500' 
                      : finding.severity === 'medium' 
                        ? 'text-amber-500' 
                        : 'text-blue-500'
                  }`} />
                  <AlertTitle>{finding.issue}</AlertTitle>
                  <AlertDescription>
                    {finding.recommendation}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleModifyToken}>
                Modify Configuration
              </Button>
              <Button 
                onClick={handleProceedWithDeployment} 
                variant={hasHighSeverity ? "destructive" : "default"}
                disabled={hasHighSeverity && findings.length > 3}
              >
                {hasHighSeverity 
                  ? "Proceed Anyway (Not Recommended)" 
                  : "Proceed with Deployment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="space-y-4 py-2">
          {findings.map((finding, index) => (
            <Alert 
              key={index} 
              className={`border ${
                finding.severity === 'high' 
                  ? 'border-red-200 bg-red-50' 
                  : finding.severity === 'medium' 
                    ? 'border-amber-200 bg-amber-50' 
                    : 'border-blue-200 bg-blue-50'
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${
                finding.severity === 'high' 
                  ? 'text-red-500' 
                  : finding.severity === 'medium' 
                    ? 'text-amber-500' 
                    : 'text-blue-500'
              }`} />
              <AlertTitle>{finding.issue}</AlertTitle>
              <AlertDescription>
                {finding.recommendation}
              </AlertDescription>
            </Alert>
          ))}
          
          {showActions && findings.length > 0 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleModifyToken}>
                Modify Configuration
              </Button>
              <Button 
                onClick={handleProceedWithDeployment} 
                variant={hasHighSeverity ? "destructive" : "default"}
                disabled={hasHighSeverity && findings.length > 3}
              >
                {hasHighSeverity 
                  ? "Proceed Anyway (Not Recommended)" 
                  : "Proceed with Deployment"}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TokenSecurityValidator;