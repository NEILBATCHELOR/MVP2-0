import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  Building2, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert,
  Activity,
  ListChecks,
  ArrowRight,
  FileText,
  UserRoundCheck
} from "lucide-react";

// Mock data for the dashboard
const mockData = {
  stats: {
    pendingInvestors: 24,
    approvedInvestors: 156,
    rejectedInvestors: 12,
    pendingIssuers: 5,
    approvedIssuers: 18,
    rejectedIssuers: 3,
    pendingDocuments: 36,
    approvedDocuments: 412,
    rejectedDocuments: 22,
    pendingApprovals: 15,
    highRiskEntities: 8,
    issuesRequiringAttention: 7
  },
  pendingVerifications: [
    { id: 'inv-001', name: 'John Smith', type: 'INVESTOR', status: 'PENDING', riskLevel: 'MEDIUM', submitted: '2023-06-15T10:30:00Z' },
    { id: 'inv-002', name: 'Sarah Johnson', type: 'INVESTOR', status: 'IN_PROGRESS', riskLevel: 'LOW', submitted: '2023-06-14T14:45:00Z' },
    { id: 'iss-001', name: 'Acme Corp', type: 'ISSUER', status: 'PENDING', riskLevel: 'HIGH', submitted: '2023-06-13T09:15:00Z' },
    { id: 'inv-003', name: 'Michael Wong', type: 'INVESTOR', status: 'IN_PROGRESS', riskLevel: 'MEDIUM', submitted: '2023-06-12T16:20:00Z' },
    { id: 'iss-002', name: 'Globex Industries', type: 'ISSUER', status: 'IN_PROGRESS', riskLevel: 'MEDIUM', submitted: '2023-06-11T11:10:00Z' }
  ],
  pendingApprovals: [
    { id: 'app-001', entity: 'John Smith', entityType: 'INVESTOR', level: 'L1', requiredApprovals: 2, currentApprovals: 1 },
    { id: 'app-002', entity: 'Acme Corp', entityType: 'ISSUER', level: 'L2', requiredApprovals: 2, currentApprovals: 0 },
    { id: 'app-003', entity: 'Sarah Johnson', entityType: 'INVESTOR', level: 'L1', requiredApprovals: 1, currentApprovals: 0 }
  ],
  auditActivity: [
    { id: 1, action: 'DOCUMENT_APPROVED', user: 'compliance_officer1', timestamp: '2023-06-15T14:30:00Z' },
    { id: 2, action: 'INVESTOR_REJECTED', user: 'compliance_manager', timestamp: '2023-06-15T13:15:00Z' },
    { id: 3, action: 'AML_CHECK_COMPLETED', user: 'system', timestamp: '2023-06-15T12:45:00Z' },
    { id: 4, action: 'WORKFLOW_ESCALATED', user: 'compliance_officer2', timestamp: '2023-06-15T11:20:00Z' },
    { id: 5, action: 'ISSUER_APPROVED', user: 'compliance_director', timestamp: '2023-06-15T10:05:00Z' }
  ],
  verificationChart: [
    { name: 'Jan', investors: 18, issuers: 2 },
    { name: 'Feb', investors: 24, issuers: 3 },
    { name: 'Mar', investors: 32, issuers: 4 },
    { name: 'Apr', investors: 28, issuers: 2 },
    { name: 'May', investors: 42, issuers: 5 },
    { name: 'Jun', investors: 36, issuers: 3 }
  ],
  riskDistribution: [
    { name: 'Low Risk', value: 65 },
    { name: 'Medium Risk', value: 27 },
    { name: 'High Risk', value: 8 }
  ]
};

export const ComplianceDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(mockData.stats);
  const [pendingVerifications, setPendingVerifications] = useState(mockData.pendingVerifications);
  const [pendingApprovals, setPendingApprovals] = useState(mockData.pendingApprovals);
  const [auditActivity, setAuditActivity] = useState(mockData.auditActivity);
  const [verificationChart, setVerificationChart] = useState(mockData.verificationChart);
  const [riskDistribution, setRiskDistribution] = useState(mockData.riskDistribution);
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get risk level badge
  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium Risk</Badge>;
      case 'LOW':
      default:
        return <Badge variant="outline" className="border-green-500 text-green-500">Low Risk</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of compliance operations and pending actions
          </p>
        </div>
        <Button>
          Run Batch Verification
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {stats.pendingInvestors + stats.pendingIssuers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingInvestors} investors, {stats.pendingIssuers} issuers
                </p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Document Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {stats.pendingDocuments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending document reviews
                </p>
              </div>
              <FileCheck className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {stats.pendingApprovals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Workflows requiring approval
                </p>
              </div>
              <ListChecks className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">
                  {stats.highRiskEntities}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requiring enhanced due diligence
                </p>
              </div>
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Verification Activity</CardTitle>
            <CardDescription>
              Monthly verification volume by entity type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verificationChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="investors" name="Investors" fill="#4f46e5" />
                  <Bar dataKey="issuers" name="Issuers" fill="#84cc16" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Entity risk level breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Low Risk</span>
                  </div>
                  <span className="font-medium">{riskDistribution[0].value}%</span>
                </div>
                <Progress value={riskDistribution[0].value} className="h-2 bg-muted" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span>Medium Risk</span>
                  </div>
                  <span className="font-medium">{riskDistribution[1].value}%</span>
                </div>
                <Progress value={riskDistribution[1].value} className="h-2 bg-muted" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>High Risk</span>
                  </div>
                  <span className="font-medium">{riskDistribution[2].value}%</span>
                </div>
                <Progress value={riskDistribution[2].value} className="h-2 bg-muted" />
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="border rounded-md p-3 text-center">
                  <p className="text-2xl font-bold">{stats.approvedInvestors + stats.approvedIssuers}</p>
                  <p className="text-xs text-muted-foreground">Approved Entities</p>
                </div>
                <div className="border rounded-md p-3 text-center">
                  <p className="text-2xl font-bold">{stats.rejectedInvestors + stats.rejectedIssuers}</p>
                  <p className="text-xs text-muted-foreground">Rejected Entities</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>
                Recent verification requests awaiting review
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerifications.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-4">
                    {item.type === 'INVESTOR' ? (
                      <UserRoundCheck className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{item.type.charAt(0) + item.type.slice(1).toLowerCase()}</span>
                        <span className="mx-1">•</span>
                        <span>Submitted {formatDate(item.submitted)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRiskBadge(item.riskLevel)}
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Workflows requiring your approval
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{item.entity}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{item.entityType}</span>
                        <span className="mx-1">•</span>
                        <span>Level {item.level}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">
                        <span className="font-medium">{item.currentApprovals}</span>
                        /{item.requiredApprovals} approvals
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest compliance actions and events
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View Audit Log
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditActivity.map((item) => (
                  <div key={item.id} className="flex items-center p-2">
                    <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{item.action.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground"> by </span>
                      <span>{item.user}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;