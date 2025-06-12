import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
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
  Separator 
} from '@/components/ui/separator';
import { TokenStandard } from '@/types/core/centralModels';
import { 
  ArrowRight, 
  Check, 
  CheckCircle, 
  Info 
} from 'lucide-react';
import { 
  AssetCategory,
  FinancialProductCategory 
} from '@/components/tokens/components/AssetTypeSelector';

// Define recommendation structure
interface StandardRecommendation {
  primary: TokenStandard[];
  alternative: TokenStandard[];
  reason: string;
}

// Map asset categories to recommended token standards
const recommendationMap: Record<FinancialProductCategory, StandardRecommendation> = {
  // Traditional assets
  [FinancialProductCategory.STRUCTURED_PRODUCTS]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Regulatory compliance, issuer control, and market liquidity'
  },
  [FinancialProductCategory.EQUITY]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Simple compliance, investor governance, and liquidity'
  },
  [FinancialProductCategory.COMMODITIES]: {
    primary: [TokenStandard.ERC1155, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC20],
    reason: 'Batch efficiency, fractionalization, and tradability'
  },
  [FinancialProductCategory.FUNDS]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC4626, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC4626, TokenStandard.ERC20],
    reason: 'Automated yield management, NAV clarity, and compliance'
  },
  [FinancialProductCategory.BONDS]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Clear issuer control, compliance, and easy market liquidity'
  },
  [FinancialProductCategory.QUANT_STRATEGIES]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC4626, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC4626, TokenStandard.ERC20],
    reason: 'Efficient management, compliance, and yield integration'
  },
  
  // Alternative assets
  [FinancialProductCategory.PRIVATE_EQUITY]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Regulatory adherence, investor restrictions, and fractional liquidity'
  },
  [FinancialProductCategory.PRIVATE_DEBT]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Issuer-controlled compliance and fractional tradability'
  },
  [FinancialProductCategory.REAL_ESTATE]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC20],
    reason: 'Flexible fractional ownership and strong compliance controls'
  },
  [FinancialProductCategory.ENERGY]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC1155, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC20],
    reason: 'Batch management, compliance, and efficient market trading'
  },
  [FinancialProductCategory.INFRASTRUCTURE]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC20],
    reason: 'Compliance for large-scale projects and flexible fractionalization'
  },
  [FinancialProductCategory.COLLECTIBLES]: {
    primary: [TokenStandard.ERC721, TokenStandard.ERC1155, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC721, TokenStandard.ERC20],
    reason: 'Clear uniqueness and fractional tradability'
  },
  [FinancialProductCategory.ASSET_BACKED]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC3525, TokenStandard.ERC20],
    reason: 'Compliance, traceability, and liquidity'
  },
  [FinancialProductCategory.CLIMATE]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC1155, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1155, TokenStandard.ERC20],
    reason: 'Efficient batch management and regulatory compliance'
  },
  [FinancialProductCategory.CARBON_CREDITS]: {
    primary: [TokenStandard.ERC1155, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC1400, TokenStandard.ERC20],
    reason: 'Batch issuance, traceability, and market trading'
  },
  
  // Digital assets
  [FinancialProductCategory.DIGITAL_FUND]: {
    primary: [TokenStandard.ERC1400, TokenStandard.ERC4626, TokenStandard.ERC20],
    alternative: [TokenStandard.ERC4626, TokenStandard.ERC20],
    reason: 'Efficient yield management, compliance, and seamless trading'
  }
};

// Define standard details for displaying in cards
interface StandardDetails {
  title: string;
  description: string;
  benefits: string[];
  bestFor: string[];
}

