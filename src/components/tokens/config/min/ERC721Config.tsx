import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ERC721Config, ERC721SimpleConfigProps } from "@/components/tokens/types";

/**
 * Simple configuration component for ERC721 (NFT) tokens
 * Focuses on the core features needed to deploy an NFT collection
 */
const ERC721SimpleConfig: React.FC<ERC721SimpleConfigProps> = ({ 
  tokenForm,
  handleInputChange,
  setTokenForm,
  onConfigChange,
  initialConfig = {} 
}) => {
  // If onConfigChange is provided, we'll use internal state for backward compatibility
  const [config, setConfig] = useState<ERC721Config>({
    name: initialConfig.name || "",
    symbol: initialConfig.symbol || "",
    description: initialConfig.description || "",
    baseUri: initialConfig.baseUri || "",
    metadataStorage: initialConfig.metadataStorage || "ipfs",
    maxSupply: initialConfig.maxSupply || "",
    hasRoyalty: initialConfig.hasRoyalty ?? false,
    royaltyPercentage: initialConfig.royaltyPercentage || "0",
    royaltyReceiver: initialConfig.royaltyReceiver || "",
    // Phase 2: Add missing critical field
    isMintable: initialConfig.isMintable ?? true
  });

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

  // Determine which values to display (tokenForm or internal config)
  const displayValues = onConfigChange ? config : tokenForm;

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
                          <p className="max-w-xs">The name of your NFT collection</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="My NFT Collection"
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
                          <p className="max-w-xs">The short symbol for your collection (e.g., "BAYC")</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="MYNFT"
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
                        <p className="max-w-xs">A brief description of your NFT collection</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="A brief description of your NFT collection"
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
                          <p className="max-w-xs">Where your NFT metadata will be stored</p>
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
                          <p className="max-w-xs">The base URI for all token metadata (e.g., "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/")</p>
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

              {/* Supply Settings Section */}
              <div>
                <h3 className="text-md font-medium mb-4">Supply Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Mintable</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Allows new tokens to be minted after deployment</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={displayValues.isMintable ?? true}
                      onCheckedChange={(checked) => handleSwitchChange("isMintable", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxSupply" className="flex items-center">
                      Maximum Supply
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The maximum number of NFTs that can be minted (leave blank for unlimited)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="maxSupply"
                      name="maxSupply"
                      type="number"
                      min="0"
                      placeholder="10000"
                      value={displayValues.maxSupply || ""}
                      onChange={handleChange}
                    />
                  </div>
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

export default ERC721SimpleConfig;