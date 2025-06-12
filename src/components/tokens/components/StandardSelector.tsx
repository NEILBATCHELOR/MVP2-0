import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { TokenStandard } from '@/types/core/centralModels';
import { InfoIcon } from 'lucide-react';
import { getTokenTypeTheme } from '@/utils/shared/tokenThemeUtils';
import { cn } from '@/lib/utils';

interface StandardSelectorProps {
  value?: TokenStandard;
  selectedStandard?: TokenStandard;
  onChange?: (value: TokenStandard) => void;
  onStandardChange?: (value: TokenStandard) => void;
  disabled?: boolean;
}

interface StandardInfo {
  description: string;
  useCase: string;
  example: string;
}

const standardInfo: Record<TokenStandard, StandardInfo> = {
  [TokenStandard.ERC20]: {
    description: 'Standard interface for fungible tokens',
    useCase: 'Currencies, utility tokens, shares, commodities',
    example: 'USDC, DAI, UNI'
  },
  [TokenStandard.ERC721]: {
    description: 'Standard interface for non-fungible tokens (NFTs)',
    useCase: 'Unique assets, real estate, IP rights',
    example: 'CryptoPunks, BAYC, Cryptokitties'
  },
  [TokenStandard.ERC1155]: {
    description: 'Multi-token standard for fungible and non-fungible tokens',
    useCase: 'Gaming items, asset bundles, semi-fungible tokens',
    example: 'Enjin, OpenSea Collections'
  },
  [TokenStandard.ERC1400]: {
    description: 'Security token standard with compliance features',
    useCase: 'Regulated securities, equity shares, debt instruments',
    example: 'Polymath, Securitize'
  },
  [TokenStandard.ERC3525]: {
    description: 'Semi-fungible token standard with slot-based structure',
    useCase: 'Derivatives, structured products, fractional ownership',
    example: 'Solv Protocol'
  },
  [TokenStandard.ERC4626]: {
    description: 'Tokenized vault standard with yield-bearing features',
    useCase: 'Yield vaults, funds, staking pools, lending protocols',
    example: 'Yearn Finance, AAVE'
  }
};

const StandardSelector: React.FC<StandardSelectorProps> = ({
  value,
  selectedStandard,
  onChange,
  onStandardChange,
  disabled = false
}) => {
  // Use either value or selectedStandard, preferring value if both are provided
  const currentValue = value || selectedStandard || TokenStandard.ERC20;
  
  // Use either onChange or onStandardChange, preferring onChange if both are provided
  const handleChange = (val: TokenStandard) => {
    if (onChange) {
      onChange(val);
    } else if (onStandardChange) {
      onStandardChange(val);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={currentValue} 
        onValueChange={(val) => handleChange(val as TokenStandard)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select token standard" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TokenStandard.ERC20} className={cn("flex items-center", getTokenTypeTheme("ERC20").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC20").bg)}></span>ERC-20
          </SelectItem>
          <SelectItem value={TokenStandard.ERC721} className={cn("flex items-center", getTokenTypeTheme("ERC721").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC721").bg)}></span>ERC-721
          </SelectItem>
          <SelectItem value={TokenStandard.ERC1155} className={cn("flex items-center", getTokenTypeTheme("ERC1155").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC1155").bg)}></span>ERC-1155
          </SelectItem>
          <SelectItem value={TokenStandard.ERC1400} className={cn("flex items-center", getTokenTypeTheme("ERC1400").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC1400").bg)}></span>ERC-1400
          </SelectItem>
          <SelectItem value={TokenStandard.ERC3525} className={cn("flex items-center", getTokenTypeTheme("ERC3525").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC3525").bg)}></span>ERC-3525
          </SelectItem>
          <SelectItem value={TokenStandard.ERC4626} className={cn("flex items-center", getTokenTypeTheme("ERC4626").text)}>
            <span className={cn("mr-2 h-2 w-2 rounded-full", getTokenTypeTheme("ERC4626").bg)}></span>ERC-4626
          </SelectItem>
        </SelectContent>
      </Select>
      
      <HoverCard>
        <HoverCardTrigger asChild>
          <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", getTokenTypeTheme(currentValue).bg, getTokenTypeTheme(currentValue).border)}>
          <div className="space-y-2">
            <h4 className={cn("font-medium", getTokenTypeTheme(currentValue).text)}>{currentValue}</h4>
            <p className="text-sm">{standardInfo[currentValue]?.description}</p>
            <div className="pt-2">
              <h5 className="text-xs font-medium text-muted-foreground">USE CASES</h5>
              <p className="text-sm">{standardInfo[currentValue]?.useCase}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground">EXAMPLES</h5>
              <p className="text-sm">{standardInfo[currentValue]?.example}</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default StandardSelector;