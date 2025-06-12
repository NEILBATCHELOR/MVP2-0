import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, FileText } from 'lucide-react';
import { loadJsonFile, fileExists, getProductTypes } from '../services/fileLoader';
import { TokenStandard } from '@/types/core/centralModels';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/components/ui/use-toast';

// Types
interface FileItem {
  name: string;
  path: string;
  productType: string;
  category: 'Primary' | 'Alternative';
  tokenStandard: TokenStandard;
}

export interface FileSelectionResult {
  content: string;
  tokenStandard: TokenStandard;
  configMode: 'min' | 'max';
}

interface ProductSelectorProps {
  onFileSelect: (result: FileSelectionResult) => void;
}

// Known product types and categories - ensure all products are listed
const PRODUCT_TYPES = [
  'Asset Backed or Invoice Receivables',
  'Bonds',
  'Carbon Credits',
  'Collectibles & Other Assets',
  'Commodities',
  'Digital Tokenized Fund',
  'Energy',
  'Equity',
  'Funds, ETFs, ETPs',
  'Infrastructure',
  'Private Debt',
  'Private Equity',
  'Quantitative Strategies',
  'Real Estate',
  'Solar and Wind Energy, Climate Receivables',
  'Structured Products'
];

const CATEGORIES = ['Primary', 'Alternative'] as const;
const TOKEN_STANDARDS = ['ERC20', 'ERC721', 'ERC1155', 'ERC1400', 'ERC3525', 'ERC4626'] as const;

// Type for the known files list
type KnownFileType = {
  productType: string;
  category: 'Primary' | 'Alternative';
  fileName: string;
  tokenStandard: TokenStandard;
};

