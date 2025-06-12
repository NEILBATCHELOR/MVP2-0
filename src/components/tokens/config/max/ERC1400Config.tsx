import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ERC1400DetailedConfigProps, TokenFormData } from "@/components/tokens/types";

/**
 * Detailed configuration component for ERC1400 (Security Token) tokens
 * Provides comprehensive options for all security token standard features
 */
const ERC1400DetailedConfig: React.FC<ERC1400DetailedConfigProps> = ({ 
  tokenForm = {} as TokenFormData,
  handleInputChange,
  setTokenForm 
}) => {
  // Full configuration with all possible ERC-1400 options
  const [config, setConfig] = useState({
    // Core Token Details
    name: tokenForm.name || "",
    symbol: tokenForm.symbol || "",
    description: tokenForm.description || "",
    decimals: tokenForm.decimals ?? 18,
    initialSupply: tokenForm.initialSupply || "",
    cap: tokenForm.cap || "",
    
    // Token Type
    securityType: tokenForm.securityType || "equity", // equity, debt, derivative, fund, reit, other
    tokenDetails: tokenForm.tokenDetails || "",
    
    // Issuing Entity Details
    issuingJurisdiction: tokenForm.issuingJurisdiction || "",
    issuingEntityName: tokenForm.issuingEntityName || "",
    issuingEntityLei: tokenForm.issuingEntityLei || "",
    regulationType: tokenForm.regulationType || "",
    
    // Compliance Configuration
    complianceAutomationLevel: tokenForm.complianceAutomationLevel || "manual",
    
    // Partitioning (ERC-1410)
    isMultiClass: tokenForm.isMultiClass ?? false,
    partitions: tokenForm.partitions || [{ name: "Default Partition", amount: "", transferable: true }],
    
    // Document Management (ERC-1643)
    documents: tokenForm.documents || [],
    legalTerms: tokenForm.legalTerms || "",
    prospectus: tokenForm.prospectus || "",
    
    // Controller Operations (ERC-1644)
    controllers: tokenForm.controllers || [""],
    enforceKYC: tokenForm.enforceKYC ?? true,
    forcedTransfersEnabled: tokenForm.forcedTransfersEnabled ?? true,
    forcedRedemptionEnabled: tokenForm.forcedRedemptionEnabled ?? true,
    
    // Transfer Restrictions (ERC-1594)
    transferRestrictions: tokenForm.transferRestrictions ?? true,
    whitelistEnabled: tokenForm.whitelistEnabled ?? true,
    geographicRestrictions: tokenForm.geographicRestrictions || [],
    investorAccreditation: tokenForm.investorAccreditation ?? false,
    holdingPeriod: tokenForm.holdingPeriod || "",
    maxInvestorCount: tokenForm.maxInvestorCount || "",
    
    // Compliance
    autoCompliance: tokenForm.autoCompliance ?? true,
    manualApprovals: tokenForm.manualApprovals ?? false,
    complianceModule: tokenForm.complianceModule || "",
    
    // Advanced Features
    isIssuable: tokenForm.isIssuable ?? true,
    isPausable: tokenForm.isPausable ?? true,
    granularControl: tokenForm.granularControl ?? false,
    dividendDistribution: tokenForm.dividendDistribution ?? false,
    corporateActions: tokenForm.corporateActions ?? false,
    
    // Custom Security Token Features
    customFeatures: tokenForm.customFeatures || ""
  });

  // Update parent state when config changes
  useEffect(() => {
    if (setTokenForm) {
      setTokenForm(prev => ({ ...prev, ...config }));
    }
  }, [config, setTokenForm]);
  
  // Update local state when tokenForm changes from parent
  useEffect(() => {
    setConfig(prev => ({
      // Core Token Details
      name: tokenForm.name || prev.name,
      symbol: tokenForm.symbol || prev.symbol,
      description: tokenForm.description || prev.description,
      decimals: tokenForm.decimals ?? prev.decimals,
      initialSupply: tokenForm.initialSupply || prev.initialSupply,
      cap: tokenForm.cap || prev.cap,
      
      // Token Type
      securityType: tokenForm.securityType || prev.securityType,
      tokenDetails: tokenForm.tokenDetails || prev.tokenDetails,
      
      // Issuing Entity Details
      issuingJurisdiction: tokenForm.issuingJurisdiction || prev.issuingJurisdiction,
      issuingEntityName: tokenForm.issuingEntityName || prev.issuingEntityName,
      issuingEntityLei: tokenForm.issuingEntityLei || prev.issuingEntityLei,
      regulationType: tokenForm.regulationType || prev.regulationType,
      
      // Compliance Configuration
      complianceAutomationLevel: tokenForm.complianceAutomationLevel || prev.complianceAutomationLevel,
      
      // Partitioning (ERC-1410)
      isMultiClass: tokenForm.isMultiClass ?? prev.isMultiClass,
      partitions: tokenForm.partitions || prev.partitions,
      
      // Document Management (ERC-1643)
      documents: tokenForm.documents || prev.documents,
      legalTerms: tokenForm.legalTerms || prev.legalTerms,
      prospectus: tokenForm.prospectus || prev.prospectus,
      
      // Controller Operations (ERC-1644)
      controllers: tokenForm.controllers || prev.controllers,
      enforceKYC: tokenForm.enforceKYC ?? prev.enforceKYC,
      forcedTransfersEnabled: tokenForm.forcedTransfersEnabled ?? prev.forcedTransfersEnabled,
      forcedRedemptionEnabled: tokenForm.forcedRedemptionEnabled ?? prev.forcedRedemptionEnabled,
      
      // Transfer Restrictions (ERC-1594)
      transferRestrictions: tokenForm.transferRestrictions ?? prev.transferRestrictions,
      whitelistEnabled: tokenForm.whitelistEnabled ?? prev.whitelistEnabled,
      geographicRestrictions: tokenForm.geographicRestrictions || prev.geographicRestrictions,
      investorAccreditation: tokenForm.investorAccreditation ?? prev.investorAccreditation,
      holdingPeriod: tokenForm.holdingPeriod || prev.holdingPeriod,
      maxInvestorCount: tokenForm.maxInvestorCount || prev.maxInvestorCount,
      
      // Compliance
      autoCompliance: tokenForm.autoCompliance ?? prev.autoCompliance,
      manualApprovals: tokenForm.manualApprovals ?? prev.manualApprovals,
      complianceModule: tokenForm.complianceModule || prev.complianceModule,
      
      // Advanced Features
      isIssuable: tokenForm.isIssuable ?? prev.isIssuable,
      isPausable: tokenForm.isPausable ?? prev.isPausable,
      granularControl: tokenForm.granularControl ?? prev.granularControl,
      dividendDistribution: tokenForm.dividendDistribution ?? prev.dividendDistribution,
      corporateActions: tokenForm.corporateActions ?? prev.corporateActions,
      
      // Custom Security Token Features
      customFeatures: tokenForm.customFeatures || prev.customFeatures
    }));
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      // Handle nested objects like partitions[index].field
      if (field.includes('[')) {
        const match = field.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (match) {
          const [_, arrayName, indexStr, property] = match;
          const index = parseInt(indexStr);
          const array = [...(prev as any)[arrayName]];
          array[index] = { ...array[index], [property]: value };
          return { ...prev, [arrayName]: array };
        }
      }
      // Handle simple fields
      return { ...prev, [field]: value };
    });
  };

  // Handle input change events
  const handleChangeEvent = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? (value === "" ? "" : Number(value)) : value;
    handleChange(name, val);
    
    // Also call parent handler if provided
    if (handleInputChange) {
      handleInputChange(e);
    }
  };

  // Add a new partition
  const addPartition = () => {
    setConfig(prev => ({
      ...prev,
      partitions: [
        ...prev.partitions,
        { name: `Partition ${prev.partitions.length + 1}`, amount: "", transferable: true }
      ]
    }));
  };

  // Remove a partition
  const removePartition = (index: number) => {
    setConfig(prev => ({
      ...prev,
      partitions: prev.partitions.filter((_, i) => i !== index)
    }));
  };

  // Add a new controller
  const addController = () => {
    setConfig(prev => ({
      ...prev,
      controllers: [...prev.controllers, ""]
    }));
  };

  // Remove a controller
  const removeController = (index: number) => {
    setConfig(prev => ({
      ...prev,
      controllers: prev.controllers.filter((_, i) => i !== index)
    }));
  };

  // Add a new document
  const addDocument = () => {
    setConfig(prev => ({
      ...prev,
      documents: [...prev.documents, { name: "", uri: "", hash: "" }]
    }));
  };

  // Remove a document
  const removeDocument = (index: number) => {
    setConfig(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Update document
  const updateDocument = (index: number, field: string, value: string) => {
    setConfig(prev => {
      const updatedDocuments = [...prev.documents];
      updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
      return { ...prev, documents: updatedDocuments };
    });
  };

  // Add a geographic restriction
  const addGeographicRestriction = () => {
    setConfig(prev => ({
      ...prev,
      geographicRestrictions: [...prev.geographicRestrictions, ""]
    }));
  };

  // Remove a geographic restriction
  const removeGeographicRestriction = (index: number) => {
    setConfig(prev => ({
      ...prev,
      geographicRestrictions: prev.geographicRestrictions.filter((_, i) => i !== index)
    }));
  };

  // Update geographic restriction
  const updateGeographicRestriction = (index: number, value: string) => {
    setConfig(prev => {
      const updatedRestrictions = [...prev.geographicRestrictions];
      updatedRestrictions[index] = value;
      return { ...prev, geographicRestrictions: updatedRestrictions };
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-semibold mb-4">Security Token Details</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Token Name *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The official name of your security token</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Security Token"
                  value={config.name}
                  onChange={handleChangeEvent}
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
                      <p className="max-w-xs">The short symbol for your security token (e.g., "SECTKN")</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder="SECTKN"
                  value={config.symbol}
                  onChange={handleChangeEvent}
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
                    <p className="max-w-xs">A brief description of your security token</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="A brief description of your security token"
                value={config.description}
                onChange={handleChangeEvent}
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
                      <p className="max-w-xs">Number of decimal places for the token</p>
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
                  onChange={handleChangeEvent}
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
                      <p className="max-w-xs">The initial amount of tokens to create</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="initialSupply"
                  name="initialSupply"
                  placeholder="1000000"
                  value={config.initialSupply}
                  onChange={handleChangeEvent}
                  required
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
                  onChange={handleChangeEvent}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityType" className="flex items-center">
                  Security Type *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The type of security this token represents</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select 
                  name="securityType"
                  value={config.securityType} 
                  onValueChange={(value) => handleChange("securityType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select security type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity">Equity (Shares)</SelectItem>
                    <SelectItem value="debt">Debt / Fixed Income</SelectItem>
                    <SelectItem value="derivative">Derivative</SelectItem>
                    <SelectItem value="fund">Investment Fund</SelectItem>
                    <SelectItem value="reit">Real Estate (REIT)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="tokenDetails" className="flex items-center">
                Token Details
                <Tooltip>
                  <TooltipTrigger className="ml-1.5">
                    <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Additional details about the security token</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tokenDetails"
                name="tokenDetails"
                placeholder="Additional security token details"
                value={config.tokenDetails}
                onChange={handleChangeEvent}
              />
            </div>
            
            {/* Issuing Entity Section */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-4">Issuing Entity Information</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issuingJurisdiction" className="flex items-center">
                    Issuing Jurisdiction
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The legal jurisdiction where the token is issued (e.g., Delaware, UK, Singapore)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="issuingJurisdiction"
                    name="issuingJurisdiction"
                    placeholder="e.g., Delaware, United States"
                    value={config.issuingJurisdiction}
                    onChange={handleChangeEvent}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regulationType" className="flex items-center">
                    Regulation Type
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The regulatory framework under which the token is issued</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select 
                    name="regulationType"
                    value={config.regulationType} 
                    onValueChange={(value) => handleChange("regulationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select regulation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reg-d">Regulation D (Private Placement)</SelectItem>
                      <SelectItem value="reg-a-plus">Regulation A+ (Mini-IPO)</SelectItem>
                      <SelectItem value="reg-s">Regulation S (Offshore)</SelectItem>
                      <SelectItem value="reg-cf">Regulation CF (Crowdfunding)</SelectItem>
                      <SelectItem value="public">Public Offering</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issuingEntityName" className="flex items-center">
                    Issuing Entity Name
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The legal name of the entity issuing the security token</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="issuingEntityName"
                    name="issuingEntityName"
                    placeholder="e.g., Chain Capital LLC"
                    value={config.issuingEntityName}
                    onChange={handleChangeEvent}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issuingEntityLei" className="flex items-center">
                    Legal Entity Identifier (LEI)
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">20-character LEI code for regulatory identification (optional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="issuingEntityLei"
                    name="issuingEntityLei"
                    placeholder="e.g., 549300EXAMPLE12345"
                    value={config.issuingEntityLei}
                    onChange={handleChangeEvent}
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="partitions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="partitions">Partitions</TabsTrigger>
            <TabsTrigger value="controllers">Controllers</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          {/* Partitions Tab */}
          <TabsContent value="partitions">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-md font-semibold">Token Partitions (ERC-1410)</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Different classes or tranches of tokens (e.g., Class A shares, Class B shares)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Enable Multi-Class</span>
                    <Switch
                      checked={config.isMultiClass}
                      onCheckedChange={(checked) => handleChange("isMultiClass", checked)}
                    />
                  </div>
                </div>
                
                {config.isMultiClass ? (
                  <div className="space-y-4">
                    {config.partitions.map((partition, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Partition {index + 1}</h4>
                          {config.partitions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePartition(index)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`partitionName-${index}`}>
                              Partition Name
                            </Label>
                            <Input
                              id={`partitionName-${index}`}
                              value={partition.name}
                              onChange={(e) => handleChange(`partitions[${index}].name`, e.target.value)}
                              placeholder="e.g., Class A Shares"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`partitionAmount-${index}`}>
                              Initial Amount
                            </Label>
                            <Input
                              id={`partitionAmount-${index}`}
                              value={partition.amount}
                              onChange={(e) => handleChange(`partitions[${index}].amount`, e.target.value)}
                              placeholder="Amount of tokens in this partition"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm">Transferable</span>
                          <Switch
                            checked={partition.transferable}
                            onCheckedChange={(checked) => handleChange(`partitions[${index}].transferable`, checked)}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={addPartition}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Partition
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-md bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      Multi-Class is disabled. Your token will have a single class.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleChange("isMultiClass", true)}
                    >
                      Enable Multi-Class
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Controllers Tab */}
          <TabsContent value="controllers">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-md font-semibold">Controllers (ERC-1644)</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Addresses with special permissions for regulatory and compliance purposes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Controllers have special permissions to enforce compliance, including forced transfers and redemptions.
                  </p>
                  
                  {config.controllers.map((controller, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Controller address (0x...)"
                        value={controller}
                        onChange={(e) => handleChange(`controllers[${index}]`, e.target.value)}
                        className="flex-1"
                      />
                      {config.controllers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeController(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={addController}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Controller
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Enforce KYC</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Require KYC verification before transfers</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.enforceKYC}
                        onCheckedChange={(checked) => handleChange("enforceKYC", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Enable Forced Transfers</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Allow controllers to force transfer tokens</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.forcedTransfersEnabled}
                        onCheckedChange={(checked) => handleChange("forcedTransfersEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Enable Forced Redemption</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Allow controllers to force redeem (burn) tokens</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.forcedRedemptionEnabled}
                        onCheckedChange={(checked) => handleChange("forcedRedemptionEnabled", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Restrictions Tab */}
          <TabsContent value="restrictions">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-md font-semibold">Transfer Restrictions (ERC-1594)</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Restrictions on who can receive tokens, enforcing regulatory compliance</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Enable Restrictions</span>
                    <Switch
                      checked={config.transferRestrictions}
                      onCheckedChange={(checked) => handleChange("transferRestrictions", checked)}
                    />
                  </div>
                </div>
                
                {config.transferRestrictions ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Enable Whitelist</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Only approved addresses can receive tokens</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.whitelistEnabled}
                        onCheckedChange={(checked) => handleChange("whitelistEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Require Investor Accreditation</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Require recipients to be accredited investors</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.investorAccreditation}
                        onCheckedChange={(checked) => handleChange("investorAccreditation", checked)}
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-2">
                      <Label htmlFor="holdingPeriod" className="flex items-center">
                        Holding Period (days)
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Minimum days tokens must be held before transfer (e.g., 90 for Rule 144)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="holdingPeriod"
                        name="holdingPeriod"
                        type="number"
                        min="0"
                        placeholder="0 (no holding period)"
                        value={config.holdingPeriod}
                        onChange={handleChangeEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxInvestorCount" className="flex items-center">
                        Maximum Investor Count
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Maximum number of investors allowed (e.g., 99 for Reg. D, 2000 for Reg. A+)</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="maxInvestorCount"
                        name="maxInvestorCount"
                        type="number"
                        min="0"
                        placeholder="Leave blank for no limit"
                        value={config.maxInvestorCount}
                        onChange={handleChangeEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center">
                        Geographic Restrictions
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Jurisdictions where the token cannot be transferred to</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      
                      {config.geographicRestrictions.length > 0 ? (
                        <div className="space-y-2">
                          {config.geographicRestrictions.map((restriction, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder="e.g., US or China"
                                value={restriction}
                                onChange={(e) => updateGeographicRestriction(index, e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeGeographicRestriction(index)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                          
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={addGeographicRestriction}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Restriction
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={addGeographicRestriction}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Geographic Restriction
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Automatic Compliance</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Automatically check compliance for each transfer</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.autoCompliance}
                        onCheckedChange={(checked) => handleChange("autoCompliance", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Manual Approvals</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Require manual approval for each transfer</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={config.manualApprovals}
                        onCheckedChange={(checked) => handleChange("manualApprovals", checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="complianceAutomationLevel" className="flex items-center">
                        Compliance Automation Level
                        <Tooltip>
                          <TooltipTrigger className="ml-1.5">
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Level of automation for compliance checks</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select 
                        name="complianceAutomationLevel"
                        value={config.complianceAutomationLevel} 
                        onValueChange={(value) => handleChange("complianceAutomationLevel", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select automation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual (All approvals manual)</SelectItem>
                          <SelectItem value="semi-automated">Semi-Automated (Basic rules automated)</SelectItem>
                          <SelectItem value="fully-automated">Fully Automated (All rules automated)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-md bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      Transfer restrictions are disabled. All transfers will be allowed without restrictions.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => handleChange("transferRestrictions", true)}
                    >
                      Enable Transfer Restrictions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-md font-semibold">Document Management (ERC-1643)</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Manage legal and regulatory documents associated with the token</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalTerms" className="flex items-center">
                      Legal Terms
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">URI to the legal terms document</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="legalTerms"
                      name="legalTerms"
                      placeholder="https://... or ipfs://..."
                      value={config.legalTerms}
                      onChange={handleChangeEvent}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prospectus" className="flex items-center">
                      Prospectus / Offering Document
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">URI to the prospectus or offering document</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="prospectus"
                      name="prospectus"
                      placeholder="https://... or ipfs://..."
                      value={config.prospectus}
                      onChange={handleChangeEvent}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Additional Documents
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Other documents linked to the token (e.g., financial statements)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    
                    {config.documents.length > 0 ? (
                      <div className="space-y-4">
                        {config.documents.map((doc, index) => (
                          <div key={index} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Document {index + 1}</h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(index)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`docName-${index}`}>
                                  Document Name
                                </Label>
                                <Input
                                  id={`docName-${index}`}
                                  value={doc.name}
                                  onChange={(e) => updateDocument(index, "name", e.target.value)}
                                  placeholder="e.g., Financial Statement"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`docUri-${index}`}>
                                  Document URI
                                </Label>
                                <Input
                                  id={`docUri-${index}`}
                                  value={doc.uri}
                                  onChange={(e) => updateDocument(index, "uri", e.target.value)}
                                  placeholder="https://... or ipfs://..."
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`docHash-${index}`}>
                                  Document Hash (optional)
                                </Label>
                                <Input
                                  id={`docHash-${index}`}
                                  value={doc.hash}
                                  onChange={(e) => updateDocument(index, "hash", e.target.value)}
                                  placeholder="SHA-256 hash of the document"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={addDocument}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Document
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={addDocument}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Document
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Advanced Features */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-md font-semibold">
              Advanced Features
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Issuable</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Allow minting additional tokens after initial issuance</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isIssuable}
                    onCheckedChange={(checked) => handleChange("isIssuable", checked)}
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
                        <p className="max-w-xs">Allow pausing all transfers in emergency situations</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.isPausable}
                    onCheckedChange={(checked) => handleChange("isPausable", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Granular Control</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable fine-grained control over token permissions and operations</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.granularControl}
                    onCheckedChange={(checked) => handleChange("granularControl", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Dividend Distribution</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable distribution of dividends to token holders</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.dividendDistribution}
                    onCheckedChange={(checked) => handleChange("dividendDistribution", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Corporate Actions</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable corporate actions like splits, mergers, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.corporateActions}
                    onCheckedChange={(checked) => handleChange("corporateActions", checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complianceModule" className="flex items-center">
                    External Compliance Module
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Address of external compliance contract (optional)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="complianceModule"
                    name="complianceModule"
                    placeholder="0x... (leave blank if not using)"
                    value={config.complianceModule}
                    onChange={handleChangeEvent}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customFeatures" className="flex items-center">
                    Custom Features
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Describe any custom features needed for your security token</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Textarea
                    id="customFeatures"
                    name="customFeatures"
                    placeholder="Describe any custom features you need..."
                    value={config.customFeatures}
                    onChange={handleChangeEvent}
                    className="min-h-20"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
};

export default ERC1400DetailedConfig;