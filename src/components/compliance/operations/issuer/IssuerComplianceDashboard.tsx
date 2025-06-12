import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, FileCheck, Shield, Search, 
  Building, Building2 as BuildingSquare, BarChart4, 
  ClipboardCheck, Users, UserCheck
} from "lucide-react";
import { KYBVerification } from './kyb/KYBVerification';
import IssuerOnboarding from './IssuerOnboarding';
import { AMLCheck } from '../kyc/components/AMLCheck';
import { RiskAssessment } from '../kyc/components/RiskAssessment';
import { ApprovalWorkflow as ApprovalWorkflowComponent } from '../approvals/components/ApprovalWorkflow';
import { ApprovalWorkflowService } from '../approvals/services/approvalWorkflowService';
import type { ComplianceCheck } from '../types';
import type { RiskAssessment as RiskAssessmentType, VerificationStatus } from '@/types/domain/identity/onfido';
import type { ApprovalWorkflow, ApprovalStatus, ApprovalEntityType as EntityType, ApprovalLevel, Approver } from '@/types/domain/compliance/compliance';

// Define extended approval workflow type to match component requirements
interface ExtendedApprovalWorkflow {
  id: string;
  entityId: string;
  entityType: EntityType;
  status: ApprovalStatus | 'IN_PROGRESS';
  createdAt: Date;
  approvers: Approver[];
  currentLevel: ApprovalLevel;
  requiredLevels: ApprovalLevel[];
  escalationReason?: string;
  completedAt?: Date;
}

interface IssuerComplianceDashboardProps {
  issuerId: string;
  initialData?: {
    name: string;
    legalName?: string;
    registrationNumber?: string;
    registrationDate?: string;
    taxId?: string;
    jurisdiction?: string;
    businessType?: string;
    email?: string;
  };
  complianceData?: {
    checks: ComplianceCheck[];
    kybStatus: VerificationStatus;
    amlStatus: VerificationStatus;
  };
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

// Define KYB props to match component expectations
interface KYBVerificationProps {
  issuerId: string;
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
  // Additional props can be defined as needed
}

// Define AMLCheck props to match component expectations
interface AMLCheckProps {
  investorId: string;
  investorData?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
  };
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

export const IssuerComplianceDashboard: React.FC<IssuerComplianceDashboardProps> = ({
  issuerId,
  initialData,
  complianceData,
  currentUser = { id: '1', name: 'Admin User', role: 'COMPLIANCE_OFFICER' }
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(complianceData?.checks || []);
  const [issuerData] = useState(initialData || {
    name: 'Acme Capital',
    legalName: 'Acme Capital LLC',
    registrationNumber: 'AC12345678',
    registrationDate: '2010-01-15',
    taxId: '12-3456789',
    jurisdiction: 'US',
    businessType: 'Investment Fund',
    email: 'compliance@acmecapital.com'
  });
  const [documentId, setDocumentId] = useState<string>('');
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentType | null>(null);
  const [kybStatus, setKybStatus] = useState<VerificationStatus>(complianceData?.kybStatus || 'NOT_STARTED');
  const [amlStatus, setAmlStatus] = useState<VerificationStatus>(complianceData?.amlStatus || 'NOT_STARTED');
  const [error, setError] = useState<string | null>(null);
  const [approvalWorkflow, setApprovalWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);

  // Helper function to adapt ApprovalWorkflow to ExtendedApprovalWorkflow
  const adaptWorkflowForComponent = (workflow: ApprovalWorkflow): ExtendedApprovalWorkflow => {
    return {
      ...workflow,
      // Add default values for required properties that might be missing
      approvers: [],
      currentLevel: 'L1',
      requiredLevels: ['L1'],
      status: workflow.status as ApprovalStatus | 'IN_PROGRESS'
    };
  };

  // Helper function to ensure status is one of the allowed VerificationStatus values
  const validateStatus = (status: string): VerificationStatus => {
    const validStatuses: VerificationStatus[] = ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'NOT_STARTED', 'PENDING'];
    return validStatuses.includes(status as VerificationStatus) 
      ? (status as VerificationStatus) 
      : 'PENDING';
  };

  // Update status indicators when complianceChecks changes
  useEffect(() => {
    // Update KYB status based on checks
    const kybChecks = complianceChecks.filter(check => check.type === 'KYB');
    if (kybChecks.length > 0) {
      const latestKybCheck = kybChecks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      setKybStatus(validateStatus(latestKybCheck.status));
    }
    
    // Update AML status based on checks
    const amlChecks = complianceChecks.filter(check => check.type === 'AML');
    if (amlChecks.length > 0) {
      const latestAmlCheck = amlChecks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      setAmlStatus(validateStatus(latestAmlCheck.status));
    }
  }, [complianceChecks]);

  const handleVerificationComplete = (result: ComplianceCheck) => {
    setComplianceChecks(prev => [...prev, result]);
    if (result.details.documentId) {
      setDocumentId(result.details.documentId);
    }
  };

  const handleVerificationError = (error: Error) => {
    console.error('Verification error:', error);
    setError(error.message);
  };

  const handleRiskAssessmentComplete = (assessment: RiskAssessmentType) => {
    setRiskAssessment(assessment);
    
    // Create a compliance check for the risk assessment
    const complianceCheck: ComplianceCheck = {
      id: crypto.randomUUID(),
      type: 'RISK',
      status: 'COMPLETED',
      result: assessment.riskLevel === 'high' ? 'REVIEW_REQUIRED' : 'PASS',
      details: {
        riskLevel: assessment.riskLevel,
        score: assessment.totalScore,
        assessmentId: assessment.id
      },
      createdAt: new Date(),
    };
    
    setComplianceChecks(prev => [...prev, complianceCheck]);
    
    // Trigger approval workflow for high-risk issuers
    if (assessment.riskLevel === 'high') {
      createApprovalWorkflow(assessment.riskLevel);
    }
  };
  
  // Create approval workflow based on risk level
  const createApprovalWorkflow = async (riskLevel: string) => {
    try {
      setIsLoadingWorkflow(true);
      const workflowService = ApprovalWorkflowService.getInstance();
      const workflow = await workflowService.createWorkflow(
        'ISSUER',
        issuerId,
        riskLevel.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'
      );
      setApprovalWorkflow(workflow);
      // Switch to approvals tab when workflow is created
      setActiveTab('approvals');
    } catch (err) {
      console.error('Error creating approval workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to create approval workflow');
    } finally {
      setIsLoadingWorkflow(false);
    }
  };
  
  // Load existing approval workflow if any
  useEffect(() => {
    const loadApprovalWorkflow = async () => {
      try {
        setIsLoadingWorkflow(true);
        const workflowService = ApprovalWorkflowService.getInstance();
        const workflows = await workflowService.getWorkflowsForEntity('ISSUER', issuerId);
        if (workflows && workflows.length > 0) {
          // Get the most recent workflow
          const latestWorkflow = workflows.sort((a, b) => 
            b.createdAt.getTime() - a.createdAt.getTime()
          )[0];
          setApprovalWorkflow(latestWorkflow);
        }
      } catch (err) {
        console.error('Error loading approval workflow:', err);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };
    
    if (issuerId) {
      loadApprovalWorkflow();
    }
  }, [issuerId]);
  
  // Handle approval actions
  const handleApprove = async (workflowId: string, comments?: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.approveWorkflow(
        workflowId,
        currentUser.id,
        comments
      );
      setApprovalWorkflow(updatedWorkflow);
    } catch (err) {
      console.error('Error approving workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve workflow');
    }
  };
  
  const handleReject = async (workflowId: string, reason: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.rejectWorkflow(
        workflowId,
        currentUser.id,
        reason
      );
      setApprovalWorkflow(updatedWorkflow);
    } catch (err) {
      console.error('Error rejecting workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject workflow');
    }
  };
  
