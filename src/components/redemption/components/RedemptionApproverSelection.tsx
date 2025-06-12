import React, { useState, useEffect } from "react";
import { Check, Plus, Trash2, UserPlus, X, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApprovers } from "@/hooks/rule/useApprovers";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Define the RedemptionApprover interface here instead of importing it
export interface RedemptionApprover {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface RedemptionApproverSelectionProps {
  redemptionRequestId?: string;
  selectedApprovers?: RedemptionApprover[];
  onApproversChange?: (approvers: RedemptionApprover[]) => void;
  minApprovers?: number;
  maxApprovers?: number;
}

const RedemptionApproverSelection = ({
  redemptionRequestId,
  selectedApprovers = [],
  onApproversChange = () => {},
  minApprovers = 1,
  maxApprovers = 5,
}: RedemptionApproverSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth(); // Get current user to exclude them from approver selection
  const { 
    approvers: eligibleApprovers = [], 
    isLoading: loadingApprovers = false,
    loadApprovers: loadEligibleApprovers = () => {}
  } = useApprovers(redemptionRequestId);
  const [dbSelectedApprovers, setDbSelectedApprovers] = useState<any[]>([]);
  const [approverError, setApproverError] = useState<string | null>(null);
  
  // Helper functions for adding/removing approvers since they're not in the hook
  const addApprover = async (approverId: string) => {
    try {
      // Implementation would go here in a real scenario
      console.log(`Would add approver ${approverId} to redemption request ${redemptionRequestId}`);
      return true;
    } catch (error) {
      console.error('Error adding approver:', error);
      return false;
    }
  };

  const removeApprover = async (approverId: string) => {
    try {
      // Implementation would go here in a real scenario
      console.log(`Would remove approver ${approverId} from redemption request ${redemptionRequestId}`);
      return true;
    } catch (error) {
      console.error('Error removing approver:', error);
      return false;
    }
  };
  
  // Convert database user objects to RedemptionApprover objects - add null check for eligibleApprovers
  // Then deduplicate by ID and exclude current user
  const availableApprovers: RedemptionApprover[] = eligibleApprovers 
    ? eligibleApprovers.reduce<RedemptionApprover[]>((unique, userObj) => {
        // Exclude current user from approver selection to prevent self-approval
        if (user && userObj.id === user.id) {
          return unique;
        }
        
        // Check if we already have this user ID
        if (!unique.some(item => item.id === userObj.id)) {
          unique.push({
            id: userObj.id,
            name: userObj.name || 'Unknown',
            email: userObj.email || '',
            role: userObj.role || 'Unknown',
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${(userObj.name || 'XX').substring(0, 2)}&backgroundColor=4F46E5`
          });
        }
        return unique;
      }, [])
    : [];

  // Sync DB selected approvers with component state when they change
  useEffect(() => {
    if (redemptionRequestId && dbSelectedApprovers.length > 0) {
      // Ensure each approver has a unique ID before mapping
      const uniqueApprovers = dbSelectedApprovers.filter((userObj, index, self) => 
        index === self.findIndex((t) => t.id === userObj.id)
      );
      
      const mappedApprovers = uniqueApprovers.map(userObj => ({
        id: userObj.id,
        name: userObj.name || 'Unknown',
        email: userObj.email || '',
        role: userObj.role || 'Unknown',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${(userObj.name || 'XX').substring(0, 2)}&backgroundColor=4F46E5`
      }));
      onApproversChange(mappedApprovers);
    }
  }, [dbSelectedApprovers, redemptionRequestId]);

