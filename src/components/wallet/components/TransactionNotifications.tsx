import React, { useEffect, useState } from 'react';
import { transactionMonitorService } from '../../../services/wallet/TransactionMonitorService';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  Bell, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransactionNotificationsProps {
  walletAddress: string;
  onViewTransaction?: (txHash: string) => void;
}

export function TransactionNotifications({ walletAddress, onViewTransaction }: TransactionNotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch transaction notifications from service
      const results = await transactionMonitorService.getTransactionNotifications(walletAddress);
      setNotifications(results || []);
    } catch (err: any) {
      console.error('Failed to fetch transaction notifications:', err);
      setError(err.message || 'Failed to fetch transaction notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await transactionMonitorService.markNotificationAsRead(notificationId);
      // Update local state to mark notification as read
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      // Mark each notification as read
      await Promise.all(unreadIds.map(id => 
        transactionMonitorService.markNotificationAsRead(id)
      ));
      
      // Update local state to mark all notifications as read
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Get filtered notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(notification => !notification.read);
      case 'read':
        return notifications.filter(notification => notification.read);
      case 'transactions':
        return notifications.filter(notification => 
          notification.type === 'transaction_confirmed' || 
          notification.type === 'transaction_failed' || 
          notification.type === 'transaction_pending'
        );
      default:
        return notifications;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'transaction_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'transaction_pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'token_received':
        return <ArrowDownLeft className="h-5 w-5 text-blue-500" />;
      case 'token_sent':
        return <ArrowUpRight className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchNotifications();
    }
  }, [walletAddress]);

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notification => !notification.read).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <Skeleton className="h-6 w-20" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && <Badge variant="outline" className="ml-1">{notifications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && <Badge variant="outline" className="ml-1">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p>No {activeTab === 'all' ? '' : activeTab} notifications found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredNotifications.map(notification => (
                  <Card 
                    key={notification.id} 
                    className={`border ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {notification.data?.tx_hash && onViewTransaction && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7"
                                  onClick={() => onViewTransaction(notification.data.tx_hash)}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              )}
                              {notification.action_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-7"
                                  onClick={() => window.open(notification.action_url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}