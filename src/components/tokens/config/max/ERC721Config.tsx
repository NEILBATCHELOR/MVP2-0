import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ERC721DetailedConfigProps } from "@/components/tokens/types";

/**
 * Detailed configuration component for ERC721 (NFT) tokens
 * Includes all standard features, optional extensions, and advanced settings
 */
const ERC721DetailedConfig: React.FC<ERC721DetailedConfigProps> = ({ 
  tokenForm = {} as any,
  handleInputChange,
  setTokenForm 
}) => {
  // Full configuration with all possible ERC-721 options
  const [config, setConfig] = useState({
    // Core Collection Details
    name: tokenForm.name || "",
    symbol: tokenForm.symbol || "",
    description: tokenForm.description || "",
    
    // Metadata Management
    baseUri: tokenForm.baseUri || "",
    metadataStorage: tokenForm.metadataStorage || "ipfs",
    dynamicMetadata: tokenForm.dynamicMetadata || false,
    contractUri: tokenForm.contractUri || "",  // For OpenSea collection-level metadata
    
    // Minting Settings
    maxSupply: tokenForm.maxSupply || "",
    reservedTokens: tokenForm.reservedTokens || "0",
    mintingMethod: tokenForm.mintingMethod || "public",  // public, whitelist, auction
    mintingPrice: tokenForm.mintingPrice || "0",
    maxMintsPerTx: tokenForm.maxMintsPerTx || "10",
    maxMintsPerWallet: tokenForm.maxMintsPerWallet || "",
    
    // Enumeration Extension (ERC-721 optional)
    supportsEnumeration: tokenForm.supportsEnumeration || true,
    
    // Access Control
    isPausable: tokenForm.isPausable || false,
    burnable: tokenForm.burnable || false,
    
    // Royalty Standard (EIP-2981)
    hasRoyalty: tokenForm.hasRoyalty || false,
    royaltyPercentage: tokenForm.royaltyPercentage || "0",
    royaltyReceiver: tokenForm.royaltyReceiver || "",
    
    // Advanced Extensions
    enableFractionalOwnership: tokenForm.enableFractionalOwnership || false,
    enableDynamicMetadata: tokenForm.enableDynamicMetadata || false,
    useSafeTransfer: tokenForm.useSafeTransfer || true,  // Enable safeTransferFrom with data parameter
    
    // Custom Settings
    customBaseUri: tokenForm.customBaseUri || false,
    revealable: tokenForm.revealable || false,
    preRevealUri: tokenForm.preRevealUri || "",
  });

  // Update parent state when config changes
  useEffect(() => {
    if (setTokenForm) {
      setTokenForm(prev => ({ ...prev, ...config }));
    }
  }, [config, setTokenForm]);

  // Update local state when tokenForm changes from parent
  useEffect(() => {
    const tokenFormData = tokenForm as any;
    const prevConfig = {} as any;
    
    setConfig((prev) => {
      // Copy all previous values to prevConfig
      Object.assign(prevConfig, prev);
      
      return {
        ...prev,
        name: tokenFormData.name || prev.name,
        symbol: tokenFormData.symbol || prev.symbol,
        description: tokenFormData.description || prev.description,
        baseUri: tokenFormData.baseUri || prev.baseUri,
        metadataStorage: tokenFormData.metadataStorage || prev.metadataStorage,
        maxSupply: tokenFormData.maxSupply || prev.maxSupply,
        hasRoyalty: tokenFormData.hasRoyalty ?? prev.hasRoyalty,
        royaltyPercentage: tokenFormData.royaltyPercentage || prev.royaltyPercentage,
        royaltyReceiver: tokenFormData.royaltyReceiver || prev.royaltyReceiver,
        burnable: tokenFormData.isBurnable ?? tokenFormData.burnable ?? prev.burnable,
        isPausable: tokenFormData.isPausable ?? prev.isPausable,
        mintingMethod: tokenFormData.mintingMethod || prev.mintingMethod,
        
        // Add additional properties if they exist in tokenForm
        ...(tokenFormData.assetType ? { assetType: tokenFormData.assetType } : {}),
        ...(tokenFormData.provenanceTracking !== undefined ? { provenanceTracking: tokenFormData.provenanceTracking } : {}),
        ...(tokenFormData.tokenAttributes ? { tokenAttributes: tokenFormData.tokenAttributes } : {}),
        ...(tokenFormData.erc721Extensions ? { erc721Extensions: tokenFormData.erc721Extensions } : {})
      };
    });
  }, [tokenForm]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      return newConfig;
    });
  };

  // Handle input change events
  const handleChangeEvent = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? (value === "" ? "" : Number(value)) : value;
    handleChange(name, val);
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
                      <p className="max-w-xs">The name of your NFT collection (e.g., "Bored Ape Yacht Club")</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My NFT Collection"
                  value={config.name}
                  onChange={handleChangeEvent}
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
                    <p className="max-w-xs">A brief description of your NFT collection</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="A brief description of your NFT collection"
                value={config.description}
                onChange={handleChangeEvent}
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={["metadata", "minting"]}>
          {/* Metadata Section */}
          <AccordionItem value="metadata">
            <AccordionTrigger className="text-md font-semibold">
              Metadata Configuration
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Enable Dynamic Metadata</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Allows updating tokenURI after minting (e.g., for evolving game characters)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.dynamicMetadata}
                    onCheckedChange={(checked) => handleChange("dynamicMetadata", checked)}
                  />
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
                    value={config.baseUri}
                    onChange={handleChangeEvent}
                  />
                  <p className="text-xs text-muted-foreground">
                    Can be set later if not available yet
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Reveal Mechanism</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Start with a placeholder image and reveal the actual NFTs later</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.revealable}
                    onCheckedChange={(checked) => handleChange("revealable", checked)}
                  />
                </div>

                {config.revealable && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="preRevealUri" className="flex items-center">
                      Pre-reveal URI
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">URI for the placeholder metadata before reveal</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="preRevealUri"
                      name="preRevealUri"
                      placeholder="ipfs://..."
                      value={config.preRevealUri}
                      onChange={handleChangeEvent}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contractUri" className="flex items-center">
                    Contract URI (OpenSea Collection Metadata)
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">URI for collection-level metadata for marketplaces</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="contractUri"
                    name="contractUri"
                    placeholder="ipfs://..."
                    value={config.contractUri}
                    onChange={handleChangeEvent}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Minting & Supply Section */}
          <AccordionItem value="minting">
            <AccordionTrigger className="text-md font-semibold">
              Minting & Supply Settings
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
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
                    value={config.maxSupply}
                    onChange={handleChangeEvent}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservedTokens" className="flex items-center">
                    Reserved Tokens
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Number of tokens reserved for the team, giveaways, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="reservedTokens"
                    name="reservedTokens"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={config.reservedTokens}
                    onChange={handleChangeEvent}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mintingMethod" className="flex items-center">
                    Minting Method
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">How users will be able to mint NFTs</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select 
                    value={config.mintingMethod} 
                    onValueChange={(value) => handleChange("mintingMethod", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minting method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Mint</SelectItem>
                      <SelectItem value="whitelist">Whitelist Only</SelectItem>
                      <SelectItem value="auction">Dutch Auction</SelectItem>
                      <SelectItem value="free">Free Mint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.mintingMethod !== "free" && (
                  <div className="space-y-2">
                    <Label htmlFor="mintingPrice" className="flex items-center">
                      Minting Price (ETH)
                      <Tooltip>
                        <TooltipTrigger className="ml-1.5">
                          <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The price to mint one NFT in ETH</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="mintingPrice"
                      name="mintingPrice"
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="0.08"
                      value={config.mintingPrice}
                      onChange={handleChangeEvent}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxMintsPerTx" className="flex items-center">
                    Max Mints Per Transaction
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum number of NFTs that can be minted in a single transaction</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="maxMintsPerTx"
                    name="maxMintsPerTx"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={config.maxMintsPerTx}
                    onChange={handleChangeEvent}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMintsPerWallet" className="flex items-center">
                    Max Mints Per Wallet
                    <Tooltip>
                      <TooltipTrigger className="ml-1.5">
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum number of NFTs that can be minted by a single wallet (leave blank for unlimited)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="maxMintsPerWallet"
                    name="maxMintsPerWallet"
                    type="number"
                    min="0"
                    placeholder="Leave blank for unlimited"
                    value={config.maxMintsPerWallet}
                    onChange={handleChangeEvent}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Extensions & Features Section */}
          <AccordionItem value="extensions">
            <AccordionTrigger className="text-md font-semibold">
              Optional Extensions & Features
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Enumeration Extension</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds totalSupply(), tokenByIndex(), and tokenOfOwnerByIndex() functions</p>
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
                    <span className="text-sm font-medium">Pausable Transfers</span>
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
                    checked={config.isPausable}
                    onCheckedChange={(checked) => handleChange("isPausable", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Burnable Tokens</span>
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
                    checked={config.burnable}
                    onCheckedChange={(checked) => handleChange("burnable", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Safe Transfer Extension</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Ensures receiving contracts can handle NFTs (always recommended)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.useSafeTransfer}
                    onCheckedChange={(checked) => handleChange("useSafeTransfer", checked)}
                  />
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Enable Royalties (EIP-2981)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adds royaltyInfo(uint256 tokenId, uint256 salePrice) for creator royalties</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.hasRoyalty}
                    onCheckedChange={(checked) => handleChange("hasRoyalty", checked)}
                  />
                </div>

                {config.hasRoyalty && (
                  <div className="pl-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="royaltyPercentage">
                        Royalty Percentage (%)
                      </Label>
                      <Input
                        id="royaltyPercentage"
                        name="royaltyPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="5.0"
                        value={config.royaltyPercentage}
                        onChange={handleChangeEvent}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="royaltyReceiver">
                        Royalty Receiver Address
                      </Label>
                      <Input
                        id="royaltyReceiver"
                        name="royaltyReceiver"
                        placeholder="0x..."
                        value={config.royaltyReceiver}
                        onChange={handleChangeEvent}
                      />
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced Extensions Section */}
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-md font-semibold">
              Advanced Extensions
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
                        <p className="max-w-xs">Allows an NFT to be fractionalized into multiple ERC-20 tokens</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.enableFractionalOwnership}
                    onCheckedChange={(checked) => handleChange("enableFractionalOwnership", checked)}
                  />
                </div>

                {config.enableFractionalOwnership && (
                  <div className="pl-6 p-3 border rounded-md bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Fractional ownership settings will be configurable after deployment in the token management panel.
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
};

export default ERC721DetailedConfig;