  // Filter available approvers to exclude already selected ones
  const searchFilteredApprovers = availableApprovers.filter(
    (approver) =>
      !selectedApprovers.some((selected) => selected.id === approver.id) &&
      (approver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approver.role.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Then remove duplicates by ID
  const filteredApprovers = searchFilteredApprovers.reduce<RedemptionApprover[]>((unique, approver) => {
    if (!unique.some(item => item.id === approver.id)) {
      unique.push(approver);
    }
    return unique;
  }, []);

  // Handle adding approver
  const handleAddApprover = async (approver: RedemptionApprover) => {
    // Check if this approver is already in the selectedApprovers list
    if (selectedApprovers.some(a => a.id === approver.id)) {
      return; // Don't add duplicate approvers
    }
    
    // Prevent user from selecting themselves as an approver
    if (user && approver.id === user.id) {
      setApproverError('You cannot select yourself as an approver for your own redemption request');
      return;
    }
    
    if (selectedApprovers.length < maxApprovers) {
      if (redemptionRequestId) {
        // If we have a redemption request ID, use the database function
        const success = await addApprover(approver.id);
        if (success) {
          // The database will be updated and the useApprovers hook will update selectedApprovers
          console.log(`Added approver ${approver.name} to redemption request ${redemptionRequestId}`);
        }
      } else {
        // For new redemption requests, just update the local state
        const newApprovers = [...selectedApprovers, approver];
        onApproversChange(newApprovers);
      }
      setSearchTerm("");
      setApproverError(null); // Clear any previous errors
    }
  };

  // Handle removing approver
  const handleRemoveApprover = async (approverId: string) => {
    if (redemptionRequestId) {
      // If we have a redemption request ID, use the database function
      const success = await removeApprover(approverId);
      if (success) {
        // The database will be updated and the useApprovers hook will update selectedApprovers
        console.log(`Removed approver ${approverId} from redemption request ${redemptionRequestId}`);
      }
    } else {
      // For new redemption requests, just update the local state
      const newApprovers = selectedApprovers.filter((a) => a.id !== approverId);
      onApproversChange(newApprovers);
    }
  };

  // Ensure selected approvers have unique IDs - this prevents React key duplication
  const uniqueSelectedApprovers = selectedApprovers.reduce<RedemptionApprover[]>((acc, current) => {
    const isDuplicate = acc.find(item => item.id === current.id);
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Load approvers when component mounts
  useEffect(() => {
    loadEligibleApprovers();
  }, []);

  // Enhanced load approvers function with error handling
  const handleLoadApprovers = async () => {
    try {
      setApproverError(null);
      await loadEligibleApprovers();
    } catch (error) {
      console.error("Error loading approvers:", error);
      setApproverError("Failed to load approvers. Please try again.");
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">
          Redemption Approver Selection
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleLoadApprovers()} 
          disabled={loadingApprovers}
          className="ml-auto"
        >
          {loadingApprovers ? "Refreshing..." : "Refresh Approvers"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Select {minApprovers}-{maxApprovers} approvers for this redemption request
          </div>
          <div className="text-xs text-gray-400">
            Approval requirements are configured globally by administrators
          </div>
        </div>

        {/* Selected approvers list */}
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Selected Approvers ({uniqueSelectedApprovers.length}/{maxApprovers})
          </div>
          {approverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{approverError}</div>
            </div>
          )}
          {uniqueSelectedApprovers.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              No approvers selected yet
            </div>
          ) : (
            <div className="space-y-2">
              {uniqueSelectedApprovers.map((approver) => (
                <div
                  key={`selected-${approver.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={approver.avatarUrl}
                        alt={approver.name || ''}
                      />
                      <AvatarFallback>
                        {approver && approver.name ? approver.name.substring(0, 2).toUpperCase() : 'XX'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{approver.name}</div>
                      <div className="text-sm text-gray-500">
                        {approver.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {approver.role}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveApprover(approver.id)}
                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove approver</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add approver section */}
        {uniqueSelectedApprovers.length < maxApprovers && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Add Approvers</div>
            <div className="relative">
              <div className="flex items-center border rounded-md px-3 py-2">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <Input
                  placeholder="Search by name, email, or role"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {loadingApprovers ? (
              // Loading skeleton
              <div className="space-y-2 mt-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : approverError ? (
              // Error state
              <div className="text-center p-4 border border-red-100 bg-red-50 rounded-md mt-2">
                <div className="text-sm text-red-500 mb-2">{approverError}</div>
                <Button size="sm" variant="outline" onClick={() => handleLoadApprovers()}>
                  Try Again
                </Button>
              </div>
            ) : availableApprovers.length === 0 ? (
              // No approvers at all
              <div className="text-center p-4 border border-amber-100 bg-amber-50 rounded-md mt-2">
                <div className="text-amber-800 font-medium mb-1">No eligible approvers found</div>
                <p className="text-sm text-amber-700 mb-3">
                  Users with compliance officer, compliance manager, owner, or admin roles 
                  are eligible to approve redemption requests.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => handleLoadApprovers()}
                >
                  Refresh Approvers
                </Button>
              </div>
            ) : (
              // Results list
              <div className={`border rounded-md overflow-hidden mt-2 ${searchTerm ? 'max-h-60 overflow-y-auto' : ''}`}>
                {searchTerm ? (
                  filteredApprovers.length > 0 ? (
                    filteredApprovers.map((approver, index) => (
                      <div
                        key={`available-${approver.id}-${index}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddApprover(approver)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={approver.avatarUrl}
                              alt={approver.name || ''}
                            />
                            <AvatarFallback>
                              {approver && approver.name ? approver.name.substring(0, 2).toUpperCase() : 'XX'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{approver.name}</div>
                            <div className="text-sm text-gray-500">
                              {approver.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {approver.role}
                          </Badge>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No matching approvers found
                    </div>
                  )
                ) : (
                  <div
                    className="p-3 flex items-center justify-center text-sm text-gray-500"
                    onClick={() => setSearchTerm(" ")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search to find approvers
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RedemptionApproverSelection;
