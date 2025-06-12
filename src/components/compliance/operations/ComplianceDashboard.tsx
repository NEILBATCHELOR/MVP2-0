import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  BarChart4,
  FileText,
  Users,
  Building,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Clock,
  Menu,
  FileCheck,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import { IssuerBulkUpload } from './issuer/IssuerBulkUpload';
import { InvestorBulkUpload } from './investor/InvestorBulkUpload';
import { DataExportPanel } from './shared/DataExportPanel';
import ComplianceBarChart from './charts/ComplianceBarChart';
import CompliancePieChart from './charts/CompliancePieChart';
import { BatchApprovalProcessor } from './approvals/components/BatchApprovalProcessor';
import IssuerComplianceDashboard from './issuer/IssuerComplianceDashboard';
import KYCComplianceDashboard from './kyc/KYCComplianceDashboard';
import { cn } from '@/utils';

// Mock data for charts
const activityData = [
  { name: 'Jan', issuer: 20, investor: 35 },
  { name: 'Feb', issuer: 15, investor: 30 },
  { name: 'Mar', issuer: 25, investor: 45 },
  { name: 'Apr', issuer: 30, investor: 60 },
  { name: 'May', issuer: 40, investor: 80 },
  { name: 'Jun', issuer: 45, investor: 70 },
];

const kycStatusData = [
  { name: 'Approved', value: 78, color: '#3b82f6' },
  { name: 'Pending', value: 15, color: '#60a5fa' },
  { name: 'Rejected', value: 7, color: '#93c5fd' },
];

const documentTypeData = [
  { name: 'ID Card', value: 35, color: '#3b82f6' },
  { name: 'Passport', value: 25, color: '#60a5fa' },
  { name: 'Utility Bill', value: 15, color: '#93c5fd' },
  { name: 'Tax Form', value: 10, color: '#bfdbfe' },
  { name: 'Other', value: 15, color: '#dbeafe' },
];

// Blue theme colors for charts
const blueThemeColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

