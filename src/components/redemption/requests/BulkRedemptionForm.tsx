'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Download, 
  X, 
  Users,
  FileSpreadsheet,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/utils';
import { 
  BulkRedemptionData, 
  BulkInvestorData,
  RedemptionRequest 
} from '../types';
import { useRedemptions } from '../hooks';

// Form validation schema
const bulkRedemptionFormSchema = z.object({
  tokenType: z.enum(['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-1400', 'ERC-3525', 'ERC-4626']),
  redemptionType: z.enum(['standard', 'interval']),
  conversionRate: z.number().min(0, 'Conversion rate must be positive'),
  notes: z.string().optional()
});

type BulkRedemptionFormData = z.infer<typeof bulkRedemptionFormSchema>;

interface BulkRedemptionFormProps {
  onSuccess?: (redemptions: RedemptionRequest[]) => void;
  onCancel?: () => void;
  className?: string;
}

interface InvestorFormData {
  investorId: string;
  investorName: string;
  distributionId: string;
  tokenAmount: number;
  sourceWallet: string;
  destinationWallet: string;
}

export const BulkRedemptionForm: React.FC<BulkRedemptionFormProps> = ({
  onSuccess,
  onCancel,
  className
}) => {
  // Hooks
  const { createBulkRedemption, loading: submitting } = useRedemptions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<BulkRedemptionFormData>({
    resolver: zodResolver(bulkRedemptionFormSchema),
    defaultValues: {
      tokenType: 'ERC-20',
      redemptionType: 'standard',
      conversionRate: 1.0,
      notes: ''
    }
  });

  // State
  const [investors, setInvestors] = useState<InvestorFormData[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<Set<number>>(new Set());
  const [csvError, setCsvError] = useState<string | null>(null);
  const [estimatedTotal, setEstimatedTotal] = useState<number>(0);

  // Watch form values for calculations
  const { conversionRate } = form.watch();

  // Calculate estimated total when data changes
  React.useEffect(() => {
    const total = investors.reduce((sum, investor) => sum + investor.tokenAmount, 0) * (conversionRate || 0);
    setEstimatedTotal(total);
  }, [investors, conversionRate]);

  // Add new investor manually
  const addInvestor = () => {
    setInvestors(prev => [...prev, {
      investorId: '',
      investorName: '',
      distributionId: '',
      tokenAmount: 0,
      sourceWallet: '',
      destinationWallet: ''
    }]);
  };

  // Remove investor
  const removeInvestor = (index: number) => {
    setInvestors(prev => prev.filter((_, i) => i !== index));
    setSelectedInvestors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // Update investor data
  const updateInvestor = (index: number, field: keyof InvestorFormData, value: string | number) => {
    setInvestors(prev => prev.map((investor, i) => 
      i === index ? { ...investor, [field]: value } : investor
    ));
  };

  // Select/deselect investor
  const toggleInvestorSelection = (index: number) => {
    setSelectedInvestors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Select all investors
  const selectAllInvestors = (checked: boolean) => {
    if (checked) {
      setSelectedInvestors(new Set(investors.map((_, index) => index)));
    } else {
      setSelectedInvestors(new Set());
    }
  };

  // Remove selected investors
  const removeSelectedInvestors = () => {
    const selectedIndices = Array.from(selectedInvestors).sort((a, b) => b - a);
    let newInvestors = [...investors];
    selectedIndices.forEach(index => {
      newInvestors.splice(index, 1);
    });
    setInvestors(newInvestors);
    setSelectedInvestors(new Set());
  };

  // Handle CSV upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError('CSV file must contain a header row and at least one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['investorId', 'investorName', 'distributionId', 'tokenAmount', 'sourceWallet', 'destinationWallet'];
        
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          setCsvError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const newInvestors: InvestorFormData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Incorrect number of columns`);
            continue;
          }

          const investor: InvestorFormData = {
            investorId: '',
            investorName: '',
            distributionId: '',
            tokenAmount: 0,
            sourceWallet: '',
            destinationWallet: ''
          };

          headers.forEach((header, index) => {
            const value = values[index];
            switch (header) {
              case 'tokenAmount':
                const amount = parseFloat(value);
                if (isNaN(amount) || amount <= 0) {
                  errors.push(`Row ${i + 1}: Invalid token amount`);
                } else {
                  investor.tokenAmount = amount;
                }
                break;
              case 'investorId':
              case 'investorName':
              case 'distributionId':
              case 'sourceWallet':
              case 'destinationWallet':
                if (!value) {
                  errors.push(`Row ${i + 1}: Missing ${header}`);
                } else {
                  investor[header] = value;
                }
                break;
            }
          });

          if (investor.investorId && investor.tokenAmount > 0) {
            newInvestors.push(investor);
          }
        }

        if (errors.length > 0) {
          setCsvError(`CSV validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        }

        if (newInvestors.length > 0) {
          setInvestors(prev => [...prev, ...newInvestors]);
        }

      } catch (error) {
        setCsvError('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['investorId', 'investorName', 'distributionId', 'tokenAmount', 'sourceWallet', 'destinationWallet'];
    const sampleData = [
      'INV001,John Doe,DIST001,1000,0x1234...,0x5678...',
      'INV002,Jane Smith,DIST002,2500,0x9abc...,0xdef0...'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-redemption-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle form submission
  const onSubmit = async (data: BulkRedemptionFormData) => {
    try {
      if (investors.length === 0) {
        form.setError('root', { message: 'Please add at least one investor' });
        return;
      }

      // Validate investor data
      const invalidInvestors = investors.filter(inv => 
        !inv.investorId || !inv.distributionId || inv.tokenAmount <= 0 || !inv.sourceWallet || !inv.destinationWallet
      );

      if (invalidInvestors.length > 0) {
        form.setError('root', { message: 'Please complete all investor information' });
        return;
      }

      const totalTokenAmount = investors.reduce((sum, inv) => sum + inv.tokenAmount, 0);
      
      const bulkData: BulkRedemptionData = {
        tokenType: data.tokenType,
        redemptionType: data.redemptionType,
        conversionRate: data.conversionRate,
        totalAmount: totalTokenAmount,
        investors: investors.map(inv => ({
          investorId: inv.investorId,
          investorName: inv.investorName,
          tokenAmount: inv.tokenAmount,
          walletAddress: inv.destinationWallet,
          distributionId: inv.distributionId,
          sourceWallet: inv.sourceWallet,
          destinationWallet: inv.destinationWallet,
          usdcAmount: inv.tokenAmount * (data.conversionRate || 1)
        }))
      };

      const redemptions = await createBulkRedemption(bulkData);
      
      if (redemptions) {
        onSuccess?.(redemptions);
        form.reset();
        setInvestors([]);
        setSelectedInvestors(new Set());
      }
    } catch (error) {
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to create bulk redemption' 
      });
    }
  };

  return (
    <Card className={cn('w-full max-w-6xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Redemption Request
        </CardTitle>
        <CardDescription>
          Submit redemption requests for multiple investors simultaneously. 
          You can add investors manually or upload a CSV file. All requests will use the same token standard, redemption type, and conversion rate.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Common Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Common Settings</CardTitle>
                <CardDescription>
                  These settings will apply to all redemption requests in this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="tokenType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Standard</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ERC-20">ERC-20 (Fungible)</SelectItem>
                            <SelectItem value="ERC-721">ERC-721 (NFT)</SelectItem>
                            <SelectItem value="ERC-1155">ERC-1155 (Multi-Token)</SelectItem>
                            <SelectItem value="ERC-1400">ERC-1400 (Security Token)</SelectItem>
                            <SelectItem value="ERC-3525">ERC-3525 (Semi-Fungible)</SelectItem>
                            <SelectItem value="ERC-4626">ERC-4626 (Vault)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redemptionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redemption Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard (Immediate)</SelectItem>
                            <SelectItem value="interval">Interval Fund (Periodic)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conversionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversion Rate (Token to USDC)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="1.000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Batch Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information for this bulk redemption batch..."
                          className="resize-none"
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Investor Management */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Investors</CardTitle>
                    <CardDescription>
                      Add investors manually or upload a CSV file
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInvestor}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Investor
                    </Button>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />

                {/* CSV Error */}
                {csvError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-line">
                      {csvError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>

              <CardContent>
                {investors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No investors added yet</p>
                    <p className="text-sm mb-4">
                      Add investors manually or upload a CSV file to get started
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button type="button" variant="outline" onClick={addInvestor}>
                        Add Manually
                      </Button>
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Upload CSV
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bulk Actions */}
                    {selectedInvestors.size > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
                        <span className="text-sm font-medium">
                          {selectedInvestors.size} investor(s) selected
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeSelectedInvestors}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Selected
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvestors(new Set())}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}

                    {/* Investors Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedInvestors.size === investors.length && investors.length > 0}
                                onCheckedChange={selectAllInvestors}
                              />
                            </TableHead>
                            <TableHead>Investor ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Distribution ID</TableHead>
                            <TableHead>Token Amount</TableHead>
                            <TableHead>Source Wallet</TableHead>
                            <TableHead>Destination Wallet</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {investors.map((investor, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedInvestors.has(index)}
                                  onCheckedChange={() => toggleInvestorSelection(index)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={investor.investorId}
                                  onChange={(e) => updateInvestor(index, 'investorId', e.target.value)}
                                  placeholder="INV001"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={investor.investorName}
                                  onChange={(e) => updateInvestor(index, 'investorName', e.target.value)}
                                  placeholder="John Doe"
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={investor.distributionId}
                                  onChange={(e) => updateInvestor(index, 'distributionId', e.target.value)}
                                  placeholder="DIST001"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={investor.tokenAmount}
                                  onChange={(e) => updateInvestor(index, 'tokenAmount', parseFloat(e.target.value) || 0)}
                                  placeholder="1000"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={investor.sourceWallet}
                                  onChange={(e) => updateInvestor(index, 'sourceWallet', e.target.value)}
                                  placeholder="0x..."
                                  className="w-32 font-mono text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={investor.destinationWallet}
                                  onChange={(e) => updateInvestor(index, 'destinationWallet', e.target.value)}
                                  placeholder="0x..."
                                  className="w-32 font-mono text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInvestor(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {investors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Batch Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{investors.length}</div>
                      <div className="text-sm text-muted-foreground">Investors</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {investors.reduce((sum, inv) => sum + inv.tokenAmount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Tokens</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{conversionRate || 0}</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        ${estimatedTotal.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">Estimated USDC Value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Errors */}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting || investors.length === 0}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating {investors.length} Requests...
                  </>
                ) : (
                  `Create ${investors.length} Redemption Requests`
                )}
              </Button>
              
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};