import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils";
import {
  PieChart,
  Users,
  FileText,
  Wallet,
  FileCheck,
  Blocks,
  FileSliders,
  ChevronsRight,
  Settings,
} from "lucide-react";

const CapTableNavigation = ({ projectId }: { projectId: string }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    {
      icon: <PieChart className="h-4 w-4" />,
      label: "Overview",
      href: `/projects/${projectId}/captable`,
    },
     {
      icon: <Blocks className="h-4 w-4" />,
      label: "Token Management",
      href: `/projects/${projectId}/tokens`,
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Investors",
      href: `/projects/${projectId}/captable/investors`,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Subscriptions",
      href: `/projects/${projectId}/captable/subscriptions`,
    },
    {
      icon: <Wallet className="h-4 w-4" />,
      label: "Allocations",
      href: `/projects/${projectId}/captable/allocations`,
    },
    {
      icon: <FileCheck className="h-4 w-4" />,
      label: "Token Minting",
      href: `/projects/${projectId}/captable/minting`,
    },
    {
      icon: <ChevronsRight className="h-4 w-4" />,
      label: "Distribution",
      href: `/projects/${projectId}/captable/distributions`,
    },
  ];

  return (
    <div className="bg-white border-b px-6 py-3">
      <div className="flex space-x-6 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 py-2 border-b-2 text-sm font-medium whitespace-nowrap",
              pathname === item.href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CapTableNavigation;
