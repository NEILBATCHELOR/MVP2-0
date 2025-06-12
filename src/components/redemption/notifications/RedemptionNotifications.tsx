import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationData {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  redemptionId?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface RedemptionNotificationsProps {
  className?: string;
  maxNotifications?: number;
  autoHideDelay?: number;
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
}

export const RedemptionNotifications: React.FC<RedemptionNotificationsProps> = ({
  className,
  maxNotifications = 50,
  autoHideDelay = 5000,
  enableSound = true,
  enableBrowserNotifications = true
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request browser notification permission
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, [enableBrowserNotifications]);

  // Add notification function
  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the max number of notifications
      return updated.slice(0, maxNotifications);
    });

    // Play sound if enabled
    if (enableSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
    }

    // Show browser notification if enabled and permitted
    if (enableBrowserNotifications && permissionGranted) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.redemptionId || notification.type,
        requireInteraction: notification.type === 'error'
      });
    }

    // Auto-hide notification after delay (except for errors)
    if (notification.type !== 'error' && autoHideDelay > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDelay);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get notification background color
  const getNotificationBg = (type: NotificationData['type'], read: boolean) => {
    const opacity = read ? 'bg-opacity-50' : 'bg-opacity-100';
    switch (type) {
      case 'success':
        return `bg-green-50 border-green-200 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 border-yellow-200 ${opacity}`;
      case 'error':
        return `bg-red-50 border-red-200 ${opacity}`;
      case 'info':
      default:
        return `bg-blue-50 border-blue-200 ${opacity}`;
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Expose addNotification globally for other components
  useEffect(() => {
    (window as any).addRedemptionNotification = addNotification;
    return () => {
      delete (window as any).addRedemptionNotification;
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                      getNotificationBg(notification.type, notification.read)
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          notification.read ? "text-gray-600" : "text-gray-900"
                        )}>
                          {notification.title}
                        </p>
                        <p className={cn(
                          "text-sm mt-1",
                          notification.read ? "text-gray-500" : "text-gray-700"
                        )}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio element for notification sounds */}
      {enableSound && (
        <audio ref={audioRef} preload="auto">
          <source src="/notification.mp3" type="audio/mpeg" />
          <source src="/notification.wav" type="audio/wav" />
        </audio>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Hook to use notifications
export const useRedemptionNotifications = () => {
  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    if ((window as any).addRedemptionNotification) {
      (window as any).addRedemptionNotification(notification);
    }
  };

  return { addNotification };
};

export default RedemptionNotifications;
