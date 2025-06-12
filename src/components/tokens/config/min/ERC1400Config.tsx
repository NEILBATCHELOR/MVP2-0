import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ERC1400Config, ERC1400SimpleConfigProps } from "@/components/tokens/types";

/**
 * Simple configuration component for ERC1400 (Security Token) tokens
 * Focuses on the core features needed to deploy a security token
 */
const ERC1400SimpleConfig: React.FC<ERC1400SimpleConfigProps> = ({ 
  tokenForm,
  handleInputChange,
  setTokenForm,
  onConfigChange,
  initialConfig = {} 
}) => {
  // If onConfigChange is provided, we'll use internal state for backward compatibility
  const [config, setConfig] = useState<ERC1400Config>({
    name: initialConfig.name || "",
    symbol: initialConfig.symbol || "",
    description: initialConfig.description || "",
    decimals: initialConfig.decimals ?? 18,
    initialSupply: initialConfig.initialSupply || "",
    cap: initialConfig.cap || "",
    partitions: initialConfig.partitions || [],
    controllers: initialConfig.controllers || [],
    isIssuable: initialConfig.isIssuable ?? true,
    isMultiClass: initialConfig.isMultiClass ?? false,
    transferRestrictions: initialConfig.transferRestrictions ?? true,
    trancheTransferability: initialConfig.trancheTransferability ?? false
  });

  // Initialize partitions if empty
  useEffect(() => {
    if ((!config.partitions || config.partitions.length === 0) && config.isMultiClass) {
      setConfig(prev => ({
        ...prev,
        partitions: [{ name: "Default Partition", amount: "" }]
      }));
    }
  }, [config.isMultiClass, config.partitions]);

  // Initialize controllers if empty
  useEffect(() => {
    if (!config.controllers || config.controllers.length === 0) {
      setConfig(prev => ({
        ...prev,
        controllers: [""]
      }));
    }
  }, [config.controllers]);

  // Call onConfigChange when config changes (only if using internal state)
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

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

  // Handle partition changes
  const handlePartitionChange = (index: number, field: string, value: string) => {
    const updatedPartitions = [...(config.partitions || [])];
    updatedPartitions[index] = { ...updatedPartitions[index], [field]: value };
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        partitions: updatedPartitions
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        partitions: updatedPartitions
      }));
    }
  };

  // Handle controller changes
  const handleControllerChange = (index: number, value: string) => {
    const updatedControllers = [...(config.controllers || [])];
    updatedControllers[index] = value;
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        controllers: updatedControllers
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        controllers: updatedControllers
      }));
    }
  };

  // Add a new partition
  const addPartition = () => {
    const updatedPartitions = [...(config.partitions || [])];
    updatedPartitions.push({ name: `Partition ${updatedPartitions.length + 1}`, amount: "" });
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        partitions: updatedPartitions
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        partitions: updatedPartitions
      }));
    }
  };

  // Remove a partition
  const removePartition = (index: number) => {
    const updatedPartitions = [...(config.partitions || [])];
    updatedPartitions.splice(index, 1);
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        partitions: updatedPartitions
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        partitions: updatedPartitions
      }));
    }
  };

  // Add a new controller
  const addController = () => {
    const updatedControllers = [...(config.controllers || [])];
    updatedControllers.push("");
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        controllers: updatedControllers
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        controllers: updatedControllers
      }));
    }
  };

  // Remove a controller
  const removeController = (index: number) => {
    const updatedControllers = [...(config.controllers || [])];
    updatedControllers.splice(index, 1);
    
    if (onConfigChange) {
      setConfig(prev => ({
        ...prev,
        controllers: updatedControllers
      }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        controllers: updatedControllers
      }));
    }
  };

  // Determine which values to display (tokenForm or internal config)
  const displayValues = onConfigChange ? config : tokenForm;

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Token Details Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Security Token Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      Token Name *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The name of your security token</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="My Security Token"
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
                          <p className="max-w-xs">The short symbol for your security token</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="SECTKN"
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
                        <p className="max-w-xs">A brief description of your security token</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="A brief description of your security token"
                    value={displayValues.description || ""}
                    onChange={handleChange}
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
                      value={displayValues.decimals || 18}
                      onChange={handleChange}
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
                      value={displayValues.initialSupply || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
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
                    value={displayValues.cap || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Security Token Features Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Security Token Features</h3>
                
                <div className="space-y-4">
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
                      checked={displayValues.isIssuable || false}
                      onCheckedChange={(checked) => handleSwitchChange("isIssuable", checked)}
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
                          <p className="max-w-xs">Enable regulatory restrictions on transfers (who can receive tokens)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.transferRestrictions || false}
                      onCheckedChange={(checked) => handleSwitchChange("transferRestrictions", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Multi-Class Token (Partitions)</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Create different classes/tranches of tokens with distinct properties</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.isMultiClass || false}
                      onCheckedChange={(checked) => handleSwitchChange("isMultiClass", checked)}
                    />
                  </div>

                  {displayValues.isMultiClass && (
                    <div className="pl-6 space-y-4">
                      <Label className="text-sm font-medium">Token Partitions</Label>
                      
                      {(displayValues.partitions || []).map((partition, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Partition {index + 1}</h4>
                            {(displayValues.partitions || []).length > 1 && (
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
                                onChange={(e) => handlePartitionChange(index, "name", e.target.value)}
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
                                onChange={(e) => handlePartitionChange(index, "amount", e.target.value)}
                                placeholder="Amount of tokens in this partition"
                              />
                            </div>
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
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Partition Transferability</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Allow transfers between different partitions</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={displayValues.trancheTransferability || false}
                          onCheckedChange={(checked) => handleSwitchChange("trancheTransferability", checked)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controllers Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Controllers</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Controllers have special permissions to enforce compliance, including forced transfers and redemptions.
                </p>
                
                <div className="space-y-4">
                  {(displayValues.controllers || []).map((controller, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Controller address (0x...)"
                        value={controller}
                        onChange={(e) => handleControllerChange(index, e.target.value)}
                        className="flex-1"
                      />
                      {(displayValues.controllers || []).length > 1 && (
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
};

export default ERC1400SimpleConfig;