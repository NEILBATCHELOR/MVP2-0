import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTokenization } from '@/components/tokens/hooks/useTokenization';
import { BlockchainBadge } from '@/components/tokens/components/BlockchainBadge';
import { providerManager, NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import type { SupportedChain } from '@/infrastructure/web3';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BlockchainSelectorProps {
  value: SupportedChain | string;
  onChange: (value: SupportedChain) => void;
  filterEVM?: boolean;
  filterNonEVM?: boolean;
  disabled?: boolean;
}

interface BlockchainOption {
  id: string;
  name: string;
  available: boolean;
}

const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  value,
  onChange,
  filterEVM = false,
  filterNonEVM = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [blockchainOptions, setBlockchainOptions] = useState<BlockchainOption[]>([]);
  const { 
    getSupportedBlockchains, 
    getEVMChains, 
    getNonEVMChains,
    environment
  } = useTokenization();

  useEffect(() => {
    let chains: string[] = [];
    
    if (filterEVM) {
      chains = getEVMChains();
    } else if (filterNonEVM) {
      chains = getNonEVMChains();
    } else {
      chains = getSupportedBlockchains();
    }
    
    // Check provider availability for each chain
    const options = chains.map(chain => {
      const baseChain = chain.split('-')[0];
      let available = false;
      
      try {
        const provider = providerManager.getProviderForEnvironment(baseChain as SupportedChain, environment as NetworkEnvironment);
        available = !!provider;
      } catch (e) {
        available = false;
      }
      
      return {
        id: chain,
        name: getBlockchainName(chain),
        available
      };
    });
    
    setBlockchainOptions(options);
  }, [filterEVM, filterNonEVM, getSupportedBlockchains, getEVMChains, getNonEVMChains, environment]);

  // Helper to get blockchain display name
  const getBlockchainName = (id: string): string => {
    const names: Record<string, string> = {
      ethereum: 'Ethereum',
      'ethereum-goerli': 'Ethereum Goerli',
      polygon: 'Polygon',
      'polygon-mumbai': 'Polygon Mumbai',
      avalanche: 'Avalanche',
      'avalanche-fuji': 'Avalanche Fuji',
      bsc: 'BNB Chain',
      'bsc-testnet': 'BNB Chain Testnet',
      solana: 'Solana',
      'solana-devnet': 'Solana Devnet',
      bitcoin: 'Bitcoin',
      'bitcoin-testnet': 'Bitcoin Testnet',
    };
    
    return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
  };

  // Find the currently selected blockchain option
  const selectedOption = blockchainOptions.find(option => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? (
            <div className="flex items-center">
              <BlockchainBadge blockchain={value} className="mr-2" />
              {getBlockchainName(value)}
              {selectedOption && !selectedOption.available && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Provider not available</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ) : (
            "Select blockchain"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search blockchains..." />
          <CommandEmpty>No blockchain found.</CommandEmpty>
          <CommandGroup>
            {blockchainOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                onSelect={(currentValue) => {
                  onChange(currentValue as SupportedChain);
                  setOpen(false);
                }}
                className={!option.available ? "opacity-70" : ""}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <BlockchainBadge blockchain={option.id} className="mr-2" />
                <div className="flex items-center justify-between flex-1">
                  <span>{option.name}</span>
                  {!option.available && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Provider not available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BlockchainSelector;