import { useEffect, useState } from 'react';
import { GuardianWalletService } from '@/services/guardian/GuardianWalletService';
import type { GuardianWalletExtension } from '@/types/guardian/guardian';
import type { Wallet } from '@/types/core/centralModels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GuardianWalletListProps {
  onTestResult?: (result: 'success' | 'error' | 'pending') => void;
}

export function GuardianWalletList({ onTestResult }: GuardianWalletListProps = {}) {
  const [wallets, setWallets] = useState<(Wallet & GuardianWalletExtension)[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      onTestResult?.('pending');
      try {
        const service = new GuardianWalletService();
        const data = await service.listWallets();
        setWallets(data);
        onTestResult?.('success');
      } catch (err: any) {
        setError(err.message);
        onTestResult?.('error');
      }
    };

    fetchWallets();
  }, [onTestResult]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Guardian Wallets</h2>
      {error && <div className="text-red-600">Error: {error}</div>}
      {wallets.map((wallet) => (
        <Card key={wallet.id}>
          <CardHeader>
            <CardTitle>{wallet.name || wallet.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-700">
              {JSON.stringify(wallet, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default GuardianWalletList;
