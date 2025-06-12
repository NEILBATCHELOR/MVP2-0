import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlockchainNetwork } from "@/components/tokens/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Card, CardContent } from "@/components/ui/card";

// Network data with names, icons, and compatibility
const NETWORK_DATA = {
  [BlockchainNetwork.ETHEREUM]: {
    name: "Ethereum",
    icon: "🔷",
    evm: true,
    description: "The original Ethereum blockchain",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.POLYGON]: {
    name: "Polygon",
    icon: "🟣",
    evm: true,
    description: "Ethereum layer 2 solution with fast and low-cost transactions",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.OPTIMISM]: {
    name: "Optimism",
    icon: "🔴",
    evm: true,
    description: "Ethereum layer 2, optimistic rollup based scaling solution",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.ARBITRUM]: {
    name: "Arbitrum",
    icon: "🔵",
    evm: true,
    description: "Ethereum layer 2, optimistic rollup scaling solution",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.BASE]: {
    name: "Base",
    icon: "🔷",
    evm: true,
    description: "Coinbase's Ethereum layer 2 built on Optimism",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.AVALANCHE]: {
    name: "Avalanche",
    icon: "🔺",
    evm: true,
    description: "High-throughput, low-latency blockchain platform",
    standards: ["ERC-20", "ERC-721", "ERC-1155", "ERC-1400", "ERC-3525", "ERC-4626"]
  },
  [BlockchainNetwork.XRP]: {
    name: "XRP Ledger",
    icon: "✖️",
    evm: false,
    description: "Fast and energy-efficient blockchain for payments",
    standards: ["XLS-20"]
  },
  [BlockchainNetwork.APTOS]: {
    name: "Aptos",
    icon: "🔺",
    evm: false,
    description: "Layer 1 blockchain focusing on security and scalability",
    standards: ["Aptos Token"]
  },
  [BlockchainNetwork.SUI]: {
    name: "Sui",
    icon: "🔹",
    evm: false,
    description: "High-performance Layer 1 blockchain with a Move-based smart contract system",
    standards: ["Sui Object"]
  },
  [BlockchainNetwork.NEAR]: {
    name: "Near",
    icon: "🔸",
    evm: false,
    description: "Developer-friendly, sharded, proof-of-stake blockchain",
    standards: ["NEP-141", "NEP-171"]
  }
};

interface NetworkSelectorProps {
  selectedNetwork: BlockchainNetwork;
  onChange: (network: BlockchainNetwork) => void;
  tokenStandard: string;
  disabled?: boolean;
}

/**
 * Network selector component for choosing blockchain network to deploy to
 * Filters networks based on compatibility with the selected token standard
 */
const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onChange,
  tokenStandard,
  disabled = false
}) => {
  // Filter networks based on ERC standard compatibility
  const compatibleNetworks = Object.entries(NETWORK_DATA).filter(([_, data]) => {
    if (tokenStandard.startsWith("ERC")) {
      return data.evm;
    }
    return data.standards.includes(tokenStandard);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label htmlFor="network-selector" className="mr-2">Blockchain Network</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>Select the blockchain network to deploy your token to. Only networks compatible with your token standard are shown.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select
        value={selectedNetwork}
        onValueChange={(value) => onChange(value as BlockchainNetwork)}
        disabled={disabled}
      >
        <SelectTrigger id="network-selector" className="w-full">
          <SelectValue placeholder="Select a network" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>EVM-Compatible</SelectLabel>
            {compatibleNetworks
              .filter(([_, data]) => data.evm)
              .map(([network, data]) => (
                <SelectItem key={network} value={network}>
                  <div className="flex items-center">
                    <span className="mr-2">{data.icon}</span>
                    {data.name}
                  </div>
                </SelectItem>
              ))}
          </SelectGroup>
          {compatibleNetworks.some(([_, data]) => !data.evm) && (
            <SelectGroup>
              <SelectLabel>Non-EVM</SelectLabel>
              {compatibleNetworks
                .filter(([_, data]) => !data.evm)
                .map(([network, data]) => (
                  <SelectItem key={network} value={network}>
                    <div className="flex items-center">
                      <span className="mr-2">{data.icon}</span>
                      {data.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {selectedNetwork && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="text-sm">
              <div className="flex items-center font-medium">
                <span className="mr-2">{NETWORK_DATA[selectedNetwork].icon}</span>
                {NETWORK_DATA[selectedNetwork].name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {NETWORK_DATA[selectedNetwork].description}
              </p>
              <div className="mt-1 text-xs">
                <span className="font-medium">Supported Standards:</span>{" "}
                {NETWORK_DATA[selectedNetwork].standards.join(", ")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NetworkSelector;