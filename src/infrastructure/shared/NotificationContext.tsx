import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
// Define NotificationItem interface locally to avoid circular dependency
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type?: "approval" | "request" | "milestone" | "system";
  actionRequired?: boolean;
  actionUrl?: string;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">,
  ) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Export as default to fix Fast Refresh issues
export default function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationLimit, setNotificationLimit] = useState<number>(3);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("redemption-notifications");
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Convert string timestamps back to Date objects
        const withDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(withDates);
      } catch (error) {
        console.error("Failed to parse saved notifications", error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem(
      "redemption-notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  const addNotification = (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">,
  ) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => {
      const updatedNotifications = [newNotification, ...prev];
      // Limit the number of notifications to prevent overwhelming the user
      return updatedNotifications.slice(0, 3);
    });

    // Show browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.description,
      });
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        dismissNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Also export as named export for backward compatibility
export { NotificationProvider };
