// Global redemption request form for creating redemption requests with open access
// Provides form interface for global redemption submission

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Send, Calculator } from 'lucide-react';
import { globalRedemptionService } from '../services/globalRedemptionService';
import { globalEligibilityService } from '../services/globalEligibilityService';
import type { GlobalCreateRedemptionRequestInput } from '../services/globalRedemptionService';
import type { Distribution } from '../types';

interface GlobalRedemptionRequestFormProps {
  onSuccess?: (redemptionId: string) => void;
  onCancel?: () => void;
  className?: string;
  prefilledData?: Partial<GlobalCreateRedemptionRequestInput>;
}

export function GlobalRedemptionRequestForm({
  onSuccess,
  onCancel,
  className = '',
  prefilledData
}: GlobalRedemptionRequestFormProps) {
  const [formData, setFormData] = useState<GlobalCreateRedemptionRequestInput>({
    tokenAmount: prefilledData?.tokenAmount || 0,
    tokenType: prefilledData?.tokenType || '',
    redemptionType: prefilledData?.redemptionType || 'standard',
    sourceWallet: prefilledData?.sourceWallet || '',
    destinationWallet: prefilledData?.destinationWallet || '',
    conversionRate: prefilledData?.conversionRate || 1,
    investorName: prefilledData?.investorName || '',
    investorId: prefilledData?.investorId || '',
    distributionId: prefilledData?.distributionId || '',
    notes: prefilledData?.notes || ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableDistributions, setAvailableDistributions] = useState<Distribution[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
  const [eligibilityChecking, setEligibilityChecking] = useState<boolean>(false);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reason?: string } | null>(null);

  // Load available distributions on mount
  useEffect(() => {
    const loadDistributions = async () => {
      try {
        const response = await globalRedemptionService.getAllAvailableDistributions();
        if (response.success && response.data) {
          setAvailableDistributions(response.data);
        }
      } catch (err) {
        console.error('Error loading distributions:', err);
      }
    };
    loadDistributions();
  }, []);

  // Update selected distribution when distribution ID changes
  useEffect(() => {
    if (formData.distributionId && availableDistributions.length > 0) {
      const distribution = availableDistributions.find(d => d.id === formData.distributionId);
      setSelectedDistribution(distribution || null);
      
      if (distribution) {
        setFormData(prev => ({
          ...prev,
          tokenType: distribution.tokenType,
          tokenAmount: prev.tokenAmount || distribution.remainingAmount
        }));
      }
    }
  }, [formData.distributionId, availableDistributions]);

  // Check eligibility when key fields change
  useEffect(() => {
    const checkEligibility = async () => {
      if (!formData.distributionId || !formData.tokenAmount || !formData.tokenType) {
        setEligibilityResult(null);
        return;
      }

      setEligibilityChecking(true);
      try {
        const result = await globalEligibilityService.checkRedemptionEligibility({
          distributionId: formData.distributionId,
          requestedAmount: formData.tokenAmount,
          tokenType: formData.tokenType,
          redemptionType: formData.redemptionType,
          investorId: formData.investorId,
          investorName: formData.investorName
        });

        setEligibilityResult(result);
      } catch (err) {
        console.error('Error checking eligibility:', err);
        setEligibilityResult({
          eligible: false,
          reason: 'Error checking eligibility'
        });
      } finally {
        setEligibilityChecking(false);
      }
    };

    const debounceTimer = setTimeout(checkEligibility, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.distributionId, formData.tokenAmount, formData.tokenType, formData.redemptionType]);

  const handleInputChange = (field: keyof GlobalCreateRedemptionRequestInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setValidationError(null);
  };

  const calculateUSDCAmount = () => {
    return formData.tokenAmount * formData.conversionRate;
  };

  const validateForm = (): boolean => {
    if (!formData.tokenAmount || formData.tokenAmount <= 0) {
      setValidationError('Token amount must be greater than zero');
      return false;
    }
    if (!formData.tokenType.trim()) {
      setValidationError('Token type is required');
      return false;
    }
    if (!formData.sourceWallet.trim()) {
      setValidationError('Source wallet address is required');
      return false;
    }
    if (!formData.destinationWallet.trim()) {
      setValidationError('Destination wallet address is required');
      return false;
    }
    if (!formData.conversionRate || formData.conversionRate <= 0) {
      setValidationError('Conversion rate must be greater than zero');
      return false;
    }

    // Check eligibility
    if (eligibilityResult && !eligibilityResult.eligible) {
      setValidationError(`Eligibility check failed: ${eligibilityResult.reason}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await globalRedemptionService.createGlobalRedemptionRequest(formData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create redemption request');
      }

      if (response.data && onSuccess) {
        onSuccess(response.data.id);
      }
    } catch (err) {
      console.error('Error creating redemption request:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Global Redemption Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Distribution Selection */}
          <div className="space-y-2">
            <Label htmlFor="distributionId">Distribution (Optional)</Label>
            <Select value={formData.distributionId} onValueChange={(value) => handleInputChange('distributionId', value)}>
              <SelectTrigger id="distributionId">
                <SelectValue placeholder="Select a distribution or leave empty for auto-matching" />
              </SelectTrigger>
              <SelectContent>
                {availableDistributions.map((distribution) => (
                  <SelectItem key={distribution.id} value={distribution.id}>
                    {distribution.tokenType} - {distribution.remainingAmount} tokens
                    {distribution.tokenSymbol && ` (${distribution.tokenSymbol})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDistribution && (
              <div className="text-sm text-gray-600">
                Available: {selectedDistribution.remainingAmount} {selectedDistribution.tokenType} tokens
              </div>
            )}
          </div>

          {/* Token Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tokenType">Token Type</Label>
              <Input
                id="tokenType"
                value={formData.tokenType}
                onChange={(e) => handleInputChange('tokenType', e.target.value)}
                placeholder="e.g., ERC-20, ERC-721"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenAmount">Token Amount</Label>
              <Input
                id="tokenAmount"
                type="number"
                step="0.000001"
                min="0"
                value={formData.tokenAmount}
                onChange={(e) => handleInputChange('tokenAmount', parseFloat(e.target.value) || 0)}
                placeholder="Amount to redeem"
                required
              />
            </div>
          </div>

          {/* Redemption Type */}
          <div className="space-y-2">
            <Label htmlFor="redemptionType">Redemption Type</Label>
            <Select value={formData.redemptionType} onValueChange={(value: 'standard' | 'interval') => handleInputChange('redemptionType', value)}>
              <SelectTrigger id="redemptionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Immediate)</SelectItem>
                <SelectItem value="interval">Interval Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wallet Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceWallet">Source Wallet</Label>
              <Input
                id="sourceWallet"
                value={formData.sourceWallet}
                onChange={(e) => handleInputChange('sourceWallet', e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationWallet">Destination Wallet</Label>
              <Input
                id="destinationWallet"
                value={formData.destinationWallet}
                onChange={(e) => handleInputChange('destinationWallet', e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
          </div>

          {/* Conversion Rate and USDC Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conversionRate">Conversion Rate (Token:USDC)</Label>
              <Input
                id="conversionRate"
                type="number"
                step="0.000001"
                min="0"
                value={formData.conversionRate}
                onChange={(e) => handleInputChange('conversionRate', parseFloat(e.target.value) || 1)}
                placeholder="1.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated USDC Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={calculateUSDCAmount().toFixed(6)}
                  readOnly
                  className="bg-gray-50"
                />
                <Calculator className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Optional Investor Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investorName">Investor Name (Optional)</Label>
              <Input
                id="investorName"
                value={formData.investorName}
                onChange={(e) => handleInputChange('investorName', e.target.value)}
                placeholder="Leave empty for anonymous"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investorId">Investor ID (Optional)</Label>
              <Input
                id="investorId"
                value={formData.investorId}
                onChange={(e) => handleInputChange('investorId', e.target.value)}
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or comments"
              rows={3}
            />
          </div>

          {/* Eligibility Status */}
          {eligibilityChecking && (
            <div className="flex items-center gap-2 text-yellow-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking eligibility...</span>
            </div>
          )}
          
          {eligibilityResult && !eligibilityChecking && (
            <div className={`flex items-center gap-2 ${eligibilityResult.eligible ? 'text-green-600' : 'text-red-600'}`}>
              {eligibilityResult.eligible ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>
                {eligibilityResult.eligible ? 'Eligible for redemption' : eligibilityResult.reason}
              </span>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{validationError}</span>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading || eligibilityChecking || (eligibilityResult && !eligibilityResult.eligible)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Redemption Request
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>

          {/* Success Summary */}
          {formData.tokenAmount > 0 && formData.conversionRate > 0 && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Request Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Redeeming: {formData.tokenAmount} {formData.tokenType} tokens</div>
                <div>Estimated value: {calculateUSDCAmount().toFixed(6)} USDC</div>
                <div>Type: {formData.redemptionType === 'standard' ? 'Standard (Immediate)' : 'Interval Fund'}</div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default GlobalRedemptionRequestForm;
