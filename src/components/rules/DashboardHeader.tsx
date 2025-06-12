import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Bell, Plus, Search, Settings, X, FileText, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
  onCreatePolicy?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onTemplatesClick?: () => void;
  onSearch?: (searchTerm: string) => void;
  pendingApprovalsCount?: number;
}

const DashboardHeader = ({
  userName = "John Doe",
  userAvatar = "https://api.dicebear.com/7.x/initials/svg?seed=JD&backgroundColor=4F46E5",
  onCreatePolicy = () => {},
  onProfileClick = () => {},
  onSettingsClick = () => {},
  onNotificationsClick = () => {},
  onTemplatesClick = () => {},
  onSearch = () => {},
  pendingApprovalsCount = 0,
}: DashboardHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
  };

  const handleTemplatesClick = () => {
    navigate("/templates");
  };

  return (
    <header className="w-full h-20 px-6 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Policy Management
        </h1>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search policies..."
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={onCreatePolicy}
          className="bg-[#0f172b] hover:bg-[#0f172b]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Policy
        </Button>
        <Button
          variant="outline"
          onClick={handleTemplatesClick}
          className="text-gray-700 hover:text-gray-900 flex items-center"
          title="Policy Templates"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Templates</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNotificationsClick}
          className="relative text-gray-500 hover:text-gray-700"
          title={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending approvals` : "No pending approvals"}
        >
          <Bell className="h-5 w-5" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingApprovalsCount > 99 ? "99+" : pendingApprovalsCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-gray-500 hover:text-gray-700"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
