import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/infrastructure/database/client";
import { UsersTable } from "@/types/core/database";

interface Approver {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  approved: boolean;
  roleDisplay: string;
}

// Interface for user with role field
interface UserWithRole {
  id: string;
  name: string;
  role?: string;
}

interface MultiSigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  action: {
    type: string;
    details: any;
  };
  onApprove: () => void;
  onReject: () => void;
}

// Local storage keys for consensus config (must match PolicyRules.tsx)
const CONSENSUS_TYPE_KEY = 'consensus_type';
const ELIGIBLE_ROLES_KEY = 'eligible_roles';
const REQUIRED_APPROVALS_KEY = 'required_approvals';
const SELECTED_SIGNERS_KEY = 'selected_signers';
const SELECTED_SIGNERS_INFO_KEY = 'selected_signers_info';

export const MultiSigModal: React.FC<MultiSigModalProps> = ({
  open,
  onOpenChange,
  title = "Action Requires Approval",
  description,
  action,
  onApprove,
  onReject,
}) => {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [consensusConfig, setConsensusConfig] = useState<{
    required_approvals: number;
    eligible_roles: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const fetchApproversAndConfig = async () => {
      try {
        // Get consensus config from localStorage first
        const storedConsensusType = localStorage.getItem(CONSENSUS_TYPE_KEY);
        const storedEligibleRoles = localStorage.getItem(ELIGIBLE_ROLES_KEY);
        const storedRequiredApprovals = localStorage.getItem(REQUIRED_APPROVALS_KEY);
        const storedSignersInfo = localStorage.getItem(SELECTED_SIGNERS_INFO_KEY);
        
        let config = {
          required_approvals: 2,
          eligible_roles: ['superAdmin', 'owner']
        };
        
        // Use localStorage values if available
        if (storedConsensusType && storedEligibleRoles && storedRequiredApprovals) {
          config = {
            required_approvals: parseInt(storedRequiredApprovals, 10),
            eligible_roles: JSON.parse(storedEligibleRoles)
          };
        }
        
        // Set config
        setConsensusConfig(config);

        // Use stored signers info if available
        if (storedSignersInfo) {
          try {
            const parsedSigners = JSON.parse(storedSignersInfo);
            if (Array.isArray(parsedSigners) && parsedSigners.length > 0) {
              setApprovers(parsedSigners.map((user: any) => ({
                id: user.id,
                name: user.name,
                role: user.role || 'No Role',
                roleDisplay: user.roleDisplay || user.role || 'No Role',
                approved: false,
              })));
              return; // Successfully loaded signers, exit early
            }
          } catch (e) {
            console.error('Error parsing stored signers:', e);
          }
        }
          
        // Fallback: Fetch users with their roles
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', config.eligible_roles);

        if (usersError) throw usersError;
        
        const approvers = users?.map((user: UserWithRole) => {
          // For each user, determine their role from eligible_roles
          const userRole = config.eligible_roles.find(role => 
            user.id === role || role.includes(user.id)
          ) || 'No Role';
          
          // Format role name for display
          const roleDisplay = userRole
            .replace(/([A-Z])/g, ' $1')
            .split(/[ _]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
            
          return {
            id: user.id,
            name: user.name || "Unknown",
            role: userRole,
            roleDisplay,
            approved: false
          };
        }) || [];

        setApprovers(approvers);
      } catch (error) {
        console.error('Error fetching approvers:', error);
        setError('Failed to load approvers');
      }
    };

    if (open) {
      fetchApproversAndConfig();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const approvedCount = approvers.filter((a) => a.approved).length;
  const requiredSignatures = consensusConfig?.required_approvals || 0;
  const approvalProgress = (approvedCount / requiredSignatures) * 100;

  // Group approvers by role
  const approversByRole = approvers.reduce((acc, approver) => {
    if (!acc[approver.role]) {
      acc[approver.role] = [];
    }
    acc[approver.role].push(approver);
    return acc;
  }, {} as Record<string, Approver[]>);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {description && <p className="text-sm text-gray-500">{description}</p>}
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">
              This action requires {requiredSignatures} approvers to proceed
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time Remaining: {formatTime(timeRemaining)}</span>
              <span>
                Approval Progress ({approvedCount} of {requiredSignatures} Required)
              </span>
            </div>
            <Progress value={approvalProgress} className="w-full" />
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Required Signers by Role</h3>
            
            {Object.entries(approversByRole).length > 0 ? (
              Object.entries(approversByRole).map(([roleKey, roleApprovers]) => {
                // Get roleDisplay from the first approver (they should all have the same display for the same role)
                const roleDisplay = roleApprovers[0]?.roleDisplay || 
                  roleKey
                    .replace(/([A-Z])/g, ' $1')
                    .split(/[ _]+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                    .trim();
                
                return (
                  <div key={roleKey} className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      {roleDisplay}
                      <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {roleApprovers.length} {roleApprovers.length === 1 ? 'user' : 'users'}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {roleApprovers.map((approver) => (
                        <div
                          key={approver.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              {approver.avatar && (
                                <AvatarImage src={approver.avatar} alt={approver.name} />
                              )}
                              <AvatarFallback>
                                {approver.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{approver.name}</p>
                              <p className="text-xs text-gray-500">{approver.roleDisplay || roleDisplay}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                approver.approved ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                            <span className="text-xs ml-2 text-gray-500">
                              {approver.approved ? "Approved" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No eligible signers found</p>
                <p className="text-sm text-gray-400 mt-1">Please configure required signers in the Approvers tab</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
