/**
 * DFNS Wallet Creation Component
 * 
 * Provides a comprehensive form for creating new DFNS wallets
 * across multiple blockchain networks with advanced configuration options.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet as WalletIcon,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Network,
  Shield,
  Key,
  Settings,
  Tag
} from 'lucide-react';

import type { Wallet, WalletCreationRequest, DfnsNetwork } from '@/types/dfns';
import { dfnsService } from '@/services/dfns/dfnsService';

interface DfnsWalletCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletCreated: (wallet: Wallet) => void;
}

interface NetworkOption {
  id: string;
  name: string;
  description: string;
  supported: boolean;
  testnet?: boolean;
  curve: 'secp256k1' | 'ed25519';
  features: string[];
}

const SUPPORTED_NETWORKS: NetworkOption[] = [
  {
    id: 'Ethereum',
    name: 'Ethereum',
    description: 'Ethereum mainnet with EVM support',
    supported: true,
    curve: 'secp256k1',
    features: ['Smart Contracts', 'ERC-20', 'ERC-721', 'ERC-1155', 'DeFi']
  },
  {
    id: 'EthereumGoerli',
    name: 'Ethereum Goerli',
    description: 'Ethereum testnet for development',
    supported: true,
    testnet: true,
    curve: 'secp256k1',
    features: ['Testnet', 'Smart Contracts', 'ERC Tokens']
  },
  {
    id: 'EthereumSepolia',
    name: 'Ethereum Sepolia',
    description: 'Ethereum testnet (recommended)',
    supported: true,
    testnet: true,
    curve: 'secp256k1',
    features: ['Testnet', 'Smart Contracts', 'ERC Tokens']
  },
  {
    id: 'Polygon',
    name: 'Polygon',
    description: 'Layer 2 scaling solution for Ethereum',
    supported: true,
    curve: 'secp256k1',
    features: ['Low Fees', 'Fast Transactions', 'EVM Compatible']
  },
  {
    id: 'PolygonMumbai',
    name: 'Polygon Mumbai',
    description: 'Polygon testnet',
    supported: true,
    testnet: true,
    curve: 'secp256k1',
    features: ['Testnet', 'Low Fees', 'EVM Compatible']
  },
  {
    id: 'Bitcoin',
    name: 'Bitcoin',
    description: 'Bitcoin mainnet',
    supported: true,
    curve: 'secp256k1',
    features: ['Store of Value', 'P2P Transactions']
  },
  {
    id: 'BitcoinTestnet',
    name: 'Bitcoin Testnet',
    description: 'Bitcoin testnet for development',
    supported: true,
    testnet: true,
    curve: 'secp256k1',
    features: ['Testnet', 'P2P Transactions']
  },
  {
    id: 'Solana',
    name: 'Solana',
    description: 'High-performance blockchain',
    supported: true,
    curve: 'ed25519',
    features: ['High Throughput', 'Low Fees', 'SPL Tokens']
  },
  {
    id: 'SolanaDevnet',
    name: 'Solana Devnet',
    description: 'Solana development network',
    supported: true,
    testnet: true,
    curve: 'ed25519',
    features: ['Testnet', 'High Throughput', 'SPL Tokens']
  },
  {
    id: 'Arbitrum',
    name: 'Arbitrum One',
    description: 'Ethereum Layer 2 with Optimistic Rollups',
    supported: true,
    curve: 'secp256k1',
    features: ['Layer 2', 'Low Fees', 'EVM Compatible']
  },
  {
    id: 'Optimism',
    name: 'Optimism',
    description: 'Ethereum Layer 2 scaling solution',
    supported: true,
    curve: 'secp256k1',
    features: ['Layer 2', 'Optimistic Rollups', 'EVM Compatible']
  }
];

export function DfnsWalletCreation({
  isOpen,
  onClose,
  onWalletCreated
}: DfnsWalletCreationProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    network: '',
    externalId: '',
    tags: '',
    custodial: true,
    enableDelegation: false,
    delegatedTo: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'config' | 'advanced' | 'review'>('config');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        network: '',
        externalId: '',
        tags: '',
        custodial: true,
        enableDelegation: false,
        delegatedTo: ''
      });
      setStep('config');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const selectedNetwork = SUPPORTED_NETWORKS.find(n => n.id === formData.network);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Wallet name is required';
    }
    
    if (!formData.network) {
      return 'Please select a network';
    }

    if (formData.enableDelegation && !formData.delegatedTo.trim()) {
      return 'Delegation recipient is required when delegation is enabled';
    }

    return null;
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate form
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      // Prepare wallet creation request
      const createRequest: WalletCreationRequest = {
        name: formData.name.trim(),
        network: formData.network as DfnsNetwork,
        externalId: formData.externalId.trim() || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      // Create wallet via DFNS service
      const response = await dfnsService.createWallet(createRequest);

      if (!response.success || !response.wallet) {
        throw new Error(response.error || 'Failed to create wallet');
      }

      const wallet = response.wallet;

      // Handle delegation if enabled
      if (formData.enableDelegation && formData.delegatedTo.trim()) {
        await dfnsService.delegateWallet(wallet.walletId, formData.delegatedTo.trim());
      }

      setSuccess(`Wallet "${wallet.name || 'Unnamed'}" created successfully!`);
      
      // Notify parent component
      onWalletCreated(wallet);

      // Close dialog after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to create DFNS wallet:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to create wallet. Please check your DFNS configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderConfigStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="walletName">Wallet Name *</Label>
          <Input
            id="walletName"
            placeholder="e.g., Trading Wallet, Treasury, etc."
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            A descriptive name for your wallet
          </p>
        </div>

        <div>
          <Label htmlFor="network">Blockchain Network *</Label>
          <Select value={formData.network} onValueChange={(value) => handleInputChange('network', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a blockchain network" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <h4 className="font-medium text-sm mb-2">Mainnet Networks</h4>
                {SUPPORTED_NETWORKS.filter(n => !n.testnet).map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center gap-2">
                      <span>{network.name}</span>
                      {!network.supported && (
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <Separator className="my-2" />
                <h4 className="font-medium text-sm mb-2">Testnet Networks</h4>
                {SUPPORTED_NETWORKS.filter(n => n.testnet).map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center gap-2">
                      <span>{network.name}</span>
                      <Badge variant="outline" className="text-xs">Testnet</Badge>
                    </div>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          
          {selectedNetwork && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Network className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{selectedNetwork.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNetwork.description}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedNetwork.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      {selectedNetwork.curve}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => setStep('advanced')}
          disabled={!formData.name.trim() || !formData.network}
        >
          Next: Advanced Options
        </Button>
      </div>
    </div>
  );

  const renderAdvancedStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="externalId">External ID (Optional)</Label>
          <Input
            id="externalId"
            placeholder="Your internal reference ID"
            value={formData.externalId}
            onChange={(e) => handleInputChange('externalId', e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Link this wallet to your internal systems
          </p>
        </div>

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            placeholder="trading, treasury, client-funds (comma-separated)"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Add tags for organization and filtering
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Custodial Wallet
              </Label>
              <p className="text-sm text-muted-foreground">
                DFNS manages the private keys for enhanced security
              </p>
            </div>
            <Switch
              checked={formData.custodial}
              onCheckedChange={(checked) => handleInputChange('custodial', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Enable Delegation
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow another user to manage this wallet
              </p>
            </div>
            <Switch
              checked={formData.enableDelegation}
              onCheckedChange={(checked) => handleInputChange('enableDelegation', checked)}
            />
          </div>

          {formData.enableDelegation && (
            <div>
              <Label htmlFor="delegatedTo">Delegate To *</Label>
              <Input
                id="delegatedTo"
                placeholder="user@example.com or user ID"
                value={formData.delegatedTo}
                onChange={(e) => handleInputChange('delegatedTo', e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Email or user ID of the person to delegate wallet management to
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('config')}>
          Back
        </Button>
        <Button onClick={() => setStep('review')}>
          Review & Create
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Wallet Configuration</CardTitle>
          <CardDescription>
            Please review the settings before creating your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{formData.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Network</Label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{selectedNetwork?.name}</p>
                {selectedNetwork?.testnet && (
                  <Badge variant="outline" className="text-xs">Testnet</Badge>
                )}
              </div>
            </div>
            {formData.externalId && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">External ID</Label>
                <p className="text-sm font-medium">{formData.externalId}</p>
              </div>
            )}
            {formData.tags && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {formData.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Custodial</span>
              <Badge variant={formData.custodial ? 'default' : 'secondary'}>
                {formData.custodial ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Delegation</span>
              <Badge variant={formData.enableDelegation ? 'default' : 'secondary'}>
                {formData.enableDelegation ? `Yes (${formData.delegatedTo})` : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('advanced')} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleCreateWallet} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Wallet...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Wallet
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Create DFNS Wallet
          </DialogTitle>
          <DialogDescription>
            Create a new institutional-grade wallet on the DFNS platform
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'config' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'advanced' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step Content */}
          {step === 'config' && renderConfigStep()}
          {step === 'advanced' && renderAdvancedStep()}
          {step === 'review' && renderReviewStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the Props interface
export type { DfnsWalletCreationProps };

export default DfnsWalletCreation;