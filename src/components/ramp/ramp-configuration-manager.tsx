/**
 * RAMP Configuration Manager Component
 * 
 * Manages RAMP Network configuration settings and environment variables
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { 
  Settings, 
  Key, 
  Globe, 
  Shield, 
  Palette, 
  BarChart3,
  Save,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

import type { 
  RampNetworkEnhancedConfig, 
  RampFeatureFlags, 
  RampEnvironment 
} from '@/types/ramp';

export interface RampConfigurationManagerProps {
  /** Current configuration */
  config: RampNetworkEnhancedConfig;
  
  /** Callback when configuration changes */
  onConfigChange: (config: RampNetworkEnhancedConfig) => void;
  
  /** Whether the component is in edit mode */
  editMode?: boolean;
  
  /** Whether to show sensitive information */
  showSensitive?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Whether to show advanced settings */
  showAdvanced?: boolean;
  
  /** Available environments */
  environments?: RampEnvironment[];
}

export function RampConfigurationManager({
  config: initialConfig,
  onConfigChange,
  editMode = false,
  showSensitive = false,
  className,
  showAdvanced = true,
  environments = ['staging', 'production']
}: RampConfigurationManagerProps) {
  // State
  const [config, setConfig] = useState<RampNetworkEnhancedConfig>(initialConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Hooks
  const { toast } = useToast();
  
  // Update config when prop changes
  useEffect(() => {
    setConfig(initialConfig);
    setHasChanges(false);
  }, [initialConfig]);
  
  // Handle config change
  const handleConfigChange = (updates: Partial<RampNetworkEnhancedConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setHasChanges(true);
    validateConfig(newConfig);
  };
  
  // Validate configuration
  const validateConfig = (configToValidate: RampNetworkEnhancedConfig) => {
    const errors: Record<string, string> = {};
    
    if (!configToValidate.apiKey || configToValidate.apiKey.trim() === '') {
      errors.apiKey = 'API key is required';
    }
    
    if (!configToValidate.hostAppName || configToValidate.hostAppName.trim() === '') {
      errors.hostAppName = 'Host app name is required';
    }
    
    if (!configToValidate.hostLogoUrl || configToValidate.hostLogoUrl.trim() === '') {
      errors.hostLogoUrl = 'Host logo URL is required';
    }
    
    try {
      new URL(configToValidate.hostLogoUrl);
    } catch {
      errors.hostLogoUrl = 'Invalid URL format';
    }
    
    if (configToValidate.enabledFlows.length === 0) {
      errors.enabledFlows = 'At least one flow must be enabled';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Save configuration
  const handleSave = () => {
    if (validateConfig(config)) {
      onConfigChange(config);
      setHasChanges(false);
      
      toast({
        title: 'Configuration Saved',
        description: 'RAMP Network configuration has been updated successfully.',
      });
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the configuration errors before saving.',
        variant: 'destructive',
      });
    }
  };
  
  // Reset configuration
  const handleReset = () => {
    setConfig(initialConfig);
    setHasChanges(false);
    setValidationErrors({});
    
    toast({
      title: 'Configuration Reset',
      description: 'Configuration has been reset to original values.',
    });
  };
  
  // Toggle feature flag
  const toggleFeatureFlag = (flag: keyof RampFeatureFlags) => {
    const featureFlags = {
      enableOnRamp: config.enabledFlows.includes('ONRAMP'),
      enableOffRamp: config.enabledFlows.includes('OFFRAMP'),
      enableQuotes: config.enableQuotes || false,
      enableWebhooks: config.enableWebhooks || false,
      enableEventTracking: config.enableEventTracking || false,
      enableAdvancedAnalytics: false,
      enableCustomBranding: !!config.primaryColor,
      enableNativeFlow: config.enableNativeFlow || false,
      enableMultiplePaymentMethods: true,
      enableGeoRestrictions: !!config.supportedCountries?.length
    };
    
    const newValue = !featureFlags[flag];
    
    // Update relevant config based on feature flag
    const updates: Partial<RampNetworkEnhancedConfig> = {};
    
    switch (flag) {
      case 'enableOnRamp':
        updates.enabledFlows = newValue 
          ? [...config.enabledFlows.filter(f => f !== 'ONRAMP'), 'ONRAMP']
          : config.enabledFlows.filter(f => f !== 'ONRAMP');
        break;
      case 'enableOffRamp':
        updates.enabledFlows = newValue
          ? [...config.enabledFlows.filter(f => f !== 'OFFRAMP'), 'OFFRAMP']
          : config.enabledFlows.filter(f => f !== 'OFFRAMP');
        break;
      case 'enableQuotes':
        updates.enableQuotes = newValue;
        break;
      case 'enableWebhooks':
        updates.enableWebhooks = newValue;
        break;
      case 'enableEventTracking':
        updates.enableEventTracking = newValue;
        break;
      case 'enableNativeFlow':
        updates.enableNativeFlow = newValue;
        break;
    }
    
    handleConfigChange(updates);
  };
  
  // Get current feature flags
  const getFeatureFlags = (): RampFeatureFlags => ({
    enableOnRamp: config.enabledFlows.includes('ONRAMP'),
    enableOffRamp: config.enabledFlows.includes('OFFRAMP'),
    enableQuotes: config.enableQuotes || false,
    enableWebhooks: config.enableWebhooks || false,
    enableEventTracking: config.enableEventTracking || false,
    enableAdvancedAnalytics: false,
    enableCustomBranding: !!config.primaryColor,
    enableNativeFlow: config.enableNativeFlow || false,
    enableMultiplePaymentMethods: true,
    enableGeoRestrictions: !!config.supportedCountries?.length
  });
  
  const featureFlags = getFeatureFlags();
  
  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          RAMP Network Configuration
        </CardTitle>
        <CardDescription>
          Manage your RAMP Network integration settings and preferences
        </CardDescription>
        {hasChanges && (
          <Alert>
            <AlertDescription>
              You have unsaved changes. Don't forget to save your configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Basic Configuration */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => handleConfigChange({ apiKey: e.target.value })}
                    disabled={!editMode}
                    className={validationErrors.apiKey ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.apiKey && (
                  <p className="text-sm text-red-500">{validationErrors.apiKey}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <select
                  id="environment"
                  value={config.environment || 'production'}
                  onChange={(e) => handleConfigChange({ environment: e.target.value as RampEnvironment })}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md"
                >
                  {environments.map(env => (
                    <option key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hostAppName">Host App Name</Label>
                <Input
                  id="hostAppName"
                  value={config.hostAppName}
                  onChange={(e) => handleConfigChange({ hostAppName: e.target.value })}
                  disabled={!editMode}
                  placeholder="Your App Name"
                  className={validationErrors.hostAppName ? 'border-red-500' : ''}
                />
                {validationErrors.hostAppName && (
                  <p className="text-sm text-red-500">{validationErrors.hostAppName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hostLogoUrl">Host Logo URL</Label>
                <Input
                  id="hostLogoUrl"
                  value={config.hostLogoUrl}
                  onChange={(e) => handleConfigChange({ hostLogoUrl: e.target.value })}
                  disabled={!editMode}
                  placeholder="https://example.com/logo.png"
                  className={validationErrors.hostLogoUrl ? 'border-red-500' : ''}
                />
                {validationErrors.hostLogoUrl && (
                  <p className="text-sm text-red-500">{validationErrors.hostLogoUrl}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={config.webhookSecret || ''}
                  onChange={(e) => handleConfigChange({ webhookSecret: e.target.value })}
                  disabled={!editMode}
                  placeholder="Optional webhook secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Feature Flags */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(featureFlags).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getFeatureDescription(key as keyof RampFeatureFlags)}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={() => toggleFeatureFlag(key as keyof RampFeatureFlags)}
                    disabled={!editMode}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Branding */}
          <TabsContent value="branding" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={config.primaryColor || ''}
                    onChange={(e) => handleConfigChange({ primaryColor: e.target.value })}
                    disabled={!editMode}
                    placeholder="#3B82F6"
                  />
                  <input
                    type="color"
                    value={config.primaryColor || '#3B82F6'}
                    onChange={(e) => handleConfigChange({ primaryColor: e.target.value })}
                    disabled={!editMode}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="borderRadius">Border Radius</Label>
                <Input
                  id="borderRadius"
                  value={config.borderRadius || ''}
                  onChange={(e) => handleConfigChange({ borderRadius: e.target.value })}
                  disabled={!editMode}
                  placeholder="8px"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={config.fontFamily || ''}
                  onChange={(e) => handleConfigChange({ fontFamily: e.target.value })}
                  disabled={!editMode}
                  placeholder="Inter, sans-serif"
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultVariant">Default Variant</Label>
                <select
                  id="defaultVariant"
                  value={config.defaultVariant || 'auto'}
                  onChange={(e) => handleConfigChange({ defaultVariant: e.target.value as any })}
                  disabled={!editMode}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="auto">Auto</option>
                  <option value="hosted-auto">Hosted Auto</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="embedded-desktop">Embedded Desktop</option>
                  <option value="embedded-mobile">Embedded Mobile</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="containerElementId">Container Element ID</Label>
                <Input
                  id="containerElementId"
                  value={config.containerElementId || ''}
                  onChange={(e) => handleConfigChange({ containerElementId: e.target.value })}
                  disabled={!editMode}
                  placeholder="ramp-widget-container"
                />
              </div>
            </div>
            
            {/* Rate Limits */}
            {config.rateLimits && (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Rate Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quotesPerMinute">Quotes Per Minute</Label>
                    <Input
                      id="quotesPerMinute"
                      type="number"
                      value={config.rateLimits.quotesPerMinute || ''}
                      onChange={(e) => handleConfigChange({ 
                        rateLimits: { 
                          ...config.rateLimits, 
                          quotesPerMinute: parseInt(e.target.value) || undefined 
                        } 
                      })}
                      disabled={!editMode}
                      placeholder="60"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transactionsPerHour">Transactions Per Hour</Label>
                    <Input
                      id="transactionsPerHour"
                      type="number"
                      value={config.rateLimits.transactionsPerHour || ''}
                      onChange={(e) => handleConfigChange({ 
                        rateLimits: { 
                          ...config.rateLimits, 
                          transactionsPerHour: parseInt(e.target.value) || undefined 
                        } 
                      })}
                      disabled={!editMode}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Security */}
          <TabsContent value="security" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="font-medium">Security Settings</h3>
            </div>
            
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Always use HTTPS URLs for production environments. Keep your API keys secure and never expose them in client-side code.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">API Key Security</h4>
                  <div className="space-y-2">
                    <Badge variant={config.apiKey ? 'default' : 'destructive'}>
                      {config.apiKey ? 'Configured' : 'Missing'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Your API key is used to authenticate with RAMP Network services.
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Webhook Security</h4>
                  <div className="space-y-2">
                    <Badge variant={config.webhookSecret ? 'default' : 'secondary'}>
                      {config.webhookSecret ? 'Enabled' : 'Optional'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Webhook secret provides additional security for webhook verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        {editMode && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || Object.keys(validationErrors).length > 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getFeatureDescription(flag: keyof RampFeatureFlags): string {
  const descriptions: Record<keyof RampFeatureFlags, string> = {
    enableOnRamp: 'Allow users to buy cryptocurrency with fiat',
    enableOffRamp: 'Allow users to sell cryptocurrency for fiat',
    enableQuotes: 'Show real-time price quotes before transactions',
    enableWebhooks: 'Receive transaction status updates via webhooks',
    enableEventTracking: 'Track user events and analytics',
    enableAdvancedAnalytics: 'Enable detailed analytics and reporting',
    enableCustomBranding: 'Apply custom branding to the widget',
    enableNativeFlow: 'Use native crypto transfer flow for off-ramp',
    enableMultiplePaymentMethods: 'Support multiple payment methods',
    enableGeoRestrictions: 'Apply geographic restrictions to users'
  };
  
  return descriptions[flag];
}

export default RampConfigurationManager;
