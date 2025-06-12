import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  InfoIcon,
  FileCode,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ContractRiskCheckProps {
  contractAddress: string;
  network: string;
}

interface CodeFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  line?: number;
  impact: string;
  recommendation: string;
}

interface AuditStatus {
  audited: boolean;
  auditedBy?: string[];
  auditDate?: string;
  auditLink?: string;
}

interface ContractRiskResult {
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  verified: boolean;
  openSource: boolean;
  audit: AuditStatus;
  findings: CodeFinding[];
  deployedTime?: string;
  lastActivity?: string;
  totalTransactions?: number;
  totalValue?: string;
}

/**
 * Contract Security Analysis Service
 */
class ContractSecurityService {
  /**
   * Analyze contract security and risk factors
   */
  static async analyzeContract(contractAddress: string, network: string): Promise<ContractRiskResult> {
    try {
      // Perform basic contract verification checks
      const basicChecks = await this.performBasicChecks(contractAddress, network);
      
      // Calculate risk score based on available data
      const score = this.calculateRiskScore(basicChecks);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(score);
      
      return {
        score,
        riskLevel,
        ...basicChecks
      };
    } catch (error) {
      throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Perform basic contract verification and checks
   */
  private static async performBasicChecks(contractAddress: string, network: string): Promise<Omit<ContractRiskResult, 'score' | 'riskLevel'>> {
    // Check if address format is valid for contract
    const isValidAddress = this.isValidContractAddress(contractAddress, network);
    
    if (!isValidAddress) {
      throw new Error("Invalid contract address format");
    }
    
    // Basic analysis results
    // In a real implementation, these would come from:
    // - Blockchain explorers (Etherscan, etc.)
    // - Contract verification services
    // - Audit database APIs
    // - Static analysis tools
    
    const findings: CodeFinding[] = [];
    
    // Add findings based on contract analysis
    if (!this.isVerifiedContract(contractAddress)) {
      findings.push({
        id: "unverified",
        severity: "high",
        description: "Contract source code is not verified",
        impact: "Unable to audit contract for security vulnerabilities",
        recommendation: "Only interact with verified contracts when possible"
      });
    }
    
    // Check for common patterns that might indicate risk
    const riskPatterns = await this.checkRiskPatterns(contractAddress, network);
    findings.push(...riskPatterns);
    
    return {
      verified: this.isVerifiedContract(contractAddress),
      openSource: this.isVerifiedContract(contractAddress), // Assume verified = open source
      audit: await this.checkAuditStatus(contractAddress),
      findings,
      deployedTime: await this.getDeploymentTime(contractAddress, network),
      lastActivity: await this.getLastActivity(contractAddress, network),
      totalTransactions: await this.getTotalTransactions(contractAddress, network),
      totalValue: await this.getTotalValue(contractAddress, network)
    };
  }
  
  /**
   * Validate contract address format
   */
  private static isValidContractAddress(address: string, network: string): boolean {
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'polygon':
      case 'avalanche':
      case 'optimism':
      case 'arbitrum':
      case 'base':
        // EVM contract address validation
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      
      case 'solana':
        // Solana program address validation
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      
      default:
        return false;
    }
  }
  
  /**
   * Check if contract is verified (simplified check)
   */
  private static isVerifiedContract(address: string): boolean {
    // In a real implementation, this would check against:
    // - Etherscan API for verification status
    // - Other blockchain explorer APIs
    // For now, assume contracts that follow certain patterns are more likely verified
    
    // Common contract patterns that are often verified
    const commonVerifiedPatterns = [
      /^0x[aA][0-9a-fA-F]{39}$/, // Common proxy patterns
      /^0x[bB][0-9a-fA-F]{39}$/, // Common token patterns
    ];
    
    return commonVerifiedPatterns.some(pattern => pattern.test(address));
  }
  
  /**
   * Check for audit status
   */
  private static async checkAuditStatus(address: string): Promise<AuditStatus> {
    // In a real implementation, this would check:
    // - Audit firm databases
    // - DeFi protocol registries
    // - Known audit report repositories
    
    return {
      audited: false,
      auditedBy: [],
      auditDate: undefined,
      auditLink: undefined
    };
  }
  
  /**
   * Check for common risk patterns
   */
  private static async checkRiskPatterns(address: string, network: string): Promise<CodeFinding[]> {
    const findings: CodeFinding[] = [];
    
    // Check for suspicious address patterns
    if (this.isSuspiciousAddress(address)) {
      findings.push({
        id: "suspicious_pattern",
        severity: "medium",
        description: "Address follows potentially suspicious pattern",
        impact: "May indicate automatically generated or malicious contract",
        recommendation: "Exercise extra caution when interacting with this contract"
      });
    }
    
    // Check age of contract
    const deploymentTime = await this.getDeploymentTime(address, network);
    if (deploymentTime && this.isVeryNewContract(deploymentTime)) {
      findings.push({
        id: "new_contract",
        severity: "medium",
        description: "Contract was deployed very recently",
        impact: "Less time for community review and testing",
        recommendation: "Be cautious with new contracts and wait for community validation"
      });
    }
    
    return findings;
  }
  
  /**
   * Check if address pattern is suspicious
   */
  private static isSuspiciousAddress(address: string): boolean {
    // Check for patterns that might indicate generated or malicious contracts
    const suspiciousPatterns = [
      /^0x0+[1-9a-fA-F]/, // Address starting with many zeros
      /^0x[0-9a-fA-F]*dead/i, // Contains "dead"
      /^0x[0-9a-fA-F]*beef/i, // Contains "beef"
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(address));
  }
  
  /**
   * Check if contract is very new (deployed within last 7 days)
   */
  private static isVeryNewContract(deploymentTime: string): boolean {
    const deployTime = new Date(deploymentTime);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return deployTime > oneWeekAgo;
  }
  
  /**
   * Get deployment time (placeholder - would integrate with blockchain explorer)
   */
  private static async getDeploymentTime(address: string, network: string): Promise<string | undefined> {
    // This would integrate with blockchain explorers to get actual deployment time
    return undefined;
  }
  
  /**
   * Get last activity time
   */
  private static async getLastActivity(address: string, network: string): Promise<string | undefined> {
    // This would check recent transactions to the contract
    return undefined;
  }
  
  /**
   * Get total transaction count
   */
  private static async getTotalTransactions(address: string, network: string): Promise<number | undefined> {
    // This would query blockchain explorer for transaction count
    return undefined;
  }
  
  /**
   * Get total value locked or processed
   */
  private static async getTotalValue(address: string, network: string): Promise<string | undefined> {
    // This would calculate TVL or total value processed
    return undefined;
  }
  
  /**
   * Calculate overall risk score
   */
  private static calculateRiskScore(checks: Omit<ContractRiskResult, 'score' | 'riskLevel'>): number {
    let score = 50; // Start with neutral score
    
    // Positive factors
    if (checks.verified) score += 25;
    if (checks.audit.audited) score += 20;
    
    // Negative factors based on findings
    for (const finding of checks.findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
        default:
          score -= 1;
      }
    }
    
    // Ensure score stays within bounds
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Determine risk level based on score
   */
  private static determineRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 80) return "low";
    if (score >= 60) return "medium";
    if (score >= 40) return "high";
    return "critical";
  }
}