// Hardcoded list of known files that actually exist
const KNOWN_FILES: KnownFileType[] = [
  // Asset Backed or Invoice Receivables
  { productType: 'Asset Backed or Invoice Receivables', category: 'Alternative', fileName: 'Receivables_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Asset Backed or Invoice Receivables', category: 'Alternative', fileName: 'Receivables_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Asset Backed or Invoice Receivables', category: 'Primary', fileName: 'Receivables_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Asset Backed or Invoice Receivables', category: 'Primary', fileName: 'Receivables_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  
  // Bonds
  { productType: 'Bonds', category: 'Alternative', fileName: 'Bonds_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Bonds', category: 'Alternative', fileName: 'Bonds_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Bonds', category: 'Alternative', fileName: 'Bonds_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Bonds', category: 'Primary', fileName: 'Bonds_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Bonds', category: 'Primary', fileName: 'Bonds_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Carbon Credits
  { productType: 'Carbon Credits', category: 'Alternative', fileName: 'CarbonCredits_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Carbon Credits', category: 'Alternative', fileName: 'CarbonCredits_ERC721.json', tokenStandard: 'ERC721' as TokenStandard },
  { productType: 'Carbon Credits', category: 'Primary', fileName: 'CarbonCredits_ERC1155.json', tokenStandard: 'ERC1155' as TokenStandard },
  { productType: 'Carbon Credits', category: 'Primary', fileName: 'CarbonCredits_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Collectibles & Other Assets
  { productType: 'Collectibles & Other Assets', category: 'Alternative', fileName: 'Collectibles_ERC1155.json', tokenStandard: 'ERC1155' as TokenStandard },
  { productType: 'Collectibles & Other Assets', category: 'Alternative', fileName: 'Collectibles_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Collectibles & Other Assets', category: 'Primary', fileName: 'Collectibles_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Collectibles & Other Assets', category: 'Primary', fileName: 'Collectibles_ERC721.json', tokenStandard: 'ERC721' as TokenStandard },
  
  // Commodities
  { productType: 'Commodities', category: 'Alternative', fileName: 'Commodities_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Commodities', category: 'Primary', fileName: 'Commodities_ERC1155.json', tokenStandard: 'ERC1155' as TokenStandard },
  { productType: 'Commodities', category: 'Primary', fileName: 'Commodities_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Digital Tokenized Fund
  { productType: 'Digital Tokenized Fund', category: 'Alternative', fileName: 'DigitalFund_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Digital Tokenized Fund', category: 'Alternative', fileName: 'DigitalFund_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  { productType: 'Digital Tokenized Fund', category: 'Primary', fileName: 'DigitalFund_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Digital Tokenized Fund', category: 'Primary', fileName: 'DigitalFund_ERC20 2.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Digital Tokenized Fund', category: 'Primary', fileName: 'DigitalFund_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Digital Tokenized Fund', category: 'Primary', fileName: 'DigitalFund_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  
  // Energy
  { productType: 'Energy', category: 'Alternative', fileName: 'Energy_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Energy', category: 'Alternative', fileName: 'Energy_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Energy', category: 'Alternative', fileName: 'Energy_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Energy', category: 'Primary', fileName: 'Energy_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Energy', category: 'Primary', fileName: 'Energy_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Equity
  { productType: 'Equity', category: 'Alternative', fileName: 'Equity_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Equity', category: 'Alternative', fileName: 'Equity_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Equity', category: 'Alternative', fileName: 'Equity_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Equity', category: 'Primary', fileName: 'Equity_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Equity', category: 'Primary', fileName: 'Equity_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Funds, ETFs, ETPs
  { productType: 'Funds, ETFs, ETPs', category: 'Alternative', fileName: 'Funds_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Funds, ETFs, ETPs', category: 'Alternative', fileName: 'Funds_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  { productType: 'Funds, ETFs, ETPs', category: 'Primary', fileName: 'Funds_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Funds, ETFs, ETPs', category: 'Primary', fileName: 'Funds_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  
  // Infrastructure
  { productType: 'Infrastructure', category: 'Alternative', fileName: 'Infrastructure_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Infrastructure', category: 'Alternative', fileName: 'Infrastructure_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Infrastructure', category: 'Alternative', fileName: 'Infrastructure_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Infrastructure', category: 'Primary', fileName: 'Infrastructure_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Infrastructure', category: 'Primary', fileName: 'Infrastructure_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Private Debt
  { productType: 'Private Debt', category: 'Alternative', fileName: 'PrivateDebt_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Private Debt', category: 'Alternative', fileName: 'PrivateDebt_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Private Debt', category: 'Alternative', fileName: 'PrivateDebt_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Private Debt', category: 'Primary', fileName: 'PrivateDebt_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Private Debt', category: 'Primary', fileName: 'PrivateDebt_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Private Equity
  { productType: 'Private Equity', category: 'Alternative', fileName: 'PrivateEquity_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Private Equity', category: 'Alternative', fileName: 'PrivateEquity_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Private Equity', category: 'Alternative', fileName: 'PrivateEquity_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Private Equity', category: 'Primary', fileName: 'PrivateEquity_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Private Equity', category: 'Primary', fileName: 'PrivateEquity_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Quantitative Strategies
  { productType: 'Quantitative Strategies', category: 'Alternative', fileName: 'Quant_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  { productType: 'Quantitative Strategies', category: 'Primary', fileName: 'Quant_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Quantitative Strategies', category: 'Primary', fileName: 'Quant_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  
  // Real Estate
  { productType: 'Real Estate', category: 'Alternative', fileName: 'RealEstate_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Real Estate', category: 'Alternative', fileName: 'RealEstate_ERC721.json', tokenStandard: 'ERC721' as TokenStandard },
  { productType: 'Real Estate', category: 'Primary', fileName: 'RealEstate_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Real Estate', category: 'Primary', fileName: 'RealEstate_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  
  // Solar and Wind Energy, Climate Receivables
  { productType: 'Solar and Wind Energy, Climate Receivables', category: 'Alternative', fileName: 'Climate_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Solar and Wind Energy, Climate Receivables', category: 'Alternative', fileName: 'Climate_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Solar and Wind Energy, Climate Receivables', category: 'Primary', fileName: 'Climate_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Solar and Wind Energy, Climate Receivables', category: 'Primary', fileName: 'Climate_ERC4626.json', tokenStandard: 'ERC4626' as TokenStandard },
  
  // Structured Products
  { productType: 'Structured Products', category: 'Alternative', fileName: 'StructuredProduct_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Structured Products', category: 'Alternative', fileName: 'StructuredProduct_ERC20.json', tokenStandard: 'ERC20' as TokenStandard },
  { productType: 'Structured Products', category: 'Alternative', fileName: 'StructuredProduct_ERC3525.json', tokenStandard: 'ERC3525' as TokenStandard },
  { productType: 'Structured Products', category: 'Primary', fileName: 'StructuredProduct_ERC1400.json', tokenStandard: 'ERC1400' as TokenStandard },
  { productType: 'Structured Products', category: 'Primary', fileName: 'StructuredProduct_ERC20.json', tokenStandard: 'ERC20' as TokenStandard }
];

const ProductSelector: React.FC<ProductSelectorProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  // Filter states
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Primary' | 'Alternative'>('all');
  
  // Base path for JSON files (in public folder)
  const basePath = '/JSON_Products';

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load the file list by checking which files actually exist
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const fileItems: FileItem[] = [];
      
      // Start with our known files
      for (const knownFile of KNOWN_FILES) {
        const filePath = `${basePath}/${knownFile.productType}/${knownFile.category}/${knownFile.fileName}`;
        
        // Check if the file actually exists
        const exists = await fileExists(filePath);
        
        if (exists) {
          fileItems.push({
            name: knownFile.fileName,
            path: filePath,
            productType: knownFile.productType,
            category: knownFile.category,
            tokenStandard: knownFile.tokenStandard
          });
        }
      }
      
      setFiles(fileItems);
      console.log(`Loaded ${fileItems.length} JSON files`);
      
      // Only show toast if we found files
      if (fileItems.length > 0) {
        toast({
          title: "File list refreshed",
          description: `Found ${fileItems.length} JSON files`,
          duration: 3000
        });
      } else {
        toast({
          title: "No files found",
          description: "No JSON files were found in the expected locations",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error refreshing files",
        description: "Could not refresh file list",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file.path);
    
    try {
      // Check if the file exists before trying to load it
      const exists = await fileExists(file.path);
      
      if (!exists) {
        throw new Error(`File does not exist: ${file.path}`);
      }
      
      // Load the JSON file content
      const content = await loadJsonFile(file.path, true);
      
      // Determine config mode (min or max)
      const configMode = file.path.toLowerCase().includes('min') ? 'min' : 'max';
      
      // Notify parent component of selection
      onFileSelect({
        content,
        tokenStandard: file.tokenStandard,
        configMode
      });
      
      toast({
        title: "File loaded",
        description: `Loaded ${file.name}`,
        duration: 2000
      });
    } catch (error) {
      console.error(`Error loading file ${file.path}:`, error);
      
      // Alert the user that the file couldn't be loaded
      toast({
        title: "Error loading file",
        description: `Unable to load ${file.name}. The file might not exist or there was an error loading it.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Filter the file list based on search term and selected filters
  const filteredFiles = files.filter(file => {
    // Text search filter
    const matchesSearch = !searchTerm || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tokenStandard.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Product type filter
    const matchesProduct = productFilter === 'all' || file.productType === productFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    
    return matchesSearch && matchesProduct && matchesCategory;
  });

  // Render a file item
  const renderFileItem = (file: FileItem) => {
    const isSelected = file.path === selectedFile;
    
    // Token standard badge
    const tokenBadge = (
      <Badge variant="outline" className="ml-1 text-xs">
        {file.tokenStandard}
      </Badge>
    );
    
    // Category badge
    const categoryBadge = (
      <Badge variant={file.category === 'Primary' ? 'default' : 'secondary'} className="ml-1 text-xs">
        {file.category}
      </Badge>
    );
    
    return (
      <div 
        key={file.path}
        className={`flex items-center justify-between rounded-md px-3 py-2 my-1 cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-100 hover:bg-blue-100' : ''}`}
        onClick={() => handleFileSelect(file)}
      >
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          <span className="mr-2">{file.name}</span>
          {tokenBadge}
        </div>
        <div className="flex items-center">
          {categoryBadge}
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>JSON File Browser</CardTitle>
          <CardDescription>
            Browse and select token JSON files
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={loadFiles}
          disabled={isLoading}
          title="Refresh file list"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="search">Search Files</Label>
              <Input
                id="search"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="product-filter">Filter by Product</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger id="product-filter" className="mt-1">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {/* Use the static PRODUCT_TYPES array to ensure all products are listed */}
                  {PRODUCT_TYPES.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger id="category-filter" className="mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Alternative">Alternative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Display filters summary */}
          <div className="flex flex-wrap gap-2">
            {productFilter !== 'all' && (
              <Badge variant="outline" className="px-2 py-1">
                Product: {productFilter}
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="outline" className="px-2 py-1">
                Category: {categoryFilter}
              </Badge>
            )}
          </div>
          
          {/* File listing */}
          <div className="border rounded-md">
            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full p-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full p-4 text-gray-500">
                  {files.length === 0 ? 
                    "No files found. Click refresh to scan for files." : 
                    productFilter !== 'all' ? 
                      `No files found for ${productFilter}${categoryFilter !== 'all' ? ` in ${categoryFilter}` : ''}` :
                      "No matching files found for the current filters."}
                </div>
              ) : (
                <div className="p-2">
                  {filteredFiles.map(file => renderFileItem(file))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSelector;