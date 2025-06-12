'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  MessageSquare,
  Volume2,
  Smartphone
} from 'lucide-react';
import { cn } from '@/utils';

interface DemoNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  channel: 'in-app' | 'email' | 'sms';
  event: string;
}

interface NotificationDemoProps {
  className?: string;
}

export const NotificationDemo: React.FC<NotificationDemoProps> = ({
  className
}) => {
  const [demoNotifications, setDemoNotifications] = useState<DemoNotification[]>([]);
  const [sending, setSending] = useState(false);

  const notificationTemplates = [
    {
      type: 'success' as const,
      title: 'Request Submitted',
      message: 'Your redemption request for 5,000 tokens has been successfully submitted and is pending approval.',
      event: 'request_submitted',
      channel: 'in-app' as const
    },
    {
      type: 'info' as const,
      title: 'Approval in Progress',
      message: 'Your redemption request is currently under review by our compliance team.',
      event: 'approval_progress',
      channel: 'email' as const
    },
    {
      type: 'success' as const,
      title: 'Request Approved',
      message: 'Great news! Your redemption request has been approved and will be processed shortly.',
      event: 'request_approved',
      channel: 'sms' as const
    },
    {
      type: 'error' as const,
      title: 'Request Rejected',
      message: 'Your redemption request has been rejected due to insufficient lock-up period completion.',
      event: 'request_rejected',
      channel: 'in-app' as const
    },
    {
      type: 'success' as const,
      title: 'Settlement Complete',
      message: 'Your redemption has been completed. $5,000 USDC has been transferred to your wallet.',
      event: 'settlement_complete',
      channel: 'email' as const
    },
    {
      type: 'warning' as const,
      title: 'Window Closing Soon',
      message: 'The current redemption window will close in 24 hours. Submit your requests now.',
      event: 'window_closing',
      channel: 'in-app' as const
    }
  ];

  const getIcon = (type: DemoNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getChannelIcon = (channel: DemoNotification['channel']) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <Smartphone className="h-3 w-3" />;
      case 'in-app':
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getChannelColor = (channel: DemoNotification['channel']) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'in-app':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sendDemoNotification = async (template: typeof notificationTemplates[0]) => {
    setSending(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newNotification: DemoNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type: template.type,
      title: template.title,
      message: template.message,
      timestamp: new Date(),
      channel: template.channel,
      event: template.event
    };

    setDemoNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setSending(false);

    // Simulate browser notification for in-app notifications
    if (template.channel === 'in-app' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(template.title, {
          body: template.message,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(template.title, {
            body: template.message,
            icon: '/favicon.ico'
          });
        }
      }
    }
  };

  const clearDemoNotifications = () => {
    setDemoNotifications([]);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Notification Demo
          </CardTitle>
          <CardDescription>
            Test different notification types to see how they appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTemplates.map((template, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(template.type)}
                      <span className="font-medium text-sm">{template.title}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs', getChannelColor(template.channel))}
                    >
                      <div className="flex items-center gap-1">
                        {getChannelIcon(template.channel)}
                        {template.channel}
                      </div>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.message}
                  </p>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => sendDemoNotification(template)}
                    disabled={sending}
                    className="w-full"
                  >
                    {sending ? 'Sending...' : 'Send Demo'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {demoNotifications.length > 0 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {demoNotifications.length} demo notification(s) sent
              </p>
              <Button variant="outline" size="sm" onClick={clearDemoNotifications}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Demo Notifications */}
      {demoNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Demo Notifications
            </CardTitle>
            <CardDescription>
              Notifications sent during this demo session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', getChannelColor(notification.channel))}
                        >
                          <div className="flex items-center gap-1">
                            {getChannelIcon(notification.channel)}
                            {notification.channel}
                          </div>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      Event: {notification.event}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browser Notification Permission */}
      {'Notification' in window && Notification.permission === 'default' && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Enable browser notifications to test in-app notifications fully.</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => Notification.requestPermission()}
              >
                Enable
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>How to use this demo:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Click any "Send Demo" button to simulate that notification type</li>
              <li>In-app notifications may trigger browser notifications if enabled</li>
              <li>Email and SMS notifications are simulated (no actual messages sent)</li>
              <li>Each notification shows the channel, timestamp, and content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDemo;
