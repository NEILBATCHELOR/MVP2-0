import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Copy,
  Wallet,
  Shield,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { SignatoryInfo } from '../types';
import { Wallet as EthersWallet } from 'ethers';

export const WalletSetup: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateInvestorData, updateWalletStatus } = useOnboarding();
  
  const [walletType, setWalletType] = useState<'guardian' | 'external'>('guardian');
  const [blockchain, setBlockchain] = useState('ethereum');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletJson, setWalletJson] = useState<string>('');
  const [isMultiSig, setIsMultiSig] = useState(false);
  const [signatories, setSignatories] = useState<SignatoryInfo[]>([
    {
      id: '1',
      name: state.investorData.fullName || 'Primary Investor',
      email: state.investorData.businessEmail || '',
      role: 'primary',
    },
  ]);
  const [newSignatory, setNewSignatory] = useState<Omit<SignatoryInfo, 'id'>>({
    name: '',
    email: '',
    role: 'approver',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleWalletTypeChange = (type: 'guardian' | 'external') => {
    setWalletType(type);
    if (type === 'guardian') {
      generateWalletAddress();
    } else {
      setWalletAddress('');
      setWalletJson('');
    }
  };

  const generateWalletAddress = async () => {
    try {
      // Create a new random wallet
      const wallet = EthersWallet.createRandom();
      
      // Set the wallet address
      setWalletAddress(wallet.address);

      // Create an encrypted JSON wallet with a temporary password
      // In production, you would want to use a user-provided password
      const tempPassword = "temporary-password-" + Date.now();
      const json = await wallet.encrypt(tempPassword);
      setWalletJson(json);

    } catch (error) {
      console.error('Error generating wallet:', error);
      setErrors({ wallet: 'Failed to generate wallet. Please try again.' });
    }
  };

  const handleBlockchainChange = (value: string) => {
    setBlockchain(value);
    if (walletType === 'guardian') {
      generateWalletAddress();
    }
  };

  const handleAddSignatory = () => {
    if (!newSignatory.name || !newSignatory.email) {
      setErrors({
        ...errors,
        signatory: 'Please fill in all signatory information',
      });
      return;
    }

    const newId = (signatories.length + 1).toString();
    setSignatories([...signatories, { ...newSignatory, id: newId }]);
    setNewSignatory({ name: '', email: '', role: 'approver' });
    setErrors({});
  };

  const handleRemoveSignatory = (id: string) => {
    if (id === '1') return; // Can't remove primary signatory
    setSignatories(signatories.filter((sig) => sig.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (walletType === 'external' && !walletAddress) {
      newErrors.wallet = 'Please enter a wallet address';
    }

    if (isMultiSig && signatories.length < 2) {
      newErrors.signatories = 'Multi-signature requires at least 2 signatories';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownloadBackup = () => {
    if (!walletJson) {
      setErrors({ wallet: 'No wallet backup available' });
      return;
    }

    const blob = new Blob([walletJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardian-wallet-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Update investor data
      updateInvestorData({
        walletType,
        walletAddress,
        isMultiSigEnabled: isMultiSig,
        signatories: isMultiSig ? signatories : undefined,
      });

      // Update wallet status
      updateWalletStatus({
        status: 'pending',
        guardianPolicyStatus: 'pending',
      });

      // Navigate to dashboard
      navigate('/compliance/investor-onboarding/dashboard');
    } catch (error) {
      console.error('Wallet setup error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Wallet Setup & Compliance</h2>
        <p className="text-gray-500 mt-2">
          Set up your investment wallet and complete the compliance approval process
        </p>
      </div>

      {/* Wallet Options */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Options</CardTitle>
          <CardDescription>
            Choose between a Guardian Wallet or connect your existing wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                walletType === 'guardian'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleWalletTypeChange('guardian')}
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Create a Guardian Wallet</h3>
                  <p className="text-sm text-gray-500">
                    We'll create a secure wallet for you that's fully compliant
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                walletType === 'external'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleWalletTypeChange('external')}
            >
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Connect Existing Wallet</h3>
                  <p className="text-sm text-gray-500">
                    Connect your MetaMask, Ledger, or other compatible wallet
                  </p>
                </div>
              </div>
            </div>
          </div>

          {walletType === 'guardian' && (
            <div className="space-y-4">
              <div>
                <Label>Select Blockchain</Label>
                <Select value={blockchain} onValueChange={handleBlockchainChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="avalanche">Avalanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Wallet Address</Label>
                <div className="flex items-center space-x-2">
                  <Input value={walletAddress} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-amber-600 mt-2">
                  Important: Download your wallet backup before continuing. Anyone with
                  access to this backup will have full control over the wallet.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={generateWalletAddress}>
                  Generate New
                </Button>
                <Button variant="outline" onClick={handleDownloadBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Backup
                </Button>
              </div>
            </div>
          )}

          {walletType === 'external' && (
            <div className="space-y-4">
              <div>
                <Label>Wallet Address</Label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                />
                {errors.wallet && (
                  <p className="text-sm text-red-500 mt-1">{errors.wallet}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Signature Setup */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Multi-Signature Setup</CardTitle>
            <CardDescription>
              Enable multi-signature for enhanced security
            </CardDescription>
          </div>
          <Switch
            checked={isMultiSig}
            onCheckedChange={setIsMultiSig}
          />
        </CardHeader>
        {isMultiSig && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {signatories.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sig.name}</p>
                    <p className="text-sm text-gray-500">{sig.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={sig.role === 'primary' ? 'default' : 'secondary'}>
                      {sig.role === 'primary' ? 'Primary' : 'Approver'}
                    </Badge>
                    {sig.id !== '1' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSignatory(sig.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="Name"
                  value={newSignatory.name}
                  onChange={(e) =>
                    setNewSignatory((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Email"
                  value={newSignatory.email}
                  onChange={(e) =>
                    setNewSignatory((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
                <Button onClick={handleAddSignatory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signatory
                </Button>
              </div>
              {errors.signatory && (
                <p className="text-sm text-red-500">{errors.signatory}</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Wallet Activation Status */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your wallet will be activated once your KYC/AML verification is complete.
          This typically takes 1-2 business days.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={handleSubmit}>Continue</Button>
      </div>
    </div>
  );
};

export default WalletSetup;