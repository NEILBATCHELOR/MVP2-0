import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import {
  Bell,
  CheckCircle,
  Clock,
  Filter,
  Info,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { getNotifications, NotificationProps } from "@/services/dashboard/dashboardDataService";

interface NotificationSectionProps {
  notifications?: NotificationProps[];
  userId?: string;
}

const NotificationSection = ({
  notifications: initialNotifications,
  userId = "default-user",
}: NotificationSectionProps) => {
  const [loading, setLoading] = useState(!initialNotifications);
  const [notifications, setNotifications] = useState<NotificationProps[]>(
    initialNotifications || [],
  );
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationProps[]
  >([]);

  useEffect(() => {
    if (initialNotifications) {
      setNotifications(initialNotifications);
      setFilteredNotifications(initialNotifications);
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getNotifications(userId);
        setNotifications(data);
        setFilteredNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, initialNotifications]);

  // Filter notifications based on active tab and search query
  React.useEffect(() => {
    let filtered = notifications;

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter(
        (notification) => notification.type === activeTab,
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.description.toLowerCase().includes(query),
      );
    }

    setFilteredNotifications(filtered);
  }, [activeTab, searchQuery, notifications]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " at " +
      date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "request":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "milestone":
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get notification badge based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "approval":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approval
          </Badge>
        );
      case "request":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Request
          </Badge>
        );
      case "milestone":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Milestone
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <Select defaultValue="newest">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="unread">Unread first</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading notifications...</span>
        </div>
      ) : (
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="approval">Approvals</TabsTrigger>
            <TabsTrigger value="request">Requests</TabsTrigger>
            <TabsTrigger value="milestone">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderNotifications(filteredNotifications)}
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            {renderNotifications(filteredNotifications)}
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            {renderNotifications(filteredNotifications)}
          </TabsContent>

          <TabsContent value="milestone" className="space-y-4">
            {renderNotifications(filteredNotifications)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  function renderNotifications(notifications: NotificationProps[]) {
    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No notifications found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "You're all caught up!"}
          </p>
        </div>
      );
    }

    return notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 border rounded-lg ${notification.read ? "bg-white" : "bg-blue-50"} ${notification.actionRequired ? "border-l-4 border-l-blue-500" : "border-gray-200"}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-gray-900">
                  {notification.title}
                </h3>
                {getNotificationBadge(notification.type)}
                {!notification.read && (
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(notification.date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {notification.description}
            </p>
            {notification.actionRequired && (
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm">Take Action</Button>
                <Button variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  }
};

export default NotificationSection;
