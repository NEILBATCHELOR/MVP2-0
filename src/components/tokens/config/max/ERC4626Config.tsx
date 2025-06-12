import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ERC4626DetailedConfigProps } from "@/components/tokens/types";

// Define these interfaces directly in the file to avoid import type errors
interface TokenFee {
  enabled?: boolean;
  managementFee?: string;
  performanceFee?: string;
  depositFee?: string;
  withdrawalFee?: string;
  [key: string]: any;
}

interface TokenLimits {
  minDeposit?: string;
  maxDeposit?: string;
  maxWithdraw?: string;
  maxRedeem?: string;
  [key: string]: any;
}

// Extended source data interface to handle additional properties
interface ExtendedSourceData {
  name?: string;
  symbol?: string;
  description?: string;
  decimals?: number;
  assetAddress?: string;
  assetDecimals?: number;
  fee?: TokenFee | number;
  minDeposit?: string;
  maxDeposit?: string;
  pausable?: boolean;
  
  // Additional properties
  assetName?: string;
  assetSymbol?: string;
  yieldStrategy?: string | { protocol?: string[]; rebalancingFrequency?: "daily" | "weekly" | "monthly" };
  strategyDetails?: string;
  expectedAPY?: string;
  limits?: TokenLimits;
  accessControl?: string;
  allowlist?: boolean;
  customHooks?: boolean;
  autoReporting?: boolean;
  previewFunctions?: boolean;
  limitFunctions?: boolean;
  compoundIntegration?: boolean;
  aaveIntegration?: boolean;
  lidoIntegration?: boolean;
  uniswapIntegration?: boolean;
  curveIntegration?: boolean;
  customIntegration?: string;
  
  // Support for metadata field that might be in tokenForm
  metadata?: {
    standardsConfig?: {
      'ERC-4626'?: any;
    };
  };
  
  // Allow any other properties
  [key: string]: any;
}

/**
 * Detailed configuration component for ERC4626 (Tokenized Vault) tokens
 * Provides comprehensive options for all standard features and extensions
 */