const standardDetails: Record<TokenStandard, StandardDetails> = {
  [TokenStandard.ERC20]: {
    title: 'Fungible Token',
    description: 'The standard for fungible tokens providing core functionality for transfer, balance tracking, and allowances.',
    benefits: [
      'Broad compatibility with wallets and exchanges',
      'Simple integration with DeFi protocols',
      'Low gas costs for transfers'
    ],
    bestFor: [
      'Tokens requiring high liquidity',
      'Simple use cases without complex compliance',
      'Maximum market compatibility'
    ]
  },
  [TokenStandard.ERC721]: {
    title: 'Non-Fungible Token',
    description: 'The standard for non-fungible tokens representing unique assets with distinct IDs and metadata.',
    benefits: [
      'Full representation of unique assets',
      'Individual tracking and ownership',
      'Rich metadata support'
    ],
    bestFor: [
      'Collectibles and unique assets',
      'Real estate and unique property rights',
      'Individual IP rights'
    ]
  },
  [TokenStandard.ERC1155]: {
    title: 'Multi-Token Standard',
    description: 'Flexible standard supporting both fungible and non-fungible tokens in one contract with batch operations.',
    benefits: [
      'Gas efficiency through batch transfers',
      'Supports both fungible and non-fungible tokens',
      'Reduced contract deployment costs'
    ],
    bestFor: [
      'Gaming items and collectibles',
      'Commodities with different classes',
      'Assets requiring batch operations'
    ]
  },
  [TokenStandard.ERC1400]: {
    title: 'Security Token',
    description: 'Comprehensive security token standard with transfer restrictions, partitioning, and controller operations.',
    benefits: [
      'Built-in compliance with transfer restrictions',
      'Forced transfers for regulatory requirements',
      'Partitioning for different rights or tranches'
    ],
    bestFor: [
      'Regulated securities and financial products',
      'Assets requiring strict compliance',
      'Multi-party controlled assets'
    ]
  },
  [TokenStandard.ERC3525]: {
    title: 'Semi-Fungible Token',
    description: 'Advanced token standard combining aspects of fungible and non-fungible tokens with slot-based categorization.',
    benefits: [
      'Slot-based categorization for flexible grouping',
      'Fractional ownership capabilities',
      'Advanced programmability for complex assets'
    ],
    bestFor: [
      'Structured financial products',
      'Assets with both unique and fungible properties',
      'Products requiring value-based slicing'
    ]
  },
  [TokenStandard.ERC4626]: {
    title: 'Tokenized Vault',
    description: 'Standardized yield-bearing token with deposit/withdrawal functions and accounting for underlying assets.',
    benefits: [
      'Standardized yield accrual mechanics',
      'Simplified deposit and withdrawal functions',
      'Transparent accounting for underlying assets'
    ],
    bestFor: [
      'Yield-generating products',
      'Investment funds and pools',
      'Assets requiring NAV tracking'
    ]
  }
};

// Helper to explain token flow
const getTokenFlowDescription = (standards: TokenStandard[]): string => {
  if (standards.length === 1) {
    return `Simple ${standards[0]} token`;
  }
  
  return standards.map((std, i) => {
    if (i === standards.length - 1) {
      return std;
    }
    return std;
  }).join(' → ');
};

interface StandardRecommenderProps {
  assetCategory: FinancialProductCategory | null;
  onSelectStandard: (standard: TokenStandard) => void;
}

const StandardRecommender: React.FC<StandardRecommenderProps> = ({
  assetCategory,
  onSelectStandard
}) => {
  const [activeTab, setActiveTab] = React.useState<'primary' | 'alternative'>('primary');
  const [selectedStandard, setSelectedStandard] = React.useState<TokenStandard | null>(null);
  
  if (!assetCategory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Standard Recommendation</CardTitle>
          <CardDescription>
            Please select an asset type to get token standard recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Info className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Select an asset type from the previous step to see recommendations
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const recommendation = recommendationMap[assetCategory];
  const standards = activeTab === 'primary' ? recommendation.primary : recommendation.alternative;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Token Standards</CardTitle>
        <CardDescription>
          Optimal token standards for your selected asset type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 p-4 rounded-md">
          <h3 className="font-medium mb-1">Recommendation Reason</h3>
          <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'primary' | 'alternative')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="primary">Primary Recommendation</TabsTrigger>
            <TabsTrigger value="alternative">Alternative Approach</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <span className="flex items-center">
                    <Badge className="mr-2">
                      {getTokenFlowDescription(standards)}
                    </Badge>
                    Token Structure
                  </span>
                </CardTitle>
                <CardDescription>
                  {activeTab === 'primary' 
                    ? 'Recommended standard approach for this asset type' 
                    : 'Alternative approach with different trade-offs'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {standards.map((standard, index) => (
                    <React.Fragment key={standard}>
                      <Card 
                        className={`flex-1 transition-colors ${selectedStandard === standard ? 'bg-muted border-primary' : ''}`}
                      >
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">{standard}</CardTitle>
                          <CardDescription>
                            {standardDetails[standard].title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="py-2">
                          <p className="text-sm text-muted-foreground">
                            {standardDetails[standard].description}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant={selectedStandard === standard ? "secondary" : "default"}
                            className="w-full font-medium"
                            onClick={() => {
                              setSelectedStandard(standard);
                              onSelectStandard(standard);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {selectedStandard === standard ? 'Selected' : 'Select This Standard'}
                          </Button>
                        </CardFooter>
                      </Card>
                      
                      {index < standards.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <h3 className="font-medium">Benefits of This Approach</h3>
              <div className="grid grid-cols-1 gap-2">
                {standards.map(standard => (
                  <Card key={`benefits-${standard}`}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{standard} Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <ul className="space-y-1">
                        {standardDetails[standard].benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StandardRecommender;