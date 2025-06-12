/**
 * RAMP Network Widget Component
 * 
 * Main React wrapper component for RAMP Network SDK integration
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { RampNetworkManager } from '@/infrastructure/dfns/fiat/ramp-network-manager';
import type {
  RampSDKConfig,
  RampNetworkEnhancedConfig,
  RampEventListeners,
  RampPurchaseCreatedEvent,
  RampSaleCreatedEvent,
  RampSendCryptoRequestEvent,
  RampWidgetCloseEvent,
  RampWidgetConfigDoneEvent,
  RampWidgetConfigFailedEvent
} from '@/types/ramp';

export interface RampWidgetProps {
  /** RAMP SDK configuration */
  config: RampSDKConfig;
  
  /** Integration mode for the widget */
  mode?: 'overlay' | 'hosted' | 'embedded';
  
  /** Container class name for styling */
  className?: string;
  
  /** Container style for embedded mode */
  style?: React.CSSProperties;
  
  /** Whether to show widget immediately on mount */
  autoShow?: boolean;
  
  /** Custom button text for manual trigger */
  buttonText?: string;
  
  /** Whether the trigger button should be disabled */
  disabled?: boolean;
  
  /** Loading state override */
  loading?: boolean;
  
  /** Event handlers */
  onPurchaseCreated?: (event: RampPurchaseCreatedEvent) => void;
  onSaleCreated?: (event: RampSaleCreatedEvent) => void;
  onSendCryptoRequest?: (event: RampSendCryptoRequestEvent) => void;
  onWidgetClose?: (event: RampWidgetCloseEvent) => void;
  onWidgetConfigDone?: (event: RampWidgetConfigDoneEvent) => void;
  onWidgetConfigFailed?: (event: RampWidgetConfigFailedEvent) => void;
  onError?: (error: Error) => void;
  
  /** Custom error message */
  errorMessage?: string;
  
  /** Whether to show status badges */
  showStatus?: boolean;
  
  /** Custom success message after transaction */
  successMessage?: string;
}

