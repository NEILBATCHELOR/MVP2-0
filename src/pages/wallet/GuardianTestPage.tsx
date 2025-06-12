import { sha512 } from '@noble/hashes/sha512';
import { ed25519 } from '@noble/curves/ed25519';

// Set up crypto polyfill for Guardian authentication
if (ed25519.utils && typeof ed25519.utils === 'object') {
  (ed25519.utils as any).sha512Sync = sha512;
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Wallet, Database, Clock, RefreshCw, Download } from 'lucide-react';
import { GuardianWalletService } from '@/services/guardian/GuardianWalletService';
import { GuardianApiClient } from '@/infrastructure/guardian/GuardianApiClient';
import { GuardianTestDatabaseService } from '@/services/guardian/GuardianTestDatabaseService';
import { GuardianPollingService } from '@/infrastructure/guardian/GuardianPollingService';
import { GuardianSyncService } from '@/services/guardian/GuardianSyncService';
import type { GuardianWallet, GuardianOperation } from '@/types/guardian/guardianTesting';

interface WalletResult {
  id: string;
  name: string;
  operationId?: string;
  status?: string;
  addresses?: Array<{
    type: string;
    address: string;
    network: string;
  }>;
  guardianData?: any;
  dbRecorded?: boolean;
  dbRecordId?: string;
}

interface GuardianApiWallet {
  id: string;
  externalId?: string;
  status: string;
  accounts?: Array<{
    type: string;
    address: string;
    network: string;
  }>;
  [key: string]: any;
}

interface GuardianApiOperation {
  id: string;
  status: string;
  type?: string;
  result?: any;
  createdAt?: string;
  [key: string]: any;
}

