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
import { ERC3525DetailedConfigProps } from "@/components/tokens/types";

/**
 * Detailed configuration component for ERC3525 (Semi-Fungible Token) tokens
 * Provides comprehensive options for all standard features and extensions
 */
const ERC3525DetailedConfig: React.FC<ERC3525DetailedConfigProps> = ({ 
  onConfigChange,
  setTokenForm,
  tokenForm
}) => {
  // Full configuration with all possible ERC-3525 options
  const [config, setConfig] = useState({
    // Core Token Details
    name: "",
    symbol: "",
    description: "",
    decimals: 18,
    valueDecimals: 0, // For precise token value units
    
    // Metadata Management
    baseUri: "",
    metadataStorage: "ipfs",
    dynamicMetadata: false,
    
    // Slots
    slots: [
      { id: "1", name: "Slot 1", description: "", properties: [], valueUnits: "units", transferable: true },
    ],
    
    // Allocations
    allocations: [],
    
    // Access Control
    accessControl: "ownable", // ownable, roles, none
    
    // Royalty Configuration
    hasRoyalty: false,
    royaltyPercentage: "",
    royaltyReceiver: "",
    
    // Core Features
    isBurnable: false,
    isPausable: false,
    slotApprovals: true,
    valueApprovals: true,
    valueTransfersEnabled: true,
    
    // MISSING ADVANCED FEATURES FROM AUDIT
    fractionalOwnershipEnabled: false, // Enable fractional ownership
    updatableUris: false, // Allow updating token metadata URIs
    updatableSlots: false, // Allow updating slot configurations
    mergable: false, // Allow merging tokens of the same slot
    splittable: false, // Allow splitting tokens into smaller amounts
    allowsSlotEnumeration: true, // Slot enumeration feature
    valueAggregation: false, // Value aggregation support
    permissioningEnabled: false, // Permission system
    supplyTracking: false, // Supply tracking feature
    updatableValues: false, // Value update capability
    fractionalizable: false, // Fractionalization support
    
    // Complex Configurations
    salesConfig: null,
    slotTransferValidation: null,
    customExtensions: "",
    
    // Legacy compatibility
    supportsEnumeration: true, // totalSupply, tokenByIndex, tokenOfOwnerByIndex
    fractionalTransfers: true, // Allow transferring partial units
    slotTransferability: true, // Allow transfers between slots
    transferRestrictions: false,
    dynamicAttributes: false, // Support for updating token attributes post-minting
    autoUnitCalculation: true, // Automatic calculation of units during transfers
    customSlotProperties: false,
  });

  // Update when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

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
      baseUri: (tokenForm as any).baseUri || prev.baseUri,
      metadataStorage: (tokenForm as any).metadataStorage || prev.metadataStorage,
      slots: (tokenForm as any).slots || prev.slots,
      // Only add these properties if they exist in tokenForm
      ...(tokenForm as any).financialInstrument ? { financialInstrument: (tokenForm as any).financialInstrument } : {},
      ...(tokenForm as any).derivativeTerms ? { derivativeTerms: (tokenForm as any).derivativeTerms } : {},
      ...(tokenForm as any).erc3525Extensions ? { erc3525Extensions: (tokenForm as any).erc3525Extensions } : {}
    }));
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      // Handle nested objects like slots[index].field
      if (field.includes('[')) {
        const match = field.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (match) {
          const [_, arrayName, indexStr, property] = match;
          const index = parseInt(indexStr);
          const array = [...prev[arrayName]];
          array[index] = { ...array[index], [property]: value };
          return { ...prev, [arrayName]: array };
        }
      }
      // Handle simple fields
      return { ...prev, [field]: value };
    });
  };

  // Add a new slot
  const addSlot = () => {
    const newId = (Math.max(...config.slots.map(s => parseInt(s.id)), 0) + 1).toString();
    setConfig(prev => ({
      ...prev,
      slots: [
        ...prev.slots,
        { 
          id: newId, 
          name: `Slot ${newId}`, 
          description: "", 
          properties: [],
          valueUnits: "units",
          transferable: true
        }
      ]
    }));
  };

  // Add a new allocation
  const addAllocation = () => {
    setConfig(prev => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        {
          slotId: config.slots.length > 0 ? config.slots[0].id : "1",
          tokenIdWithinSlot: "",
          value: "",
          recipient: ""
        }
      ]
    }));
  };

  // Remove an allocation
  const removeAllocation = (index: number) => {
    setConfig(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index)
    }));
  };

  // Update an allocation
  const updateAllocation = (index: number, field: string, value: string) => {
    setConfig(prev => {
      const updatedAllocations = [...prev.allocations];
      updatedAllocations[index] = { ...updatedAllocations[index], [field]: value };
      return { ...prev, allocations: updatedAllocations };
    });
  };

  // Remove a slot
  const removeSlot = (index: number) => {
    setConfig(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  };

  // Add a property to a slot
  const addSlotProperty = (slotIndex: number) => {
    setConfig(prev => {
      const updatedSlots = [...prev.slots];
      const properties = [...(updatedSlots[slotIndex].properties || [])];
      properties.push({ name: "", value: "" });
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], properties };
      return { ...prev, slots: updatedSlots };
    });
  };

  // Remove a property from a slot
  const removeSlotProperty = (slotIndex: number, propertyIndex: number) => {
    setConfig(prev => {
      const updatedSlots = [...prev.slots];
      const properties = [...(updatedSlots[slotIndex].properties || [])];
      properties.splice(propertyIndex, 1);
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], properties };
      return { ...prev, slots: updatedSlots };
    });
  };

  // Update a slot property
  const updateSlotProperty = (slotIndex: number, propertyIndex: number, field: string, value: string) => {
    setConfig(prev => {
      const updatedSlots = [...prev.slots];
      const properties = [...(updatedSlots[slotIndex].properties || [])];
      properties[propertyIndex] = { ...properties[propertyIndex], [field]: value };
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], properties };
      return { ...prev, slots: updatedSlots };
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-semibold mb-4">Token Details</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Token Name *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The name of your semi-fungible token</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name"
                  placeholder="My Semi-Fungible Token"
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
                      <p className="max-w-xs">The short symbol for your token</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="symbol"
                  placeholder="SFT"
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
                    <p className="max-w-xs">A brief description of your token</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                placeholder="A brief description of your semi-fungible token"
                value={config.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label htmlFor="decimals" className="flex items-center">
                  Token Decimals *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Standard ERC-20 style decimals for display</p>
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
                <Label htmlFor="valueDecimals" className="flex items-center">
                  Value Decimals *
                  <Tooltip>
                    <TooltipTrigger className="ml-1.5">
                      <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Number of decimal places for token values/units within slots</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="valueDecimals"
                  type="number"
                  min="0"
                  max="18"
                  placeholder="0"
                  value={config.valueDecimals}
                  onChange={(e) => handleChange("valueDecimals", parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="slots" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="slots">Slots</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          {/* Slots Tab */}
          <TabsContent value="slots">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold">Slots Configuration</h3>
                  <Button 
                    variant="outline" 
                    onClick={addSlot}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {config.slots.map((slot, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Slot ID: {slot.id}</h4>
                        {config.slots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSlot(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`slotName-${index}`}>
                            Slot Name
                          </Label>
                          <Input
                            id={`slotName-${index}`}
                            value={slot.name}
                            onChange={(e) => handleChange(`slots[${index}].name`, e.target.value)}
                            placeholder="e.g., Series A Bonds"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`slotDescription-${index}`}>
                            Slot Description
                          </Label>
                          <Input
                            id={`slotDescription-${index}`}
                            value={slot.description}
                            onChange={(e) => handleChange(`slots[${index}].description`, e.target.value)}
                            placeholder="Describe what this slot represents"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`slotValueUnits-${index}`}>
                            Value Units
                          </Label>
                          <Input
                            id={`slotValueUnits-${index}`}
                            value={slot.valueUnits || "units"}
                            onChange={(e) => handleChange(`slots[${index}].valueUnits`, e.target.value)}
                            placeholder="e.g., tCO2e, shares, credits"
                          />
                          <p className="text-xs text-muted-foreground">
                            The unit of measurement for values in this slot
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Slot Transferable</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow tokens in this slot to be transferred between addresses</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={slot.transferable ?? true}
                            onCheckedChange={(checked) => handleChange(`slots[${index}].transferable`, checked)}
                          />
                        </div>
                        
                        {config.customSlotProperties && (
                          <div className="space-y-2 mt-3">
                            <div className="flex justify-between items-center mb-2">
                              <Label>Custom Properties</Label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => addSlotProperty(index)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Property
                              </Button>
                            </div>
                            
                            {slot.properties?.length > 0 ? (
                              <div className="space-y-2">
                                {slot.properties.map((prop, propIndex) => (
                                  <div key={propIndex} className="flex gap-2 items-center">
                                    <Input
                                      placeholder="Property Name"
                                      value={prop.name}
                                      onChange={(e) => updateSlotProperty(index, propIndex, "name", e.target.value)}
                                      className="flex-1"
                                    />
                                    <Input
                                      placeholder="Value"
                                      value={prop.value}
                                      onChange={(e) => updateSlotProperty(index, propIndex, "value", e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeSlotProperty(index, propIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No custom properties defined</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Allocations Tab */}
          <TabsContent value="allocations">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold">Token Allocations</h3>
                  <Button 
                    variant="outline" 
                    onClick={addAllocation}
                    size="sm"
                    disabled={config.slots.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Allocation
                  </Button>
                </div>
                
                {config.slots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Please create at least one slot before adding allocations.</p>
                  </div>
                )}
                
                {config.allocations.length === 0 && config.slots.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No allocations defined yet. Click "Add Allocation" to get started.</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {config.allocations.map((allocation, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Allocation #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAllocation(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`allocationSlot-${index}`}>
                            Slot ID
                          </Label>
                          <Select 
                            value={allocation.slotId} 
                            onValueChange={(value) => updateAllocation(index, "slotId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.slots.map((slot) => (
                                <SelectItem key={slot.id} value={slot.id}>
                                  Slot {slot.id}: {slot.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`tokenIdWithinSlot-${index}`}>
                            Token ID within Slot
                          </Label>
                          <Input
                            id={`tokenIdWithinSlot-${index}`}
                            value={allocation.tokenIdWithinSlot}
                            onChange={(e) => updateAllocation(index, "tokenIdWithinSlot", e.target.value)}
                            placeholder="e.g., 1001"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`allocationValue-${index}`}>
                            Value Amount
                          </Label>
                          <Input
                            id={`allocationValue-${index}`}
                            value={allocation.value}
                            onChange={(e) => updateAllocation(index, "value", e.target.value)}
                            placeholder="e.g., 100.50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Amount of value units to allocate
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`allocationRecipient-${index}`}>
                            Recipient Address
                          </Label>
                          <Input
                            id={`allocationRecipient-${index}`}
                            value={allocation.recipient}
                            onChange={(e) => updateAllocation(index, "recipient", e.target.value)}
                            placeholder="0x..."
                          />
                          <p className="text-xs text-muted-foreground">
                            Address that will receive this allocation
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-md font-semibold mb-4">Metadata Configuration</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metadataStorage" className="flex items-center">
                      Metadata Storage *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Where your token metadata will be stored</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select 
                      value={config.metadataStorage} 
                      onValueChange={(value) => handleChange("metadataStorage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ipfs">IPFS (Recommended)</SelectItem>
                        <SelectItem value="arweave">Arweave</SelectItem>
                        <SelectItem value="centralized">Centralized Server</SelectItem>
                        <SelectItem value="onchain">On-Chain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseUri" className="flex items-center">
                      Base URI
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The base URI for all token metadata</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="baseUri"
                      placeholder="ipfs://..."
                      value={config.baseUri}
                      onChange={(e) => handleChange("baseUri", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Can be set later if not available yet
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Dynamic Metadata</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allows updating token metadata after minting</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.dynamicMetadata}
                      onCheckedChange={(checked) => handleChange("dynamicMetadata", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Dynamic Attributes</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Supports updating token attributes post-minting</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.dynamicAttributes}
                      onCheckedChange={(checked) => handleChange("dynamicAttributes", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Custom Slot Properties</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Enable custom properties for slots</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.customSlotProperties}
                      onCheckedChange={(checked) => handleChange("customSlotProperties", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardContent className="pt-6">
                <Accordion type="multiple" defaultValue={["core", "advanced", "transfer"]}>
                  {/* Core Extensions */}
                  <AccordionItem value="core">
                    <AccordionTrigger className="text-md font-semibold">
                      Core Features
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        {/* Royalty Configuration */}
                        <div className="space-y-3 p-3 border rounded-lg">
                          <h5 className="text-sm font-medium">Royalty Configuration</h5>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">Has Royalty</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Enable royalty payments on secondary sales</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Switch
                              checked={config.hasRoyalty}
                              onCheckedChange={(checked) => handleChange("hasRoyalty", checked)}
                            />
                          </div>
                          
                          {config.hasRoyalty && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="royaltyPercentage">Royalty Percentage (%)</Label>
                                <Input
                                  id="royaltyPercentage"
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  placeholder="2.5"
                                  value={config.royaltyPercentage}
                                  onChange={(e) => handleChange("royaltyPercentage", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="royaltyReceiver">Royalty Receiver Address</Label>
                                <Input
                                  id="royaltyReceiver"
                                  placeholder="0x..."
                                  value={config.royaltyReceiver}
                                  onChange={(e) => handleChange("royaltyReceiver", e.target.value)}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Enumeration Extension</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Adds totalSupply(), tokenByIndex() and tokenOfOwnerByIndex() functions</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.supportsEnumeration}
                            onCheckedChange={(checked) => handleChange("supportsEnumeration", checked)}
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
                                <p className="max-w-xs">Adds burn function to destroy tokens</p>
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
                            <span className="text-sm font-medium">Pausable</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Adds pause() and unpause() functions to temporarily disable transfers</p>
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
                            <span className="text-sm font-medium">Slot Approvals</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable approval mechanism for slot operations</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.slotApprovals}
                            onCheckedChange={(checked) => handleChange("slotApprovals", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Value Approvals</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable approval mechanism for value transfers</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.valueApprovals}
                            onCheckedChange={(checked) => handleChange("valueApprovals", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Value Transfers</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable transferring token values between addresses</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.valueTransfersEnabled}
                            onCheckedChange={(checked) => handleChange("valueTransfersEnabled", checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Advanced Features - MISSING FROM AUDIT */}
                  <AccordionItem value="advanced">
                    <AccordionTrigger className="text-md font-semibold">
                      Advanced Features
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Fractional Ownership</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable fractional ownership of semi-fungible tokens</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.fractionalOwnershipEnabled}
                            onCheckedChange={(checked) => handleChange("fractionalOwnershipEnabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Updatable URIs</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow updating token metadata URIs after deployment</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.updatableUris}
                            onCheckedChange={(checked) => handleChange("updatableUris", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Updatable Slots</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow updating slot configurations after deployment</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.updatableSlots}
                            onCheckedChange={(checked) => handleChange("updatableSlots", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Mergable Tokens</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow merging tokens of the same slot</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.mergable}
                            onCheckedChange={(checked) => handleChange("mergable", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Splittable Tokens</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow splitting tokens into smaller amounts</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.splittable}
                            onCheckedChange={(checked) => handleChange("splittable", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Slot Enumeration</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable enumeration of slots and their properties</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.allowsSlotEnumeration}
                            onCheckedChange={(checked) => handleChange("allowsSlotEnumeration", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Value Aggregation</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Support aggregating values across multiple tokens</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.valueAggregation}
                            onCheckedChange={(checked) => handleChange("valueAggregation", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Permission System</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable advanced permission controls for operations</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.permissioningEnabled}
                            onCheckedChange={(checked) => handleChange("permissioningEnabled", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Supply Tracking</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Track total supply and circulation metrics</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.supplyTracking}
                            onCheckedChange={(checked) => handleChange("supplyTracking", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Updatable Values</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allow updating token values after minting</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.updatableValues}
                            onCheckedChange={(checked) => handleChange("updatableValues", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Fractionalizable</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enable tokens to be fractionalized into smaller units</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.fractionalizable}
                            onCheckedChange={(checked) => handleChange("fractionalizable", checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Transfer Features */}
                  <AccordionItem value="transfer">
                    <AccordionTrigger className="text-md font-semibold">
                      Transfer Features
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Fractional Transfers</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allows transferring portions of a token's units</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.fractionalTransfers}
                            onCheckedChange={(checked) => handleChange("fractionalTransfers", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Slot Transferability</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allows transferring tokens between different slots</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.slotTransferability}
                            onCheckedChange={(checked) => handleChange("slotTransferability", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Auto Unit Calculation</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Automatically calculates units during transfers</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.autoUnitCalculation}
                            onCheckedChange={(checked) => handleChange("autoUnitCalculation", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Transfer Restrictions</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Enables restrictions on who can receive tokens</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.transferRestrictions}
                            onCheckedChange={(checked) => handleChange("transferRestrictions", checked)}
                          />
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
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Complex Configurations */}
                  <AccordionItem value="complex">
                    <AccordionTrigger className="text-md font-semibold">
                      Complex Configurations
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="space-y-2">
                          <Label htmlFor="customExtensions" className="flex items-center">
                            Custom Extensions
                            <Tooltip>
                              <TooltipTrigger className="ml-1.5">
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Describe any custom extensions or special features</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Textarea
                            id="customExtensions"
                            placeholder="Describe any custom extensions, integrations, or special features..."
                            value={config.customExtensions}
                            onChange={(e) => handleChange("customExtensions", e.target.value)}
                            className="min-h-20"
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">Sales Configuration</h5>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor="salesEnabled">Enable Sales</Label>
                              <Switch
                                checked={config.salesConfig?.enabled || false}
                                onCheckedChange={(checked) => 
                                  handleChange("salesConfig", { 
                                    ...config.salesConfig, 
                                    enabled: checked 
                                  })
                                }
                              />
                            </div>
                            
                            {config.salesConfig?.enabled && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="pricePerUnit">Price per Unit</Label>
                                  <Input
                                    id="pricePerUnit"
                                    placeholder="10.00"
                                    value={config.salesConfig?.pricePerUnit || ""}
                                    onChange={(e) => 
                                      handleChange("salesConfig", { 
                                        ...config.salesConfig, 
                                        pricePerUnit: e.target.value 
                                      })
                                    }
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="currency">Currency</Label>
                                  <Select 
                                    value={config.salesConfig?.currency || ""}
                                    onValueChange={(value) => 
                                      handleChange("salesConfig", { 
                                        ...config.salesConfig, 
                                        currency: value 
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ETH">ETH</SelectItem>
                                      <SelectItem value="USDC">USDC</SelectItem>
                                      <SelectItem value="USDT">USDT</SelectItem>
                                      <SelectItem value="DAI">DAI</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">Slot Transfer Validation</h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Enable Transfer Validation</Label>
                              <Switch
                                checked={config.slotTransferValidation?.enabled || false}
                                onCheckedChange={(checked) => 
                                  handleChange("slotTransferValidation", { 
                                    ...config.slotTransferValidation, 
                                    enabled: checked 
                                  })
                                }
                              />
                            </div>
                            
                            {config.slotTransferValidation?.enabled && (
                              <div className="space-y-2">
                                <Label>Validation Rules</Label>
                                <div className="space-y-2">
                                  {['kyc_required', 'accredited_only', 'whitelist_only', 'compliance_check'].map((rule) => (
                                    <div key={rule} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`rule-${rule}`}
                                        checked={config.slotTransferValidation?.rules?.includes(rule) || false}
                                        onChange={(e) => {
                                          const currentRules = config.slotTransferValidation?.rules || [];
                                          const newRules = e.target.checked 
                                            ? [...currentRules, rule]
                                            : currentRules.filter(r => r !== rule);
                                          handleChange("slotTransferValidation", {
                                            ...config.slotTransferValidation,
                                            rules: newRules
                                          });
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                      <Label htmlFor={`rule-${rule}`} className="text-sm">
                                        {rule.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ERC3525DetailedConfig;