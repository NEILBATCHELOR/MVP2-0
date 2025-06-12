import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download, FileUp, RefreshCw, Search, Shield, X } from "lucide-react";
import { AMLService } from '../services/amlService';
import type { AMLCheck } from '@/types/domain/identity/onfido';

interface BatchAMLCheckProps {
  onComplete?: (results: Record<string, AMLCheck>) => void;
}

interface InvestorData {
  investorId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  email?: string;
}

export const BatchAMLCheck: React.FC<BatchAMLCheckProps> = ({
  onComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [batchResults, setBatchResults] = useState<Record<string, AMLCheck>>({});
  const [progress, setProgress] = useState({ total: 0, processed: 0 });
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [checkType, setCheckType] = useState<'sanction' | 'pep' | 'adverse_media' | 'full'>('sanction');
  const [provider, setProvider] = useState<'onfido' | 'refinitiv' | 'complyadvantage'>('onfido');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);

  // Poll for batch results
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (batchId && batchStatus === 'processing' && isPolling) {
      interval = setInterval(checkBatchStatus, 3000);
    }
    
    return () => clearInterval(interval);
  }, [batchId, batchStatus, isPolling]);

  const runBatchCheck = async () => {
    if (investors.length === 0) {
      setError('No investors to process');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchResults({});

    try {
      const amlService = AMLService.getInstance();
      
      const result = await amlService.runBatchAMLCheck(
        investors,
        {
          checkType,
          provider
        }
      );
      
      setBatchId(result.batchId);
      setProgress({ total: result.totalInvestors, processed: 0 });
      setBatchStatus('processing');
      setIsPolling(true);
      
    } catch (err) {
      console.error('Batch AML check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run batch AML check');
      setBatchStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkBatchStatus = async () => {
    if (!batchId) return;
    
    try {
      const amlService = AMLService.getInstance();
      const result = await amlService.getBatchAMLCheckResults(batchId);
      
      setProgress({
        total: result.totalInvestors,
        processed: result.processedInvestors
      });
      
      if (result.status === 'completed') {
        setBatchStatus('completed');
        setIsPolling(false);
        
        if (result.results) {
          setBatchResults(result.results);
          if (onComplete) onComplete(result.results);
        }
      } else if (result.status === 'failed') {
        setBatchStatus('failed');
        setIsPolling(false);
        setError('Batch processing failed');
      }
    } catch (err) {
      console.error('Error checking batch status:', err);
      // Don't stop polling on transient errors
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvUploadError(null);
    
    // Read CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Check required columns
        const requiredColumns = ['investorId', 'firstName', 'lastName'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setCsvUploadError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }
        
        // Parse CSV data
        const parsedInvestors: InvestorData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const investor: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            investor[header] = values[index] || '';
          });
          
          if (investor.investorId && investor.firstName && investor.lastName) {
            parsedInvestors.push({
              investorId: investor.investorId,
              firstName: investor.firstName,
              lastName: investor.lastName,
              dateOfBirth: investor.dateOfBirth,
              nationality: investor.nationality,
              email: investor.email
            });
          }
        }
        
        if (parsedInvestors.length === 0) {
          setCsvUploadError('No valid investor records found in CSV');
          return;
        }
        
        setInvestors(parsedInvestors);
        
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setCsvUploadError('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const resetBatch = () => {
    setBatchId(null);
    setBatchStatus('idle');
    setBatchResults({});
    setProgress({ total: 0, processed: 0 });
    setIsPolling(false);
    setError(null);
  };

  const downloadCsvTemplate = () => {
    const headers = "investorId,firstName,lastName,dateOfBirth,nationality,email\n";
    const exampleRow = "INV-001,John,Doe,1980-01-01,US,john.doe@example.com\n";
    const csvContent = headers + exampleRow;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aml_check_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const exportResults = () => {
    // Convert results to CSV
    const headers = "investorId,firstName,lastName,result,status,checkType\n";
    let csvContent = headers;
    
    investors.forEach(investor => {
      const result = batchResults[investor.investorId];
      if (result) {
        csvContent += `${investor.investorId},${investor.firstName},${investor.lastName},${result.result || ''},${result.status},${result.checkType}\n`;
      } else {
        csvContent += `${investor.investorId},${investor.firstName},${investor.lastName},not_processed,pending,${checkType}\n`;
      }
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aml_batch_results_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const renderResultBadge = (result?: 'match' | 'no_match' | 'possible_match') => {
    if (!result) return null;
    
    switch (result) {
      case 'no_match':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Clear
          </Badge>
        );
      case 'match':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Match
          </Badge>
        );
      case 'possible_match':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Review Required
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch AML Checks</CardTitle>
        <CardDescription>
          Process multiple investors at once for efficient AML screening
        </CardDescription>
      </CardHeader>
      <CardContent>
        {batchStatus === 'idle' && (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Upload Investor Data (CSV)</Label>
                <div className="flex items-center gap-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input 
                      id="csv-upload" 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      CSV must include investorId, firstName, and lastName columns
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCsvTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>
                
                {csvUploadError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{csvUploadError}</AlertDescription>
                  </Alert>
                )}
                
                {investors.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {investors.length} investors loaded from CSV
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check Type</Label>
                  <Select value={checkType} onValueChange={(value) => setCheckType(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select check type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Check Types</SelectLabel>
                        <SelectItem value="sanction">Sanctions</SelectItem>
                        <SelectItem value="pep">PEPs</SelectItem>
                        <SelectItem value="adverse_media">Adverse Media</SelectItem>
                        <SelectItem value="full">Full Check</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={provider} onValueChange={(value) => setProvider(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Providers</SelectLabel>
                        <SelectItem value="onfido">Onfido</SelectItem>
                        <SelectItem value="refinitiv">Refinitiv</SelectItem>
                        <SelectItem value="complyadvantage">ComplyAdvantage</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={runBatchCheck}
                  disabled={isLoading || investors.length === 0}
                  className="w-full max-w-xs"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Submitting Batch...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Run Batch AML Check
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
        
        {batchStatus === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <Spinner size="lg" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Processing Batch</h3>
              <p className="text-muted-foreground">
                Checking {progress.total} investors...
              </p>
              <div className="w-full max-w-xs h-2 bg-muted rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ 
                    width: `${progress.processed / Math.max(progress.total, 1) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progress.processed} of {progress.total} processed
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsPolling(prev => !prev)}>
              {isPolling ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </>
              )}
            </Button>
          </div>
        )}
        
        {batchStatus === 'completed' && Object.keys(batchResults).length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Batch Complete
                </h3>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(batchResults).length} investors processed
                </p>
              </div>
              <Button variant="outline" onClick={exportResults}>
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((investor) => {
                    const result = batchResults[investor.investorId];
                    return (
                      <TableRow key={investor.investorId}>
                        <TableCell className="font-mono">{investor.investorId}</TableCell>
                        <TableCell>{investor.firstName} {investor.lastName}</TableCell>
                        <TableCell>{result?.checkType || checkType}</TableCell>
                        <TableCell>
                          {result ? renderResultBadge(result.result) : (
                            <Badge variant="outline">Not Processed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Search className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        
        {batchStatus === 'failed' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <X className="h-16 w-16 text-red-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Batch Processing Failed</h3>
              {error && <p className="text-muted-foreground">{error}</p>}
            </div>
          </div>
        )}
        
        {error && batchStatus !== 'failed' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {(batchStatus === 'completed' || batchStatus === 'failed') && (
        <CardFooter className="flex justify-center border-t pt-6">
          <Button variant="outline" onClick={resetBatch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Batch
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BatchAMLCheck;