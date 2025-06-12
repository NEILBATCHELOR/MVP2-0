import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KYCVerification } from './components/KYCVerification';
import { OnfidoVerification } from './components/OnfidoVerification';
import { EnhancedOnfidoVerification } from './components/EnhancedOnfidoVerification';
import { WorkflowVerification } from './components/WorkflowVerification';
import { DocumentVerification } from '../documents/components/DocumentVerification';
import { ComplianceCheck, DocumentVerification as DocumentVerificationType, InvestorCompliance, RiskLevel } from '../types';
import { AlertCircle, CheckCircle, Filter, RefreshCw, Shield, UserRoundCheck } from 'lucide-react';

interface KYCDashboardProps {
  investorId?: string;
  issuerId?: string;
  complianceData?: InvestorCompliance;
}

export const KYCDashboard: React.FC<KYCDashboardProps> = ({
  investorId,
  issuerId,
  complianceData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationProvider, setVerificationProvider] = useState<'onfido' | 'onfido-enhanced' | 'onfido-workflow' | 'idenfy'>('onfido');
  const [documents, setDocuments] = useState<DocumentVerificationType[]>(complianceData?.documents || []);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(complianceData?.checks || []);
  const [investorData] = useState({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    dateOfBirth: '1985-06-15'
  });
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowId, setWorkflowId] = useState<string>('');
  const [applicantId, setApplicantId] = useState<string>('');

  const handleVerificationComplete = (result: ComplianceCheck) => {
    setComplianceChecks(prev => [...prev, result]);
    if (result.details.applicantId) {
      setApplicantId(result.details.applicantId);
    }
  };

  const handleVerificationError = (error: Error) => {
    console.error('Verification error:', error);
  };

  const handleDocumentUpdate = (verification: DocumentVerificationType) => {
    setDocuments(prev => [...prev, verification]);
  };

  const getOverallStatus = (): RiskLevel => {
    if (!complianceData) return 'LOW';
    
    if (complianceData.kycStatus === 'FAILED' || complianceData.amlStatus === 'FAILED') {
      return 'HIGH';
    }
    
    if (
      complianceData.kycStatus === 'COMPLETED' && 
      complianceData.amlStatus === 'COMPLETED' && 
      documents.some(doc => doc.status === 'VERIFIED')
    ) {
      return 'LOW';
    }
    
    return 'MEDIUM';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KYC/AML Compliance</h2>
          <p className="text-muted-foreground">
            Manage identity verification, document validation, and compliance checks
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Identity Verification
            </CardTitle>
            <StatusBadge status={complianceData?.kycStatus || 'NOT_STARTED'} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verificationProvider === 'onfido' ? 'Onfido' : 
               verificationProvider === 'onfido-enhanced' ? 'Onfido Enhanced' :
               verificationProvider === 'onfido-workflow' ? 'Onfido Workflow' : 'Idenfy'}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceData?.kycStatus === 'COMPLETED' 
                ? 'Verification completed successfully'
                : complianceData?.kycStatus === 'FAILED'
                  ? 'Verification failed - review required' 
                  : 'Waiting for identity verification'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Document Verification
            </CardTitle>
            <StatusBadge 
              status={documents.some(d => d.status === 'VERIFIED') 
                ? 'COMPLETED' 
                : documents.length > 0 
                  ? 'IN_PROGRESS' 
                  : 'NOT_STARTED'} 
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              {documents.filter(d => d.status === 'VERIFIED').length} verified documents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Risk Assessment
            </CardTitle>
            <RiskBadge level={getOverallStatus()} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getOverallStatus()}
            </div>
            <p className="text-xs text-muted-foreground">
              {getOverallStatus() === 'LOW' 
                ? 'Low risk profile - approved' 
                : getOverallStatus() === 'MEDIUM'
                  ? 'Medium risk - additional review' 
                  : 'High risk - manual review required'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="identity">Identity Verification</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>
                  Overall compliance status and required actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium">KYC Status</span>
                      <StatusWithIcon 
                        status={complianceData?.kycStatus || 'NOT_STARTED'} 
                        label="Identity verification" 
                      />
                    </div>
                    <Button
                      variant={complianceData?.kycStatus === 'COMPLETED' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => setActiveTab('identity')}
                      disabled={complianceData?.kycStatus === 'COMPLETED'}
                    >
                      {complianceData?.kycStatus === 'COMPLETED' ? 'Verified' : 'Verify Now'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium">AML Status</span>
                      <StatusWithIcon 
                        status={complianceData?.amlStatus || 'NOT_STARTED'} 
                        label="Anti-money laundering check" 
                      />
                    </div>
                    <Button
                      variant={complianceData?.amlStatus === 'COMPLETED' ? 'outline' : 'default'}
                      size="sm"
                      disabled={complianceData?.kycStatus !== 'COMPLETED'}
                    >
                      {complianceData?.amlStatus === 'COMPLETED' ? 'Completed' : 'Run Check'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium">Document Status</span>
                      <StatusWithIcon 
                        status={documents.some(d => d.status === 'VERIFIED') 
                          ? 'COMPLETED' 
                          : documents.length > 0 
                            ? 'IN_PROGRESS' 
                            : 'NOT_STARTED'} 
                        label="Required documents" 
                      />
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActiveTab('documents')}
                      disabled={documents.filter(d => d.status === 'VERIFIED').length >= 2}
                    >
                      {documents.filter(d => d.status === 'VERIFIED').length >= 2 
                        ? 'All Verified' 
                        : 'Upload Documents'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Identity Verification</CardTitle>
                {complianceData?.kycStatus === 'COMPLETED' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    Verified
                  </Badge>
                )}
              </div>
              <CardDescription>
                Complete identity verification using our trusted partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-2">
                <div className="flex items-center space-x-4">
                  <Button
                    variant={verificationProvider === 'onfido' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setVerificationProvider('onfido');
                      setShowWorkflow(false);
                    }}
                  >
                    Onfido Basic
                  </Button>
                  <Button
                    variant={verificationProvider === 'onfido-enhanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setVerificationProvider('onfido-enhanced');
                      setShowWorkflow(false);
                    }}
                  >
                    Onfido Enhanced
                  </Button>
                  <Button
                    variant={verificationProvider === 'onfido-workflow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setVerificationProvider('onfido-workflow');
                      setShowWorkflow(true);
                    }}
                  >
                    Onfido Studio
                  </Button>
                  <Button
                    variant={verificationProvider === 'idenfy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setVerificationProvider('idenfy');
                      setShowWorkflow(false);
                    }}
                  >
                    Idenfy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {verificationProvider === 'onfido' 
                    ? 'Onfido Basic provides standard document and biometric verification'
                    : verificationProvider === 'onfido-enhanced'
                    ? 'Onfido Enhanced includes form validation and guided process'
                    : verificationProvider === 'onfido-workflow'
                    ? 'Onfido Studio offers customizable workflows for complex verification scenarios'
                    : 'Idenfy offers global coverage and supports multiple document types'}
                </p>
              </div>
              
              {verificationProvider === 'onfido-workflow' && (
                <div className="mb-6 space-y-4 p-4 border rounded-md">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="use-workflow" 
                      checked={showWorkflow} 
                      onCheckedChange={(checked) => setShowWorkflow(!!checked)} 
                    />
                    <div>
                      <Label htmlFor="use-workflow" className="font-medium">
                        Use Onfido Studio workflow
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        For complex verification scenarios requiring customized flow
                      </p>
                    </div>
                  </div>
                  
                  {showWorkflow && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="workflow-id">Workflow ID</Label>
                        <Input 
                          id="workflow-id"
                          value={workflowId} 
                          onChange={(e) => setWorkflowId(e.target.value)} 
                          placeholder="Enter Onfido Studio workflow ID"
                        />
                        <p className="text-xs text-muted-foreground">
                          Find this in your Onfido Studio dashboard
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {verificationProvider === 'onfido' && (
                <OnfidoVerification
                  investorId={investorId || ''}
                  investorData={investorData}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              )}
              
              {verificationProvider === 'onfido-enhanced' && (
                <EnhancedOnfidoVerification
                  investorId={investorId || ''}
                  initialData={investorData}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              )}
              
              {verificationProvider === 'onfido-workflow' && showWorkflow && workflowId && applicantId && (
                <WorkflowVerification
                  investorId={investorId || ''}
                  applicantId={applicantId}
                  workflowId={workflowId}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              )}
              
              {verificationProvider === 'idenfy' && (
                <KYCVerification
                  investorId={investorId || ''}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <DocumentVerification
            investorId={investorId || ''}
            onVerificationUpdate={handleDocumentUpdate}
            existingDocuments={documents}
          />
        </TabsContent>
        
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Checks</CardTitle>
              <CardDescription>
                Review all compliance checks and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceChecks.length > 0 ? (
                <div className="rounded-md border divide-y">
                  {complianceChecks.map((check) => (
                    <div key={check.id} className="flex items-start space-x-4 p-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            {check.type} Check
                          </h4>
                          <StatusBadge status={check.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created: {new Date(check.createdAt).toLocaleDateString()}
                          {check.completedAt && ` • Completed: ${new Date(check.completedAt).toLocaleDateString()}`}
                        </p>
                        {check.result && (
                          <div className="mt-1 flex items-center">
                            <span className="text-xs font-medium mr-2">Result:</span>
                            <Badge 
                              variant="outline"
                              className={check.result === 'PASS' 
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                                : check.result === 'FAIL'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                              }
                            >
                              {check.result}
                            </Badge>
                          </div>
                        )}
                        {Object.keys(check.details).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <details>
                              <summary className="cursor-pointer font-medium">Details</summary>
                              <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded text-xs">
                                {JSON.stringify(check.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-sm font-semibold">No compliance checks found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Complete identity verification to generate compliance checks.
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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          variant: 'outline' as const,
          className: 'bg-green-50 text-green-700 border-green-200',
          label: 'Completed'
        };
      case 'IN_PROGRESS':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'In Progress'
        };
      case 'FAILED':
        return {
          variant: 'outline' as const,
          className: 'bg-red-50 text-red-700 border-red-200',
          label: 'Failed'
        };
      case 'NOT_STARTED':
        return {
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          label: 'Not Started'
        };
      case 'PENDING':
        return {
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          label: 'Pending'
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
          label: status
        };
    }
  };

  const { variant, className, label } = getStatusProps();
  
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const getProps = () => {
    switch (level) {
      case 'LOW':
        return {
          className: 'bg-green-50 text-green-700 border-green-200',
          label: 'Low Risk'
        };
      case 'MEDIUM':
        return {
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          label: 'Medium Risk'
        };
      case 'HIGH':
        return {
          className: 'bg-red-50 text-red-700 border-red-200',
          label: 'High Risk'
        };
      default:
        return {
          className: '',
          label: level
        };
    }
  };

  const { className, label } = getProps();
  
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

const StatusWithIcon: React.FC<{ status: string, label: string }> = ({ status, label }) => {
  const getIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'IN_PROGRESS':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <UserRoundCheck className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'IN_PROGRESS':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getIcon()}
      <span className={`text-xs ${getTextColor()}`}>
        {label}
      </span>
    </div>
  );
};

export default KYCDashboard; 