import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Bell, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface ApprovalNotification {
  id: string;
  policyId: string;
  policyName: string;
  type: "approval_request" | "approval_complete" | "approval_rejected";
  timestamp: string;
  read: boolean;
}

interface ApprovalNotificationsProps {
  notifications?: ApprovalNotification[];
  onViewPolicy?: (policyId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

const ApprovalNotifications = ({
  notifications = [],
  onViewPolicy = () => {},
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
}: ApprovalNotificationsProps) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval_request":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approval_complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "approval_rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: ApprovalNotification) => {
    switch (notification.type) {
      case "approval_request":
        return `You have a pending approval request for "${notification.policyName}"`;
      case "approval_complete":
        return `Policy "${notification.policyName}" has been approved`;
      case "approval_rejected":
        return `Policy "${notification.policyName}" has been rejected`;
      default:
        return "New notification";
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Approval Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-md flex items-start space-x-3 ${notification.read ? "bg-gray-50" : "bg-blue-50"}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {getNotificationMessage(notification)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => onViewPolicy(notification.policyId)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p>No notifications</p>
            <p className="text-sm mt-1">
              You'll be notified when policies need your approval
            </p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="pt-2">
            <Separator className="mb-2" />
            <div className="text-xs text-gray-500 text-center">
              Showing {notifications.length} notifications
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalNotifications;
