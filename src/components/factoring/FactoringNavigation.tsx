import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  FileText,
  FolderPlus,
  Coins,
  ChevronsRight,
} from "lucide-react";

interface FactoringNavigationProps {
  projectId: string;
}

function FactoringNavigation({ projectId }: FactoringNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      href: `/projects/${projectId}/factoring/dashboard`,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Invoices",
      href: `/projects/${projectId}/factoring/invoices`,
    },
    {
      icon: <FolderPlus className="h-4 w-4" />,
      label: "Pools & Tranches",
      href: `/projects/${projectId}/factoring/pools`,
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: "Tokenization",
      href: `/projects/${projectId}/factoring/tokenization`,
    },
    {
      icon: <ChevronsRight className="h-4 w-4" />,
      label: "Distribution",
      href: `/projects/${projectId}/factoring/distribution`,
    },
  ];

  return (
    <div className="bg-white border-b px-6 py-3">
      <div className="flex space-x-8 overflow-x-auto">
        {navItems.map((item) => {
          // Check if this is the dashboard item and we're on the base factoring path
          const isDashboardActive = 
            item.label === "Dashboard" && 
            (pathname === `/projects/${projectId}/factoring` || 
             pathname === `/projects/${projectId}/factoring/dashboard`);
             
          // For other items, check if the pathname starts with the href
          const isActive = 
            isDashboardActive || 
            (item.label !== "Dashboard" && pathname.startsWith(item.href));
            
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 py-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default FactoringNavigation;