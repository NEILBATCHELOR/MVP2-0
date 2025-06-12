import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, ArrowRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { 
  RipplePaymentsService,
  RipplePaymentParams,
  RippleQuote,
  RipplePaymentResult
} from "@/services/wallet/RipplePaymentsService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RipplePaymentsProps {
  onPaymentComplete?: (result: RipplePaymentResult) => void;
}

type PaymentType = 'domestic' | 'cross-border' | 'crypto';
type PaymentStep = 'form' | 'quote' | 'confirm' | 'processing' | 'success' | 'error';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'XRP', name: 'XRP', flag: '⚡' },
  { code: 'BTC', name: 'Bitcoin', flag: '₿' },
  { code: 'ETH', name: 'Ethereum', flag: 'Ξ' }
];

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' }
];

export const RipplePayments: React.FC<RipplePaymentsProps> = ({ onPaymentComplete }) => {
  const [paymentService, setPaymentService] = useState<RipplePaymentsService | null>(null);
  const [step, setStep] = useState<PaymentStep>('form');
  const [paymentType, setPaymentType] = useState<PaymentType>('cross-border');
  
  // Form state
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('MXN');
  const [fromCountry, setFromCountry] = useState<string>('US');
  const [toCountry, setToCountry] = useState<string>('MX');
  const [destinationTag, setDestinationTag] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  
  // Quote and result state
  const [quote, setQuote] = useState<RippleQuote | null>(null);
  const [result, setResult] = useState<RipplePaymentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Recipient details for cross-border payments
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [routingCode, setRoutingCode] = useState<string>('');

  useEffect(() => {
    // Initialize Ripple service safely
    const initializeService = async () => {
      try {
        const service = new RipplePaymentsService();
        await service.initialize();
        setPaymentService(service);
      } catch (error) {
        console.error('Failed to initialize Ripple service:', error);
        setError('Failed to initialize Ripple service. Please try again.');
      }
    };

    if (!paymentService) {
      initializeService();
    }
  }, [paymentService]);

  const handleGetQuote = async () => {
    if (!paymentService) {
      setError('Payment service not initialized. Please wait.');
      return;
    }

    if (!amount || !fromCurrency || !toCurrency) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const quoteResult = await paymentService.getPaymentQuote(
        fromCurrency,
        toCurrency,
        amount,
        paymentType === 'cross-border' ? fromCountry : undefined,
        paymentType === 'cross-border' ? toCountry : undefined
      );
      
      setQuote(quoteResult);
      setStep('quote');
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!paymentService) {
      setError('Payment service not initialized. Please wait.');
      return;
    }

    setIsLoading(true);
    setStep('processing');

    try {
      let paymentResult;

      if (paymentType === 'cross-border') {
        // Use Ripple Payments Direct API for cross-border
        const { paymentId } = await paymentService.createCrossBorderPayment(
          fromCountry,
          toCountry,
          fromCurrency,
          toCurrency,
          amount,
          {
            name: recipientName,
            address: recipientAddress,
            accountNumber: accountNumber || undefined,
            routingCode: routingCode || undefined
          }
        );

        paymentResult = {
          hash: paymentId,
          ledgerVersion: 0,
          status: 'pending' as const,
          fee: quote?.fee || '0',
          sequence: 0
        };
      } else {
        // Direct XRP ledger payment
        const paymentParams: RipplePaymentParams = {
          fromAccount,
          toAccount,
          amount,
          currency: fromCurrency,
          destinationTag: destinationTag || undefined,
          memo: memo || undefined
        };

        paymentResult = await paymentService.executePayment(paymentParams);
      }

      setResult(paymentResult);
      setStep('success');
      
      if (onPaymentComplete) {
        onPaymentComplete(paymentResult);
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setAmount('');
    setFromAccount('');
    setToAccount('');
    setDestinationTag('');
    setMemo('');
    setRecipientName('');
    setRecipientAddress('');
    setAccountNumber('');
    setRoutingCode('');
    setQuote(null);
    setResult(null);
    setError('');
  };

  const renderPaymentTypeSelector = () => (
    <div className="space-y-3">
      <Label>Payment Type</Label>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={paymentType === 'cross-border' ? 'default' : 'outline'}
          onClick={() => setPaymentType('cross-border')}
          className="flex flex-col items-center gap-2 h-auto py-3"
        >
          <Globe className="w-5 h-5" />
          <span className="text-xs">Cross-Border</span>
        </Button>
        <Button
          variant={paymentType === 'domestic' ? 'default' : 'outline'}
          onClick={() => setPaymentType('domestic')}
          className="flex flex-col items-center gap-2 h-auto py-3"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-xs">Domestic</span>
        </Button>
        <Button
          variant={paymentType === 'crypto' ? 'default' : 'outline'}
          onClick={() => setPaymentType('crypto')}
          className="flex flex-col items-center gap-2 h-auto py-3"
        >
          <Badge variant="secondary" className="w-5 h-5 rounded-full flex items-center justify-center p-0">
            ⚡
          </Badge>
          <span className="text-xs">Crypto</span>
        </Button>
      </div>
    </div>
  );

  const renderCurrencySelector = (
    value: string,
    onChange: (value: string) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              {SUPPORTED_CURRENCIES.find(c => c.code === value)?.flag}
              <span>{value}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span>{currency.flag}</span>
                <span>{currency.code}</span>
                <span className="text-sm text-muted-foreground">{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderCountrySelector = (
    value: string,
    onChange: (value: string) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              {SUPPORTED_COUNTRIES.find(c => c.code === value)?.flag}
              <span>{SUPPORTED_COUNTRIES.find(c => c.code === value)?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderFormStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ripple Payments
          <Badge variant="secondary">ODL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {renderPaymentTypeSelector()}

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4">
          {renderCurrencySelector(fromCurrency, setFromCurrency, "From Currency")}
          {renderCurrencySelector(toCurrency, setToCurrency, "To Currency")}
        </div>

        {/* Country Selection for Cross-Border */}
        {paymentType === 'cross-border' && (
          <div className="grid grid-cols-2 gap-4">
            {renderCountrySelector(fromCountry, setFromCountry, "From Country")}
            {renderCountrySelector(toCountry, setToCountry, "To Country")}
          </div>
        )}

        {/* Account Information */}
        {paymentType === 'crypto' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fromAccount">From Account</Label>
              <Input
                id="fromAccount"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAccount">To Account</Label>
              <Input
                id="toAccount"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationTag" className="flex items-center gap-2">
                Destination Tag (Optional)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Required by some exchanges to identify your account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="destinationTag"
                placeholder="123456789"
                value={destinationTag}
                onChange={(e) => setDestinationTag(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Recipient Information for Cross-Border */}
        {paymentType === 'cross-border' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Recipient Address</Label>
              <Textarea
                id="recipientAddress"
                placeholder="123 Main St, City, State, Country"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingCode">Routing Code</Label>
                <Input
                  id="routingCode"
                  placeholder="SWIFT/ABA"
                  value={routingCode}
                  onChange={(e) => setRoutingCode(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Memo */}
        <div className="space-y-2">
          <Label htmlFor="memo">Memo (Optional)</Label>
          <Input
            id="memo"
            placeholder="Payment description..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleGetQuote} 
          disabled={isLoading || !paymentService}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Quote...
            </>
          ) : !paymentService ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Ripple...
            </>
          ) : (
            <>
              Get Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderQuoteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payment Quote
          <Badge variant="outline">Ripple ODL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Send Amount</span>
            <span className="font-medium">{quote?.sendAmount} {fromCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receive Amount</span>
            <span className="font-medium">{quote?.deliverAmount} {toCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exchange Rate</span>
            <span className="font-medium">{quote?.exchangeRate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-medium">{quote?.fee} {fromCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span className="font-medium">{quote?.slippage}%</span>
          </div>
          {quote?.path && quote.path.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Path</span>
              <span className="font-mono text-sm">{quote.path.join(' → ')}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleExecutePayment} className="flex-1">
            Confirm Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Processing Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="text-center">
            <div className="font-medium">Processing your payment...</div>
            <div className="text-sm text-muted-foreground mt-1">
              Using Ripple's On-Demand Liquidity
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payment Successful
          <CheckCircle className="h-5 w-5 text-green-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-center">
            <div className="font-medium">Payment submitted!</div>
            <div className="text-sm text-muted-foreground mt-1">
              Your payment is being processed via Ripple
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment ID</span>
          </div>
          <div className="font-mono text-sm break-all">
            {result?.hash}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline">{result?.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-medium">{result?.fee} XRP</span>
          </div>
        </div>

        <Button onClick={resetForm} className="w-full">
          Send Another Payment
        </Button>
      </CardContent>
    </Card>
  );

  const renderErrorStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payment Failed
          <AlertCircle className="h-5 w-5 text-red-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm} className="flex-1">
            Start Over
          </Button>
          <Button onClick={() => setStep('form')} className="flex-1">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {step === 'form' && renderFormStep()}
      {step === 'quote' && renderQuoteStep()}
      {step === 'processing' && renderProcessingStep()}
      {step === 'success' && renderSuccessStep()}
      {step === 'error' && renderErrorStep()}
    </div>
  );
};

export default RipplePayments;
