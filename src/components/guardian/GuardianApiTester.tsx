import React, { useState } from 'react';
import { GuardianWalletService } from '@/services/guardian/GuardianWalletService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface GuardianApiTesterProps {
  onTestResults?: (results: any) => void;
}

export function GuardianApiTester({ onTestResults }: GuardianApiTesterProps = {}) {
  const [output, setOutput] = useState('');
  const [walletId, setWalletId] = useState('');
  const [createdId, setCreatedId] = useState('');
  const walletService = new GuardianWalletService();

  const run = async (fn: () => Promise<any>) => {
    try {
      setOutput('⏳ Waiting...');
      const res = await fn();
      setOutput(JSON.stringify(res, null, 2));
      onTestResults?.(res);
    } catch (e: any) {
      setOutput(`❌ ${e.message}`);
      onTestResults?.(null);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold">🛠 Guardian API Tester</h1>

      <div className="space-y-2">
        <Button onClick={() => run(() => walletService.listWallets())}>GET /wallets</Button>
        <div className="flex items-center gap-2">
          <Input placeholder="Wallet ID" value={walletId} onChange={e => setWalletId(e.target.value)} />
          <Button onClick={() => run(() => walletService.getWalletById(walletId))}>
            GET /wallets/{'{walletId}'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Create Wallet Name" value={createdId} onChange={e => setCreatedId(e.target.value)} />
          <Button onClick={() => run(() => walletService.createWallet({
            name: createdId || 'Test Wallet',
            type: 'EOA',
            userId: 'test-user',
            blockchain: 'polygon'
          }))}>
            POST /wallets/create
          </Button>
        </div>
      </div>

      <Textarea className="min-h-[300px] font-mono" readOnly value={output} />
    </div>
  );
}

export default GuardianApiTester;
