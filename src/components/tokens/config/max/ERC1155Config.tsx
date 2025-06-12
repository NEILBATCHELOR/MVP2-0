import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FileUp } from "lucide-react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ERC1155DetailedConfigProps } from "@/components/tokens/types";

/**
 * Detailed configuration component for ERC1155 (Multi-Token) tokens
 * Provides comprehensive options for configuring an ERC-1155 contract
 */
const ERC1155ConfigMax: React.FC<ERC1155DetailedConfigProps> = ({ 
  onConfigChange,
  initialConfig = {},
  setTokenForm,
  tokenForm
}) => {
  // Initialize config from provided initialConfig if available
  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      // Core Collection Details
      name: "",
      symbol: "",
      description: "",
      
      // Metadata Management
      baseUri: "",
      metadataStorage: "ipfs",
      dynamicUris: false,
      
      // Token Types (use default if none provided)
      tokenTypes: [
        { id: "1", name: "Token Type 1", supply: "1000", fungible: true, maxSupply: "", metadataUri: "" },
      ],
      
      // Access Control
      accessControl: "ownable", // ownable, roles, none
      
      // Batch Operations
      batchMinting: true,
      batchTransfers: true,
      
      // Compliance & Restrictions
      transferRestrictions: false,
      whitelist: false,
      blacklist: false,
      
      // Supply Management
      supplyTracking: true,
      mintingRoles: false,
      burningEnabled: true,
      
      // Royalty Standard (EIP-2981)
      hasRoyalty: false,
      royaltyPercentage: "0",
      royaltyReceiver: "",
      
      // Advanced Features
      pausable: false,
      updatableMetadata: false,
      containerEnabled: false, // For composite tokens
    };
    
    // Merge with provided initialConfig
    const mergedConfig = { ...defaultConfig, ...initialConfig };
    
    // Special handling for tokenTypes - ensure it's properly initialized
    if (initialConfig && Array.isArray(initialConfig.tokenTypes) && initialConfig.tokenTypes.length > 0) {
      mergedConfig.tokenTypes = initialConfig.tokenTypes.map(token => {
        // Start with base required properties
        const tokenData = {
          id: token.id || "1",
          name: token.name || "Token Type 1",
          supply: token.supply || "1000",
          fungible: token.fungible ?? true
        };
        
        // Add rarityLevel if present
        if (token.rarityLevel) {
          tokenData['rarityLevel'] = token.rarityLevel;
        }
        
        // Use type assertion for the extended properties needed by the UI
        return tokenData as any; // This allows the UI to use additional properties while satisfying the type system
      });
    }
    
    return mergedConfig;
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
    // Ensure tokenForm is defined before accessing its properties
    if (!tokenForm) return;
    
    setConfig(prev => ({
      ...prev,
      name: tokenForm.name || prev.name,
      symbol: tokenForm.symbol || prev.symbol,
      description: tokenForm.description || prev.description,
      baseUri: (tokenForm as any).baseUri || prev.baseUri,
      metadataStorage: (tokenForm as any).metadataStorage || prev.metadataStorage,
      batchMinting: (tokenForm as any).batchMinting ?? prev.batchMinting,
      hasRoyalty: (tokenForm as any).hasRoyalty ?? prev.hasRoyalty,
      royaltyPercentage: (tokenForm as any).royaltyPercentage || prev.royaltyPercentage,
      royaltyReceiver: (tokenForm as any).royaltyReceiver || prev.royaltyReceiver,
      tokenTypes: (tokenForm as any).tokenTypes || prev.tokenTypes,
      // These properties might not exist in prev, so only add them if they exist in tokenForm
      ...((tokenForm as any).erc1155Category ? { erc1155Category: (tokenForm as any).erc1155Category } : {}),
      ...((tokenForm as any).bundleSupport !== undefined ? { bundleSupport: (tokenForm as any).bundleSupport } : {}),
      ...((tokenForm as any).erc1155Extensions ? { erc1155Extensions: (tokenForm as any).erc1155Extensions } : {})
    }));
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      // Handle nested objects like tokenTypes[index].field
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

  // Add a new token type
  const addTokenType = () => {
    const newId = (Math.max(...config.tokenTypes.map(t => parseInt(t.id) || 0), 0) + 1).toString();
    setConfig(prev => ({
      ...prev,
      tokenTypes: [
        ...prev.tokenTypes,
        { id: newId, name: `Token Type ${newId}`, supply: "1000", fungible: true, maxSupply: "", metadataUri: "" }
      ]
    }));
  };

  // Remove a token type
  const removeTokenType = (index: number) => {
    // Always keep at least one token type
    if (config.tokenTypes.length <= 1) {
      return;
    }
    
    setConfig(prev => ({
      ...prev,
      tokenTypes: prev.tokenTypes.filter((_, i) => i !== index)
    }));
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-md font-semibold mb-4">Collection Details</h3>
            
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
                  placeholder="My ERC-1155 Collection"
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
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
                  placeholder="M1155"
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
                    <p className="max-w-xs">A brief description of your token collection</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                placeholder="A brief description of your ERC-1155 collection"
                value={config.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tokens">Token Types</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* Token Types Tab */}
          <TabsContent value="tokens">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold">Token Types</h3>
                  <Button 
                    variant="outline" 
                    onClick={addTokenType}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Token Type
                  </Button>
                </div>
                
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
                            onChange={(e) => handleChange(`tokenTypes[${index}].name`, e.target.value)}
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
                            onChange={(e) => handleChange(`tokenTypes[${index}].supply`, e.target.value)}
                            placeholder="1000"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`tokenMaxSupply-${index}`}>
                            Maximum Supply (Optional)
                          </Label>
                          <Input
                            id={`tokenMaxSupply-${index}`}
                            type="number"
                            min="0"
                            value={tokenType.maxSupply}
                            onChange={(e) => handleChange(`tokenTypes[${index}].maxSupply`, e.target.value)}
                            placeholder="Leave blank for unlimited"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`tokenMetadataUri-${index}`}>
                            Token-Specific URI (Optional)
                          </Label>
                          <Input
                            id={`tokenMetadataUri-${index}`}
                            value={tokenType.metadataUri}
                            onChange={(e) => handleChange(`tokenTypes[${index}].metadataUri`, e.target.value)}
                            placeholder="ipfs://..."
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <Switch
                          id={`tokenFungible-${index}`}
                          checked={tokenType.fungible}
                          onCheckedChange={(checked) => handleChange(`tokenTypes[${index}].fungible`, checked)}
                        />
                        <Label htmlFor={`tokenFungible-${index}`} className="flex items-center">
                          Fungible Token
                          <Tooltip>
                            <TooltipTrigger className="ml-1.5">
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">If enabled, creates a fungible token with the specified supply. If disabled, creates a single NFT.</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
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
                          <p className="max-w-xs">The base URI for all token metadata. Token IDs will be appended to this URI.</p>
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
                      You can set this later if metadata is not yet ready
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Dynamic URIs</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allows updating metadata URIs after creation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.dynamicUris}
                      onCheckedChange={(checked) => handleChange("dynamicUris", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Updatable Metadata</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allows updating the content of metadata after creation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.updatableMetadata}
                      onCheckedChange={(checked) => handleChange("updatableMetadata", checked)}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" disabled>
                      <FileUp className="mr-2 h-4 w-4" />
                      Bulk Upload Metadata (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardContent className="pt-6">
                <Accordion type="multiple" defaultValue={["batch", "supply", "royalty"]}>
                  {/* Batch Operations */}
                  <AccordionItem value="batch">
                    <AccordionTrigger className="text-md font-semibold">
                      Batch Operations
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Batch Minting</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allows minting multiple token types in one transaction</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.batchMinting}
                            onCheckedChange={(checked) => handleChange("batchMinting", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Batch Transfers</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Allows transferring multiple token types in one transaction</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.batchTransfers}
                            onCheckedChange={(checked) => handleChange("batchTransfers", checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Supply Management */}
                  <AccordionItem value="supply">
                    <AccordionTrigger className="text-md font-semibold">
                      Supply Management
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Supply Tracking</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Adds totalSupply(uint256 id) to track supply for each token type</p>
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
                            <span className="text-sm font-medium">Minting Roles</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Restrict minting to specific addresses with minter role</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.mintingRoles}
                            onCheckedChange={(checked) => handleChange("mintingRoles", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Burning Enabled</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Adds burn functions to destroy tokens</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={config.burningEnabled}
                            onCheckedChange={(checked) => handleChange("burningEnabled", checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Royalty Settings */}
                  <AccordionItem value="royalty">
                    <AccordionTrigger className="text-md font-semibold">
                      Royalty Settings (EIP-2981)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Enable Royalties</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Implements EIP-2981 NFT Royalty Standard</p>
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
                              <Label htmlFor="royaltyPercentage">
                                Royalty Percentage (%)
                              </Label>
                              <Input
                                id="royaltyPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="5.0"
                                value={config.royaltyPercentage}
                                onChange={(e) => handleChange("royaltyPercentage", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="royaltyReceiver">
                                Royalty Receiver Address
                              </Label>
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
                <h3 className="text-md font-semibold mb-4">Advanced Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessControl" className="flex items-center">
                      Access Control System
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Defines how administrative permissions are managed</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select 
                      value={config.accessControl} 
                      onValueChange={(value) => handleChange("accessControl", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select access control model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ownable">Ownable (Single Owner)</SelectItem>
                        <SelectItem value="roles">Role-Based (Multiple Admins)</SelectItem>
                        <SelectItem value="none">None (No Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Pausable</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allows pausing all token transfers in emergency situations</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.pausable}
                      onCheckedChange={(checked) => handleChange("pausable", checked)}
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
                          <p className="max-w-xs">Enable restrictions on who can receive tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.transferRestrictions}
                      onCheckedChange={(checked) => handleChange("transferRestrictions", checked)}
                    />
                  </div>

                  {config.transferRestrictions && (
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Whitelist</span>
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
                          checked={config.whitelist}
                          onCheckedChange={(checked) => handleChange("whitelist", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Blacklist</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Blocked addresses cannot receive tokens</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={config.blacklist}
                          onCheckedChange={(checked) => handleChange("blacklist", checked)}
                        />
                      </div>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Container Support</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Advanced feature to create composite tokens (tokens within tokens)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={config.containerEnabled}
                      onCheckedChange={(checked) => handleChange("containerEnabled", checked)}
                    />
                  </div>
                  
                  {config.containerEnabled && (
                    <div className="p-3 border rounded-md bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        Container support adds advanced functionality for creating composite tokens. This is a complex feature that will require additional configuration after deployment.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ERC1155ConfigMax;