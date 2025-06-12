import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ERC20DetailedConfigProps } from "@/components/tokens/types";

/**
 * Detailed configuration component for ERC20 tokens
 * Includes all standard features and advanced extensions
 */
const ERC20DetailedConfig: React.FC<ERC20DetailedConfigProps> = ({ 
  tokenForm = {},
  handleInputChange,
  setTokenForm,
  onConfigChange
}) => {
  // Full configuration with all possible ERC-20 options
  const [config, setConfig] = useState({
    // Core ERC-20 Details
    name: tokenForm.name || "",
    symbol: tokenForm.symbol || "",
    description: tokenForm.description || "",
    decimals: tokenForm.decimals ?? 18,
    initialSupply: (tokenForm as any).initialSupply || "1000000",
    
    // Token Classification
    tokenType: (tokenForm as any).tokenType || "utility", // utility, security, governance, stablecoin, etc.
    
    // Supply Management
    isMintable: (tokenForm as any).isMintable ?? false,
    isBurnable: (tokenForm as any).isBurnable ?? false,
    cap: (tokenForm as any).cap || "",
    
    // Access Controls
    isPausable: (tokenForm as any).isPausable ?? false,
    accessControl: (tokenForm as any).accessControl || "ownable", // ownable, roles, none
    
    // Advanced Features
    allowanceManagement: (tokenForm as any).allowanceManagement ?? false, // increaseAllowance/decreaseAllowance
    permit: (tokenForm as any).permit ?? false, // EIP-2612 permit function
    snapshot: (tokenForm as any).snapshot ?? false, // balance snapshots
    
    // Governance Features
    governanceFeatures: {
      enabled: (tokenForm as any).governanceFeatures?.enabled ?? false,
      votingPeriod: (tokenForm as any).governanceFeatures?.votingPeriod ?? "7",
      quorumPercentage: (tokenForm as any).governanceFeatures?.quorumPercentage ?? "10",
      proposalThreshold: (tokenForm as any).governanceFeatures?.proposalThreshold ?? "100000",
      votingThreshold: (tokenForm as any).governanceFeatures?.votingThreshold ?? "1"
    },
    
    // Custom Extensions
    feeOnTransfer: {
      enabled: (tokenForm as any).feeOnTransfer?.enabled ?? false,
      fee: (tokenForm as any).feeOnTransfer?.fee ?? "0.5",
      recipient: (tokenForm as any).feeOnTransfer?.recipient || ""
    },
    rebasing: {
      enabled: (tokenForm as any).rebasing?.enabled ?? false,
      mode: (tokenForm as any).rebasing?.mode || "automatic", // automatic or governance
      targetSupply: (tokenForm as any).rebasing?.targetSupply || ""
    },
    
    // Advanced JSONB Configuration Objects
    transferConfig: {
      enabled: (tokenForm as any).transferConfig?.enabled ?? false,
      transferRestrictions: {
        enabled: (tokenForm as any).transferConfig?.transferRestrictions?.enabled ?? false,
        cooldownPeriod: (tokenForm as any).transferConfig?.transferRestrictions?.cooldownPeriod ?? 0,
        maxTransferAmount: (tokenForm as any).transferConfig?.transferRestrictions?.maxTransferAmount || "",
        maxTransfersPerDay: (tokenForm as any).transferConfig?.transferRestrictions?.maxTransfersPerDay ?? 0
      },
      blacklistEnabled: (tokenForm as any).transferConfig?.blacklistEnabled ?? false,
      whitelistOnly: (tokenForm as any).transferConfig?.whitelistOnly ?? false,
      timeLocks: {
        enabled: (tokenForm as any).transferConfig?.timeLocks?.enabled ?? false,
        defaultLockPeriod: (tokenForm as any).transferConfig?.timeLocks?.defaultLockPeriod ?? 0
      }
    },
    gasConfig: {
      enabled: (tokenForm as any).gasConfig?.enabled ?? false,
      gasOptimization: {
        enabled: (tokenForm as any).gasConfig?.gasOptimization?.enabled ?? false,
        batchTransactions: (tokenForm as any).gasConfig?.gasOptimization?.batchTransactions ?? false,
        gasLimit: (tokenForm as any).gasConfig?.gasOptimization?.gasLimit ?? 0,
        maxGasPrice: (tokenForm as any).gasConfig?.gasOptimization?.maxGasPrice || ""
      },
      gasDelegation: {
        enabled: (tokenForm as any).gasConfig?.gasDelegation?.enabled ?? false,
        delegationAddress: (tokenForm as any).gasConfig?.gasDelegation?.delegationAddress || "",
        maxDelegatedGas: (tokenForm as any).gasConfig?.gasDelegation?.maxDelegatedGas || ""
      }
    },
    complianceConfig: {
      enabled: (tokenForm as any).complianceConfig?.enabled ?? false,
      kycRequired: (tokenForm as any).complianceConfig?.kycRequired ?? false,
      amlChecks: (tokenForm as any).complianceConfig?.amlChecks ?? false,
      regulatoryReporting: {
        enabled: (tokenForm as any).complianceConfig?.regulatoryReporting?.enabled ?? false,
        reportingInterval: (tokenForm as any).complianceConfig?.regulatoryReporting?.reportingInterval || "monthly",
        jurisdictions: (tokenForm as any).complianceConfig?.regulatoryReporting?.jurisdictions || []
      },
      complianceProvider: (tokenForm as any).complianceConfig?.complianceProvider || "",
      automaticBlocking: (tokenForm as any).complianceConfig?.automaticBlocking ?? false
    },
    whitelistConfig: {
      enabled: (tokenForm as any).whitelistConfig?.enabled ?? false,
      whitelistType: (tokenForm as any).whitelistConfig?.whitelistType || "address",
      addresses: (tokenForm as any).whitelistConfig?.addresses || [],
      domains: (tokenForm as any).whitelistConfig?.domains || [],
      allowedCountries: (tokenForm as any).whitelistConfig?.allowedCountries || [],
      blockedCountries: (tokenForm as any).whitelistConfig?.blockedCountries || [],
      tieredAccess: {
        enabled: (tokenForm as any).whitelistConfig?.tieredAccess?.enabled ?? false,
        tiers: (tokenForm as any).whitelistConfig?.tieredAccess?.tiers || []
      },
      temporaryAccess: {
        enabled: (tokenForm as any).whitelistConfig?.temporaryAccess?.enabled ?? false,
        defaultDuration: (tokenForm as any).whitelistConfig?.temporaryAccess?.defaultDuration ?? 0
      }
    }
  });

  // Update parent state when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    } else if (setTokenForm) {
      setTokenForm(prev => ({ ...prev, ...config }));
    }
  }, [config, onConfigChange, setTokenForm]);

  // Update local state when tokenForm changes from parent
  useEffect(() => {
    // Only update if tokenForm has changed
    setConfig(prev => ({
      ...prev, // Preserve all previous state properties
      name: tokenForm.name || prev.name,
      symbol: tokenForm.symbol || prev.symbol,
      description: tokenForm.description || prev.description,
      decimals: tokenForm.decimals ?? prev.decimals,
      initialSupply: (tokenForm as any).initialSupply || prev.initialSupply,
      isMintable: (tokenForm as any).isMintable ?? prev.isMintable,
      isBurnable: (tokenForm as any).isBurnable ?? prev.isBurnable,
      isPausable: (tokenForm as any).isPausable ?? prev.isPausable,
      cap: (tokenForm as any).cap || prev.cap,
      allowanceManagement: (tokenForm as any).allowanceManagement ?? prev.allowanceManagement,
      permit: (tokenForm as any).permit ?? prev.permit,
      snapshot: (tokenForm as any).snapshot ?? prev.snapshot,
      accessControl: (tokenForm as any).accessControl || prev.accessControl,
      feeOnTransfer: (tokenForm as any).feeOnTransfer || prev.feeOnTransfer,
      rebasing: (tokenForm as any).rebasing || prev.rebasing,
      // Only add these properties if they exist in tokenForm - tokenType and governanceFeatures are now always included
      ...(tokenForm as any).erc20Extensions ? { erc20Extensions: (tokenForm as any).erc20Extensions } : {}
    }));
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      // Handle nested objects like feeOnTransfer or rebasing
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        
        // Special validation for feeOnTransfer.recipient
        if (parent === 'feeOnTransfer' && child === 'recipient') {
          // Validate Ethereum address format
          const isValidAddress = value === '' || /^0x[a-fA-F0-9]{40}$/.test(value);
          if (!isValidAddress && value !== '') {
            // Show validation error but still update to allow user to continue typing
            console.warn('Invalid Ethereum address format');
          }
        }
        
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
            <h3 className="text-md font-semibold mb-4">Core ERC-20 Token Parameters</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Token Name *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The full name of your token (e.g., "Ethereum")</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Token"
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol" className="flex items-center">
                  Token Symbol *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The trading symbol for your token (e.g., "ETH")</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder="TKN"
                  value={config.symbol}
                  onChange={(e) => handleChange("symbol", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label className="flex items-center">
                Token Type *
                <Tooltip>
                  <TooltipTrigger className="ml-1.5">
                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Classification of your token's primary use case and regulatory category</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={config.tokenType} onValueChange={(value) => handleChange("tokenType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility Token</SelectItem>
                  <SelectItem value="security">Security Token</SelectItem>
                  <SelectItem value="governance">Governance Token</SelectItem>
                  <SelectItem value="stablecoin">Stablecoin</SelectItem>
                  <SelectItem value="asset_backed">Asset-Backed Token</SelectItem>
                  <SelectItem value="debt">Debt Token</SelectItem>
                  <SelectItem value="share">Share Token</SelectItem>
                  <SelectItem value="private_equity">Private Equity Token</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure Token</SelectItem>
                  <SelectItem value="real_estate">Real Estate Token</SelectItem>
                  <SelectItem value="commodity">Commodity Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="description" className="flex items-center">
                Description
                <Tooltip>
                  <TooltipTrigger className="ml-1.5">
                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">A brief description of your token's purpose</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="A brief description of your token"
                value={config.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="decimals" className="flex items-center">
                  Decimals *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Number of decimal places (standard is 18 for Ethereum-like precision)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="decimals"
                  name="decimals"
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
                <Label htmlFor="initialSupply" className="flex items-center">
                  Initial Supply *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The total number of tokens to create at launch</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="initialSupply"
                  name="initialSupply"
                  placeholder="1000000"
                  value={config.initialSupply}
                  onChange={(e) => handleChange("initialSupply", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={["supply", "access"]}>
          {/* Supply Management Section */}
          <AccordionItem value="supply">
            <AccordionTrigger className="text-md font-semibold">
              Supply Management
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Mintable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds mint(address to, uint256 amount) to create new tokens</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isMintable}
                    onCheckedChange={(checked) => handleChange("isMintable", checked)}
                  />
                </div>

                {config.isMintable && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="cap" className="flex items-center">
                      Maximum Supply Cap
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Set a maximum token supply limit (leave blank for unlimited)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="cap"
                      name="cap"
                      placeholder="Optional - leave blank for unlimited"
                      value={config.cap}
                      onChange={(e) => handleChange("cap", e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Burnable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds burn(uint256 amount) and burnFrom(address account, uint256 amount) to destroy tokens</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isBurnable}
                    onCheckedChange={(checked) => handleChange("isBurnable", checked)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Access Control Section */}
          <AccordionItem value="access">
            <AccordionTrigger className="text-md font-semibold">
              Access Control & Operations
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Pausable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds pause() and unpause() to temporarily disable transfers</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isPausable}
                    onCheckedChange={(checked) => handleChange("isPausable", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    Access Control System
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
                      <div className="text-xs text-muted-foreground">Simple ownership model with a single owner</div>
                    </div>
                    <div 
                      className={`border rounded-md p-2 cursor-pointer ${config.accessControl === "roles" ? "border-primary bg-primary/5" : "border-muted"}`}
                      onClick={() => handleChange("accessControl", "roles")}
                    >
                      <div className="font-medium">Role-Based</div>
                      <div className="text-xs text-muted-foreground">Different roles with specific permissions</div>
                    </div>
                    <div 
                      className={`border rounded-md p-2 cursor-pointer ${config.accessControl === "none" ? "border-primary bg-primary/5" : "border-muted"}`}
                      onClick={() => handleChange("accessControl", "none")}
                    >
                      <div className="font-medium">None</div>
                      <div className="text-xs text-muted-foreground">No access control (no owner)</div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Features Section */}
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-md font-semibold">
              Advanced Features
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Allowance Management</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds increaseAllowance and decreaseAllowance for safer allowance management</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.allowanceManagement}
                    onCheckedChange={(checked) => handleChange("allowanceManagement", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Permit (EIP-2612)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds permit function for gasless approvals via signed messages</p>
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
                    <span className="text-sm font-medium">Snapshot</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds support for taking token balance snapshots at specific times</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.snapshot}
                    onCheckedChange={(checked) => handleChange("snapshot", checked)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Governance Features Section */}
          <AccordionItem value="governance">
            <AccordionTrigger className="text-md font-semibold">
              Governance Features
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Enable Governance</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds governance capabilities including voting, proposals, and delegation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.governanceFeatures.enabled}
                    onCheckedChange={(checked) => handleChange("governanceFeatures.enabled", checked)}
                  />
                </div>

                {config.governanceFeatures.enabled && (
                  <div className="space-y-4 pl-6 pt-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="votingPeriod">Voting Period (days)</Label>
                        <Input
                          id="votingPeriod"
                          type="number"
                          min="1"
                          placeholder="7"
                          value={config.governanceFeatures.votingPeriod}
                          onChange={(e) => handleChange("governanceFeatures.votingPeriod", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="quorumPercentage">Quorum Percentage (%)</Label>
                        <Input
                          id="quorumPercentage"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="10"
                          value={config.governanceFeatures.quorumPercentage}
                          onChange={(e) => handleChange("governanceFeatures.quorumPercentage", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="proposalThreshold">Proposal Threshold</Label>
                        <Input
                          id="proposalThreshold"
                          placeholder="100000"
                          value={config.governanceFeatures.proposalThreshold}
                          onChange={(e) => handleChange("governanceFeatures.proposalThreshold", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="votingThreshold">Voting Threshold</Label>
                        <Input
                          id="votingThreshold"
                          placeholder="1"
                          value={config.governanceFeatures.votingThreshold}
                          onChange={(e) => handleChange("governanceFeatures.votingThreshold", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Custom Extensions Section */}
          <AccordionItem value="custom">
            <AccordionTrigger className="text-md font-semibold">
              Custom Extensions
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 p-2">
                {/* Fee-on-Transfer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Fee on Transfer</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Deducts a fee from each transfer, sent to a designated address</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.feeOnTransfer.enabled}
                      onCheckedChange={(checked) => handleChange("feeOnTransfer.enabled", checked)}
                    />
                  </div>

                  {config.feeOnTransfer.enabled && (
                    <div className="space-y-3 pl-6 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                        <Input
                          id="feePercentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.5"
                          value={config.feeOnTransfer.fee}
                          onChange={(e) => handleChange("feeOnTransfer.fee", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="feeRecipient">Fee Recipient Address</Label>
                        <Input
                          id="feeRecipient"
                          placeholder="0x..."
                          value={config.feeOnTransfer.recipient}
                          onChange={(e) => handleChange("feeOnTransfer.recipient", e.target.value)}
                          className={
                            config.feeOnTransfer.recipient && 
                            !/^0x[a-fA-F0-9]{40}$/.test(config.feeOnTransfer.recipient) &&
                            config.feeOnTransfer.recipient !== ""
                              ? "border-red-500" 
                              : ""
                          }
                        />
                        {config.feeOnTransfer.recipient && 
                         !/^0x[a-fA-F0-9]{40}$/.test(config.feeOnTransfer.recipient) &&
                         config.feeOnTransfer.recipient !== "" && (
                          <p className="text-sm text-red-500">
                            Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Rebasing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Rebasing</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Dynamically adjusts balances for elastic supply tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.rebasing.enabled}
                      onCheckedChange={(checked) => handleChange("rebasing.enabled", checked)}
                    />
                  </div>

                  {config.rebasing.enabled && (
                    <div className="space-y-3 pl-6 pt-2">
                      <div className="space-y-2">
                        <Label>Rebase Mode</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div 
                            className={`border rounded-md p-2 cursor-pointer ${config.rebasing.mode === "automatic" ? "border-primary bg-primary/5" : "border-muted"}`}
                            onClick={() => handleChange("rebasing.mode", "automatic")}
                          >
                            <div className="font-medium">Automatic</div>
                            <div className="text-xs text-muted-foreground">Rebases happen automatically based on external data</div>
                          </div>
                          <div 
                            className={`border rounded-md p-2 cursor-pointer ${config.rebasing.mode === "governance" ? "border-primary bg-primary/5" : "border-muted"}`}
                            onClick={() => handleChange("rebasing.mode", "governance")}
                          >
                            <div className="font-medium">Governance</div>
                            <div className="text-xs text-muted-foreground">Rebases triggered by governance decisions</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="targetSupply">Target Supply (optional)</Label>
                        <Input
                          id="targetSupply"
                          placeholder="Target supply for rebasing"
                          value={config.rebasing.targetSupply}
                          onChange={(e) => handleChange("rebasing.targetSupply", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Configurations Section */}
          <AccordionItem value="advancedConfigs">
            <AccordionTrigger className="text-md font-semibold">
              Advanced Configurations
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 p-2">
                
                {/* Transfer Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Transfer Configuration</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Configure transfer restrictions, cooldowns, and limits</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.transferConfig.enabled}
                      onCheckedChange={(checked) => handleChange("transferConfig.enabled", checked)}
                    />
                  </div>

                  {config.transferConfig.enabled && (
                    <Card className="ml-4">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Transfer Restrictions</span>
                          <Switch
                            checked={config.transferConfig.transferRestrictions.enabled}
                            onCheckedChange={(checked) => handleChange("transferConfig.transferRestrictions.enabled", checked)}
                          />
                        </div>

                        {config.transferConfig.transferRestrictions.enabled && (
                          <div className="space-y-3 pl-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="cooldownPeriod">Cooldown Period (hours)</Label>
                                <Input
                                  id="cooldownPeriod"
                                  type="number"
                                  min="0"
                                  placeholder="24"
                                  value={config.transferConfig.transferRestrictions.cooldownPeriod}
                                  onChange={(e) => handleChange("transferConfig.transferRestrictions.cooldownPeriod", parseInt(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="maxTransfersPerDay">Max Transfers Per Day</Label>
                                <Input
                                  id="maxTransfersPerDay"
                                  type="number"
                                  min="0"
                                  placeholder="10"
                                  value={config.transferConfig.transferRestrictions.maxTransfersPerDay}
                                  onChange={(e) => handleChange("transferConfig.transferRestrictions.maxTransfersPerDay", parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="maxTransferAmount">Max Transfer Amount</Label>
                              <Input
                                id="maxTransferAmount"
                                placeholder="1000000"
                                value={config.transferConfig.transferRestrictions.maxTransferAmount}
                                onChange={(e) => handleChange("transferConfig.transferRestrictions.maxTransferAmount", e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Blacklist Enabled</span>
                          <Switch
                            checked={config.transferConfig.blacklistEnabled}
                            onCheckedChange={(checked) => handleChange("transferConfig.blacklistEnabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Whitelist Only Mode</span>
                          <Switch
                            checked={config.transferConfig.whitelistOnly}
                            onCheckedChange={(checked) => handleChange("transferConfig.whitelistOnly", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Time Locks</span>
                          <Switch
                            checked={config.transferConfig.timeLocks.enabled}
                            onCheckedChange={(checked) => handleChange("transferConfig.timeLocks.enabled", checked)}
                          />
                        </div>

                        {config.transferConfig.timeLocks.enabled && (
                          <div className="space-y-2 pl-4">
                            <Label htmlFor="defaultLockPeriod">Default Lock Period (hours)</Label>
                            <Input
                              id="defaultLockPeriod"
                              type="number"
                              min="0"
                              placeholder="168"
                              value={config.transferConfig.timeLocks.defaultLockPeriod}
                              onChange={(e) => handleChange("transferConfig.timeLocks.defaultLockPeriod", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Gas Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Gas Optimization</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Configure gas limits, optimization strategies, and fee delegation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.gasConfig.enabled}
                      onCheckedChange={(checked) => handleChange("gasConfig.enabled", checked)}
                    />
                  </div>

                  {config.gasConfig.enabled && (
                    <Card className="ml-4">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Gas Optimization</span>
                          <Switch
                            checked={config.gasConfig.gasOptimization.enabled}
                            onCheckedChange={(checked) => handleChange("gasConfig.gasOptimization.enabled", checked)}
                          />
                        </div>

                        {config.gasConfig.gasOptimization.enabled && (
                          <div className="space-y-3 pl-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Batch Transactions</span>
                              <Switch
                                checked={config.gasConfig.gasOptimization.batchTransactions}
                                onCheckedChange={(checked) => handleChange("gasConfig.gasOptimization.batchTransactions", checked)}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="gasLimit">Gas Limit</Label>
                                <Input
                                  id="gasLimit"
                                  type="number"
                                  min="0"
                                  placeholder="21000"
                                  value={config.gasConfig.gasOptimization.gasLimit}
                                  onChange={(e) => handleChange("gasConfig.gasOptimization.gasLimit", parseInt(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="maxGasPrice">Max Gas Price (Gwei)</Label>
                                <Input
                                  id="maxGasPrice"
                                  placeholder="20"
                                  value={config.gasConfig.gasOptimization.maxGasPrice}
                                  onChange={(e) => handleChange("gasConfig.gasOptimization.maxGasPrice", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Gas Delegation</span>
                          <Switch
                            checked={config.gasConfig.gasDelegation.enabled}
                            onCheckedChange={(checked) => handleChange("gasConfig.gasDelegation.enabled", checked)}
                          />
                        </div>

                        {config.gasConfig.gasDelegation.enabled && (
                          <div className="space-y-3 pl-4">
                            <div className="space-y-2">
                              <Label htmlFor="delegationAddress">Delegation Address</Label>
                              <Input
                                id="delegationAddress"
                                placeholder="0x..."
                                value={config.gasConfig.gasDelegation.delegationAddress}
                                onChange={(e) => handleChange("gasConfig.gasDelegation.delegationAddress", e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="maxDelegatedGas">Max Delegated Gas (ETH)</Label>
                              <Input
                                id="maxDelegatedGas"
                                placeholder="0.1"
                                value={config.gasConfig.gasDelegation.maxDelegatedGas}
                                onChange={(e) => handleChange("gasConfig.gasDelegation.maxDelegatedGas", e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Compliance Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Compliance Configuration</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Configure regulatory compliance, KYC/AML, and reporting requirements</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.complianceConfig.enabled}
                      onCheckedChange={(checked) => handleChange("complianceConfig.enabled", checked)}
                    />
                  </div>

                  {config.complianceConfig.enabled && (
                    <Card className="ml-4">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">KYC Required</span>
                          <Switch
                            checked={config.complianceConfig.kycRequired}
                            onCheckedChange={(checked) => handleChange("complianceConfig.kycRequired", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">AML Checks</span>
                          <Switch
                            checked={config.complianceConfig.amlChecks}
                            onCheckedChange={(checked) => handleChange("complianceConfig.amlChecks", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Automatic Blocking</span>
                          <Switch
                            checked={config.complianceConfig.automaticBlocking}
                            onCheckedChange={(checked) => handleChange("complianceConfig.automaticBlocking", checked)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="complianceProvider">Compliance Provider</Label>
                          <Select 
                            value={config.complianceConfig.complianceProvider} 
                            onValueChange={(value) => handleChange("complianceConfig.complianceProvider", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select compliance provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chainalysis">Chainalysis</SelectItem>
                              <SelectItem value="elliptic">Elliptic</SelectItem>
                              <SelectItem value="ciphertrace">CipherTrace</SelectItem>
                              <SelectItem value="coinfirm">Coinfirm</SelectItem>
                              <SelectItem value="custom">Custom Provider</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Regulatory Reporting</span>
                          <Switch
                            checked={config.complianceConfig.regulatoryReporting.enabled}
                            onCheckedChange={(checked) => handleChange("complianceConfig.regulatoryReporting.enabled", checked)}
                          />
                        </div>

                        {config.complianceConfig.regulatoryReporting.enabled && (
                          <div className="space-y-3 pl-4">
                            <div className="space-y-2">
                              <Label>Reporting Interval</Label>
                              <Select 
                                value={config.complianceConfig.regulatoryReporting.reportingInterval} 
                                onValueChange={(value) => handleChange("complianceConfig.regulatoryReporting.reportingInterval", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="annually">Annually</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Jurisdictions</Label>
                              <div className="text-sm text-muted-foreground">
                                Configure jurisdiction-specific compliance rules
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Whitelist Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Whitelist Management</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Configure address whitelisting, blacklisting, and access controls</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.whitelistConfig.enabled}
                      onCheckedChange={(checked) => handleChange("whitelistConfig.enabled", checked)}
                    />
                  </div>

                  {config.whitelistConfig.enabled && (
                    <Card className="ml-4">
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Whitelist Type</Label>
                          <Select 
                            value={config.whitelistConfig.whitelistType} 
                            onValueChange={(value) => handleChange("whitelistConfig.whitelistType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select whitelist type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="address">Address-based</SelectItem>
                              <SelectItem value="domain">Domain-based</SelectItem>
                              <SelectItem value="country">Country-based</SelectItem>
                              <SelectItem value="mixed">Mixed Approach</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tiered Access</span>
                          <Switch
                            checked={config.whitelistConfig.tieredAccess.enabled}
                            onCheckedChange={(checked) => handleChange("whitelistConfig.tieredAccess.enabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Temporary Access</span>
                          <Switch
                            checked={config.whitelistConfig.temporaryAccess.enabled}
                            onCheckedChange={(checked) => handleChange("whitelistConfig.temporaryAccess.enabled", checked)}
                          />
                        </div>

                        {config.whitelistConfig.temporaryAccess.enabled && (
                          <div className="space-y-2 pl-4">
                            <Label htmlFor="defaultDuration">Default Duration (hours)</Label>
                            <Input
                              id="defaultDuration"
                              type="number"
                              min="0"
                              placeholder="168"
                              value={config.whitelistConfig.temporaryAccess.defaultDuration}
                              onChange={(e) => handleChange("whitelistConfig.temporaryAccess.defaultDuration", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Addresses Management</Label>
                          <div className="text-sm text-muted-foreground">
                            Configure allowed and blocked addresses
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Country Restrictions</Label>
                          <div className="text-sm text-muted-foreground">
                            Configure geographical restrictions based on country
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
};

export default ERC20DetailedConfig;