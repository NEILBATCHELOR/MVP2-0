import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { GuardianTestDatabaseService } from '@/services/guardian';
import type { GuardianWallet, GuardianOperation } from '@/types/guardian/guardianTesting';

interface GuardianIdSelectorProps {
  type: 'wallet' | 'operation';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GuardianIdSelector({ 
  type, 
  value, 
  onChange, 
  placeholder, 
  disabled 
}: GuardianIdSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(GuardianWallet | GuardianOperation)[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    loadItems();
  }, [type]);

  const loadItems = async () => {
    setLoading(true);
    try {
      if (type === 'wallet') {
        const wallets = await GuardianTestDatabaseService.getGuardianWallets(100);
        setItems(wallets);
      } else {
        const operations = await GuardianTestDatabaseService.getGuardianOperations(100);
        setItems(operations);
      }
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDisplayValue = (item: GuardianWallet | GuardianOperation) => {
    if (type === 'wallet') {
      const wallet = item as GuardianWallet;
      return `${wallet.wallet_name || 'Unnamed'} (${wallet.guardian_wallet_id?.substring(0, 8)}...)`;
    } else {
      const operation = item as GuardianOperation;
      return `${operation.operation_type} - ${operation.operation_status} (${operation.operation_id?.substring(0, 8)}...)`;
    }
  };

  const getId = (item: GuardianWallet | GuardianOperation) => {
    if (type === 'wallet') {
      return (item as GuardianWallet).guardian_wallet_id;
    } else {
      return (item as GuardianOperation).operation_id;
    }
  };

  const getStatus = (item: GuardianWallet | GuardianOperation) => {
    if (type === 'wallet') {
      return (item as GuardianWallet).wallet_status;
    } else {
      return (item as GuardianOperation).operation_status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (manualEntry) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder={placeholder || `Enter ${type} ID manually`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          <Button
            onClick={() => setManualEntry(false)}
            variant="outline"
            size="sm"
          >
            Select
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select 
            value={value} 
            onValueChange={onChange}
            disabled={disabled || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                loading 
                  ? `Loading ${type}s...` 
                  : `Select ${type} from database records`
              } />
            </SelectTrigger>
            <SelectContent>
              {items.length === 0 ? (
                <SelectItem value="" disabled>
                  No {type}s found in database
                </SelectItem>
              ) : (
                items.map((item) => {
                  const id = getId(item);
                  const status = getStatus(item);
                  
                  return (
                    <SelectItem key={item.id} value={id || ''}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate flex-1">
                          {getDisplayValue(item)}
                        </span>
                        <Badge 
                          className={`ml-2 text-xs ${getStatusColor(status)}`}
                        >
                          {status}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={loadItems}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          onClick={() => setManualEntry(true)}
          variant="outline"
          size="sm"
        >
          Manual
        </Button>
      </div>

      {/* Selected item details */}
      {value && (
        <Card className="border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Selected {type} ID:
                </p>
                <p className="text-xs font-mono text-gray-600 truncate">
                  {value}
                </p>
              </div>
              <Button
                onClick={() => handleCopy(value)}
                variant="ghost"
                size="sm"
              >
                {copied === value ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database statistics */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Available {type}s: {items.length}</span>
        {items.length > 0 && (
          <>
            <span>•</span>
            <span>
              Active: {items.filter(item => getStatus(item) === 'active' || getStatus(item) === 'completed').length}
            </span>
            <span>•</span>
            <span>
              Pending: {items.filter(item => getStatus(item) === 'pending').length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