export const ContractRiskCheck: React.FC<ContractRiskCheckProps> = ({
  contractAddress,
  network,
}) => {
  const [loading, setLoading] = useState(true);
  const [riskResult, setRiskResult] = useState<ContractRiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkContractRisk = async () => {
      if (!contractAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await ContractSecurityService.analyzeContract(contractAddress, network);
        setRiskResult(result);
      } catch (err) {
        console.error("Error checking contract risk:", err);
        setError(err instanceof Error ? err.message : "Failed to analyze contract security");
      } finally {
        setLoading(false);
      }
    };
    
    checkContractRisk();
  }, [contractAddress, network]);

  const refreshAnalysis = () => {
    setRiskResult(null);
    setError(null);
    // Re-trigger analysis
    const checkContractRisk = async () => {
      setLoading(true);
      try {
        const result = await ContractSecurityService.analyzeContract(contractAddress, network);
        setRiskResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to analyze contract security");
      } finally {
        setLoading(false);
      }
    };
    checkContractRisk();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing smart contract security...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 ml-2"
            onClick={refreshAnalysis}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!riskResult) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to analyze contract security. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-amber-600 bg-amber-100";
      case "low":
        return "text-blue-600 bg-blue-100";
      case "info":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <AlertCircle className="h-4 w-4" />;
      case "low":
        return <InfoIcon className="h-4 w-4" />;
      case "info":
        return <InfoIcon className="h-4 w-4" />;
      default:
        return <InfoIcon className="h-4 w-4" />;
    }
  };

  const scoreColor = 
    riskResult.riskLevel === "low" 
      ? "text-green-600" 
      : riskResult.riskLevel === "medium" 
        ? "text-amber-600" 
        : riskResult.riskLevel === "high"
          ? "text-orange-600"
          : "text-red-600";

  const scoreBackground = 
    riskResult.riskLevel === "low" 
      ? "bg-green-100" 
      : riskResult.riskLevel === "medium" 
        ? "bg-amber-100" 
        : riskResult.riskLevel === "high"
          ? "bg-orange-100"
          : "bg-red-100";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Contract Security Score</h3>
          <p className="text-sm text-muted-foreground">
            For {contractAddress.substring(0, 6)}...{contractAddress.substring(contractAddress.length - 4)} on {network}
          </p>
        </div>
        <div className={`text-2xl font-bold ${scoreColor} flex items-center`}>
          <div className={`${scoreBackground} rounded-full p-2 mr-2`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          {riskResult.score}/100
        </div>
      </div>

      <Progress
        value={riskResult.score}
        className={`h-2 ${
          riskResult.riskLevel === "low"
            ? "bg-green-100"
            : riskResult.riskLevel === "medium"
            ? "bg-amber-100"
            : riskResult.riskLevel === "high"
            ? "bg-orange-100"
            : "bg-red-100"
        }`}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Contract Overview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified:</span>
              <span className="font-medium flex items-center">
                {riskResult.verified ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mr-1" />
                )}
                {riskResult.verified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Source:</span>
              <span className="font-medium flex items-center">
                {riskResult.openSource ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mr-1" />
                )}
                {riskResult.openSource ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audited:</span>
              <span className="font-medium flex items-center">
                {riskResult.audit.audited ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mr-1" />
                )}
                {riskResult.audit.audited ? "Yes" : "No"}
              </span>
            </div>
            {riskResult.deployedTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deployed:</span>
                <span className="font-medium">
                  {new Date(riskResult.deployedTime).toLocaleDateString()}
                </span>
              </div>
            )}
            {riskResult.lastActivity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Activity:</span>
                <span className="font-medium">
                  {new Date(riskResult.lastActivity).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Activity & Usage</h4>
          <div className="space-y-2 text-sm">
            {riskResult.totalTransactions && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions:</span>
                <span className="font-medium">{riskResult.totalTransactions.toLocaleString()}</span>
              </div>
            )}
            {riskResult.totalValue && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">{riskResult.totalValue}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Critical Issues:</span>
              <span className="font-medium">{riskResult.findings.filter(f => f.severity === "critical").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High Issues:</span>
              <span className="font-medium">{riskResult.findings.filter(f => f.severity === "high").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medium Issues:</span>
              <span className="font-medium">{riskResult.findings.filter(f => f.severity === "medium").length}</span>
            </div>
          </div>
        </div>
      </div>

      {riskResult.audit.audited && riskResult.audit.auditedBy && riskResult.audit.auditDate && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Audited Contract</AlertTitle>
          <AlertDescription>
            This contract has been audited by{" "}
            {riskResult.audit.auditedBy.join(", ")} on{" "}
            {new Date(riskResult.audit.auditDate).toLocaleDateString()}.
            {riskResult.audit.auditLink && (
              <Button
                variant="link"
                className="p-0 h-auto text-green-800 underline"
                onClick={() => window.open(riskResult.audit.auditLink, "_blank")}
              >
                View Audit Report
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Security Findings</h3>
          <Button variant="outline" size="sm" onClick={refreshAnalysis}>
            Refresh Analysis
          </Button>
        </div>

        {riskResult.findings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskResult.findings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>
                    <Badge
                      className={`${getSeverityColor(finding.severity)} border-none flex items-center space-x-1`}
                    >
                      {getSeverityIcon(finding.severity)}
                      <span className="capitalize ml-1">{finding.severity}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {finding.description}
                    {finding.line && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Line: {finding.line}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{finding.impact}</TableCell>
                  <TableCell>{finding.recommendation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
            <p>No security issues detected</p>
            <p className="text-sm">This is a preliminary analysis based on available data</p>
          </div>
        )}
      </div>

      <Alert>
        <FileCode className="h-4 w-4" />
        <AlertTitle>Security Recommendations</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li>Always verify contract source code before interacting</li>
            <li>Check for recent audit reports from reputable firms</li>
            <li>Monitor contract for unusual activity patterns</li>
            <li>Start with small amounts to test functionality</li>
            <li>Use contracts with established track records when possible</li>
            <li>Be extra cautious with new or unverified contracts</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
