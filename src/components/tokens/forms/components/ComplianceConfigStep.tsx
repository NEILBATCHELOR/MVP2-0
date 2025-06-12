/**
 * Compliance Configuration Step Component
 * Handles compliance settings, KYC, sanctions, and regulatory features
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Globe, Users, AlertTriangle, Plus, X } from 'lucide-react';

interface ComplianceConfigStepProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onConfigChange: (configType: string, config: any) => void;
}

const ComplianceConfigStep: React.FC<ComplianceConfigStepProps> = ({
  formData,
  errors,
  onChange,
  onConfigChange
}) => {
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');
  const [newRestrictedJurisdiction, setNewRestrictedJurisdiction] = useState('');

  // Handle compliance config changes
  const handleComplianceChange = (field: string, value: any) => {
    const currentConfig = formData.complianceConfig || {};
    const updatedConfig = {
      ...currentConfig,
      [field]: value
    };
    onConfigChange('complianceConfig', updatedConfig);
  };

  // Handle whitelist config changes
  const handleWhitelistChange = (field: string, value: any) => {
    const currentConfig = formData.whitelistConfig || {};
    const updatedConfig = {
      ...currentConfig,
      [field]: value
    };
    onConfigChange('whitelistConfig', updatedConfig);
  };

  // Handle transfer config changes
  const handleTransferChange = (field: string, value: any) => {
    const currentConfig = formData.transferConfig || {};
    const updatedConfig = {
      ...currentConfig,
      [field]: value
    };
    onConfigChange('transferConfig', updatedConfig);
  };

  // Add whitelist address
  const addWhitelistAddress = () => {
    if (!newWhitelistAddress || !/^0x[a-fA-F0-9]{40}$/.test(newWhitelistAddress)) {
      return;
    }

    const currentAddresses = formData.whitelistConfig?.addresses || [];
    if (!currentAddresses.includes(newWhitelistAddress)) {
      handleWhitelistChange('addresses', [...currentAddresses, newWhitelistAddress]);
    }
    setNewWhitelistAddress('');
  };

  // Remove whitelist address
  const removeWhitelistAddress = (address: string) => {
    const currentAddresses = formData.whitelistConfig?.addresses || [];
    const updatedAddresses = currentAddresses.filter((addr: string) => addr !== address);
    handleWhitelistChange('addresses', updatedAddresses);
  };

  // Add restricted jurisdiction
  const addRestrictedJurisdiction = () => {
    if (!newRestrictedJurisdiction) return;

    const currentJurisdictions = formData.complianceConfig?.jurisdictionRestrictions || [];
    if (!currentJurisdictions.includes(newRestrictedJurisdiction)) {
      handleComplianceChange('jurisdictionRestrictions', [...currentJurisdictions, newRestrictedJurisdiction]);
    }
    setNewRestrictedJurisdiction('');
  };

  // Remove restricted jurisdiction
  const removeRestrictedJurisdiction = (jurisdiction: string) => {
    const currentJurisdictions = formData.complianceConfig?.jurisdictionRestrictions || [];
    const updatedJurisdictions = currentJurisdictions.filter((j: string) => j !== jurisdiction);
    handleComplianceChange('jurisdictionRestrictions', updatedJurisdictions);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Compliance & Security Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Set up regulatory compliance and security features for your token
        </p>
      </div>

      {/* KYC & Identity Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            KYC & Identity Verification
          </CardTitle>
          <CardDescription>
            Configure know-your-customer requirements and identity verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <Label htmlFor="kycRequired" className="text-sm font-medium">
                Require KYC Verification
              </Label>
              <p className="text-xs text-muted-foreground">
                Users must complete KYC verification before trading
              </p>
            </div>
            <Switch
              id="kycRequired"
              checked={formData.complianceConfig?.kycRequired || false}
              onCheckedChange={(checked) => handleComplianceChange('kycRequired', checked)}
            />
          </div>

          {formData.complianceConfig?.kycRequired && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="maxHolders" className="text-sm font-medium">
                  Maximum Token Holders
                </Label>
                <Input
                  id="maxHolders"
                  type="number"
                  min="1"
                  placeholder="e.g., 500"
                  value={formData.complianceConfig?.maxHolders || ''}
                  onChange={(e) => handleComplianceChange('maxHolders', parseInt(e.target.value) || undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of verified token holders (optional)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Geographic & Jurisdictional Restrictions
          </CardTitle>
          <CardDescription>
            Configure jurisdictional restrictions and geographic compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Restricted Jurisdictions</Label>
            <div className="flex gap-2">
              <Select
                value={newRestrictedJurisdiction}
                onValueChange={setNewRestrictedJurisdiction}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select jurisdiction to restrict" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CN">China</SelectItem>
                  <SelectItem value="KP">North Korea</SelectItem>
                  <SelectItem value="IR">Iran</SelectItem>
                  <SelectItem value="SY">Syria</SelectItem>
                  <SelectItem value="CU">Cuba</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={addRestrictedJurisdiction}
                disabled={!newRestrictedJurisdiction}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.complianceConfig?.jurisdictionRestrictions?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.complianceConfig.jurisdictionRestrictions.map((jurisdiction: string) => (
                  <Badge key={jurisdiction} variant="secondary" className="flex items-center gap-1">
                    {jurisdiction}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeRestrictedJurisdiction(jurisdiction)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Token transfers will be blocked for addresses from these jurisdictions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sanctions & AML */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Sanctions & Anti-Money Laundering
          </CardTitle>
          <CardDescription>
            Configure automated sanctions screening and AML compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <Label htmlFor="sanctionsChecking" className="text-sm font-medium">
                Automated Sanctions Screening
              </Label>
              <p className="text-xs text-muted-foreground">
                Check addresses against OFAC and other sanctions lists
              </p>
            </div>
            <Switch
              id="sanctionsChecking"
              checked={formData.complianceConfig?.sanctionsChecking || false}
              onCheckedChange={(checked) => handleComplianceChange('sanctionsChecking', checked)}
            />
          </div>

          {formData.complianceConfig?.sanctionsChecking && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-medium">Additional Setup Required</div>
                    <div className="mt-1">
                      Sanctions screening requires integration with a compliance provider.
                      Contact support for setup assistance.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Whitelist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Whitelist Management
          </CardTitle>
          <CardDescription>
            Configure address whitelisting for restricted token access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <Label htmlFor="whitelistEnabled" className="text-sm font-medium">
                Enable Address Whitelisting
              </Label>
              <p className="text-xs text-muted-foreground">
                Only whitelisted addresses can hold or transfer tokens
              </p>
            </div>
            <Switch
              id="whitelistEnabled"
              checked={formData.whitelistConfig?.enabled || false}
              onCheckedChange={(checked) => handleWhitelistChange('enabled', checked)}
            />
          </div>

          {formData.whitelistConfig?.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="autoApproval" className="text-sm font-medium">
                    Auto-approve KYC Verified Users
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically whitelist users who complete KYC
                  </p>
                </div>
                <Switch
                  id="autoApproval"
                  checked={formData.whitelistConfig?.autoApproval || false}
                  onCheckedChange={(checked) => handleWhitelistChange('autoApproval', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Whitelisted Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0x... (Ethereum address)"
                    value={newWhitelistAddress}
                    onChange={(e) => setNewWhitelistAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addWhitelistAddress}
                    disabled={!newWhitelistAddress || !/^0x[a-fA-F0-9]{40}$/.test(newWhitelistAddress)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.whitelistConfig?.addresses?.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.whitelistConfig.addresses.map((address: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <code className="text-xs font-mono">{address}</code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWhitelistAddress(address)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add specific addresses that should be pre-approved for token access
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Transfer Restrictions
          </CardTitle>
          <CardDescription>
            Configure limitations on token transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTransferAmount" className="text-sm font-medium">
                Maximum Transfer Amount
              </Label>
              <Input
                id="maxTransferAmount"
                type="text"
                placeholder="e.g., 10000 (optional)"
                value={formData.transferConfig?.maxTransferAmount || ''}
                onChange={(e) => handleTransferChange('maxTransferAmount', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum tokens that can be transferred in a single transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferCooldown" className="text-sm font-medium">
                Transfer Cooldown (seconds)
              </Label>
              <Input
                id="transferCooldown"
                type="number"
                min="0"
                placeholder="e.g., 3600 (1 hour)"
                value={formData.transferConfig?.transferCooldown || ''}
                onChange={(e) => handleTransferChange('transferCooldown', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between transfers from the same address
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Compliance Configuration Status</span>
          </div>
          <div className="mt-2 text-sm text-green-600">
            ✓ Compliance settings configured
            {formData.complianceConfig?.kycRequired && " • KYC required"}
            {formData.complianceConfig?.sanctionsChecking && " • Sanctions screening enabled"}
            {formData.whitelistConfig?.enabled && " • Whitelist enabled"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceConfigStep;
