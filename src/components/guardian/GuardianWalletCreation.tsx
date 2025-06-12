import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuardianWalletService } from '@/services/guardian/GuardianWalletService';

interface GuardianWalletCreationProps {
  onTestResult?: (result: 'success' | 'error' | 'pending') => void;
}

export function GuardianWalletCreation({ onTestResult }: GuardianWalletCreationProps = {}) {
  const [walletId, setWalletId] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    onTestResult?.('pending');
    try {
      const service = new GuardianWalletService();
      const result = await service.createWallet({
        name: walletId || 'Test Wallet',
        type: 'EOA',
        userId: 'test-user',
        blockchain: 'polygon'
      });
      setResponse(result);
      onTestResult?.('success');
    } catch (e: any) {
      setError(e.message);
      onTestResult?.('error');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter Wallet ID"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
      />
      <Button onClick={handleCreate}>Create Wallet</Button>
      {response && (
        <pre className="bg-gray-100 p-2 text-xs overflow-auto">{JSON.stringify(response, null, 2)}</pre>
      )}
      {error && (
        <div className="text-red-500 text-sm">Error: {error}</div>
      )}
    </div>
  );
}

export default GuardianWalletCreation;