  const handleEscalate = async (workflowId: string, reason: string) => {
    try {
      const workflowService = ApprovalWorkflowService.getInstance();
      const updatedWorkflow = await workflowService.escalateWorkflow(
        workflowId,
        currentUser.id,
        reason
      );
      setApprovalWorkflow(updatedWorkflow);
    } catch (err) {
      console.error('Error escalating workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to escalate workflow');
    }
  };

  // Determine overall compliance status
  const getOverallStatus = () => {
    if (kybStatus === 'FAILED' || amlStatus === 'FAILED') {
      return 'FAILED';
    }
    
    if (kybStatus === 'COMPLETED' && amlStatus === 'COMPLETED') {
      return 'COMPLETED';
    }
    
    if (kybStatus === 'IN_PROGRESS' || amlStatus === 'IN_PROGRESS') {
      return 'IN_PROGRESS';
    }
    
    return 'PENDING';
  };

  // Get appropriate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            In Progress
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        );
      case 'PENDING':
      case 'NOT_STARTED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  const getRiskBadge = () => {
    if (!riskAssessment) return null;
    
    switch (riskAssessment.riskLevel) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium Risk
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">KYB/AML Compliance</h2>
        <p className="text-muted-foreground">
          Complete verification process for issuer {issuerData.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYB Status</CardTitle>
            {getStatusBadge(kybStatus)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {kybStatus === 'COMPLETED' 
                  ? 'Business verification complete' 
                  : kybStatus === 'IN_PROGRESS'
                  ? 'Verification in progress'
                  : kybStatus === 'FAILED'
                  ? 'Verification failed'
                  : 'Business not verified'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AML Status</CardTitle>
            {getStatusBadge(amlStatus)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {amlStatus === 'COMPLETED' 
                  ? 'AML checks passed' 
                  : amlStatus === 'IN_PROGRESS'
                  ? 'AML checks in progress'
                  : amlStatus === 'FAILED'
                  ? 'AML checks failed'
                  : 'AML checks pending'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            {riskAssessment ? getRiskBadge() : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Not Assessed
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {riskAssessment 
                  ? `Risk score: ${riskAssessment.totalScore}` 
                  : 'Risk not assessed'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kyb">KYB</TabsTrigger>
          <TabsTrigger value="aml">AML</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {approvalWorkflow && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Current status and required compliance actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Overall Status</h3>
                    <p className="text-muted-foreground">
                      {getOverallStatus() === 'COMPLETED' 
                        ? 'All compliance checks completed' 
                        : getOverallStatus() === 'IN_PROGRESS'
                        ? 'Compliance verification in progress'
                        : getOverallStatus() === 'FAILED'
                        ? 'Some compliance checks failed'
                        : 'Compliance verification required'}
                    </p>
                  </div>
                  {getStatusBadge(getOverallStatus())}
                </div>
                
                <h3 className="text-base font-medium pt-2">Required Actions</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center">
                      <BuildingSquare className="mr-3 h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium">Business Verification (KYB)</h4>
                        <p className="text-xs text-muted-foreground">
                          Verify issuer business documents and information
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('kyb')}
                      disabled={kybStatus === 'COMPLETED'}
                      variant={kybStatus === 'COMPLETED' ? 'outline' : 'default'}
                    >
                      {kybStatus === 'COMPLETED' ? 'Complete' : 'Start KYB'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center">
                      <Shield className="mr-3 h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium">AML Screening</h4>
                        <p className="text-xs text-muted-foreground">
                          Check issuer against sanctions lists and adverse media
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('aml')}
                      disabled={amlStatus === 'COMPLETED'}
                      variant={amlStatus === 'COMPLETED' ? 'outline' : 'default'}
                    >
                      {amlStatus === 'COMPLETED' ? 'Complete' : 'Run AML Check'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center">
                      <BarChart4 className="mr-3 h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium">Risk Assessment</h4>
                        <p className="text-xs text-muted-foreground">
                          Calculate risk profile based on KYB/AML results and other factors
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('risk')}
                      disabled={kybStatus !== 'COMPLETED' || amlStatus !== 'COMPLETED'}
                      variant={riskAssessment ? 'outline' : 'default'}
                    >
                      {riskAssessment ? 'Assessed' : 'Assess Risk'}
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-base font-medium pt-2">Recent Compliance Checks</h3>
                
                {complianceChecks.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {complianceChecks.slice(0, 5).map((check) => (
                          <tr key={check.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{check.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(check.status)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(check.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{check.result || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-md">
                    <p className="text-muted-foreground">No compliance checks found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kyb" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Verification (KYB)</CardTitle>
              <CardDescription>
                Verify issuer business information and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KYBVerification 
                issuerId={issuerId}
                onComplete={handleVerificationComplete}
                onError={handleVerificationError}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aml" className="space-y-4">
          <AMLCheck
            investorId={issuerId} // Reusing AML component with issuer ID
            investorData={{
              firstName: issuerData.name,
              lastName: ''
            }}
            onComplete={handleVerificationComplete}
            onError={handleVerificationError}
          />
        </TabsContent>
        
        <TabsContent value="risk" className="space-y-4">
          <RiskAssessment
            investorId={issuerId} // Reusing risk component with issuer ID
            investorData={{
              investorType: 'institutional',
              nationality: issuerData.jurisdiction || 'US',
              residenceCountry: issuerData.jurisdiction || 'US'
            }}
            onComplete={handleRiskAssessmentComplete}
          />
        </TabsContent>
        
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Multi-signature approval process for high-risk issuer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWorkflow ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading approval workflow</p>
                  </div>
                </div>
              ) : approvalWorkflow ? (
                <ApprovalWorkflowComponent
                  workflow={adaptWorkflowForComponent(approvalWorkflow)}
                  currentUser={currentUser}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEscalate={handleEscalate}
                />
              ) : riskAssessment && riskAssessment.riskLevel === 'high' ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-4 border rounded-md">
                  <BuildingSquare className="h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">Approval Required</h3>
                  <p className="text-center text-muted-foreground">
                    This high-risk issuer requires approval. Start the approval workflow to continue.
                  </p>
                  <Button onClick={() => createApprovalWorkflow('high')}>
                    Start Approval Workflow
                  </Button>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center space-y-4 border rounded-md">
                  <BuildingSquare className="h-16 w-16 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">No Approval Required</h3>
                  <p className="text-center text-muted-foreground">
                    No approval workflow is required for this issuer based on the current risk assessment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IssuerComplianceDashboard; 