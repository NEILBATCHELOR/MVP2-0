import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Badge 
} from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Check 
} from 'lucide-react';
import { cn } from '@/utils';

// Define the categories and asset types based on Product Scope.txt
export enum AssetCategory {
  TRADITIONAL = 'traditional',
  ALTERNATIVE = 'alternative',
  DIGITAL = 'digital'
}

export enum FinancialProductCategory {
  // Traditional
  STRUCTURED_PRODUCTS = 'structured_products',
  EQUITY = 'equity',
  COMMODITIES = 'commodities',
  FUNDS = 'funds',
  BONDS = 'bonds',
  QUANT_STRATEGIES = 'quant_strategies',
  
  // Alternative
  PRIVATE_EQUITY = 'private_equity',
  PRIVATE_DEBT = 'private_debt',
  REAL_ESTATE = 'real_estate',
  ENERGY = 'energy',
  INFRASTRUCTURE = 'infrastructure',
  COLLECTIBLES = 'collectibles',
  ASSET_BACKED = 'asset_backed',
  CLIMATE = 'climate',
  CARBON_CREDITS = 'carbon_credits',
  
  // Digital
  DIGITAL_FUND = 'digital_fund'
}

// Interface for asset details
interface AssetTypeDetails {
  label: string;
  description: string;
  category: AssetCategory;
}

// Asset type details lookup
const assetTypeDetails: Record<FinancialProductCategory, AssetTypeDetails> = {
  // Traditional assets
  [FinancialProductCategory.STRUCTURED_PRODUCTS]: {
    label: 'Structured Products',
    description: 'Pre-packaged investment strategies based on derivatives and market expectations.',
    category: AssetCategory.TRADITIONAL
  },
  [FinancialProductCategory.EQUITY]: {
    label: 'Equity',
    description: 'Ownership shares in corporations with potential for dividends and capital appreciation.',
    category: AssetCategory.TRADITIONAL
  },
  [FinancialProductCategory.COMMODITIES]: {
    label: 'Commodities',
    description: 'Physical goods like precious metals, agricultural products, and energy resources.',
    category: AssetCategory.TRADITIONAL
  },
  [FinancialProductCategory.FUNDS]: {
    label: 'Funds, ETFs, ETPs',
    description: 'Pooled investment vehicles offering diversification across assets or strategies.',
    category: AssetCategory.TRADITIONAL
  },
  [FinancialProductCategory.BONDS]: {
    label: 'Bonds',
    description: 'Debt securities providing fixed income through regular interest payments.',
    category: AssetCategory.TRADITIONAL
  },
  [FinancialProductCategory.QUANT_STRATEGIES]: {
    label: 'Quantitative Investment Strategies',
    description: 'Data-driven investment approaches using algorithms and statistical models.',
    category: AssetCategory.TRADITIONAL
  },
  
  // Alternative assets
  [FinancialProductCategory.PRIVATE_EQUITY]: {
    label: 'Private Equity',
    description: 'Investments in private companies not traded on public exchanges.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.PRIVATE_DEBT]: {
    label: 'Private Debt',
    description: 'Loans to private companies offering higher yields than traditional fixed income.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.REAL_ESTATE]: {
    label: 'Real Estate',
    description: 'Property investments including commercial, residential, and specialized sectors.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.ENERGY]: {
    label: 'Energy',
    description: 'Investments in energy production, distribution, and infrastructure.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.INFRASTRUCTURE]: {
    label: 'Infrastructure',
    description: 'Essential facilities and systems serving communities and economies.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.COLLECTIBLES]: {
    label: 'Collectibles & Other Assets',
    description: 'Rare items with value based on scarcity, condition, and collector interest.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.ASSET_BACKED]: {
    label: 'Asset Backed / Invoice Receivables',
    description: 'Securities backed by financial assets, invoices, or receivables.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.CLIMATE]: {
    label: 'Solar and Wind Energy, Climate Receivables',
    description: 'Renewable energy investments and climate-related financial assets.',
    category: AssetCategory.ALTERNATIVE
  },
  [FinancialProductCategory.CARBON_CREDITS]: {
    label: 'Carbon Credits',
    description: 'Tradable permits representing the right to emit greenhouse gases.',
    category: AssetCategory.ALTERNATIVE
  },
  
  // Digital assets
  [FinancialProductCategory.DIGITAL_FUND]: {
    label: 'Digital Tokenised Fund',
    description: 'Investment funds represented as digital tokens on blockchain networks.',
    category: AssetCategory.DIGITAL
  }
};

// Group asset types by category
const getAssetsByCategory = (category: AssetCategory): FinancialProductCategory[] => {
  return Object.entries(assetTypeDetails)
    .filter(([_, details]) => details.category === category)
    .map(([key, _]) => key as FinancialProductCategory);
};

interface AssetTypeSelectorProps {
  selectedCategory: FinancialProductCategory | null;
  onChange: (category: FinancialProductCategory) => void;
}

const AssetTypeSelector: React.FC<AssetTypeSelectorProps> = ({
  selectedCategory,
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<AssetCategory>(AssetCategory.TRADITIONAL);
  
  // Handle selecting a category
  const handleCategorySelect = (category: FinancialProductCategory) => {
    onChange(category);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Asset Type</CardTitle>
        <CardDescription>
          Choose the type of asset you want to tokenize
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssetCategory)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value={AssetCategory.TRADITIONAL}>Traditional</TabsTrigger>
            <TabsTrigger value={AssetCategory.ALTERNATIVE}>Alternative</TabsTrigger>
            <TabsTrigger value={AssetCategory.DIGITAL}>Digital</TabsTrigger>
          </TabsList>
          
          <TabsContent value={AssetCategory.TRADITIONAL} className="mt-0">
            <Accordion type="single" collapsible className="w-full">
              {getAssetsByCategory(AssetCategory.TRADITIONAL).map((assetType) => (
                <AccordionItem key={assetType} value={assetType}>
                  <AccordionTrigger
                    className={cn(
                      "px-4 hover:bg-muted/50 rounded-md",
                      selectedCategory === assetType && "bg-muted"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategorySelect(assetType);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{assetTypeDetails[assetType].label}</span>
                      {selectedCategory === assetType && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {assetTypeDetails[assetType].description}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      Recommended: See token recommendations
                    </Badge>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          
          <TabsContent value={AssetCategory.ALTERNATIVE} className="mt-0">
            <Accordion type="single" collapsible className="w-full">
              {getAssetsByCategory(AssetCategory.ALTERNATIVE).map((assetType) => (
                <AccordionItem key={assetType} value={assetType}>
                  <AccordionTrigger
                    className={cn(
                      "px-4 hover:bg-muted/50 rounded-md",
                      selectedCategory === assetType && "bg-muted"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategorySelect(assetType);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{assetTypeDetails[assetType].label}</span>
                      {selectedCategory === assetType && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {assetTypeDetails[assetType].description}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      Recommended: See token recommendations
                    </Badge>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          
          <TabsContent value={AssetCategory.DIGITAL} className="mt-0">
            <Accordion type="single" collapsible className="w-full">
              {getAssetsByCategory(AssetCategory.DIGITAL).map((assetType) => (
                <AccordionItem key={assetType} value={assetType}>
                  <AccordionTrigger
                    className={cn(
                      "px-4 hover:bg-muted/50 rounded-md",
                      selectedCategory === assetType && "bg-muted"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategorySelect(assetType);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{assetTypeDetails[assetType].label}</span>
                      {selectedCategory === assetType && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {assetTypeDetails[assetType].description}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      Recommended: See token recommendations
                    </Badge>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AssetTypeSelector;