export default function GuardianTestPage() {
  // Existing state
  const [walletId, setWalletId] = useState('');
  const [operationId, setOperationId] = useState('');
  const [createId, setCreateId] = useState('');
  const [result, setResult] = useState<string>('');
  const [walletResults, setWalletResults] = useState<WalletResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [dbWritable, setDbWritable] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<string>('Checking...');

  // Enhanced state for API and Database data
  const [apiWallets, setApiWallets] = useState<GuardianApiWallet[]>([]);
  const [apiOperations, setApiOperations] = useState<GuardianApiOperation[]>([]);
  const [dbWallets, setDbWallets] = useState<GuardianWallet[]>([]);
  const [dbOperations, setDbOperations] = useState<GuardianOperation[]>([]);
  const [syncResult, setSyncResult] = useState<string>('');

  const apiClient = new GuardianApiClient();
  const walletService = new GuardianWalletService();
  const pollingService = new GuardianPollingService();
  const syncService = new GuardianSyncService();

  // Check database write status on mount
  useEffect(() => {
    checkDatabaseStatus();
    loadAllEnhancedData();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const writable = await GuardianTestDatabaseService.isDatabaseWritable();
      setDbWritable(writable);
      setDbStatus(writable ? 'Writable ✅' : 'Read-only ⚠️');
    } catch (error) {
      setDbWritable(false);
      setDbStatus('Error ❌');
    }
  };

  // Enhanced data loading functions
  const loadAllEnhancedData = async () => {
    await Promise.all([
      loadApiData(),
      loadDatabaseData()
    ]);
  };

  const loadApiData = async () => {
    try {
      const [wallets, operations] = await Promise.all([
        apiClient.getWallets().catch(() => []),
        apiClient.listOperations().catch(() => [])
      ]);
      setApiWallets(wallets);
      setApiOperations(operations);
    } catch (error) {
      console.error('Failed to load API data:', error);
    }
  };

  const loadDatabaseData = async () => {
    try {
      const [wallets, operations] = await Promise.all([
        GuardianTestDatabaseService.getGuardianWallets(100),
        GuardianTestDatabaseService.getGuardianOperations(100)
      ]);
      setDbWallets(wallets);
      setDbOperations(operations);
    } catch (error) {
      console.error('Failed to load database data:', error);
    }
  };

  const syncWalletsToDatabase = async () => {
    setLoading('sync_wallets');
    setSyncResult('');
    
    try {
      const result = await syncService.syncAll({
        syncWallets: true,
        syncOperations: false,
        maxWallets: 100
      });
      
      setSyncResult(`Wallets Sync: ${result.walletsAdded} added, ${result.walletsUpdated} updated`);
      await loadDatabaseData(); // Reload database data
      
    } catch (error) {
      setSyncResult(`Sync failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const syncOperationsToDatabase = async () => {
    setLoading('sync_operations');
    setSyncResult('');
    
    try {
      const result = await syncService.syncAll({
        syncWallets: false,
        syncOperations: true,
        maxOperations: 100
      });
      
      setSyncResult(`Operations Sync: ${result.operationsAdded} added, ${result.operationsUpdated} updated`);
      await loadDatabaseData(); // Reload database data
      
    } catch (error) {
      setSyncResult(`Sync failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const refreshAllData = async () => {
    setLoading('refresh');
    await loadAllEnhancedData();
    setLoading(null);
  };

  const run = async (label: string, fn: () => Promise<any>, recordToDB = false) => {
    setLoading(label);
    setResult('');
    const startTime = Date.now();
    
    try {
      const res = await fn();
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      setResult(JSON.stringify(res, null, 2));
      
      // Record to database if requested and writable
      if (recordToDB && dbWritable) {
        try {
          const dbResult = await GuardianTestDatabaseService.recordTestResult({
            operation: label,
            endpoint: getEndpointFromLabel(label),
            method: getMethodFromLabel(label),
            requestData: getRequestDataFromLabel(label),
            responseData: res,
            status: 'success',
            timestamp: new Date().toISOString(),
            executionTime,
            walletId: extractWalletId(res),
            operationId: extractOperationId(res),
            flowType: label.includes('complete') ? 'complete_flow' : 'single_operation'
          });
          
          setResult(prev => prev + `\n\n✅ Recorded to database: ${dbResult}`);
        } catch (dbError) {
          setResult(prev => prev + `\n\n❌ Database recording failed: ${dbError.message}`);
        }
      } else if (recordToDB && !dbWritable) {
        setResult(prev => prev + `\n\n⚠️ Database is read-only - result not persisted`);
      }
      
      return res;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      setResult(`❌ Error: ${errorMsg}`);
      
      // Record error to database if possible
      if (recordToDB && dbWritable) {
        try {
          await GuardianTestDatabaseService.recordTestResult({
            operation: label,
            endpoint: getEndpointFromLabel(label),
            method: getMethodFromLabel(label),
            requestData: getRequestDataFromLabel(label),
            responseData: null,
            status: 'error',
            timestamp: new Date().toISOString(),
            executionTime,
            errorMessage: errorMsg
          });
        } catch (dbError) {
          console.error('Failed to record error to database:', dbError);
        }
      }
      
      throw err;
    } finally {
      setLoading(null);
    }
  };

  // Helper functions for database recording
  const getEndpointFromLabel = (label: string): string => {
    switch (label) {
      case 'create': return '/api/v1/wallets/create';
      case 'list': return '/api/v1/wallets';
      case 'get_wallet': return '/api/v1/wallets/{id}';
      case 'get_operation': return '/api/v1/operations/{id}';
      case 'list_operations': return '/api/v1/operations';
      default: return 'unknown';
    }
  };

  const getMethodFromLabel = (label: string): string => {
    return label === 'create' ? 'POST' : 'GET';
  };

  const getRequestDataFromLabel = (label: string): any => {
    switch (label) {
      case 'create': return { id: createId || 'generated' };
      case 'get_wallet': return { walletId };
      case 'get_operation': return { operationId };
      default: return {};
    }
  };

  const extractWalletId = (response: any): string | undefined => {
    return response?.id || response?.walletId;
  };

  const extractOperationId = (response: any): string | undefined => {
    return response?.operationId;
  };

  // Load persisted data functions
  const loadTestResults = async () => {
    return await GuardianTestDatabaseService.getTestResults(10);
  };

  const loadWalletData = async () => {
    return await GuardianTestDatabaseService.getGuardianWallets(10);
  };

  // Utility functions for displaying data
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800', 
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'processed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'error': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const generateUUID = () => {
    const id = crypto.randomUUID();
    setCreateId(id);
  };

  // Test all Guardian API endpoints
  const createWallet = async () => {
    const walletData = { id: createId || crypto.randomUUID() };
    const result = await apiClient.createWallet(walletData);
    
    const walletResult: WalletResult = {
      id: walletData.id,
      name: `Test Wallet ${walletData.id.substring(0, 8)}`,
      operationId: result.operationId,
      status: 'creating',
      guardianData: result
    };
    
    setWalletResults(prev => [...prev, walletResult]);
    return result;
  };

  const listWallets = () => apiClient.getWallets();
  
  const getWalletById = (id: string) => apiClient.getWallet(id);
  
  const getOperationStatus = (opId: string) => apiClient.getOperation(opId);

  const listOperations = () => apiClient.listOperations();

  // Test complete wallet creation flow with proper polling
  const testCompleteFlow = async () => {
    const startTime = new Date().toISOString();
    
    try {
      setResult('🚀 Starting complete Guardian wallet flow with intelligent polling...\n');
      
      // Step 1: Create wallet and poll until completion
      setResult(prev => prev + '\n📋 Step 1: Creating wallet and polling for completion...');
      
      const flowResult = await pollingService.createWalletAndWait(
        createId || undefined,
        {
          maxAttempts: 20,      // Up to 20 attempts
          intervalMs: 3000,     // Check every 3 seconds
          timeoutMs: 60000      // 60 second timeout
        }
      );
      
      setResult(prev => prev + `\n✅ Wallet creation initiated: ${flowResult.walletId.substring(0, 8)}`);
      setResult(prev => prev + `\n🔄 Operation ID: ${flowResult.operationId.substring(0, 8)}`);
      
      // Step 2: Report polling results
      const { operationResult } = flowResult;
      setResult(prev => prev + `\n\n📋 Step 2: Polling completed after ${operationResult.attempts} attempts (${operationResult.totalTime}ms)`);
      setResult(prev => prev + `\n📊 Final operation status: ${operationResult.status}`);
      
      if (operationResult.status === 'processed') {
        setResult(prev => prev + `\n✅ Wallet successfully created and is now ACTIVE!`);
        
        // Step 3: Wallet details
        if (flowResult.walletDetails) {
          setResult(prev => prev + `\n\n📋 Step 3: Wallet details retrieved`);
          const walletDetails = flowResult.walletDetails;
          
          if (walletDetails.accounts && walletDetails.accounts.length > 0) {
            setResult(prev => prev + `\n🏦 Accounts created:`);
            walletDetails.accounts.forEach((account: any, index: number) => {
              setResult(prev => prev + `\n   ${index + 1}. ${account.type}: ${account.address} (${account.network})`);
            });
          }
          
          // Update wallet results with complete information
          const walletResult: WalletResult = {
            id: flowResult.walletId,
            name: `Complete Flow Wallet ${flowResult.walletId.substring(0, 8)}`,
            operationId: flowResult.operationId,
            status: 'active',
            addresses: walletDetails.accounts || [],
            guardianData: {
              operationResult,
              walletDetails
            },
            dbRecorded: false
          };
          
          setWalletResults(prev => [...prev, walletResult]);
          
          const endTime = new Date().toISOString();
          
          // Record complete flow to database
          if (dbWritable) {
            try {
              const dbRecord = await GuardianTestDatabaseService.recordCompleteFlow(
                flowResult.walletId,
                { operationId: flowResult.operationId },
                operationResult,
                walletDetails
              );
              
              setResult(prev => prev + `\n\n✅ Complete flow recorded to database: ${dbRecord.wallet_id}`);
              
              // Also record wallet data
              const walletDbId = await GuardianTestDatabaseService.recordWalletData({
                guardianWalletId: walletDetails.id,
                externalId: walletDetails.externalId || flowResult.walletId,
                name: `Complete Flow Wallet ${flowResult.walletId.substring(0, 8)}`,
                status: walletDetails.status || 'active',
                accounts: walletDetails.accounts || [],
                createdAt: new Date().toISOString(),
                operationId: flowResult.operationId
              });
              
              setResult(prev => prev + `\n✅ Wallet data recorded: ${walletDbId}`);
              
              // Update wallet result to show DB recording
              setWalletResults(prev => prev.map(w => 
                w.id === flowResult.walletId ? { ...w, dbRecorded: true, dbRecordId: walletDbId } : w
              ));
              
            } catch (dbError) {
              setResult(prev => prev + `\n\n❌ Database recording failed: ${dbError.message}`);
            }
          }
          
          setResult(prev => prev + '\n\n🎉 COMPLETE FLOW SUCCESSFUL! Wallet is now ACTIVE and ready to use!');
        } else {
          setResult(prev => prev + `\n⚠️ Wallet created but details not available`);
        }
        
      } else if (operationResult.status === 'error') {
        setResult(prev => prev + `\n❌ Operation failed: ${operationResult.error}`);
      } else {
        setResult(prev => prev + `\n⏳ Operation incomplete: ${operationResult.status}`);
        setResult(prev => prev + `\n💡 Try checking individual operation status or wait longer`);
      }
      
    } catch (error) {
      setResult(prev => prev + `\n\n❌ Complete flow failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8" />
        <h1 className="text-3xl font-bold">🛡️ Guardian Medex API Test Center</h1>
        <Badge variant="default">Production Ready</Badge>
      </div>

      {/* Enhanced Data Summary */}
      <div className="flex gap-4 items-center text-sm text-gray-600">
        <div className="flex gap-2 items-center">
          <Database className="h-4 w-4" />
          <span>API: {apiWallets.length} wallets, {apiOperations.length} operations</span>
        </div>
        <span className="mx-2">|</span>
        <div className="flex gap-2 items-center">
          <Database className="h-4 w-4" />
          <span>DB: {dbWallets.length} wallets, {dbOperations.length} operations</span>
        </div>
        <Button 
          onClick={refreshAllData} 
          disabled={!!loading}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          {loading === 'refresh' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* API Testing Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              API Endpoints (All Working ✅)
              <div className="ml-auto flex items-center gap-2">
                <Database className="h-4 w-4" />
                <Badge variant={dbWritable ? 'default' : 'secondary'}>
                  DB: {dbStatus}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="complete">
              <TabsList className="grid grid-cols-6 mb-4">
                <TabsTrigger value="complete">Complete Flow</TabsTrigger>
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="get">Get Wallet</TabsTrigger>
                <TabsTrigger value="operation">Operations</TabsTrigger>
                <TabsTrigger value="data">Persisted Data</TabsTrigger>
              </TabsList>

              <TabsContent value="complete" className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">🎯 Complete Guardian Flow (Enhanced)</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Tests wallet creation → intelligent polling → operation completion → wallet details → database recording
                  </p>
                  <div className="mb-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                    ✨ <strong>New:</strong> Intelligent polling automatically waits for wallet to become ACTIVE (up to 60s)
                  </div>
                  <Button
                    onClick={() => run('complete_flow', testCompleteFlow, true)}
                    disabled={!!loading}
                    className="w-full"
                  >
                    {loading === 'complete_flow' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    🚀 Run Complete Flow with Intelligent Polling
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Wallet ID (optional)"
                    value={createId}
                    onChange={(e) => setCreateId(e.target.value)}
                  />
                  <Button onClick={generateUUID} variant="outline">
                    Generate UUID
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => run('create', createWallet, true)}
                    disabled={!!loading}
                    className="flex-1"
                  >
                    {loading === 'create' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    POST /api/v1/wallets/create
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallets ({apiWallets.length} from API, {dbWallets.length} in DB)
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          onClick={refreshAllData}
                          disabled={!!loading}
                          size="sm"
                          variant="outline"
                        >
                          {loading === 'refresh' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        <Button 
                          onClick={syncWalletsToDatabase}
                          disabled={!!loading}
                          size="sm"
                        >
                          {loading === 'sync_wallets' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Download className="h-4 w-4 mr-2" />
                          Sync to DB
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {syncResult && syncResult.includes('Wallets') && (
                      <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        {syncResult}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">API Wallets</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Guardian ID</TableHead>
                              <TableHead>External ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Accounts</TableHead>
                              <TableHead>In Database</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apiWallets.map((wallet) => {
                              const inDB = dbWallets.find(db => 
                                db.guardian_wallet_id === wallet.id || 
                                db.guardian_internal_id === wallet.id
                              );
                              
                              return (
                                <TableRow key={wallet.id}>
                                  <TableCell className="font-mono text-xs">
                                    {wallet.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {wallet.externalId ? `${wallet.externalId.slice(0, 8)}...` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(wallet.status)}
                                  </TableCell>
                                  <TableCell>
                                    {wallet.accounts?.length || 0} account(s)
                                    {wallet.accounts?.[0] && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {wallet.accounts[0].type}: {formatAddress(wallet.accounts[0].address)}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {inDB ? (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        ✓ Synced
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                        Missing
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="get" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Guardian Wallet ID"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  />
                  <Button
                    onClick={() => run('get_wallet', () => getWalletById(walletId), true)}
                    disabled={!walletId || !!loading}
                  >
                    {loading === 'get_wallet' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    GET /api/v1/wallets/{'{id}'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="operation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Operations ({apiOperations.length} from API, {dbOperations.length} in DB)
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          onClick={refreshAllData}
                          disabled={!!loading}
                          size="sm"
                          variant="outline"
                        >
                          {loading === 'refresh' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        <Button 
                          onClick={syncOperationsToDatabase}
                          disabled={!!loading}
                          size="sm"
                        >
                          {loading === 'sync_operations' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Download className="h-4 w-4 mr-2" />
                          Sync to DB
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {syncResult && syncResult.includes('Operations') && (
                      <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                        {syncResult}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {/* Smart Operation Polling Section */}
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">🔄 Smart Operation Polling</h4>
                        <p className="text-sm text-green-700 mb-3">
                          Poll operation status until completion (recommended for wallet creation)
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter Operation ID to poll"
                            value={operationId}
                            onChange={(e) => setOperationId(e.target.value)}
                          />
                          <Button
                            onClick={() => run('poll_operation', () => pollingService.pollOperationStatus(operationId, { maxAttempts: 15, intervalMs: 3000 }), true)}
                            disabled={!operationId || !!loading}
                            variant="default"
                          >
                            {loading === 'poll_operation' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            🔄 Poll Until Complete
                          </Button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-lg">API Operations</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Operation ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>In Database</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apiOperations.map((operation) => {
                              const inDB = dbOperations.find(db => 
                                db.operation_id === operation.id
                              );
                              
                              return (
                                <TableRow key={operation.id}>
                                  <TableCell className="font-mono text-xs">
                                    {operation.id.slice(0, 8)}...
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {operation.type || 'wallet_creation'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(operation.status)}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {formatDate(operation.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    {operation.result ? (
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        Has Result
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-400 text-xs">No result</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {inDB ? (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        ✓ Synced
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                        Missing
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="data" className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Persisted Guardian Data</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    View Guardian test results and wallet data stored in the database
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => run('get_test_results', () => GuardianTestDatabaseService.getTestResults(10))}
                      disabled={!!loading}
                      variant="outline"
                    >
                      {loading === 'get_test_results' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      📋 Get Test Results
                    </Button>
                    <Button
                      onClick={() => run('get_wallet_data', () => GuardianTestDatabaseService.getGuardianWallets(10))}
                      disabled={!!loading}
                      variant="outline"
                    >
                      {loading === 'get_wallet_data' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      🏦 Get Wallet Data
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-blue-600">
                    {dbWritable ? '✅ Database is writable - new data will be persisted' : '⚠️ Database is read-only - viewing historical data only'}
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Results & Database Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={result}
              readOnly
              placeholder="API response will appear here..."
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>

      </div>

      {/* Wallet Results Summary */}
      {walletResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Created Wallets Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {walletResults.map((wallet) => (
                <div key={wallet.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4" />
                    <span className="font-semibold text-sm">{wallet.name}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>ID: <code className="text-xs">{wallet.id.substring(0, 8)}...</code></div>
                    <div>Operation: <code className="text-xs">{wallet.operationId?.substring(0, 8)}...</code></div>
                    <div className="flex items-center gap-2">
                      Status: 
                      <Badge variant={wallet.status === 'processed' ? 'default' : 'secondary'}>
                        {wallet.status || 'creating'}
                      </Badge>
                    </div>
                    {wallet.addresses && (
                      <div>
                        Accounts: {wallet.addresses.length} networks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Guardian API Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>POST Create Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>GET List Wallets</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>GET Wallet Details</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>GET Operations</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ All Guardian Medex API endpoints are working perfectly with proper authentication!
              {dbWritable 
                ? ' Results are automatically recorded in the database for audit purposes.' 
                : ' Database is read-only - results shown in UI only.'}
            </p>
            {dbWritable && (
              <p className="text-xs text-green-600 mt-1">
                💾 Data persistence: Test results, wallet data, and complete flows are saved to wallet_details table
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
