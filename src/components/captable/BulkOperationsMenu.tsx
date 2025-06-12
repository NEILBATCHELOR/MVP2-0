import React, { useEffect } from "react";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  Tag,
  Download,
  Upload,
  Mail,
  Share2,
} from "lucide-react";
import { supabase } from "@/infrastructure/database/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BulkOperationsMenuProps {
  selectedCount?: number;
  onUpdateStatus?: (status: string) => void;
  onDelete?: () => void;
  onTag?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onEmail?: () => void;
  onShare?: () => void;
  disabled?: boolean;
}

const BulkOperationsMenu = ({
  selectedCount = 0,
  onUpdateStatus = () => {},
  onDelete = () => {},
  onTag = () => {},
  onExport = () => {},
  onImport = () => {},
  onEmail = () => {},
  onShare = () => {},
  disabled = false,
}: BulkOperationsMenuProps) => {
  // Subscribe to real-time updates for selected investors
  useEffect(() => {
    if (selectedCount === 0) return;

    // Set up Supabase real-time subscription
    const subscription = supabase
      .channel("public:subscriptions")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
        },
        (payload) => {
          console.log("Subscription updated:", payload);
          // In a real implementation, you would update the UI based on the payload
          // For example, refreshing the selected investors or showing a notification
        },
      )
      .subscribe();

    return () => {
      // Clean up subscription when component unmounts or selection changes
      supabase.removeChannel(subscription);
    };
  }, [selectedCount]);
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled || selectedCount === 0}>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={disabled || selectedCount === 0}
          >
            <span>Bulk Actions</span>
            <MoreHorizontal className="h-4 w-4" />
            {selectedCount > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {selectedCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            Operations for {selectedCount} selected
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onUpdateStatus("active")}
            className="cursor-pointer"
          >
            <UserCheck className="mr-2 h-4 w-4 text-green-500" />
            <span>Set Status: Active</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onUpdateStatus("pending")}
            className="cursor-pointer"
          >
            <UserCheck className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Set Status: Pending</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onUpdateStatus("inactive")}
            className="cursor-pointer"
          >
            <UserX className="mr-2 h-4 w-4 text-gray-500" />
            <span>Set Status: Inactive</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onTag} className="cursor-pointer">
            <Tag className="mr-2 h-4 w-4 text-blue-500" />
            <span>Apply Tags</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4 text-green-500" />
            <span>Export Selected</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onImport} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4 text-purple-500" />
            <span>Import Data</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onEmail} className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4 text-blue-500" />
            <span>Email Selected</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Share Access</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onDelete}
            className="cursor-pointer text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Selected</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BulkOperationsMenu;
