import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Image as ImageIcon, 
  ExternalLink, 
  Zap, 
  TrendingUp, 
  Users, 
  PieChart,
  Gift,
  Upload,
  Filter,
  Search,
  Grid,
  List,
  Star,
  Share2
} from 'lucide-react';
import { nftService, NFTCollectionStats } from '@/services/wallet/moonpay/core/NFTService';
import { MoonpayPass, MoonpayAssetInfo, MoonpayProject } from '@/services/wallet/MoonpayService';
import { useWallet } from '@/services/wallet/WalletContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NFTMarketplaceProps {
  onPassMinted?: (pass: MoonpayPass) => void;
  onPassTransferred?: (pass: MoonpayPass) => void;
}

type ViewMode = 'grid' | 'list';
type PassFilter = 'all' | 'owned' | 'minted' | 'pending';

const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({
  onPassMinted,
  onPassTransferred
}) => {
  const { wallets } = useWallet();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [passFilter, setPassFilter] = useState<PassFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [passes, setPasses] = useState<MoonpayPass[]>([]);
  const [projects, setProjects] = useState<MoonpayProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [collectionStats, setCollectionStats] = useState<NFTCollectionStats | null>(null);
  const [selectedPass, setSelectedPass] = useState<MoonpayPass | null>(null);
  const [passAssetInfo, setPassAssetInfo] = useState<MoonpayAssetInfo | null>(null);

  // Create Pass Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createPassData, setCreatePassData] = useState({
    name: '',
    description: '',
    projectId: '',
    contractAddress: '',
    tokenId: '',
    image: '',
    attributes: [] as Array<{ trait_type: string; value: string | number }>
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPasses();
  }, [passFilter, selectedProject, searchQuery]);

  useEffect(() => {
    if (selectedProject) {
      loadCollectionStats();
    }
  }, [selectedProject]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const { projects } = await nftService.getProjects(20, 0);
      setProjects(projects);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPasses = async () => {
    setIsLoading(true);
    try {
      const userAddress = wallets[0]?.address;
      const filter: any = {};
      
      if (selectedProject) filter.projectId = selectedProject;
      if (passFilter === 'owned' && userAddress) filter.ownerAddress = userAddress;
      if (passFilter !== 'all') filter.status = passFilter === 'minted' ? 'minted' : passFilter;

      const { passes: loadedPasses } = await nftService.getPasses(filter, 50, 0);
      
      // Apply search filter
      const filteredPasses = searchQuery 
        ? loadedPasses.filter(pass => 
            pass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pass.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : loadedPasses;
      
      setPasses(filteredPasses);
    } catch (err) {
      setError('Failed to load passes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectionStats = async () => {
    if (!selectedProject) return;
    
    try {
      const stats = await nftService.getProjectStats(selectedProject);
      setCollectionStats(stats);
    } catch (err) {
      console.error('Failed to load collection stats:', err);
    }
  };

  const handleCreatePass = async () => {
    if (!createPassData.name || !createPassData.projectId) {
      setError('Name and project are required');
      return;
    }

    setIsLoading(true);
    try {
      const newPass = await nftService.createPass({
        ...createPassData,
        status: 'pending'
      } as any);
      
      setPasses(prev => [newPass, ...prev]);
      setShowCreateDialog(false);
      setCreatePassData({
        name: '',
        description: '',
        projectId: '',
        contractAddress: '',
        tokenId: '',
        image: '',
        attributes: []
      });
      
      if (onPassMinted) {
        onPassMinted(newPass);
      }
    } catch (err) {
      setError('Failed to create pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintPass = async (passId: string) => {
    const userAddress = wallets[0]?.address;
    if (!userAddress) {
      setError('Please connect a wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const mintedPass = await nftService.mintPass(passId, userAddress);
      setPasses(prev => prev.map(p => p.id === passId ? mintedPass : p));
      
      if (onPassMinted) {
        onPassMinted(mintedPass);
      }
    } catch (err) {
      setError('Failed to mint pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferPass = async (passId: string, toAddress: string) => {
    const userAddress = wallets[0]?.address;
    if (!userAddress) {
      setError('Please connect a wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const transferredPass = await nftService.transferPass(passId, userAddress, toAddress);
      setPasses(prev => prev.map(p => p.id === passId ? transferredPass : p));
      
      if (onPassTransferred) {
        onPassTransferred(transferredPass);
      }
    } catch (err) {
      setError('Failed to transfer pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPassDetails = async (pass: MoonpayPass) => {
    setSelectedPass(pass);
    
    try {
      const passWithAssetInfo = await nftService.getPassById(pass.id);
      if ('assetInfo' in passWithAssetInfo) {
        setPassAssetInfo(passWithAssetInfo.assetInfo || null);
      }
    } catch (err) {
      console.error('Failed to load asset info:', err);
    }
  };

  const addAttribute = () => {
    setCreatePassData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setCreatePassData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setCreatePassData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const renderCollectionStats = () => {
    if (!collectionStats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{collectionStats.totalPasses}</div>
                <div className="text-sm text-muted-foreground">Total Passes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{collectionStats.mintedPasses}</div>
                <div className="text-sm text-muted-foreground">Minted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{collectionStats.uniqueOwners}</div>
                <div className="text-sm text-muted-foreground">Owners</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {collectionStats.floorPrice ? `${collectionStats.floorPrice} ETH` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Floor Price</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPassCard = (pass: MoonpayPass) => (
    <Card key={pass.id} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square mb-3 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {pass.image ? (
            <img src={pass.image} alt={pass.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium truncate">{pass.name}</h3>
            <Badge variant={
              pass.status === 'minted' ? 'default' :
              pass.status === 'pending' ? 'secondary' :
              'outline'
            }>
              {pass.status}
            </Badge>
          </div>
          
          {pass.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {pass.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Token ID: {pass.tokenId}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewPassDetails(pass)}
              className="flex-1"
            >
              View Details
            </Button>
            
            {pass.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => handleMintPass(pass.id)}
                disabled={isLoading}
              >
                <Zap className="w-3 h-3 mr-1" />
                Mint
              </Button>
            )}
            
            {pass.status === 'minted' && pass.owner === wallets[0]?.address && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Transfer Pass</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCreatePassDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pass</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Pass name"
                value={createPassData.name}
                onChange={(e) => setCreatePassData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={createPassData.projectId}
                onValueChange={(value) => setCreatePassData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Pass description"
              value={createPassData.description}
              onChange={(e) => setCreatePassData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input
                placeholder="0x..."
                value={createPassData.contractAddress}
                onChange={(e) => setCreatePassData(prev => ({ ...prev, contractAddress: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Token ID</Label>
              <Input
                placeholder="Token ID"
                value={createPassData.tokenId}
                onChange={(e) => setCreatePassData(prev => ({ ...prev, tokenId: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              placeholder="https://..."
              value={createPassData.image}
              onChange={(e) => setCreatePassData(prev => ({ ...prev, image: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attributes</Label>
              <Button size="sm" variant="outline" onClick={addAttribute}>
                Add Attribute
              </Button>
            </div>
            
            {createPassData.attributes.map((attr, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Trait type"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeAttribute(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreatePass} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
              Create Pass
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">NFT Marketplace</h1>
          <p className="text-muted-foreground">Manage and trade your digital collectibles</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadPasses()}>
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Create Pass
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search passes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={passFilter} onValueChange={(value: PassFilter) => setPassFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="minted">Minted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collection Stats */}
      {renderCollectionStats()}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Passes Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No passes found</h3>
          <p className="text-muted-foreground">Create your first pass or adjust your filters</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
          : 'grid-cols-1'
        }`}>
          {passes.map(renderPassCard)}
        </div>
      )}

      {/* Create Pass Dialog */}
      {renderCreatePassDialog()}
    </div>
  );
};

export default NFTMarketplace;
