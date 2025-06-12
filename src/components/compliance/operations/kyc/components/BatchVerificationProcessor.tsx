import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Download, Upload, FileText } from "lucide-react";
import { VerificationProviderFactory } from '../services/verificationProviderAdapter';
import { useToast } from "@/components/ui/use-toast";
import Papa from 'papaparse';
import type { ComplianceCheck } from '../../types';

interface InvestorVerificationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: ComplianceCheck;
  error?: string;
}

interface BatchVerificationProcessorProps {
  onComplete: (results: ComplianceCheck[]) => void;
  onError: (error: Error) => void;
}

export const BatchVerificationProcessor: React.FC<BatchVerificationProcessorProps> = ({
  onComplete,
  onError,
}) => {
  const [provider, setProvider] = useState<'onfido' | 'idenfy'>('onfido');
  const [apiConfig, setApiConfig] = useState<Record<string, string>>({
    apiToken: '',
    webhookToken: '',
    region: 'us'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investors, setInvestors] = useState<InvestorVerificationData[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<ComplianceCheck[]>([]);

  const { toast } = useToast();

  // Update API config fields
  const handleConfigChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiConfig(prev => ({ ...prev, [field]: event.target.value }));
  };

  // Handle provider change
  const handleProviderChange = (value: string) => {
    const providerType = value as 'onfido' | 'idenfy';
    setProvider(providerType);
    
    // Reset API config fields based on provider
    if (providerType === 'onfido') {
      setApiConfig({
        apiToken: '',
        webhookToken: '',
        region: 'us'
      });
    } else {
      setApiConfig({
        apiKey: '',
        apiSecret: '',
        baseUrl: 'https://ivs.idenfy.com/api/v2'
      });
    }
  };

  // Configure the verification provider
  const configureProvider = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate configuration
      if (provider === 'onfido') {
        if (!apiConfig.apiToken) {
          throw new Error('API Token is required');
        }
      } else { // idenfy
        if (!apiConfig.apiKey || !apiConfig.apiSecret) {
          throw new Error('API Key and API Secret are required');
        }
      }
      
      // Create a test adapter to validate configuration
      VerificationProviderFactory.createProvider(provider, apiConfig as any);
      
      setIsConfigured(true);
      toast({
        title: "Provider configured",
        description: `${provider === 'onfido' ? 'Onfido' : 'Idenfy'} provider has been successfully configured.`,
      });
    } catch (err) {
      console.error('Error configuring provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to configure verification provider');
      toast({
        variant: "destructive",
        title: "Configuration failed",
        description: err instanceof Error ? err.message : 'Failed to configure verification provider',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData: InvestorVerificationData[] = results.data.map((row: any, index: number) => ({
            id: row.id || `investor-${index}`,
            firstName: row.firstName || row.first_name || '',
            lastName: row.lastName || row.last_name || '',
            email: row.email || '',
            dateOfBirth: row.dateOfBirth || row.date_of_birth || '',
            status: 'pending'
          }));
          
          if (parsedData.length === 0) {
            setError('No valid records found in the CSV file');
            return;
          }
          
          // Validate that we have the minimum required fields
          const invalidRows = parsedData.filter(investor => 
            !investor.firstName || !investor.lastName || !investor.email
          );
          
          if (invalidRows.length > 0) {
            setError(`${invalidRows.length} records are missing required fields (firstName, lastName, email)`);
            return;
          }
          
          setInvestors(parsedData);
          toast({
            title: "File uploaded",
            description: `Successfully loaded ${parsedData.length} investors.`,
          });
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setError('Failed to parse CSV file: ' + error.message);
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: 'Failed to parse CSV file: ' + error.message,
          });
        }
      });
    } catch (err) {
      console.error('File reading error:', err);
      setError('Failed to read file');
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: 'Failed to read file',
      });
    }
  };

  // Start batch processing
  const startProcessing = async () => {
    if (investors.length === 0) {
      setError('No investors to process');
      return;
    }
    
    setIsProcessing(true);
    setCurrentIndex(0);
    setProgress(0);
    setCompletedChecks([]);
    setError(null);
  };

  // Process a single investor
  const processSingleInvestor = async (investor: InvestorVerificationData, index: number) => {
    try {
      // Update status to in_progress
      setInvestors(prev => prev.map((inv, i) => 
        i === index ? { ...inv, status: 'in_progress' } : inv
      ));
      
      // Create adapter
      const adapter = VerificationProviderFactory.createProvider(provider, apiConfig as any);
      
      // Create applicant
      const applicant = await adapter.createApplicant({
        firstName: investor.firstName,
        lastName: investor.lastName,
        email: investor.email,
        dateOfBirth: investor.dateOfBirth
      });
      
      // Start verification process
      const verificationResult = await adapter.startVerification(applicant.id, true);
      
      // Store result to Supabase
      const storedResult = await adapter.storeResult({
        type: 'KYC',
        status: 'PENDING',
        applicantId: applicant.id,
        id: verificationResult.id || `${provider}-${Date.now()}`,
        investorId: investor.id,
        provider: provider,
        details: {
          ...verificationResult,
          name: `${investor.firstName} ${investor.lastName}`,
          email: investor.email
        }
      });
      
      // Create compliance check
      const complianceCheck = VerificationProviderFactory.createComplianceCheck(
        provider,
        'KYC',
        storedResult,
        investor.id
      );
      
      // Update investor status and result
      setInvestors(prev => prev.map((inv, i) => 
        i === index ? { 
          ...inv, 
          status: 'completed',
          result: complianceCheck
        } : inv
      ));
      
      // Add to completed checks
      setCompletedChecks(prev => [...prev, complianceCheck]);
      
      return complianceCheck;
    } catch (err) {
      console.error(`Error processing investor ${investor.id}:`, err);
      
      // Update investor status and error
      setInvestors(prev => prev.map((inv, i) => 
        i === index ? { 
          ...inv, 
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error'
        } : inv
      ));
      
      throw err;
    }
  };

  // Effect to handle batch processing
  useEffect(() => {
    if (!isProcessing || currentIndex < 0 || currentIndex >= investors.length) return;
    
    const processCurrentInvestor = async () => {
      try {
        await processSingleInvestor(investors[currentIndex], currentIndex);
        
        // Update progress
        const newProgress = Math.round((currentIndex + 1) / investors.length * 100);
        setProgress(newProgress);
        
        // Move to next investor or complete
        if (currentIndex + 1 < investors.length) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Complete processing
          setIsProcessing(false);
          toast({
            title: "Processing complete",
            description: `Successfully processed ${investors.length} investors.`,
          });
          
          if (completedChecks.length > 0) {
            onComplete(completedChecks);
          }
        }
      } catch (err) {
        console.error('Error in batch processing:', err);
        
        // Still move to next investor
        const newProgress = Math.round((currentIndex + 1) / investors.length * 100);
        setProgress(newProgress);
        
        if (currentIndex + 1 < investors.length) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Complete processing
          setIsProcessing(false);
          toast({
            variant: "destructive",
            title: "Processing complete with errors",
            description: `Completed with ${investors.filter(i => i.status === 'failed').length} errors.`,
          });
          
          if (completedChecks.length > 0) {
            onComplete(completedChecks);
          }
        }
      }
    };
    
    processCurrentInvestor();
  }, [isProcessing, currentIndex, investors]);

  // Export results to CSV
  const exportResults = () => {
    if (investors.length === 0) return;
    
    const csvData = investors.map(investor => ({
      id: investor.id,
      firstName: investor.firstName,
      lastName: investor.lastName,
      email: investor.email,
      status: investor.status,
      result: investor.result?.status || 'N/A',
      checkId: investor.result?.id || 'N/A',
      error: investor.error || 'N/A'
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `verification-results-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status?: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'in_progress':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Batch Verification Processor</CardTitle>
        <CardDescription>
          Process multiple identity verifications at once using CSV upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConfigured ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Verification Provider</Label>
              <Select
                value={provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onfido">Onfido</SelectItem>
                  <SelectItem value="idenfy">Idenfy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {provider === 'onfido' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    value={apiConfig.apiToken || ''}
                    onChange={handleConfigChange('apiToken')}
                    placeholder="Enter your Onfido API token"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookToken">Webhook Token (Optional)</Label>
                  <Input
                    id="webhookToken"
                    value={apiConfig.webhookToken || ''}
                    onChange={handleConfigChange('webhookToken')}
                    placeholder="Enter your webhook token if you have one"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={apiConfig.region}
                    onValueChange={(value) => setApiConfig(prev => ({ ...prev, region: value }))}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">US</SelectItem>
                      <SelectItem value="eu">EU</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiConfig.apiKey || ''}
                    onChange={handleConfigChange('apiKey')}
                    placeholder="Enter your Idenfy API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={apiConfig.apiSecret || ''}
                    onChange={handleConfigChange('apiSecret')}
                    placeholder="Enter your Idenfy API secret"
                  />
                </div>
              </>
            )}
            
            <Button 
              onClick={configureProvider}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Configuring...
                </>
              ) : (
                'Configure Provider'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                Upload a CSV file with the following columns: id, firstName, lastName, email, and dateOfBirth (optional)
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4">
              <Label htmlFor="csvFile">Upload Investor Data</Label>
              <Input 
                id="csvFile" 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </div>
            
            {investors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Investors ({investors.length})</h3>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportResults}
                      disabled={isProcessing}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>
                    <Button
                      onClick={startProcessing}
                      disabled={isProcessing}
                      size="sm"
                    >
                      {isProcessing ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        'Start Processing'
                      )}
                    </Button>
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: {progress}%</span>
                      <span>{currentIndex + 1} of {investors.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Result/Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investors.map((investor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {investor.firstName} {investor.lastName}
                          </TableCell>
                          <TableCell>{investor.email}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(investor.status)}>
                              {investor.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {investor.status === 'failed' ? (
                              <span className="text-red-500 text-sm">{investor.error}</span>
                            ) : investor.result ? (
                              <span className="text-green-500 text-sm">
                                Check ID: {investor.result.id.substring(0, 8)}...
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setIsConfigured(false);
            setInvestors([]);
            setError(null);
          }}
          disabled={isProcessing}
        >
          Change Provider
        </Button>
        
        {isConfigured && completedChecks.length > 0 && (
          <Button 
            variant="default"
            onClick={() => onComplete(completedChecks)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finish Process
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BatchVerificationProcessor;