export function RampWidget({
  config,
  mode = 'overlay',
  className,
  style,
  autoShow = false,
  buttonText,
  disabled = false,
  loading: externalLoading = false,
  onPurchaseCreated,
  onSaleCreated,
  onSendCryptoRequest,
  onWidgetClose,
  onWidgetConfigDone,
  onWidgetConfigFailed,
  onError,
  errorMessage,
  showStatus = true,
  successMessage
}: RampWidgetProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<'idle' | 'initializing' | 'ready' | 'active' | 'completed' | 'error'>('idle');
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  // Refs
  const rampManagerRef = useRef<RampNetworkManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<any>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Initialize RAMP manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        setIsLoading(true);
        setWidgetStatus('initializing');
        
        const rampConfig: RampNetworkEnhancedConfig = {
          apiKey: config.hostApiKey,
          hostAppName: config.hostAppName,
          hostLogoUrl: config.hostLogoUrl,
          enabledFlows: config.enabledFlows || ['ONRAMP', 'OFFRAMP'],
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
          enableNativeFlow: true,
          enableQuotes: true,
          enableWebhooks: true,
          enableEventTracking: true
        };
        
        const manager = new RampNetworkManager(rampConfig);
        await manager.initializeSDK();
        
        rampManagerRef.current = manager;
        setWidgetStatus('ready');
        setError(null);
        
        if (autoShow && mode === 'overlay') {
          handleShowWidget();
        }
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize RAMP widget';
        setError(errorMsg);
        setWidgetStatus('error');
        onError?.(err as Error);
        
        toast({
          title: 'Initialization Error',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeManager();
    
    // Cleanup
    return () => {
      if (rampManagerRef.current) {
        rampManagerRef.current.closeWidget();
      }
    };
  }, [config, mode, autoShow, onError, toast]);
  
  // Event handlers setup
  useEffect(() => {
    const manager = rampManagerRef.current;
    if (!manager) return;
    
    // Purchase created
    const handlePurchaseCreated = (data: any) => {
      setWidgetStatus('active');
      setLastTransaction(data);
      onPurchaseCreated?.(data);
      
      toast({
        title: 'Purchase Created',
        description: 'Your crypto purchase has been initiated.',
      });
    };
    
    // Sale created
    const handleSaleCreated = (data: any) => {
      setWidgetStatus('active');
      setLastTransaction(data);
      onSaleCreated?.(data);
      
      toast({
        title: 'Sale Created',
        description: 'Your crypto sale has been initiated.',
      });
    };
    
    // Send crypto request
    const handleSendCryptoRequest = (data: any) => {
      onSendCryptoRequest?.(data);
      
      toast({
        title: 'Crypto Transfer Required',
        description: `Please send ${data.cryptoAmount} to ${data.cryptoAddress}`,
      });
    };
    
    // Widget close
    const handleWidgetClose = (data: any) => {
      setWidgetStatus('idle');
      onWidgetClose?.(data);
    };
    
    // Widget config done
    const handleWidgetConfigDone = (data: any) => {
      setWidgetStatus('ready');
      onWidgetConfigDone?.(data);
    };
    
    // Widget config failed
    const handleWidgetConfigFailed = (data: any) => {
      setWidgetStatus('error');
      setError('Widget configuration failed');
      onWidgetConfigFailed?.(data);
    };
    
    // Add event listeners
    manager.addEventListener('purchase_created', handlePurchaseCreated);
    manager.addEventListener('offramp_sale_created', handleSaleCreated);
    manager.addEventListener('send_crypto_request', handleSendCryptoRequest);
    manager.addEventListener('widget_close', handleWidgetClose);
    manager.addEventListener('widget_config_done', handleWidgetConfigDone);
    manager.addEventListener('widget_config_failed', handleWidgetConfigFailed);
    
    // Cleanup
    return () => {
      manager.removeEventListener('purchase_created', handlePurchaseCreated);
      manager.removeEventListener('offramp_sale_created', handleSaleCreated);
      manager.removeEventListener('send_crypto_request', handleSendCryptoRequest);
      manager.removeEventListener('widget_close', handleWidgetClose);
      manager.removeEventListener('widget_config_done', handleWidgetConfigDone);
      manager.removeEventListener('widget_config_failed', handleWidgetConfigFailed);
    };
  }, [onPurchaseCreated, onSaleCreated, onSendCryptoRequest, onWidgetClose, onWidgetConfigDone, onWidgetConfigFailed, toast]);
  
  // Show widget handler
  const handleShowWidget = useCallback(async () => {
    const manager = rampManagerRef.current;
    if (!manager || widgetStatus !== 'ready') return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const request = {
        walletAddress: config.userAddress || '',
        cryptoAsset: config.swapAsset || config.offrampAsset || 'ETH',
        currency: config.fiatCurrency || 'USD',
        amount: config.fiatValue || config.swapAmount || '100',
        paymentMethod: config.paymentMethodType,
        userEmail: config.userEmailAddress,
        returnUrl: config.finalUrl,
        bankAccount: {
          accountNumber: '',
          accountHolderName: '',
          bankName: '',
          country: 'US',
          currency: config.fiatCurrency || 'USD'
        }
      };
      
      let result;
      
      if (config.defaultFlow === 'OFFRAMP') {
        result = await manager.createOffRampWidget(request);
      } else {
        result = await manager.createOnRampWidget(request);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      widgetInstanceRef.current = result.data?.widgetInstance;
      setWidgetStatus('active');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to show widget';
      setError(errorMsg);
      setWidgetStatus('error');
      onError?.(err as Error);
      
      toast({
        title: 'Widget Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [config, widgetStatus, onError, toast]);
  
  // Close widget handler
  const handleCloseWidget = useCallback(() => {
    if (rampManagerRef.current) {
      rampManagerRef.current.closeWidget();
    }
    setWidgetStatus('idle');
  }, []);
  
  // Get status badge
  const getStatusBadge = () => {
    const statusMap = {
      idle: { label: 'Ready', variant: 'secondary' as const },
      initializing: { label: 'Initializing', variant: 'outline' as const },
      ready: { label: 'Ready', variant: 'default' as const },
      active: { label: 'Active', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'default' as const },
      error: { label: 'Error', variant: 'destructive' as const }
    };
    
    const status = statusMap[widgetStatus];
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };
  
  // Get flow badge
  const getFlowBadge = () => {
    const flow = config.defaultFlow || 'ONRAMP';
    return (
      <Badge variant="outline">
        {flow === 'ONRAMP' ? 'Buy Crypto' : 'Sell Crypto'}
      </Badge>
    );
  };
  
  // Render loading state
  if (isLoading || externalLoading) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="flex items-center justify-center p-6">
          <Spinner className="h-6 w-6 mr-2" />
          <span>Initializing RAMP Network...</span>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error || errorMessage) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Render embedded mode
  if (mode === 'embedded') {
    return (
      <div 
        ref={containerRef}
        className={cn('ramp-widget-container', className)}
        style={style}
      >
        {showStatus && (
          <div className="flex items-center gap-2 mb-4">
            {getStatusBadge()}
            {getFlowBadge()}
          </div>
        )}
        <div id="ramp-widget-embedded" className="w-full h-full min-h-[600px]" />
      </div>
    );
  }
  
  // Render hosted mode
  if (mode === 'hosted') {
    const hostedUrl = `https://app.ramp.network/?${new URLSearchParams({
      hostApiKey: config.hostApiKey,
      ...(config.userAddress && { userAddress: config.userAddress }),
      ...(config.swapAsset && { swapAsset: config.swapAsset }),
      ...(config.fiatCurrency && { fiatCurrency: config.fiatCurrency }),
      ...(config.fiatValue && { fiatValue: config.fiatValue }),
      ...(config.defaultFlow && { defaultFlow: config.defaultFlow }),
      ...(config.finalUrl && { finalUrl: config.finalUrl })
    })}`;
    
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {config.defaultFlow === 'OFFRAMP' ? 'Sell Crypto' : 'Buy Crypto'}
            {showStatus && getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Powered by RAMP Network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.open(hostedUrl, '_blank')}
            disabled={disabled || widgetStatus !== 'ready'}
            className="w-full"
          >
            {buttonText || `${config.defaultFlow === 'OFFRAMP' ? 'Sell' : 'Buy'} Crypto`}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Render overlay mode (default)
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {config.defaultFlow === 'OFFRAMP' ? 'Sell Crypto' : 'Buy Crypto'}
          {showStatus && (
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getFlowBadge()}
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {config.swapAsset || config.offrampAsset} • {config.fiatCurrency || 'USD'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Info */}
        {(config.fiatValue || config.swapAmount) && (
          <div className="text-sm text-muted-foreground">
            Amount: {config.fiatValue || config.swapAmount} {config.fiatCurrency || config.swapAsset}
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && lastTransaction && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleShowWidget}
            disabled={disabled || widgetStatus !== 'ready'}
            className="flex-1"
          >
            {isLoading && <Spinner className="h-4 w-4 mr-2" />}
            {buttonText || `${config.defaultFlow === 'OFFRAMP' ? 'Sell' : 'Buy'} Crypto`}
          </Button>
          
          {widgetStatus === 'active' && (
            <Button 
              onClick={handleCloseWidget}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RampWidget;
