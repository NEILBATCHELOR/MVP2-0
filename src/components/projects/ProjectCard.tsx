import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  Coins,
  Star,
  File,
  ChevronRight,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    project_type: string;
    token_symbol?: string;
    created_at?: string;
    updated_at?: string;
    is_primary?: boolean;
    fund_raise?: number;
    total_token_supply?: number;
    share_price?: number;
    target_raise?: number;
    total_notional?: number;
    estimated_yield_percentage?: number;
    duration?: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
    transaction_start_date?: string;
    maturity_date?: string;
    minimum_investment?: number;
    currency?: string;
  };
  stats?: {
    totalInvestors: number;
    totalRaised: number;
    documentCount?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onViewProject: (projectId: string) => void;
  onManageSubscription: (projectId: string) => void;
}

const ProjectCard = ({
  project,
  stats = { totalInvestors: 0, totalRaised: 0, documentCount: 0 },
  onEdit,
  onDelete,
  onViewProject,
  onManageSubscription
}: ProjectCardProps) => {
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "Not set";
    const currencySymbol = getCurrencySymbol(project.currency || "USD");
    return `${currencySymbol}${amount?.toLocaleString() || 0}`;
  };

  // Helper for currency symbols
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "Fr",
      CNY: "¥",
      INR: "₹",
      // Add more as needed
    };
    return symbols[currencyCode] || currencyCode;
  };

  // Add defensive checks to prevent accessing properties of undefined
  if (!project) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Project data unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to display project information</p>
        </CardContent>
      </Card>
    );
  }

  const targetRaise = project.target_raise || 0;
  const raisedPercent = targetRaise > 0 ? Math.min(((stats.totalRaised || 0) / targetRaise) * 100, 100) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1">
            {project.is_primary && (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            )}
            <CardTitle className="text-xl truncate" title={project?.name || ""}>
              {project?.name || "Unnamed Project"}
            </CardTitle>
          </div>
          {getStatusBadge(project?.status || "draft")}
        </div>
        <div className="text-sm text-muted-foreground capitalize my-2 flex items-center">
          {project?.project_type || "unknown"}{" "}
          {project?.token_symbol ? `• ${project.token_symbol}` : ""}
          {project.is_primary && <Badge variant="outline" className="ml-2 bg-amber-50">Primary</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-grow">
        {project?.description && (
          <div className="border-l-4 border-primary/20 pl-3 mb-6">
            <p className="text-sm min-h-[60px]">
              {project.description}
            </p>
          </div>
        )}

        {targetRaise > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Fundraising Progress</span>
              <span className="font-medium">{raisedPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${raisedPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>${stats.totalRaised?.toLocaleString() || 0}</span>
              <span>Goal: ${targetRaise?.toLocaleString() || 0}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 text-sm mb-6">
          {project.total_notional !== undefined && project.total_notional !== null && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Total Notional:</span>
              <span className="ml-auto">${project.total_notional?.toLocaleString() || 0}</span>
            </div>
          )}
          
          {stats?.totalInvestors > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Investors:</span>
              <span className="ml-auto">{stats.totalInvestors}</span>
            </div>
          )}
          
          {stats?.totalRaised > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Total Raised:</span>
              <span className="ml-auto">${stats.totalRaised.toLocaleString()}</span>
            </div>
          )}
          
          {project.minimum_investment !== undefined && project.minimum_investment !== null && project.minimum_investment > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Min Investment:</span>
              <span className="ml-auto">${project.minimum_investment?.toLocaleString() || 0}</span>
            </div>
          )}
          
          {project.estimated_yield_percentage !== undefined && project.estimated_yield_percentage !== null && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-medium">Est. Yield:</span>
              <span className="ml-auto">{project.estimated_yield_percentage}%</span>
            </div>
          )}
          
          {project.duration && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Duration:</span>
              <span className="ml-auto">{project.duration.replace(/_/g, ' ')}</span>
            </div>
          )}
          
          {project.subscription_start_date && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Subscription Start:</span>
              <span className="ml-auto">{formatDate(project.subscription_start_date)}</span>
            </div>
          )}
          
          {project.subscription_end_date && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Subscription End:</span>
              <span className="ml-auto">{formatDate(project.subscription_end_date)}</span>
            </div>
          )}
          
          {project.transaction_start_date && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Transaction Start:</span>
              <span className="ml-auto">{formatDate(project.transaction_start_date)}</span>
            </div>
          )}
          
          {project.maturity_date && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Maturity Date:</span>
              <span className="ml-auto">{formatDate(project.maturity_date)}</span>
            </div>
          )}
          
          {project.share_price !== undefined && project.share_price !== null && project.share_price > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Share Price:</span>
              <span className="ml-auto">{formatCurrency(project.share_price)}</span>
            </div>
          )}
          
          {project.target_raise !== undefined && project.target_raise !== null && project.target_raise > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Funding Goal:</span>
              <span className="ml-auto">${project.target_raise?.toLocaleString() || 0}</span>
            </div>
          )}
          
          {stats?.documentCount !== undefined && stats.documentCount > 0 && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Documents:</span>
              <span className="ml-auto">{stats.documentCount}</span>
            </div>
          )}
          
          {project?.created_at && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Created:</span>
              <span className="ml-auto">{formatDate(project.created_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between w-full gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Link to={`/projects/${project.id}/captable/investors`} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 w-full"
            >
              <Users className="h-4 w-4 mr-1" />
              <span>Investors</span>
            </Button>
          </Link>
          <Link to={`/projects/${project.id}/tokens`} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 w-full"
            >
              <Coins className="h-4 w-4 mr-1" />
              <span>Token Design</span>
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2 w-full">
          <Link to={`/projects/${project.id}?tab=documents`} className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 w-full"
            >
              <FileText className="h-4 w-4 mr-1" />
              <span>Manage Documents ({stats?.documentCount || 0})</span>
            </Button>
          </Link>
        </div>
        <Link to={`/projects/${project.id}`} className="w-full">
          <Button
            variant="default"
            size="sm"
            className="flex items-center justify-center gap-1 w-full"
            onClick={() => onViewProject(project.id)}
          >
            <span>View Details</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;