const ERC4626DetailedConfig: React.FC<ERC4626DetailedConfigProps> = ({ 
  onConfigChange,
  initialConfig,
  tokenForm,
  handleInputChange,
  setTokenForm
}) => {
  // Debug log the props received
  useEffect(() => {
    if (initialConfig) {
      console.log('ERC4626DetailedConfig initialConfig:', initialConfig);
    }
    if (tokenForm) {
      console.log('ERC4626DetailedConfig tokenForm:', tokenForm);
    }
  }, [initialConfig, tokenForm]);

  // Determine which data source to use - prefer initialConfig, fallback to tokenForm
  const sourceData = initialConfig || tokenForm || {} as any;
  
  // Helper to safely get nested properties
  const getNestedProperty = (obj: any, path: string, defaultValue: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  };
  
  // Extract fee structure safely
  const getFeeValue = (path: string, defaultValue: any): any => {
    // Check if fee is an object with the expected property
    if (sourceData.fee && typeof sourceData.fee === 'object') {
      // It's a TokenFee object
      const value = sourceData.fee[path];
      if (value === undefined || value === null) return defaultValue;
      
      // Convert numbers to strings for input fields
      if (typeof value === 'number' && path !== 'enabled') {
        return isNaN(value) ? defaultValue : value.toString();
      }
      
      return value;
    }
    
    // Handle number type fee (legacy format)
    if (path === 'enabled' && typeof sourceData.fee === 'number') {
      return sourceData.fee > 0;
    }
    
    if (path === 'managementFee' && typeof sourceData.fee === 'number') {
      const value = sourceData.fee;
      return isNaN(value) ? defaultValue : value.toString();
    }
    
    return defaultValue;
  };
  
  // Extract limits safely
  const getLimitValue = (path: string, defaultValue: string): string => {
    // First check if there's a direct property with this name
    if (sourceData[path] !== undefined && sourceData[path] !== null) {
      const value = sourceData[path];
      // Handle potential NaN values
      if (typeof value === 'number' && isNaN(value)) {
        return defaultValue;
      }
      return String(value);
    }
    
    // Then check in the limits object
    if (sourceData.limits && typeof sourceData.limits === 'object') {
      const value = sourceData.limits[path];
      if (value !== undefined && value !== null) {
        // Handle potential NaN values
        if (typeof value === 'number' && isNaN(value)) {
          return defaultValue;
        }
        return String(value);
      }
    }
    
    return defaultValue;
  };

  // Full configuration with all possible ERC-4626 options
  const [config, setConfig] = useState({
    // Core Vault Details
    name: sourceData.name || "",
    symbol: sourceData.symbol || "",
    description: sourceData.description || "",
    decimals: typeof sourceData.decimals === 'number' && !isNaN(sourceData.decimals) ? sourceData.decimals : 18,
    
    // Standard Features
    isMintable: !!sourceData.isMintable,
    isBurnable: !!sourceData.isBurnable,
    isPausable: !!sourceData.isPausable,
    permit: !!sourceData.permit,
    flashLoans: !!sourceData.flashLoans,
    emergencyShutdown: !!sourceData.emergencyShutdown,
    performanceMetrics: !!sourceData.performanceMetrics,
    performanceTracking: !!sourceData.performanceTracking,
    
    // Underlying Asset
    assetAddress: sourceData.assetAddress || "",
    assetName: sourceData.assetName || "", 
    assetSymbol: sourceData.assetSymbol || "",
    assetDecimals: typeof sourceData.assetDecimals === 'number' && !isNaN(sourceData.assetDecimals) ? sourceData.assetDecimals : 18,
    
    // Vault Configuration
    vaultType: sourceData.vaultType || "yield",
    vaultStrategy: sourceData.vaultStrategy || "simple",
    customStrategy: !!sourceData.customStrategy,
    strategyController: sourceData.strategyController || "",
    
    // Yield Strategy
    yieldStrategy: sourceData.yieldStrategy || "lending",
    yieldSource: sourceData.yieldSource || "external",
    strategyDetails: sourceData.strategyDetails || "",
    strategyDocumentation: sourceData.strategyDocumentation || "",
    expectedAPY: sourceData.expectedAPY || "",
    
    // MISSING FIELDS ADDED: Yield Optimization & Automation
    yieldOptimizationEnabled: !!sourceData.yieldOptimizationEnabled,
    automatedRebalancing: !!sourceData.automatedRebalancing,
    rebalanceThreshold: sourceData.rebalanceThreshold || "",
    liquidityReserve: sourceData.liquidityReserve || "10",
    maxSlippage: sourceData.maxSlippage || "",
    
    // Fee Structure (nested object for backward compatibility)
    fee: {
      enabled: getFeeValue('enabled', false),
      managementFee: getFeeValue('managementFee', "0"),
      performanceFee: getFeeValue('performanceFee', "0"), 
      depositFee: getFeeValue('depositFee', "0"),
      withdrawalFee: getFeeValue('withdrawalFee', "0"),
    },
    
    // MISSING FIELDS ADDED: Individual Fee Fields (map to DB columns)
    depositFee: sourceData.depositFee || getFeeValue('depositFee', "0"),
    withdrawalFee: sourceData.withdrawalFee || getFeeValue('withdrawalFee', "0"), 
    managementFee: sourceData.managementFee || getFeeValue('managementFee', "0"),
    performanceFee: sourceData.performanceFee || getFeeValue('performanceFee', "0"),
    feeRecipient: sourceData.feeRecipient || "",
    
    // Deposit/Withdrawal Limits (nested object for backward compatibility)
    limits: {
      minDeposit: getLimitValue('minDeposit', ""),
      maxDeposit: getLimitValue('maxDeposit', ""),
      maxWithdraw: getLimitValue('maxWithdraw', ""),
      maxRedeem: getLimitValue('maxRedeem', ""),
    },
    
    // MISSING FIELDS ADDED: Individual Limit Fields (map to DB columns)
    depositLimit: sourceData.depositLimit || "", // Total deposit limit
    withdrawalLimit: sourceData.withdrawalLimit || "", // Daily withdrawal limit
    minDeposit: sourceData.minDeposit || getLimitValue('minDeposit', ""),
    maxDeposit: sourceData.maxDeposit || getLimitValue('maxDeposit', ""),
    minWithdrawal: sourceData.minWithdrawal || "",
    maxWithdrawal: sourceData.maxWithdrawal || "",
    
    // Access Control
    accessControl: sourceData.accessControl || "ownable",
    allowlist: !!sourceData.allowlist,
    
    // Features & Extensions
    pausable: !!sourceData.pausable,
    customHooks: !!sourceData.customHooks,
    autoReporting: !!sourceData.autoReporting,
    
    // Advanced Features
    previewFunctions: sourceData.previewFunctions !== undefined ? sourceData.previewFunctions : true,
    limitFunctions: sourceData.limitFunctions !== undefined ? sourceData.limitFunctions : true,
    
    // Integrations
    compoundIntegration: !!sourceData.compoundIntegration,
    aaveIntegration: !!sourceData.aaveIntegration,
    lidoIntegration: !!sourceData.lidoIntegration,
    uniswapIntegration: !!sourceData.uniswapIntegration,
    curveIntegration: !!sourceData.curveIntegration,
    customIntegration: sourceData.customIntegration || "",
    
    // JSONB Complex Configurations
    rebalancingRules: sourceData.rebalancingRules || null,
    withdrawalRules: sourceData.withdrawalRules || null,
    feeStructure: sourceData.feeStructure || null, // Already exists in DB schema
  });

  // Update the parent component when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
    
    // If setTokenForm is provided, update the token form
    if (setTokenForm && tokenForm) {
      setTokenForm((prevForm: any) => ({
        ...prevForm,
        ...config,
        // Special handling for complex objects
        fee: config.fee,
        limits: config.limits
      }));
    }
  }, [config, onConfigChange, setTokenForm, tokenForm]);

  // Update parent state when config changes
  useEffect(() => {
    if (setTokenForm) {
      setTokenForm(prev => ({ ...prev, ...config }));
    }
  }, [config, setTokenForm]);

  // Update local state when tokenForm changes from parent
  useEffect(() => {
    setConfig(prev => ({
      ...prev, // Preserve all previous state properties
      name: tokenForm.name || prev.name,
      symbol: tokenForm.symbol || prev.symbol,
      description: tokenForm.description || prev.description,
      decimals: tokenForm.decimals ?? prev.decimals,
      assetAddress: (tokenForm as any).assetAddress || prev.assetAddress,
      assetDecimals: (tokenForm as any).assetDecimals ?? prev.assetDecimals,
      assetName: (tokenForm as any).assetName || prev.assetName,
      assetSymbol: (tokenForm as any).assetSymbol || prev.assetSymbol,
      fee: (tokenForm as any).fee || prev.fee,
      // Handle properties that exist in limits object but might be directly on tokenForm
      limits: {
        ...prev.limits,
        minDeposit: (tokenForm as any).minDeposit || (tokenForm as any).limits?.minDeposit || prev.limits.minDeposit,
        maxDeposit: (tokenForm as any).maxDeposit || (tokenForm as any).limits?.maxDeposit || prev.limits.maxDeposit,
        maxWithdraw: (tokenForm as any).maxWithdraw || (tokenForm as any).limits?.maxWithdraw || prev.limits.maxWithdraw,
        maxRedeem: (tokenForm as any).maxRedeem || (tokenForm as any).limits?.maxRedeem || prev.limits.maxRedeem,
      },
      pausable: (tokenForm as any).pausable ?? prev.pausable,
      yieldStrategy: (tokenForm as any).yieldStrategy || prev.yieldStrategy,
      // Only add these properties if they exist in tokenForm
      ...(tokenForm as any).vaultType ? { vaultType: (tokenForm as any).vaultType } : {},
      ...(tokenForm as any).riskProfile ? { riskProfile: (tokenForm as any).riskProfile } : {},
      ...(tokenForm as any).erc4626Extensions ? { erc4626Extensions: (tokenForm as any).erc4626Extensions } : {}
    }));
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      // Handle nested objects like fee.managementFee
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      // Handle simple fields
      return { ...prev, [field]: value };
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-semibold mb-4">Vault Details</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Vault Name *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The name of your tokenized vault</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name"
                  placeholder="My Yield Vault"
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol" className="flex items-center">
                  Vault Token Symbol *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The short symbol for your vault shares (e.g., "yDAI" for a DAI vault)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="symbol"
                  placeholder="yTKN"
                  value={config.symbol}
                  onChange={(e) => handleChange("symbol", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="description" className="flex items-center">
                Description
                <Tooltip>
                  <TooltipTrigger className="ml-1.5">
                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">A brief description of your vault and its yield strategy</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                placeholder="A brief description of your tokenized vault"
                value={config.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="decimals" className="flex items-center">
                  Vault Share Decimals *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Number of decimal places for vault shares (usually matches the underlying asset)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="18"
                  placeholder="18"
                  value={config.decimals}
                  onChange={(e) => handleChange("decimals", parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vaultType" className="flex items-center">
                  Vault Type *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The primary purpose of this tokenized vault</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select 
                  value={config.vaultType} 
                  onValueChange={(value) => handleChange("vaultType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vault type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yield">Yield Generation</SelectItem>
                    <SelectItem value="fund">Investment Fund</SelectItem>
                    <SelectItem value="staking">Staking</SelectItem>
                    <SelectItem value="lending">Lending Pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Standard Features Section */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-4">Standard Features</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Mintable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Allow new vault shares to be minted</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isMintable}
                    onCheckedChange={(checked) => handleChange("isMintable", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Burnable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Allow vault shares to be burned</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isBurnable}
                    onCheckedChange={(checked) => handleChange("isBurnable", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Permit Support (EIP-2612)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable gasless approvals via signatures</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.permit}
                    onCheckedChange={(checked) => handleChange("permit", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Flash Loans</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Allow flash loans of vault assets</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.flashLoans}
                    onCheckedChange={(checked) => handleChange("flashLoans", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Emergency Shutdown</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable emergency shutdown mechanism</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.emergencyShutdown}
                    onCheckedChange={(checked) => handleChange("emergencyShutdown", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Performance Tracking</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Track and emit performance metrics</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.performanceTracking}
                    onCheckedChange={(checked) => handleChange("performanceTracking", checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="asset" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="asset">Asset</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* Asset Tab */}
          <TabsContent value="asset">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-md font-semibold mb-4">Underlying Asset</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetAddress" className="flex items-center">
                      Asset Token Address *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The contract address of the ERC-20 token that this vault will manage</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="assetAddress"
                      placeholder="0x..."
                      value={config.assetAddress}
                      onChange={(e) => handleChange("assetAddress", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="assetName" className="flex items-center">
                        Asset Name
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Name of the underlying token (for display purposes)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="assetName"
                        placeholder="e.g., DAI Stablecoin"
                        value={config.assetName}
                        onChange={(e) => handleChange("assetName", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assetSymbol" className="flex items-center">
                        Asset Symbol
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Symbol of the underlying token (for display purposes)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="assetSymbol"
                        placeholder="e.g., DAI"
                        value={config.assetSymbol}
                        onChange={(e) => handleChange("assetSymbol", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetDecimals" className="flex items-center">
                      Asset Token Decimals *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Number of decimal places for the underlying asset token</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="assetDecimals"
                      type="number"
                      min="0"
                      max="18"
                      placeholder="18"
                      value={config.assetDecimals}
                      onChange={(e) => handleChange("assetDecimals", parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Strategy Tab */}
          <TabsContent value="strategy">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-md font-semibold mb-4">Yield Strategy</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="yieldStrategy" className="flex items-center">
                        Yield Strategy Type *
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">How will the vault generate yield from deposited assets</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select 
                        value={config.yieldStrategy} 
                        onValueChange={(value) => handleChange("yieldStrategy", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select yield strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lending">Lending (Aave, Compound)</SelectItem>
                          <SelectItem value="staking">Staking</SelectItem>
                          <SelectItem value="liquidity">Liquidity Provision</SelectItem>
                          <SelectItem value="custom">Custom Strategy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yieldSource" className="flex items-center">
                        Yield Source
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Primary source of yield generation</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select 
                        value={config.yieldSource} 
                        onValueChange={(value) => handleChange("yieldSource", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select yield source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="external">External Protocol</SelectItem>
                          <SelectItem value="compound">Compound</SelectItem>
                          <SelectItem value="aave">Aave</SelectItem>
                          <SelectItem value="yearn">Yearn</SelectItem>
                          <SelectItem value="convex">Convex</SelectItem>
                          <SelectItem value="hybrid">Multi-Protocol Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vaultStrategy" className="flex items-center">
                        Vault Strategy
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Overall strategy approach</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select 
                        value={config.vaultStrategy} 
                        onValueChange={(value) => handleChange("vaultStrategy", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vault strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="compound">Compound</SelectItem>
                          <SelectItem value="multi-asset">Multi-Asset</SelectItem>
                          <SelectItem value="algorithmic">Algorithmic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategyController" className="flex items-center">
                        Strategy Controller
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Address of the strategy controller contract</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="strategyController"
                        placeholder="0x... (optional)"
                        value={config.strategyController}
                        onChange={(e) => handleChange("strategyController", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Custom Strategy</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Enable custom strategy implementation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.customStrategy}
                      onCheckedChange={(checked) => handleChange("customStrategy", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategyDetails" className="flex items-center">
                      Strategy Details
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Detailed explanation of how the vault will generate yield</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Textarea
                      id="strategyDetails"
                      placeholder="Explain how your vault will generate yield..."
                      value={config.strategyDetails}
                      onChange={(e) => handleChange("strategyDetails", e.target.value)}
                      className="min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedAPY" className="flex items-center">
                      Expected APY (%)
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Estimated annual percentage yield (e.g., 5.0 for 5%)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="expectedAPY"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.0"
                      value={config.expectedAPY}
                      onChange={(e) => handleChange("expectedAPY", e.target.value)}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Protocol Integrations</h4>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between space-x-2 border rounded-md p-2">
                        <span className="text-sm">Compound Finance</span>
                        <Switch
                          checked={config.compoundIntegration}
                          onCheckedChange={(checked) => handleChange("compoundIntegration", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border rounded-md p-2">
                        <span className="text-sm">Aave</span>
                        <Switch
                          checked={config.aaveIntegration}
                          onCheckedChange={(checked) => handleChange("aaveIntegration", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border rounded-md p-2">
                        <span className="text-sm">Lido</span>
                        <Switch
                          checked={config.lidoIntegration}
                          onCheckedChange={(checked) => handleChange("lidoIntegration", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border rounded-md p-2">
                        <span className="text-sm">Uniswap</span>
                        <Switch
                          checked={config.uniswapIntegration}
                          onCheckedChange={(checked) => handleChange("uniswapIntegration", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2 border rounded-md p-2">
                        <span className="text-sm">Curve Finance</span>
                        <Switch
                          checked={config.curveIntegration}
                          onCheckedChange={(checked) => handleChange("curveIntegration", checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customIntegration">
                        Custom Integration Address
                      </Label>
                      <Input
                        id="customIntegration"
                        placeholder="0x... (contract address for custom integration)"
                        value={config.customIntegration}
                        onChange={(e) => handleChange("customIntegration", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* MISSING SECTION ADDED: Yield Optimization & Automation */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Yield Optimization & Automation</h4>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Yield Optimization</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Enable automatic yield optimization strategies</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={config.yieldOptimizationEnabled}
                          onCheckedChange={(checked) => handleChange("yieldOptimizationEnabled", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Automated Rebalancing</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Enable automated portfolio rebalancing</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={config.automatedRebalancing}
                          onCheckedChange={(checked) => handleChange("automatedRebalancing", checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="rebalanceThreshold">
                          Rebalance Threshold (%)
                        </Label>
                        <Input
                          id="rebalanceThreshold"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="5.0"
                          value={config.rebalanceThreshold}
                          onChange={(e) => handleChange("rebalanceThreshold", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="liquidityReserve">
                          Liquidity Reserve (%)
                        </Label>
                        <Input
                          id="liquidityReserve"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="10"
                          value={config.liquidityReserve}
                          onChange={(e) => handleChange("liquidityReserve", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxSlippage">
                          Maximum Slippage (%)
                        </Label>
                        <Input
                          id="maxSlippage"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          placeholder="1.0"
                          value={config.maxSlippage}
                          onChange={(e) => handleChange("maxSlippage", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="strategyDocumentation">
                        Strategy Documentation URI
                      </Label>
                      <Input
                        id="strategyDocumentation"
                        placeholder="https:// or ipfs://... (link to strategy documentation)"
                        value={config.strategyDocumentation}
                        onChange={(e) => handleChange("strategyDocumentation", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Parameters Tab */}
          <TabsContent value="params">
            <Card>
              <CardContent className="pt-6">
                <Accordion type="multiple" defaultValue={["fees", "limits"]}>
                  {/* Fees Configuration */}
                  <AccordionItem value="fees">
                    <AccordionTrigger className="text-md font-semibold">
                      Fee Structure
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Enable Fees</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Apply fees on deposits, withdrawals, or performance</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.fee.enabled}
                            onCheckedChange={(checked) => handleChange("fee.enabled", checked)}
                          />
                        </div>

                        {config.fee.enabled && (
                          <div className="space-y-4 pl-6">
                            <div className="space-y-2">
                              <Label htmlFor="managementFee" className="flex items-center">
                                Management Fee (% per year)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Annual fee charged on total assets under management</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input
                                id="managementFee"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="2.0"
                                value={config.fee.managementFee}
                                onChange={(e) => handleChange("fee.managementFee", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="performanceFee" className="flex items-center">
                                Performance Fee (%)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Fee charged on profits generated by the vault</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input
                                id="performanceFee"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="20.0"
                                value={config.fee.performanceFee}
                                onChange={(e) => handleChange("fee.performanceFee", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="depositFee" className="flex items-center">
                                Deposit Fee (%)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Fee charged when assets are deposited</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input
                                id="depositFee"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="0.1"
                                value={config.fee.depositFee}
                                onChange={(e) => handleChange("fee.depositFee", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="withdrawalFee" className="flex items-center">
                                Withdrawal Fee (%)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Fee charged when assets are withdrawn</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input
                                id="withdrawalFee"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="0.1"
                                value={config.fee.withdrawalFee}
                                onChange={(e) => handleChange("fee.withdrawalFee", e.target.value)}
                              />
                            </div>
                            
                            {/* MISSING FIELD ADDED: Fee Recipient */}
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="feeRecipient" className="flex items-center">
                                Fee Recipient Address
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Address that will receive all collected fees</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Input
                                id="feeRecipient"
                                placeholder="0x... (address to receive fees)"
                                value={config.feeRecipient}
                                onChange={(e) => handleChange("feeRecipient", e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Deposit/Withdrawal Limits */}
                  <AccordionItem value="limits">
                    <AccordionTrigger className="text-md font-semibold">
                      Deposit & Withdrawal Limits
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="space-y-2">
                          <Label htmlFor="minDeposit" className="flex items-center">
                            Minimum Deposit
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Minimum amount of assets that can be deposited (leave blank for no minimum)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="minDeposit"
                            placeholder="Leave blank for no minimum"
                            value={config.limits.minDeposit}
                            onChange={(e) => handleChange("limits.minDeposit", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxDeposit" className="flex items-center">
                            Maximum Deposit
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Maximum amount of assets that can be deposited (leave blank for no maximum)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="maxDeposit"
                            placeholder="Leave blank for no maximum"
                            value={config.limits.maxDeposit}
                            onChange={(e) => handleChange("limits.maxDeposit", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxWithdraw" className="flex items-center">
                            Maximum Withdrawal
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Maximum amount of assets that can be withdrawn at once (leave blank for no maximum)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="maxWithdraw"
                            placeholder="Leave blank for no maximum"
                            value={config.limits.maxWithdraw}
                            onChange={(e) => handleChange("limits.maxWithdraw", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxRedeem" className="flex items-center">
                            Maximum Redemption
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Maximum amount of shares that can be redeemed at once (leave blank for no maximum)</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            id="maxRedeem"
                            placeholder="Leave blank for no maximum"
                            value={config.limits.maxRedeem}
                            onChange={(e) => handleChange("limits.maxRedeem", e.target.value)}
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* MISSING FIELDS ADDED: Additional Limit Controls */}
                        <h5 className="text-sm font-medium mb-3">Additional Limit Controls</h5>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="depositLimit" className="flex items-center">
                              Total Deposit Limit
                              <Tooltip>
                                <TooltipTrigger className="ml-1.5">
                                  <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Maximum total assets that can be deposited in the vault</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="depositLimit"
                              placeholder="Leave blank for unlimited"
                              value={config.depositLimit}
                              onChange={(e) => handleChange("depositLimit", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="withdrawalLimit" className="flex items-center">
                              Daily Withdrawal Limit
                              <Tooltip>
                                <TooltipTrigger className="ml-1.5">
                                  <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Maximum assets that can be withdrawn per day</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="withdrawalLimit"
                              placeholder="Leave blank for unlimited"
                              value={config.withdrawalLimit}
                              onChange={(e) => handleChange("withdrawalLimit", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="minWithdrawal" className="flex items-center">
                              Minimum Withdrawal
                              <Tooltip>
                                <TooltipTrigger className="ml-1.5">
                                  <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Minimum amount that can be withdrawn per transaction</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="minWithdrawal"
                              placeholder="Leave blank for no minimum"
                              value={config.minWithdrawal}
                              onChange={(e) => handleChange("minWithdrawal", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="maxWithdrawal" className="flex items-center">
                              Maximum Withdrawal Per Transaction
                              <Tooltip>
                                <TooltipTrigger className="ml-1.5">
                                  <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Maximum amount that can be withdrawn in a single transaction</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="maxWithdrawal"
                              placeholder="Leave blank for no maximum"
                              value={config.maxWithdrawal}
                              onChange={(e) => handleChange("maxWithdrawal", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Access Control */}
                  <AccordionItem value="access">
                    <AccordionTrigger className="text-md font-semibold">
                      Access Control
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="space-y-2">
                          <Label className="flex items-center">
                            Access Control Model
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Choose how admin permissions are managed</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div 
                              className={`border rounded-md p-2 cursor-pointer ${config.accessControl === "ownable" ? "border-primary bg-primary/5" : "border-muted"}`}
                              onClick={() => handleChange("accessControl", "ownable")}
                            >
                              <div className="font-medium">Ownable</div>
                              <div className="text-xs text-muted-foreground">Single owner with full control</div>
                            </div>
                            
                            <div 
                              className={`border rounded-md p-2 cursor-pointer ${config.accessControl === "roles" ? "border-primary bg-primary/5" : "border-muted"}`}
                              onClick={() => handleChange("accessControl", "roles")}
                            >
                              <div className="font-medium">Role-Based</div>
                              <div className="text-xs text-muted-foreground">Specific roles for different permissions</div>
                            </div>
                            
                            <div 
                              className={`border rounded-md p-2 cursor-pointer ${config.accessControl === "none" ? "border-primary bg-primary/5" : "border-muted"}`}
                              onClick={() => handleChange("accessControl", "none")}
                            >
                              <div className="font-medium">None</div>
                              <div className="text-xs text-muted-foreground">No central administration</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Enable Allowlist</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Restrict deposits to approved addresses only</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.allowlist}
                            onCheckedChange={(checked) => handleChange("allowlist", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Pausable</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow pausing deposits and withdrawals in emergency situations</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.pausable}
                            onCheckedChange={(checked) => handleChange("pausable", checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  {/* MISSING SECTION ADDED: Complex Configurations */}
                  <AccordionItem value="complex">
                    <AccordionTrigger className="text-md font-semibold">
                      Complex Configurations
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium">JSONB Configuration Fields</h5>
                          <p className="text-xs text-muted-foreground">
                            These fields store complex configuration objects in the database for advanced vault management.
                          </p>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="feeStructure" className="flex items-center">
                                Fee Structure (JSON)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Complex fee configuration as JSON object (e.g., tiered fees, time-based fees)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Textarea
                                id="feeStructure"
                                placeholder='{"type": "tiered", "tiers": [{"threshold": "0", "fee": "0.1"}, {"threshold": "100000", "fee": "0.05"}]}'
                                value={config.feeStructure ? JSON.stringify(config.feeStructure, null, 2) : ""}
                                onChange={(e) => {
                                  try {
                                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                    handleChange("feeStructure", parsed);
                                  } catch {
                                    // Invalid JSON - store as string for now
                                    handleChange("feeStructure", e.target.value);
                                  }
                                }}
                                className="min-h-20 font-mono text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="rebalancingRules" className="flex items-center">
                                Rebalancing Rules (JSON)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Automated rebalancing configuration as JSON object</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Textarea
                                id="rebalancingRules"
                                placeholder='{"enabled": true, "frequency": "daily", "triggers": ["threshold_breach", "time_based"], "maxRebalanceSize": "25"}'
                                value={config.rebalancingRules ? JSON.stringify(config.rebalancingRules, null, 2) : ""}
                                onChange={(e) => {
                                  try {
                                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                    handleChange("rebalancingRules", parsed);
                                  } catch {
                                    // Invalid JSON - store as string for now
                                    handleChange("rebalancingRules", e.target.value);
                                  }
                                }}
                                className="min-h-20 font-mono text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="withdrawalRules" className="flex items-center">
                                Withdrawal Rules (JSON)
                                <Tooltip>
                                  <TooltipTrigger className="ml-1.5">
                                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">Withdrawal restriction and penalty rules as JSON object</p>
                                  </TooltipContent>
                                </Tooltip>
                              </Label>
                              <Textarea
                                id="withdrawalRules"
                                placeholder='{"lockupPeriod": "7", "noticePeriod": "24", "penalties": {"earlyWithdrawal": "1.0"}}'
                                value={config.withdrawalRules ? JSON.stringify(config.withdrawalRules, null, 2) : ""}
                                onChange={(e) => {
                                  try {
                                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                    handleChange("withdrawalRules", parsed);
                                  } catch {
                                    // Invalid JSON - store as string for now
                                    handleChange("withdrawalRules", e.target.value);
                                  }
                                }}
                                className="min-h-20 font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-md font-semibold mb-4">Advanced Features</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Preview Functions</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Add preview functions (previewDeposit, previewMint, previewWithdraw, previewRedeem)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.previewFunctions}
                      onCheckedChange={(checked) => handleChange("previewFunctions", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Limit Functions</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Add limit functions (maxDeposit, maxMint, maxWithdraw, maxRedeem)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.limitFunctions}
                      onCheckedChange={(checked) => handleChange("limitFunctions", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Custom Hooks</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Add custom logic before/after key actions (e.g., deposit, withdraw)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.customHooks}
                      onCheckedChange={(checked) => handleChange("customHooks", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Automatic Reporting</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Emit events with performance metrics and asset values</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.autoReporting}
                      onCheckedChange={(checked) => handleChange("autoReporting", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ERC4626DetailedConfig;