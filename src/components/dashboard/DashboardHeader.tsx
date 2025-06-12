import React from "react";
import { Bell, Settings, User, ChevronDown, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
  unreadNotifications?: number;
  companyName?: string;
}

const DashboardHeader = ({
  userName = "John Doe",
  userAvatar = "",
  unreadNotifications = 3,
  companyName = "Acme SPV",
}: DashboardHeaderProps) => {
  return (
    <header className="w-full h-20 px-6 bg-white border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-6">{companyName}</h1>
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 h-9 w-64 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
        </div>

        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-2 pr-3"
            >
              <Avatar className="h-8 w-8">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={userName} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="hidden md:inline-block">{userName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
