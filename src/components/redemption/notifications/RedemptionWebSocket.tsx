import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { RedemptionRequest, RedemptionStatus } from '../types';
import { useRedemptionNotifications } from './RedemptionNotifications';

interface WebSocketMessage {
  type: 'redemption_status_update' | 'approval_required' | 'settlement_complete' | 'system_notification';
  data: any;
  timestamp: string;
  redemptionId?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (redemptionId: string) => void;
  unsubscribe: (redemptionId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface RedemptionWebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
  enableNotifications?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const RedemptionWebSocketProvider: React.FC<RedemptionWebSocketProviderProps> = ({
  children,
  wsUrl = 'ws://localhost:3001/ws/redemptions',
  enableNotifications = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { addNotification } = useRedemptionNotifications();

  // Initialize WebSocket connection
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Re-subscribe to all active subscriptions
        subscriptions.forEach(redemptionId => {
          sendMessage({ type: 'subscribe', redemptionId });
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current++;
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  // Handle incoming WebSocket messages
  const handleMessage = (message: WebSocketMessage) => {
    if (!enableNotifications) return;

    switch (message.type) {
      case 'redemption_status_update':
        handleRedemptionStatusUpdate(message);
        break;
        
      case 'approval_required':
        handleApprovalRequired(message);
        break;
        
      case 'settlement_complete':
        handleSettlementComplete(message);
        break;
        
      case 'system_notification':
        handleSystemNotification(message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Handle redemption status updates
  const handleRedemptionStatusUpdate = (message: WebSocketMessage) => {
    const { redemption, oldStatus, newStatus } = message.data;
    
    const statusMessages = {
      'pending': 'Redemption request submitted for review',
      'approved': 'Redemption request has been approved',
      'processing': 'Settlement process has started',
      'settled': 'Redemption completed successfully',
      'rejected': 'Redemption request was rejected',
      'cancelled': 'Redemption request was cancelled'
    };

    const notificationTypes = {
      'approved': 'success' as const,
      'settled': 'success' as const,
      'rejected': 'error' as const,
      'cancelled': 'warning' as const,
      'processing': 'info' as const,
      'pending': 'info' as const
    };

    addNotification({
      type: notificationTypes[newStatus] || 'info',
      title: 'Redemption Status Update',
      message: statusMessages[newStatus] || `Status changed to ${newStatus}`,
      redemptionId: redemption.id,
      actionUrl: `/redemptions/${redemption.id}`
    });
  };

  // Handle approval required notifications
  const handleApprovalRequired = (message: WebSocketMessage) => {
    const { redemption, approvers } = message.data;
    
    addNotification({
      type: 'warning',
      title: 'Approval Required',
      message: `Redemption request #${redemption.id.slice(-8)} requires your approval`,
      redemptionId: redemption.id,
      actionUrl: `/approvals/${redemption.id}`
    });
  };

  // Handle settlement completion
  const handleSettlementComplete = (message: WebSocketMessage) => {
    const { redemption, settlement } = message.data;
    
    addNotification({
      type: 'success',
      title: 'Settlement Complete',
      message: `Your redemption of ${redemption.tokenAmount} tokens has been processed`,
      redemptionId: redemption.id,
      actionUrl: `/redemptions/${redemption.id}`
    });
  };

  // Handle system notifications
  const handleSystemNotification = (message: WebSocketMessage) => {
    const { title, content, severity } = message.data;
    
    addNotification({
      type: severity || 'info',
      title: title || 'System Notification',
      message: content
    });
  };

  // Send message to WebSocket
  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  };

  // Subscribe to redemption updates
  const subscribe = (redemptionId: string) => {
    setSubscriptions(prev => new Set([...prev, redemptionId]));
    sendMessage({ type: 'subscribe', redemptionId });
  };

  // Unsubscribe from redemption updates
  const unsubscribe = (redemptionId: string) => {
    setSubscriptions(prev => {
      const newSet = new Set(prev);
      newSet.delete(redemptionId);
      return newSet;
    });
    sendMessage({ type: 'unsubscribe', redemptionId });
  };

  // Initialize connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const heartbeat = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Send ping every 30 seconds
    
    return () => clearInterval(heartbeat);
  }, [isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useRedemptionWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useRedemptionWebSocket must be used within a RedemptionWebSocketProvider');
  }
  return context;
};

// Status indicator component
interface WebSocketStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

export const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({
  className = '',
  showText = false
}) => {
  const { connectionStatus } = useRedemptionWebSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      case 'disconnected':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {showText && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default RedemptionWebSocketProvider;
