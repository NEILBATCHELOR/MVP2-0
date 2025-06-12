import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Shield, 
  FileText, 
  Camera, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Upload
} from 'lucide-react';
import { moonpayService, MoonpayCustomerProfile } from '@/services/wallet/MoonpayService';
import { supabase } from '@/infrastructure/database/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CustomerFilter {
  status?: 'all' | 'verified' | 'pending' | 'failed';
  kycLevel?: 'all' | 'none' | 'basic' | 'enhanced' | 'premium';
  searchQuery?: string;
}

interface KYCDocument {
  id: string;
  type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

interface VerificationSession {
  id: string;
  customerId: string;
  sessionId: string;
  verificationType: 'basic' | 'enhanced';
  status: 'pending' | 'completed' | 'failed';
  verificationUrl: string;
  createdAt: string;
  completedAt?: string;
}

const CustomerManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Customer data
  const [customers, setCustomers] = useState<MoonpayCustomerProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<MoonpayCustomerProfile | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filters
  const [filter, setFilter] = useState<CustomerFilter>({
    status: 'all',
    kycLevel: 'all',
    searchQuery: ''
  });
  
  // Verification state
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationSessions, setVerificationSessions] = useState<VerificationSession[]>([]);
  const [selectedVerificationType, setSelectedVerificationType] = useState<'basic' | 'enhanced'>('basic');

  useEffect(() => {
    loadCustomers();
  }, [filter, currentPage]);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Replace with actual moonpay_customers table when available
      // Build query with filters
      // let query = supabase
      //   .from('moonpay_customers')
      //   .select('*', { count: 'exact' });

      // Apply status filter
      // if (filter.status !== 'all') {
      //   if (filter.status === 'verified') {
      //     query = query.eq('identity_verification_status', 'completed');
      //   } else if (filter.status === 'pending') {
      //     query = query.eq('identity_verification_status', 'pending');
      //   } else if (filter.status === 'failed') {
      //     query = query.eq('identity_verification_status', 'failed');
      //   }
      // }

      // Apply KYC level filter
      // if (filter.kycLevel !== 'all') {
      //   query = query.eq('kyc_level', filter.kycLevel);
      // }

      // Apply search filter
      // if (filter.searchQuery) {
      //   query = query.or(`email.ilike.%${filter.searchQuery}%,first_name.ilike.%${filter.searchQuery}%,last_name.ilike.%${filter.searchQuery}%`);
      // }

      // Apply pagination
      // const offset = (currentPage - 1) * pageSize;
      // query = query.range(offset, offset + pageSize - 1);
      // query = query.order('created_at', { ascending: false });

      // const { data, error, count } = await query;

      // if (error) throw error;

      // Mock data for development
      const data: any[] = [];
      const count = 0;

      // Convert database records to customer profiles
      const customerProfiles = data?.map(mapDatabaseToCustomer) || [];
      
      setCustomers(customerProfiles);
      setTotalCustomers(count || 0);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Customer loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapDatabaseToCustomer = (data: any): MoonpayCustomerProfile => {
    return {
      id: data.moonpay_customer_id || data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      address: data.address,
      kycLevel: data.kyc_level || 'none',
      identityVerificationStatus: data.identity_verification_status,
      verificationDocuments: data.verification_documents || [],
      transactionLimits: data.transaction_limits || {
        daily: { min: 30, max: 2000 },
        weekly: { min: 30, max: 10000 },
        monthly: { min: 30, max: 50000 }
      },
      preferredPaymentMethods: data.preferred_payment_methods || []
    };
  };

  const handleCustomerSelect = (customer: MoonpayCustomerProfile) => {
    setSelectedCustomer(customer);
  };

  const handleInitiateVerification = async (customerId: string, verificationType: 'basic' | 'enhanced') => {
    setIsLoading(true);
    try {
      const result = await moonpayService.initiateIdentityCheck(customerId, verificationType);
      
      // Store verification session
      const session: VerificationSession = {
        id: crypto.randomUUID(),
        customerId,
        sessionId: result.sessionId,
        verificationType,
        status: 'pending',
        verificationUrl: result.verificationUrl,
        createdAt: new Date().toISOString()
      };
      
      setVerificationSessions(prev => [session, ...prev]);
      
      // Open verification URL in new window
      window.open(result.verificationUrl, '_blank', 'width=800,height=600');
      
    } catch (err) {
      setError('Failed to initiate verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDocument = async (customerId: string, documentId: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual moonpay_customers table when available
      // Update document status in customer record
      const customer = customers.find(c => c.id === customerId);
      if (customer && customer.verificationDocuments) {
        const updatedDocs = customer.verificationDocuments.map((doc: any) => 
          doc.id === documentId 
            ? { ...doc, status: 'approved', reviewedAt: new Date().toISOString() }
            : doc
        );
        
        // await supabase
        //   .from('moonpay_customers')
        //   .update({ verification_documents: updatedDocs })
        //   .eq('moonpay_customer_id', customerId);
        
        // Mock successful update
        console.log('Document approved (mock operation):', documentId);
        
        await loadCustomers();
      }
    } catch (err) {
      setError('Failed to approve document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDocument = async (customerId: string, documentId: string, notes: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual moonpay_customers table when available
      const customer = customers.find(c => c.id === customerId);
      if (customer && customer.verificationDocuments) {
        const updatedDocs = customer.verificationDocuments.map((doc: any) => 
          doc.id === documentId 
            ? { ...doc, status: 'rejected', reviewedAt: new Date().toISOString(), notes }
            : doc
        );
        
        // await supabase
        //   .from('moonpay_customers')
        //   .update({ verification_documents: updatedDocs })
        //   .eq('moonpay_customer_id', customerId);
        
        // Mock successful update
        console.log('Document rejected (mock operation):', documentId, notes);
        
        await loadCustomers();
      }
    } catch (err) {
      setError('Failed to reject document');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  const getKYCBadge = (level: string) => {
    const colors = {
      none: 'outline',
      basic: 'secondary',
      enhanced: 'default',
      premium: 'destructive'
    } as const;
    
    return <Badge variant={colors[level as keyof typeof colors] || 'outline'}>{level.toUpperCase()}</Badge>;
  };

  const renderCustomerList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Customers ({totalCustomers})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={filter.status} 
            onValueChange={(value: any) => setFilter(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filter.kycLevel} 
            onValueChange={(value: any) => setFilter(prev => ({ ...prev, kycLevel: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC Levels</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No customers found
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCustomer?.id === customer.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(customer.identityVerificationStatus)}
                    {getKYCBadge(customer.kycLevel)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalCustomers > pageSize && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCustomers / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalCustomers / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCustomerDetails = () => {
    if (!selectedCustomer) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
              <p className="text-muted-foreground">Choose a customer from the list to view details</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>{selectedCustomer.firstName} {selectedCustomer.lastName}</CardTitle>
                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedCustomer.identityVerificationStatus)}
                {getKYCBadge(selectedCustomer.kycLevel)}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Customer Information */}
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <div className="font-medium">{selectedCustomer.firstName || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <div className="font-medium">{selectedCustomer.lastName || 'Not provided'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="font-medium">{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <div className="font-medium">
                      {selectedCustomer.dateOfBirth 
                        ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString()
                        : 'Not provided'
                      }
                    </div>
                  </div>
                </div>
                
                {selectedCustomer.address && (
                  <div>
                    <Label>Address</Label>
                    <div className="font-medium">
                      {selectedCustomer.address.street}<br />
                      {selectedCustomer.address.town}, {selectedCustomer.address.postCode}<br />
                      {selectedCustomer.address.country}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Identity Verification</CardTitle>
                  <Button onClick={() => setShowVerificationDialog(true)}>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Verification
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedCustomer.identityVerificationStatus)}
                    </div>
                  </div>
                  <div>
                    <Label>KYC Level</Label>
                    <div className="mt-1">
                      {getKYCBadge(selectedCustomer.kycLevel)}
                    </div>
                  </div>
                </div>
                
                {/* Verification Progress */}
                <div>
                  <Label>Verification Progress</Label>
                  <div className="mt-2">
                    <Progress 
                      value={
                        selectedCustomer.kycLevel === 'premium' ? 100 :
                        selectedCustomer.kycLevel === 'enhanced' ? 75 :
                        selectedCustomer.kycLevel === 'basic' ? 50 :
                        selectedCustomer.identityVerificationStatus === 'pending' ? 25 : 0
                      } 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCustomer.verificationDocuments && selectedCustomer.verificationDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedCustomer.verificationDocuments.map((doc: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{doc.type.replace('_', ' ').toUpperCase()}</div>
                              <div className="text-sm text-muted-foreground">
                                Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            
                            {doc.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveDocument(selectedCustomer.id!, doc.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectDocument(selectedCustomer.id!, doc.id, 'Document rejected')}
                                >
                                  <UserX className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {doc.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Notes: {doc.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents submitted yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="limits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      ${selectedCustomer.transactionLimits.daily.max}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Limit</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      ${selectedCustomer.transactionLimits.weekly.max}
                    </div>
                    <div className="text-sm text-muted-foreground">Weekly Limit</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      ${selectedCustomer.transactionLimits.monthly.max}
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly Limit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderVerificationDialog = () => (
    <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Identity Verification</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Verification Type</Label>
            <Select value={selectedVerificationType} onValueChange={(value: any) => setSelectedVerificationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Verification</SelectItem>
                <SelectItem value="enhanced">Enhanced Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {selectedVerificationType === 'basic' 
                ? 'Basic verification requires ID document and selfie verification.'
                : 'Enhanced verification includes additional document verification and background checks.'
              }
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedCustomer) {
                  handleInitiateVerification(selectedCustomer.id!, selectedVerificationType);
                  setShowVerificationDialog(false);
                }
              }}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              Start Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer profiles and verification status</p>
        </div>
        
        <Button variant="outline" onClick={loadCustomers}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          {renderCustomerList()}
        </div>
        
        {/* Customer Details */}
        <div className="lg:col-span-2">
          {renderCustomerDetails()}
        </div>
      </div>

      {/* Verification Dialog */}
      {renderVerificationDialog()}
    </div>
  );
};

export default CustomerManagement;
