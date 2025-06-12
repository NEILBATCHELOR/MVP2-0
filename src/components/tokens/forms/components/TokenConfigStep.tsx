/**
 * Token Configuration Step Component
 * Handles token features like mintable, burnable, pausable, etc.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Zap, Users } from 'lucide-react';
import { TokenConfigMode } from '@/types/core/centralModels';

interface AdditionalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'url' | 'select';
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

interface AdditionalToggle {
  name: string;
  label: string;
  description: string;
}

interface TokenConfigStepProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  configMode: TokenConfigMode;
  additionalFields?: AdditionalField[];
  additionalToggles?: AdditionalToggle[];
}

const TokenConfigStep: React.FC<TokenConfigStepProps> = ({
  formData,
  errors,
  onChange,
  configMode,
  additionalFields = [],
  additionalToggles = []
}) => {
  const isAdvancedMode = configMode === TokenConfigMode.MAX;

  const handleSwitchChange = (field: string, checked: boolean) => {
    onChange(field, checked);
  };

  const handleSelectChange = (field: string, value: string) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Token Features & Capabilities</h3>
        <p className="text-sm text-muted-foreground">
          Configure the functional capabilities of your ERC-20 token
        </p>
      </div>

      {/* Core Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Core Features
          </CardTitle>
          <CardDescription>
            Enable or disable essential token functionalities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mintable */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="isMintable" className="text-sm font-medium">
                  Mintable
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow creation of new tokens after deployment
                </p>
              </div>
              <Switch
                id="isMintable"
                checked={formData.isMintable || false}
                onCheckedChange={(checked) => handleSwitchChange('isMintable', checked)}
              />
            </div>

            {/* Burnable */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="isBurnable" className="text-sm font-medium">
                  Burnable
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow token holders to permanently destroy tokens
                </p>
              </div>
              <Switch
                id="isBurnable"
                checked={formData.isBurnable || false}
                onCheckedChange={(checked) => handleSwitchChange('isBurnable', checked)}
              />
            </div>

            {/* Pausable */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="isPausable" className="text-sm font-medium">
                  Pausable
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow pausing all token transfers in emergencies
                </p>
              </div>
              <Switch
                id="isPausable"
                checked={formData.isPausable || false}
                onCheckedChange={(checked) => handleSwitchChange('isPausable', checked)}
              />
            </div>

            {/* Permit */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="permit" className="text-sm font-medium">
                  EIP-2612 Permit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable gasless approvals using signatures
                </p>
              </div>
              <Switch
                id="permit"
                checked={formData.permit || false}
                onCheckedChange={(checked) => handleSwitchChange('permit', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Type & Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Token Type & Access Control
          </CardTitle>
          <CardDescription>
            Define the token's purpose and access control mechanism
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Type */}
            <div className="space-y-2">
              <Label htmlFor="tokenType" className="text-sm font-medium">
                Token Type
              </Label>
              <Select
                value={formData.tokenType || 'utility'}
                onValueChange={(value) => handleSelectChange('tokenType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility Token</SelectItem>
                  <SelectItem value="governance">Governance Token</SelectItem>
                  <SelectItem value="payment">Payment Token</SelectItem>
                  <SelectItem value="reward">Reward Token</SelectItem>
                  <SelectItem value="security">Security Token</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The primary use case for your token
              </p>
            </div>

            {/* Access Control */}
            <div className="space-y-2">
              <Label htmlFor="accessControl" className="text-sm font-medium">
                Access Control
              </Label>
              <Select
                value={formData.accessControl || 'ownable'}
                onValueChange={(value) => handleSelectChange('accessControl', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access control" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ownable">Ownable (Single Owner)</SelectItem>
                  <SelectItem value="role-based">Role-Based Access</SelectItem>
                  <SelectItem value="multisig">Multi-Signature</SelectItem>
                  <SelectItem value="dao">DAO Governance</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How administrative functions are controlled
              </p>
            </div>
          </div>

          {/* Allow Management */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <Label htmlFor="allowManagement" className="text-sm font-medium">
                Allow Management Functions
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable administrative functions like blacklisting or freezing
              </p>
            </div>
            <Switch
              id="allowManagement"
              checked={formData.allowManagement || false}
              onCheckedChange={(checked) => handleSwitchChange('allowManagement', checked)}
            />
          </div>

          {/* Additional Fields */}
          {additionalFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && (
                  <Badge variant="destructive" className="ml-1">Required</Badge>
                )}
              </Label>
              {field.type === 'select' ? (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={(value) => handleSelectChange(field.name, value)}
                >
                  <SelectTrigger className={errors[field.name] ? 'border-red-500' : ''}>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => {
                    const value = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                    onChange(field.name, value);
                  }}
                  className={`w-full p-2 border rounded-md ${errors[field.name] ? 'border-red-500' : ''}`}
                  min={field.min}
                  max={field.max}
                />
              )}
              {errors[field.name] && (
                <p className="text-sm text-red-500">{errors[field.name]}</p>
              )}
              {field.description && (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              )}
            </div>
          ))}

          {/* Additional Toggles */}
          {additionalToggles.map((toggle) => (
            <div key={toggle.name} className="flex items-center justify-between space-x-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor={toggle.name} className="text-sm font-medium">
                  {toggle.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {toggle.description}
                </p>
              </div>
              <Switch
                id={toggle.name}
                checked={formData[toggle.name] || false}
                onCheckedChange={(checked) => handleSwitchChange(toggle.name, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Advanced Features (only in advanced mode) */}
      {isAdvancedMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Advanced Features
              <Badge variant="secondary">Advanced</Badge>
            </CardTitle>
            <CardDescription>
              Additional features for complex token implementations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Snapshot */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="snapshot" className="text-sm font-medium">
                    Snapshot
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable taking snapshots of token balances
                  </p>
                </div>
                <Switch
                  id="snapshot"
                  checked={formData.snapshot || false}
                  onCheckedChange={(checked) => handleSwitchChange('snapshot', checked)}
                />
              </div>

              {/* Fee on Transfer */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="feeOnTransfer" className="text-sm font-medium">
                    Fee on Transfer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Charge a fee on each token transfer
                  </p>
                </div>
                <Switch
                  id="feeOnTransfer"
                  checked={formData.feeOnTransfer || false}
                  onCheckedChange={(checked) => handleSwitchChange('feeOnTransfer', checked)}
                />
              </div>

              {/* Rebasing */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="rebasing" className="text-sm font-medium">
                    Rebasing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically adjust balances periodically
                  </p>
                </div>
                <Switch
                  id="rebasing"
                  checked={formData.rebasing || false}
                  onCheckedChange={(checked) => handleSwitchChange('rebasing', checked)}
                />
              </div>

              {/* Governance Features */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="governanceFeatures" className="text-sm font-medium">
                    Governance Features
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable voting and proposal functionality
                  </p>
                </div>
                <Switch
                  id="governanceFeatures"
                  checked={formData.governanceFeatures || false}
                  onCheckedChange={(checked) => handleSwitchChange('governanceFeatures', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Impact Information */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <span className="text-sm font-medium">Feature Impact</span>
              <div className="text-sm text-muted-foreground space-y-1">
                {formData.isMintable && (
                  <div>• Mintable: Increases contract size and gas costs</div>
                )}
                {formData.isPausable && (
                  <div>• Pausable: Adds emergency stop functionality</div>
                )}
                {formData.permit && (
                  <div>• Permit: Reduces gas costs for approvals</div>
                )}
                {formData.snapshot && (
                  <div>• Snapshot: Required for governance and airdrops</div>
                )}
                {(!formData.isMintable && !formData.isPausable && !formData.permit && !formData.snapshot) && (
                  <div>• Minimal features selected - optimized for gas efficiency</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary for this step */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Configuration Status</span>
          </div>
          <div className="mt-2 text-sm text-green-600">
            ✓ Token features configured successfully
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenConfigStep;
