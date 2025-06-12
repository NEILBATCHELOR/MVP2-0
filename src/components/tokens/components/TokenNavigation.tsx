import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  Plus,
  Coins,
  Send,
  Activity,
  FileText,
  FileUp
} from "lucide-react";

interface TokenNavigationProps {
  projectId: string | null;
  tokenId?: string | null;
}

function TokenNavigation({ projectId, tokenId }: TokenNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // If projectId is invalid, don't render navigation
  if (!projectId || projectId === "undefined") {
    return null;
  }

  // Define the type for navigation items
  interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    showAlways: boolean;
    disabled?: boolean;
  }

  // Base navigation items (available for all token routes)
  const navItems: NavItem[] = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      href: `/projects/${projectId}/tokens`,
      showAlways: true
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create Token",
      href: `/projects/${projectId}/tokens/create`,
      showAlways: true
    },
    {
      icon: <FileUp className="h-4 w-4" />,
      label: "Upload",
      href: `/projects/${projectId}/tokens/test`,
      showAlways: true
    }
  ];

  // Token-specific navigation items (always shown and clickable)
  const tokenSpecificItems: NavItem[] = [
    {
      icon: <Send className="h-4 w-4" />,
      label: "Deploy",
      href: tokenId && tokenId !== "undefined" ? `/projects/${projectId}/tokens/${tokenId}/deploy` : `/projects/${projectId}/tokens/select/deploy`,
      showAlways: true
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: "Mint",
      href: tokenId && tokenId !== "undefined" ? `/projects/${projectId}/tokens/${tokenId}/mint` : `/projects/${projectId}/tokens/select/mint`,
      showAlways: true
    }
  ];

  // Combine the navigation items
  const allNavItems = [...navItems, ...tokenSpecificItems];

  return (
    <div className="w-full bg-white border-b" data-component-name="TokenNavigation">
      <div className="container mx-auto">
        <div className="flex space-x-8 overflow-x-auto py-3" data-component-name="TokenNavigation">
          {allNavItems.map((item) => {
            // For the dashboard item, check if we're on the base tokens path
            const isDashboardActive = 
              item.label === "Dashboard" && 
              (pathname === `/projects/${projectId}/tokens` || 
               pathname === `/projects/${projectId}/tokens/`);
               
            // For testing item, check if we're on the test path
            const isTestingActive =
              item.label === "Testing" &&
              pathname === `/projects/${projectId}/tokens/test`;
               
            // For other items, check if the pathname equals the href
            const isActive = 
              isDashboardActive || 
              isTestingActive ||
              pathname === item.href;
              
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 py-2 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary bg-white rounded-t-md shadow-sm"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300",
                  item.disabled && "opacity-50 pointer-events-none cursor-not-allowed"
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TokenNavigation; 