const ComplianceMetricsCard = ({ title, value, subtitle, change, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {subtitle}
        {change && (
          <span className={change > 0 ? "text-green-500" : "text-red-500"}>
            {' '}{change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </p>
    </CardContent>
  </Card>
);

const ComplianceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Navigation items for the horizontal navigation
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart4 className="h-4 w-4" /> },
    { id: 'issuers', label: 'Issuer Management', icon: <Building className="h-4 w-4" /> },
    { id: 'issuer-compliance', label: 'Issuer KYB/AML', icon: <FileCheck className="h-4 w-4" /> },
    { id: 'issuer-bulk', label: 'Issuer Bulk Upload', icon: <Upload className="h-4 w-4" /> },
    { id: 'investors', label: 'Investor Management', icon: <Users className="h-4 w-4" /> },
    { id: 'investor-compliance', label: 'Investor KYC/AML', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'investor-bulk', label: 'Investor Bulk Upload', icon: <Upload className="h-4 w-4" /> },
    { id: 'batch-approvals', label: 'Batch Approvals', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
    { id: 'export', label: 'Export Data', icon: <Download className="h-4 w-4" /> }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Horizontal Navigation Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex space-x-6 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 py-2 border-b-2 text-sm font-medium whitespace-nowrap",
                activeTab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="p-8">
          <header className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Compliance Operations Dashboard</h1>
              <p className="text-muted-foreground">Manage compliance operations and data for your platform</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </header>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issuers">Issuer Management</TabsTrigger>
              <TabsTrigger value="investors">Investor Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ComplianceMetricsCard
                  title="Total Issuers"
                  value="248"
                  subtitle="Onboarded issuers"
                  change={5.2}
                  icon={Building}
                />
                <ComplianceMetricsCard
                  title="Total Investors"
                  value="1,342"
                  subtitle="Verified investors"
                  change={8.1}
                  icon={Users}
                />
                <ComplianceMetricsCard
                  title="KYC Completion Rate"
                  value="94%"
                  subtitle="Last 30 days"
                  change={2.1}
                  icon={FileText}
                />
                <ComplianceMetricsCard
                  title="Document Uploads"
                  value="528"
                  subtitle="Last 30 days"
                  change={-3.4}
                  icon={Upload}
                />
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-2">
                  <ComplianceBarChart
                    title="Compliance Activity"
                    description="Monthly onboarding and verification activity"
                    data={activityData}
                    dataKeys={['issuer', 'investor']}
                    colors={blueThemeColors}
                    footer={
                      <div className="flex items-center justify-between text-sm text-muted-foreground w-full">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Updated 2 hours ago
                        </div>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    }
                  />
                </div>
                
                <CompliancePieChart
                  title="KYC Status"
                  description="Distribution by verification status"
                  data={kycStatusData}
                  innerRadius={60}
                  outerRadius={90}
                  colors={blueThemeColors}
                  footer={
                    <div className="flex justify-between w-full text-sm">
                      <div><Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Approved</Badge> 78%</div>
                      <div><Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50">Pending</Badge> 15%</div>
                      <div><Badge className="bg-blue-50 text-blue-500 hover:bg-blue-50">Rejected</Badge> 7%</div>
                    </div>
                  }
                />
              </div>

              {/* Document Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1">
                  <CompliancePieChart
                    title="Document Types"
                    description="Distribution by document category"
                    data={documentTypeData}
                    colors={blueThemeColors}
                  />
                </div>
                
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest compliance operations and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-100 text-blue-700 hover:bg-blue-100">KYC Update</Badge>
                            <span>New KYC verification processes implemented</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          Updated KYC verification processes have been implemented to comply with new regulatory requirements.
                          Please ensure all team members are trained on the new procedures.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-100 text-blue-700 hover:bg-blue-100">Data Import</Badge>
                            <span>Bulk investor data import completed</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          Successfully imported 143 new investor profiles from the latest data migration.
                          All profiles have been verified and are now available in the system.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-100 text-blue-700 hover:bg-blue-100">System Update</Badge>
                            <span>Compliance reporting framework updated</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          The compliance reporting framework has been updated to include new regulatory requirements.
                          New report templates are now available in the reports section.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Activity
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="issuers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issuer Bulk Upload</CardTitle>
                  <CardDescription>
                    Upload issuer information in bulk using a spreadsheet template.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IssuerBulkUpload />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Issuer Data Export</CardTitle>
                  <CardDescription>
                    Export all issuer information in various formats.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataExportPanel entityType="issuer" />
                </CardContent>
              </Card>
              
              <ComplianceBarChart
                title="Issuer Compliance Analytics"
                description="Monthly compliance metrics for issuers"
                data={[
                  { name: 'Jan', verified: 15, pending: 8, rejected: 2 },
                  { name: 'Feb', verified: 18, pending: 6, rejected: 1 },
                  { name: 'Mar', verified: 22, pending: 7, rejected: 3 },
                  { name: 'Apr', verified: 25, pending: 9, rejected: 2 },
                  { name: 'May', verified: 30, pending: 12, rejected: 4 },
                  { name: 'Jun', verified: 35, pending: 10, rejected: 5 },
                ]}
                dataKeys={['verified', 'pending', 'rejected']}
                colors={blueThemeColors}
                footer={
                  <Button variant="outline" className="w-full">View Detailed Analytics</Button>
                }
              />
            </TabsContent>
            
            <TabsContent value="investors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Investor Bulk Upload</CardTitle>
                  <CardDescription>
                    Upload multiple investor profiles in bulk using a spreadsheet template.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InvestorBulkUpload />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Investor Data Export</CardTitle>
                  <CardDescription>
                    Export all investor information in various formats.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataExportPanel entityType="investor" />
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2">
                <ComplianceBarChart
                  title="Investor Verification Trend"
                  description="KYC verification statistics by month"
                  data={[
                    { name: 'Jan', verified: 35, pending: 15, rejected: 5 },
                    { name: 'Feb', verified: 40, pending: 12, rejected: 3 },
                    { name: 'Mar', verified: 45, pending: 18, rejected: 7 },
                    { name: 'Apr', verified: 60, pending: 20, rejected: 5 },
                    { name: 'May', verified: 75, pending: 25, rejected: 8 },
                    { name: 'Jun', verified: 90, pending: 15, rejected: 6 },
                  ]}
                  dataKeys={['verified', 'pending', 'rejected']}
                  colors={blueThemeColors}
                />
                
                <CompliancePieChart
                  title="Investor Verification Status"
                  description="Current distribution by KYC status"
                  data={[
                    { name: 'Verified', value: 78, color: '#3b82f6' },
                    { name: 'Pending', value: 15, color: '#60a5fa' },
                    { name: 'Rejected', value: 7, color: '#93c5fd' },
                  ]}
                  innerRadius={60}
                  outerRadius={90}
                  colors={blueThemeColors}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Investor Compliance Status</CardTitle>
                  <CardDescription>KYC and verification status for investor accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="investor-1">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full mr-4">
                          <span>KYC Verification Status</span>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">78% Complete</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Fully Verified Investors:</span>
                            <span className="font-medium">1,046</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Verification:</span>
                            <span className="font-medium">201</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed Verification:</span>
                            <span className="font-medium">95</span>
                          </div>
                          <Separator className="my-2" />
                          <Button variant="outline" size="sm">View Detailed Report</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="investor-2">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full mr-4">
                          <span>Document Verification</span>
                          <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">65% Complete</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Documents:</span>
                            <span className="font-medium">3,245</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Verified Documents:</span>
                            <span className="font-medium">2,109</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Review:</span>
                            <span className="font-medium">876</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rejected Documents:</span>
                            <span className="font-medium">260</span>
                          </div>
                          <Separator className="my-2" />
                          <Button variant="outline" size="sm">View Document Analytics</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="investor-3">
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full mr-4">
                          <span>AML Screening Status</span>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">92% Complete</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Screened Investors:</span>
                            <span className="font-medium">1,235</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending Screening:</span>
                            <span className="font-medium">107</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Flagged for Review:</span>
                            <span className="font-medium">42</span>
                          </div>
                          <Separator className="my-2" />
                          <Button variant="outline" size="sm">View AML Reports</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="issuer-compliance" className="space-y-6">
              <IssuerComplianceDashboard
                issuerId="SAMPLE-ISSUER-123"
                currentUser={{
                  id: '1',
                  name: 'Admin User',
                  role: 'COMPLIANCE_OFFICER'
                }}
              />
            </TabsContent>
            
            <TabsContent value="investor-compliance" className="space-y-6">
              <KYCComplianceDashboard
                investorId="SAMPLE-INVESTOR-123"
                currentUser={{
                  id: '1',
                  name: 'Admin User',
                  role: 'COMPLIANCE_OFFICER'
                }}
              />
            </TabsContent>
            
            <TabsContent value="batch-approvals" className="space-y-6">
              <BatchApprovalProcessor
                currentUser={{
                  id: '1',
                  name: 'Admin User',
                  role: 'COMPLIANCE_OFFICER'
                }}
              />
            </TabsContent>
            
            <TabsContent value="issuer-bulk" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issuer Bulk Upload and Processing</CardTitle>
                  <CardDescription>
                    Upload and process multiple issuers at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IssuerBulkUpload />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="investor-bulk" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Investor Bulk Upload and Processing</CardTitle>
                  <CardDescription>
                    Upload and process multiple investors at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InvestorBulkUpload />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;