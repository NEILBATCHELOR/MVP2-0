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
import { ERC1155Config, ERC1155SimpleConfigProps } from "@/components/tokens/types";

/**
 * Simple configuration component for ERC1155 (Multi-Token) tokens
 * Focuses on the core features needed to deploy an ERC-1155 contract
 */
const ERC1155ConfigMin: React.FC<ERC1155SimpleConfigProps> = ({ 
  tokenForm,
  handleInputChange,
  setTokenForm,
  onConfigChange,
  initialConfig = {} 
}) => {
  // If onConfigChange is provided, we'll use internal state for backward compatibility
  const [config, setConfig] = useState<ERC1155Config>({
    name: initialConfig.name || "",
    symbol: initialConfig.symbol || "",
    description: initialConfig.description || "",
    baseUri: initialConfig.baseUri || "",
    metadataStorage: initialConfig.metadataStorage || "ipfs",
    batchMinting: initialConfig.batchMinting ?? true,
    hasRoyalty: initialConfig.hasRoyalty ?? false,
    royaltyPercentage: initialConfig.royaltyPercentage || "0",
    royaltyReceiver: initialConfig.royaltyReceiver || "",
    // Phase 2: Add missing fields with defaults
    containerEnabled: initialConfig.containerEnabled ?? false,
    supplyTracking: initialConfig.supplyTracking ?? true,
    isBurnable: initialConfig.isBurnable ?? false,
    isPausable: initialConfig.isPausable ?? false,
    enableApprovalForAll: initialConfig.enableApprovalForAll ?? true,
    accessControl: initialConfig.accessControl || "ownable",
    tokenTypes: Array.isArray(initialConfig.tokenTypes) && initialConfig.tokenTypes.length > 0
      ? initialConfig.tokenTypes
      : [{ id: "1", name: "Token Type 1", supply: "1000", fungible: true }]
  });

  // State for token types - initialize from initialConfig if available
  const [tokenTypes, setTokenTypes] = useState(() => {
    // Always ensure tokenTypes is initialized properly
    if (Array.isArray(initialConfig.tokenTypes) && initialConfig.tokenTypes.length > 0) {
      return initialConfig.tokenTypes.map(token => ({
        id: token.id || "1",
        name: token.name || "Token Type 1",
        supply: token.supply || "1000",
        fungible: token.fungible ?? true
      }));
    }
    return [{ id: "1", name: "Token Type 1", supply: "1000", fungible: true }];
  });

  // Call onConfigChange when config changes (only if using internal state)
  useEffect(() => {
    if (onConfigChange) {
      // Ensure tokenTypes is always included as required by ERC1155Config
      const configWithRequiredFields: ERC1155Config = {
        ...config,
        tokenTypes: config.tokenTypes || []
      };
      onConfigChange(configWithRequiredFields);
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

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (onConfigChange) {
      setConfig(prev => ({ ...prev, [name]: value }));
    } else {
      setTokenForm((prev: any) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle token type changes
  const handleTokenTypeChange = (index: number, field: string, value: string | boolean) => {
    setConfig(prev => {
      const updatedTokenTypes = [...prev.tokenTypes];
      updatedTokenTypes[index] = { ...updatedTokenTypes[index], [field]: value };
      return {
        ...prev,
        tokenTypes: updatedTokenTypes
      };
    });
  };

  // Add a new token type
  const addTokenType = () => {
    // Calculate a new unused ID
    setConfig(prev => {
      const newId = (Math.max(...prev.tokenTypes.map(t => parseInt(t.id) || 0), 0) + 1).toString();
      return {
        ...prev,
        tokenTypes: [...prev.tokenTypes, { id: newId, name: `Token Type ${newId}`, supply: "1000", fungible: true }]
      };
    });
  };

  // Remove a token type
  const removeTokenType = (index: number) => {
    setConfig(prev => {
      if (prev.tokenTypes.length <= 1) {
        return prev; // Always keep at least one token type
      }
      return {
        ...prev,
        tokenTypes: prev.tokenTypes.filter((_, i) => i !== index)
      };
    });
  };

  // Determine which values to display (tokenForm or internal config)
  // Ensure displayValues are never undefined to prevent controlled/uncontrolled input warnings
  // Use type assertion to handle the empty object case
  const displayValues = onConfigChange ? config : (tokenForm || {}) as ERC1155Config;

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Collection Details Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Collection Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      Collection Name *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The name of your token collection</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="My ERC-1155 Collection"
                      value={displayValues.name || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="flex items-center">
                      Collection Symbol *
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The short symbol for your collection</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="M1155"
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
                        <p className="max-w-xs">A brief description of your token collection</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="A brief description of your ERC-1155 collection"
                    value={displayValues.description || ""}
                    onChange={handleChange}
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
                    <Select 
                      value={displayValues.metadataStorage || "ipfs"} 
                      onValueChange={(value) => handleSelectChange("metadataStorage", value)}
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
                          <p className="max-w-xs">The base URI for all token metadata (e.g., "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/"). Token IDs will be appended to this URI.</p>
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Batch Minting</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allow minting multiple token types in a single transaction</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.batchMinting || false}
                      onCheckedChange={(checked) => handleSwitchChange("batchMinting", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Features Section - Phase 2 Addition */}
              <div>
                <h3 className="text-md font-medium mb-4">Advanced Features</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Container Support</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allow tokens to be contained within other tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.containerEnabled || false}
                      onCheckedChange={(checked) => handleSwitchChange("containerEnabled", checked)}
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
                          <p className="max-w-xs">Track token supply automatically</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.supplyTracking ?? true}
                      onCheckedChange={(checked) => handleSwitchChange("supplyTracking", checked)}
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
                          <p className="max-w-xs">Allow tokens to be burned (destroyed)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.isBurnable || false}
                      onCheckedChange={(checked) => handleSwitchChange("isBurnable", checked)}
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
                          <p className="max-w-xs">Allow pausing all token transfers</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.isPausable || false}
                      onCheckedChange={(checked) => handleSwitchChange("isPausable", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessControl" className="flex items-center">
                      Access Control
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">How access to administrative functions is controlled</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select 
                      value={displayValues.accessControl || "ownable"} 
                      onValueChange={(value) => handleSelectChange("accessControl", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access control method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ownable">Ownable (Single Owner)</SelectItem>
                        <SelectItem value="roles">Role-Based Access</SelectItem>
                        <SelectItem value="none">No Access Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Token Types Section */}
              <div>
                <h3 className="text-md font-medium mb-4">
                  Token Types
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (Define your token IDs)
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {config.tokenTypes.map((tokenType, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Token ID: {tokenType.id}</h4>
                        {config.tokenTypes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTokenType(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`tokenName-${index}`}>
                            Token Name
                          </Label>
                          <Input
                            id={`tokenName-${index}`}
                            value={tokenType.name}
                            onChange={(e) => handleTokenTypeChange(index, "name", e.target.value)}
                            placeholder="Gold Coin"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`tokenSupply-${index}`}>
                            Initial Supply
                          </Label>
                          <Input
                            id={`tokenSupply-${index}`}
                            type="number"
                            min="1"
                            value={tokenType.supply}
                            onChange={(e) => handleTokenTypeChange(index, "supply", e.target.value)}
                            placeholder="1000"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <Switch
                          id={`tokenFungible-${index}`}
                          checked={tokenType.fungible}
                          onCheckedChange={(checked) => handleTokenTypeChange(index, "fungible", checked)}
                        />
                        <Label htmlFor={`tokenFungible-${index}`}>
                          Fungible Token
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">If enabled, creates a fungible token with the specified supply. If disabled, creates a single NFT.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={addTokenType}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Token Type
                  </Button>
                </div>
              </div>

              {/* Royalty Settings Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Royalty Settings (EIP-2981)</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Enable Royalties</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Adds royaltyInfo(uint256 tokenId, uint256 salePrice) for creator royalties on secondary sales</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.hasRoyalty || false}
                      onCheckedChange={(checked) => handleSwitchChange("hasRoyalty", checked)}
                    />
                  </div>

                  {displayValues.hasRoyalty && (
                    <div className="pl-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="royaltyPercentage" className="flex items-center">
                          Royalty Percentage (%)
                          <Tooltip>
                            <TooltipTrigger className="ml-1.5">
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">The percentage of the sale price that goes to the creator (e.g., 5.0 for 5%)</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="royaltyPercentage"
                          name="royaltyPercentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="5.0"
                          value={displayValues.royaltyPercentage || "0"}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="royaltyReceiver" className="flex items-center">
                          Royalty Receiver Address
                          <Tooltip>
                            <TooltipTrigger className="ml-1.5">
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">The Ethereum address that will receive royalty payments</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="royaltyReceiver"
                          name="royaltyReceiver"
                          placeholder="0x..."
                          value={displayValues.royaltyReceiver || ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
};

export default ERC1155ConfigMin;