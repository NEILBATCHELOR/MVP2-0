import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ERC3525Config, ERC3525SimpleConfigProps } from "@/components/tokens/types";

/**
 * Simple configuration component for ERC3525 (Semi-Fungible Token) tokens
 * Focuses on the core features needed to deploy an ERC-3525 contract
 */
const ERC3525SimpleConfig: React.FC<ERC3525SimpleConfigProps> = ({ 
  tokenForm,
  handleInputChange,
  setTokenForm,
  onConfigChange,
  initialConfig = {} 
}) => {
  // If onConfigChange is provided, we'll use internal state for backward compatibility
  const [config, setConfig] = useState<ERC3525Config>({
    name: initialConfig.name || "",
    symbol: initialConfig.symbol || "",
    description: initialConfig.description || "",
    baseUri: initialConfig.baseUri || "",
    metadataStorage: initialConfig.metadataStorage || "ipfs",
    decimals: initialConfig.decimals ?? 18,
    slots: initialConfig.slots || []
  });

  // State for slots if not provided in initialConfig
  const [slots, setSlots] = useState(
    initialConfig.slots?.length 
      ? initialConfig.slots 
      : [{ id: "1", name: "Slot 1", description: "" }]
  );

  // Call onConfigChange when config changes (only if using internal state)
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({...config, slots});
    }
  }, [config, slots, onConfigChange]);

  // Handle switch/toggle changes for tokenForm
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (onConfigChange) {
      // Using internal state with onConfigChange
      setConfig(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Using tokenForm
      setTokenForm((prev: any) => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (onConfigChange) {
      setConfig(prev => ({ ...prev, [name]: value }));
    } else {
      handleInputChange(e);
    }
  };

  // Handle slot changes
  const handleSlotChange = (index: number, field: string, value: string) => {
    const updatedSlots = [...slots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    if (onConfigChange) {
      setSlots(updatedSlots);
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        slots: updatedSlots
      }));
    }
  };

  // Add a new slot
  const addSlot = () => {
    const newId = (parseInt(slots[slots.length - 1]?.id || "0") + 1).toString();
    const newSlot = { id: newId, name: `Slot ${newId}`, description: "" };
    
    if (onConfigChange) {
      setSlots([...slots, newSlot]);
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        slots: [...(prev.slots || []), newSlot]
      }));
    }
  };

  // Remove a slot
  const removeSlot = (index: number) => {
    const updatedSlots = [...slots];
    updatedSlots.splice(index, 1);
    
    if (onConfigChange) {
      setSlots(updatedSlots);
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        slots: updatedSlots
      }));
    }
  };

  // Determine which values to display (tokenForm or internal config)
  const displayValues = onConfigChange ? config : tokenForm;
  const displaySlots = onConfigChange ? slots : (tokenForm.slots || slots);

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Collection Details Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Token Details</h3>
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
                      name="name"
                      placeholder="My Semi-Fungible Token"
                      value={displayValues.name || ""}
                      onChange={handleChange}
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
                      name="symbol"
                      placeholder="SFT"
                      value={displayValues.symbol || ""}
                      onChange={handleChange}
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
                  <Input
                    id="description"
                    name="description"
                    placeholder="A brief description of your semi-fungible token"
                    value={displayValues.description || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="decimals" className="flex items-center">
                    Value Decimals *
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Number of decimal places for token values (units)</p>
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
                    value={displayValues.decimals || 18}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Metadata Settings Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Metadata Settings</h3>
                
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
                    <select
                      id="metadataStorage"
                      name="metadataStorage"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={displayValues.metadataStorage || "ipfs"}
                      onChange={handleInputChange}
                    >
                      <option value="ipfs">IPFS (Recommended)</option>
                      <option value="arweave">Arweave</option>
                      <option value="centralized">Centralized Server</option>
                      <option value="onchain">On-Chain</option>
                    </select>
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
                      name="baseUri"
                      placeholder="ipfs://..."
                      value={displayValues.baseUri || ""}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Can be set later if not available yet
                    </p>
                  </div>
                </div>
              </div>

              {/* Slots Configuration Section */}
              <div>
                <h3 className="text-md font-medium mb-4">
                  Slots Configuration
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (Define token categories)
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {displaySlots.map((slot, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Slot ID: {slot.id}</h4>
                        {displaySlots.length > 1 && (
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
                            onChange={(e) => handleSlotChange(index, "name", e.target.value)}
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
                            onChange={(e) => handleSlotChange(index, "description", e.target.value)}
                            placeholder="Describe what this slot represents"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={addSlot}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
};

export default ERC3525SimpleConfig;