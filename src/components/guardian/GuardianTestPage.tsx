import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { GuardianWalletCreation } from './GuardianWalletCreation';
import { GuardianWalletList } from './GuardianWalletList';
import { GuardianApiTester } from './GuardianApiTester';

/**
 * Guardian Medex API Test Page
 * 
 * Tests both working and problematic endpoints:
 * ✅ POST /api/v1/wallets/create (working - 200 OK)
 * ❌ GET /api/v1/wallets (403 Invalid Signature)
 * ❌ GET /api/v1/wallets/{id} (403 Invalid Signature)
 */
export function GuardianTestPage() {
  const [testResults, setTestResults] = useState<{
    postCreate: 'success' | 'error' | 'pending' | null;
    getWallets: 'success' | 'error' | 'pending' | null;
    getWallet: 'success' | 'error' | 'pending' | null;
  }>({
    postCreate: null,
    getWallets: null,
    getWallet: null
  });

  const getStatusIcon = (status: typeof testResults.postCreate) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = (status: typeof testResults.postCreate) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Working</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Not Tested</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-blue-500" />
          Guardian Medex API Test Page
        </h1>
        <p className="text-gray-600">
          Test and debug Guardian wallet operations. POST creation works, GET requests need debugging.
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.postCreate)}
                <span className="font-medium">POST /api/v1/wallets/create</span>
              </div>
              {getStatusBadge(testResults.postCreate)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.getWallets)}
                <span className="font-medium">GET /api/v1/wallets</span>
              </div>
              {getStatusBadge(testResults.getWallets)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.getWallet)}
                <span className="font-medium">GET /api/v1/wallets/{'{id}'}</span>
              </div>
              {getStatusBadge(testResults.getWallet)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Known Issues Alert */}
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Known Issue:</strong> GET requests return "403 Invalid Signature" while POST requests work perfectly. 
          This suggests different signature requirements for GET vs POST operations.
        </AlertDescription>
      </Alert>

      {/* Test Tabs */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Wallet</TabsTrigger>
          <TabsTrigger value="list">List Wallets</TabsTrigger>
          <TabsTrigger value="debug">API Debug</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <GuardianWalletCreation 
            onTestResult={(result) => setTestResults(prev => ({ ...prev, postCreate: result }))}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <GuardianWalletList 
            onTestResult={(result) => setTestResults(prev => ({ ...prev, getWallets: result }))}
          />
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <GuardianApiTester 
            onTestResults={(results) => setTestResults(results)}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">✅ Working Features</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Ed25519 authentication with BASE64 signatures</li>
                    <li>• POST /api/v1/wallets/create (200 OK)</li>
                    <li>• JSON key sorting for signature consistency</li>
                    <li>• Correct request body format: {'{'}&quot;id&quot;: &quot;uuid&quot;{'}'}</li>
                    <li>• Operation ID returned matches nonce</li>
                    <li>• Infrastructure files updated and working</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600">❌ Issues to Resolve</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• GET requests return "403 Invalid Signature"</li>
                    <li>• Operation status checking not working</li>
                    <li>• Wallet listing not working</li>
                    <li>• Different signature format needed for GET?</li>
                    <li>• Awaiting Guardian Labs guidance</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Next Steps</h3>
                <ol className="text-sm space-y-1 text-gray-600">
                  <li>1. Contact Guardian Labs about GET request signature format</li>
                  <li>2. Test different signature approaches for GET requests</li>
                  <li>3. Once GET requests work, implement operation status polling</li>
                  <li>4. Add webhook integration for real-time updates</li>
                  <li>5. Deploy to production environment</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
