/**
 * DFNS Staking Management Component - UI for managing staking operations
 * 
 * This component provides a comprehensive interface for:
 * - Creating and managing stake positions across multiple networks
 * - Monitoring staking rewards and performance
 * - Managing validators and delegation strategies
 * - Staking portfolio analytics and optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DfnsStakingManager,
  StakeAction,
  StakingPortfolio,
  StakingProvider,
  StakingNetwork,
  StakeStatus,
  StakeActionType,
  ValidatorStatus,
  RiskLevel
} from '@/infrastructure/dfns/staking-manager';
import type {
  StakePosition,
  StakingReward,
  ValidatorInfo,
  StakingStrategy
} from '@/types/dfns';
import { DfnsAuthenticator } from '@/infrastructure/dfns';
import { DEFAULT_CLIENT_CONFIG } from '@/infrastructure/dfns/config';
import { 
  Coins, 
  Plus, 
  TrendingUp, 
  Award, 
  Users, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Eye,
  BarChart,
  Shield,
  Zap,
  Target,
  DollarSign
} from 'lucide-react';

// ===== Types =====

interface StakingManagementProps {
  authenticator?: DfnsAuthenticator;
  walletId?: string;
  onStakeCreated?: (stake: StakePosition) => void;
  defaultView?: 'positions' | 'validators' | 'rewards' | 'strategies' | 'portfolio';
}

interface StakeFormData {
  walletId: string;
  provider: StakingProvider;
  network: StakingNetwork;
  amount: string;
  validator?: string;
  duration?: number;
  autoCompound: boolean;
}

interface ActionFormData {
  stakeId: string;
  type: StakeActionType;
  amount?: string;
  validator?: string;
}

// ===== Main Component =====

export const DfnsStakingManagement: React.FC<StakingManagementProps> = ({
  authenticator,
  walletId,
  onStakeCreated,
  defaultView = 'positions'
}) => {
  // ===== State Management =====
  const [stakingManager] = useState(() => 
    new DfnsStakingManager(DEFAULT_CLIENT_CONFIG, authenticator)
  );
  
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [validators, setValidators] = useState<Record<StakingNetwork, ValidatorInfo[]>>({} as any);
  const [rewards, setRewards] = useState<StakingReward[]>([]);
  const [actions, setActions] = useState<StakeAction[]>([]);
  const [portfolio, setPortfolio] = useState<StakingPortfolio | null>(null);
  const [strategies, setStrategies] = useState<StakingStrategy[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStake, setSelectedStake] = useState<StakePosition | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<StakingNetwork>(StakingNetwork.Ethereum);
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState(defaultView);

  // ===== Data Loading =====

  const loadStakes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { stakes: stakeList } = await stakingManager.listStakes(
        walletId ? { walletId } : undefined
      );
      setStakes(stakeList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [stakingManager, walletId]);

  const loadValidators = useCallback(async (network: StakingNetwork) => {
    try {
      setIsLoading(true);
      const validatorList = await stakingManager.listValidators(network);
      setValidators(prev => ({ ...prev, [network]: validatorList }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [stakingManager]);

  const loadRewards = useCallback(async () => {
    try {
      const rewardList = await stakingManager.getStakingRewards();
      setRewards(rewardList);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [stakingManager]);

  const loadPortfolio = useCallback(async () => {
    try {
      const portfolioData = await stakingManager.getStakingPortfolio(walletId);
      setPortfolio(portfolioData);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [stakingManager, walletId]);

  // ===== Effects =====

  useEffect(() => {
    loadStakes();
    loadRewards();
    loadPortfolio();
    setStrategies(stakingManager.getStakingStrategies());
  }, [loadStakes, loadRewards, loadPortfolio, stakingManager]);

  useEffect(() => {
    loadValidators(selectedNetwork);
  }, [selectedNetwork, loadValidators]);

  // ===== Staking Operations =====

  const handleCreateStake = async (formData: StakeFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newStake = await stakingManager.createStake({
        walletId: formData.walletId,
        provider: formData.provider,
        protocol: 'Native' as any,
        network: formData.network,
        amount: formData.amount,
        validator: formData.validator,
        duration: formData.duration,
        autoCompound: formData.autoCompound
      });
      
      setStakes(prev => [...prev, newStake]);
      setIsStakeDialogOpen(false);
      onStakeCreated?.(newStake);
      loadPortfolio(); // Refresh portfolio
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakeAction = async (formData: ActionFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const action = await stakingManager.createStakeAction({
        stakeId: formData.stakeId,
        type: formData.type,
        amount: formData.amount,
        validator: formData.validator
      });
      
      setActions(prev => [...prev, action]);
      setIsActionDialogOpen(false);
      loadStakes(); // Refresh stakes
      loadPortfolio(); // Refresh portfolio
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await stakingManager.claimRewards(stakeId);
      loadRewards(); // Refresh rewards
      loadPortfolio(); // Refresh portfolio
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Render Helpers =====

  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  const getStatusBadge = (status: StakeStatus) => {
    const variants = {
      [StakeStatus.Active]: 'default',
      [StakeStatus.Pending]: 'secondary',
      [StakeStatus.Unstaking]: 'outline',
      [StakeStatus.Completed]: 'default',
      [StakeStatus.Failed]: 'destructive',
      [StakeStatus.Cancelled]: 'secondary'
    } as const;
    
    const icons = {
      [StakeStatus.Active]: CheckCircle,
      [StakeStatus.Pending]: Clock,
      [StakeStatus.Unstaking]: RefreshCw,
      [StakeStatus.Completed]: CheckCircle,
      [StakeStatus.Failed]: XCircle,
      [StakeStatus.Cancelled]: XCircle
    };
    
    const Icon = icons[status];
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getValidatorStatusBadge = (status: ValidatorStatus) => {
    const variants = {
      [ValidatorStatus.Active]: 'default',
      [ValidatorStatus.Jailed]: 'destructive',
      [ValidatorStatus.Unbonding]: 'outline',
      [ValidatorStatus.Inactive]: 'secondary'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getRiskLevelBadge = (level: RiskLevel) => {
    const variants = {
      [RiskLevel.Low]: 'default',
      [RiskLevel.Medium]: 'outline',
      [RiskLevel.High]: 'destructive'
    } as const;
    
    const colors = {
      [RiskLevel.Low]: 'text-green-600',
      [RiskLevel.Medium]: 'text-yellow-600',
      [RiskLevel.High]: 'text-red-600'
    };
    
    return (
      <Badge variant={variants[level]} className={colors[level]}>
        <Shield className="h-3 w-3 mr-1" />
        {level} Risk
      </Badge>
    );
  };

  // ===== Main Render =====

  return (
    <div className="space-y-6">
      {renderError()}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staking Management</h2>
          <p className="text-gray-600">Manage your staking positions and earn rewards</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isStakeDialogOpen} onOpenChange={setIsStakeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Stake
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <StakeCreateDialog
                validators={validators[selectedNetwork] || []}
                onSubmit={handleCreateStake}
                onCancel={() => setIsStakeDialogOpen(false)}
                isLoading={isLoading}
                defaultWalletId={walletId}
              />
            </DialogContent>
          </Dialog>
          
          {selectedStake && (
            <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Stake Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <StakeActionDialog
                  stake={selectedStake}
                  validators={validators[selectedStake.network] || []}
                  onSubmit={handleStakeAction}
                  onCancel={() => setIsActionDialogOpen(false)}
                  isLoading={isLoading}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(portfolio.totalStaked).toFixed(2)} ETH</div>
              <p className="text-xs text-muted-foreground">
                ~${parseFloat(portfolio.totalValueUsd).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(portfolio.totalRewards).toFixed(4)} ETH</div>
              <p className="text-xs text-muted-foreground">
                Monthly: {parseFloat(portfolio.rewardSummary.monthly).toFixed(4)} ETH
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average APR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(portfolio.averageApr).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                ROI: {parseFloat(portfolio.performanceMetrics.roi).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.positions.length}</div>
              <p className="text-xs text-muted-foreground">
                Pending: {portfolio.pendingActions.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={currentView} onValueChange={(value: string) => setCurrentView(value as typeof currentView)}>
        <TabsList>
          <TabsTrigger value="positions">
            <Coins className="h-4 w-4 mr-2" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="validators">
            <Users className="h-4 w-4 mr-2" />
            Validators
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Award className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="strategies">
            <Zap className="h-4 w-4 mr-2" />
            Strategies
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <BarChart className="h-4 w-4 mr-2" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <StakePositionsView
            stakes={stakes}
            selectedStake={selectedStake}
            onSelectStake={setSelectedStake}
            onClaimRewards={handleClaimRewards}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="validators" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Label>Network:</Label>
            <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as StakingNetwork)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StakingNetwork).map(network => (
                  <SelectItem key={network} value={network}>{network}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ValidatorsView
            validators={validators[selectedNetwork] || []}
            network={selectedNetwork}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <RewardsView
            rewards={rewards}
            stakes={stakes}
            onClaimRewards={handleClaimRewards}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <StrategiesView
            strategies={strategies}
            onSelectStrategy={(strategy) => {
              // Implementation for applying strategy
              console.log('Selected strategy:', strategy);
            }}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioView
            portfolio={portfolio}
            stakes={stakes}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ===== Sub-components =====

interface StakeCreateDialogProps {
  validators: ValidatorInfo[];
  onSubmit: (data: StakeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  defaultWalletId?: string;
}

const StakeCreateDialog: React.FC<StakeCreateDialogProps> = ({
  validators,
  onSubmit,
  onCancel,
  isLoading,
  defaultWalletId
}) => {
  const [formData, setFormData] = useState<StakeFormData>({
    walletId: defaultWalletId || '',
    provider: StakingProvider.Figment,
    network: StakingNetwork.Ethereum,
    amount: '',
    validator: '',
    autoCompound: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Stake Position</DialogTitle>
        <DialogDescription>
          Stake your assets to earn rewards on the selected network.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="wallet-id">Wallet ID</Label>
          <Input
            id="wallet-id"
            value={formData.walletId}
            onChange={(e) => setFormData(prev => ({ ...prev, walletId: e.target.value }))}
            placeholder="Enter wallet ID"
            required
          />
        </div>
        
        <div>
          <Label>Provider</Label>
          <Select 
            value={formData.provider} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value as StakingProvider }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(StakingProvider).map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Network</Label>
          <Select 
            value={formData.network} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, network: value as StakingNetwork }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(StakingNetwork).map(network => (
                <SelectItem key={network} value={network}>{network}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.000001"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="Enter amount to stake"
            required
          />
        </div>
        
        {validators.length > 0 && (
          <div>
            <Label>Validator (Optional)</Label>
            <Select 
              value={formData.validator} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, validator: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select validator" />
              </SelectTrigger>
              <SelectContent>
                {validators.slice(0, 10).map(validator => (
                  <SelectItem key={validator.id} value={validator.address}>
                    {validator.name || validator.address.slice(0, 10)}... 
                    ({validator.apr}% APR)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.walletId || !formData.amount}>
            {isLoading ? 'Creating...' : 'Create Stake'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// Additional sub-components would be implemented here...
// (StakePositionsView, ValidatorsView, RewardsView, etc.)

// StakeActionDialog Component
interface StakeActionDialogProps {
  stake: StakePosition;
  validators: ValidatorInfo[];
  onSubmit: (data: ActionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const StakeActionDialog: React.FC<StakeActionDialogProps> = ({
  stake,
  validators,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<ActionFormData>({
    stakeId: stake.id,
    type: StakeActionType.Delegate,
    amount: '',
    validator: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Stake Action</DialogTitle>
        <DialogDescription>
          Perform an action on stake position: {stake.id}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Action Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as StakeActionType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(StakeActionType).map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(formData.type === StakeActionType.Delegate || formData.type === StakeActionType.Undelegate) && (
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              required
            />
          </div>
        )}
        
        {formData.type === StakeActionType.Delegate && validators.length > 0 && (
          <div>
            <Label>Validator</Label>
            <Select 
              value={formData.validator} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, validator: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select validator" />
              </SelectTrigger>
              <SelectContent>
                {validators.slice(0, 10).map(validator => (
                  <SelectItem key={validator.id} value={validator.address}>
                    {validator.name || validator.address.slice(0, 10)}... 
                    ({validator.apr}% APR)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : `Execute ${formData.type}`}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

// StakePositionsView Component
interface StakePositionsViewProps {
  stakes: StakePosition[];
  selectedStake: StakePosition | null;
  onSelectStake: (stake: StakePosition) => void;
  onClaimRewards: (stakeId: string) => void;
  isLoading: boolean;
}

const StakePositionsView: React.FC<StakePositionsViewProps> = ({
  stakes,
  selectedStake,
  onSelectStake,
  onClaimRewards,
  isLoading
}) => {
  if (isLoading && stakes.length === 0) {
    return <div className="flex justify-center p-4">Loading stakes...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Stake Positions</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Network</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>APR</TableHead>
            <TableHead>Rewards</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stakes.map((stake) => (
            <TableRow 
              key={stake.id} 
              className={selectedStake?.id === stake.id ? 'bg-muted' : 'cursor-pointer'}
              onClick={() => onSelectStake(stake)}
            >
              <TableCell>{stake.network}</TableCell>
              <TableCell>{stake.provider}</TableCell>
              <TableCell>{parseFloat(stake.amount).toFixed(4)} {stake.asset}</TableCell>
              <TableCell>
                <Badge variant={stake.status === StakeStatus.Active ? 'default' : 'secondary'}>
                  {stake.status}
                </Badge>
              </TableCell>
              <TableCell>{parseFloat(stake.apr).toFixed(2)}%</TableCell>
              <TableCell>{parseFloat(stake.rewards).toFixed(6)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimRewards(stake.id);
                    }}
                    disabled={parseFloat(stake.rewards) === 0}
                  >
                    Claim
                  </Button>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStake(stake);
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// ValidatorsView Component
interface ValidatorsViewProps {
  validators: ValidatorInfo[];
  network: StakingNetwork;
  isLoading: boolean;
}

const ValidatorsView: React.FC<ValidatorsViewProps> = ({
  validators,
  network,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading validators...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Validators - {network}</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>APR</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Delegated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validators.slice(0, 20).map((validator) => (
            <TableRow key={validator.id}>
              <TableCell className="font-medium">
                {validator.name || 'Unknown'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {validator.address.slice(0, 12)}...
              </TableCell>
              <TableCell>
                <Badge variant={validator.status === ValidatorStatus.Active ? 'default' : 'secondary'}>
                  {validator.status}
                </Badge>
              </TableCell>
              <TableCell>{parseFloat(validator.apr).toFixed(2)}%</TableCell>
              <TableCell>{parseFloat(validator.commission).toFixed(2)}%</TableCell>
              <TableCell>{parseFloat(validator.delegatedAmount).toFixed(2)}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline">
                  Delegate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// RewardsView Component
interface RewardsViewProps {
  rewards: StakingReward[];
  stakes: StakePosition[];
  onClaimRewards: (stakeId: string) => void;
  isLoading: boolean;
}

const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  stakes,
  onClaimRewards,
  isLoading
}) => {
  const totalRewards = rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
  const unclaimedRewards = rewards.filter(r => !r.claimed);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading rewards...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Staking Rewards</h3>
        <div className="text-sm text-muted-foreground">
          Total: {totalRewards.toFixed(6)} ETH | Unclaimed: {unclaimedRewards.length}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRewards.toFixed(6)} ETH</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unclaimedRewards.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewards.length > 0 ? (totalRewards / Math.max(1, rewards.length / 30)).toFixed(6) : '0.000000'} ETH
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stake ID</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map((reward) => (
            <TableRow key={reward.id}>
              <TableCell className="font-mono text-sm">{reward.stakeId.slice(0, 8)}...</TableCell>
              <TableCell>{reward.network}</TableCell>
              <TableCell>{parseFloat(reward.amount).toFixed(6)} {reward.asset}</TableCell>
              <TableCell>{new Date(reward.dateEarned).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={reward.claimed ? 'default' : 'secondary'}>
                  {reward.claimed ? 'Claimed' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell>
                {!reward.claimed && (
                  <Button 
                    size="sm" 
                    onClick={() => onClaimRewards(reward.stakeId)}
                  >
                    Claim
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// StrategiesView Component
interface StrategiesViewProps {
  strategies: StakingStrategy[];
  onSelectStrategy: (strategy: StakingStrategy) => void;
  isLoading: boolean;
}

const StrategiesView: React.FC<StrategiesViewProps> = ({
  strategies,
  onSelectStrategy,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading strategies...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staking Strategies</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="cursor-pointer hover:bg-muted" onClick={() => onSelectStrategy(strategy)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </div>
                <Badge variant={strategy.riskLevel === RiskLevel.Low ? 'default' : strategy.riskLevel === RiskLevel.Medium ? 'secondary' : 'destructive'}>
                  {strategy.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expected APR:</span>
                  <span>{parseFloat(strategy.expectedApr).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto Compound:</span>
                  <span>{strategy.autoCompound ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Networks:</span>
                  <span>{strategy.supportedNetworks.length}</span>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Apply Strategy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// PortfolioView Component
interface PortfolioViewProps {
  portfolio: StakingPortfolio | null;
  stakes: StakePosition[];
  isLoading: boolean;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  stakes,
  isLoading
}) => {
  if (isLoading) {
    return <div className="flex justify-center p-4">Loading portfolio...</div>;
  }

  if (!portfolio) {
    return <div className="flex justify-center p-4">No portfolio data available</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staking Portfolio</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Staked:</span>
              <span className="font-medium">{parseFloat(portfolio.totalStaked).toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Total Rewards:</span>
              <span className="font-medium">{parseFloat(portfolio.totalRewards).toFixed(6)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Average APR:</span>
              <span className="font-medium">{parseFloat(portfolio.averageApr).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Portfolio Value:</span>
              <span className="font-medium">${parseFloat(portfolio.totalValueUsd).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>ROI:</span>
              <span className="font-medium">{parseFloat(portfolio.performanceMetrics.roi).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Return:</span>
              <span className="font-medium">{parseFloat(portfolio.performanceMetrics.totalReturn).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Score:</span>
              <span className="font-medium">7.5/10</span>
            </div>
            <div className="flex justify-between">
              <span>Sharpe Ratio:</span>
              <span className="font-medium">{parseFloat(portfolio.performanceMetrics.sharpeRatio).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Position Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolio.positions.map((position, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{position.network}</Badge>
                  <span className="font-medium">{position.provider}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{parseFloat(position.amount).toFixed(4)} {position.asset}</div>
                  <div className="text-sm text-muted-foreground">{parseFloat(position.apr).toFixed(2)}% APR</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===== Export =====

export default DfnsStakingManagement;
