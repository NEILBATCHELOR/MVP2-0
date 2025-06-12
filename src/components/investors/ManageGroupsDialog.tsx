import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";
import {
  Search,
  Plus,
  Loader2,
  CheckCircle,
  X,
  Users,
  UserPlus,
  UserMinus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define the Investor interface used in the component
export interface Investor {
  id: string;
  investor_id?: string;
  name: string;
  email: string;
}

interface ManageGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestors: Investor[];
  onComplete: () => void;
}

interface Group {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  member_count?: number;
  isSelected?: boolean;
  isMember?: boolean;
}

const ManageGroupsDialog = ({
  open,
  onOpenChange,
  selectedInvestors,
  onComplete,
}: ManageGroupsDialogProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [memberGroups, setMemberGroups] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [showAllGroups, setShowAllGroups] = useState(false);
  
  // For renaming groups
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  
  // For deleting groups
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingGroupName, setDeletingGroupName] = useState("");

  const [activeTab, setActiveTab] = useState<"add" | "remove">("add");
  const { toast } = useToast();

  // Fetch all groups when dialog opens
  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  // Filter groups based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  // Fetch all investor groups and check membership
  const fetchGroups = async () => {
    try {
      setIsLoading(true);

      // Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("investor_groups")
        .select("id, name, created_at, updated_at, project_id, member_count");

      if (groupsError) throw groupsError;

      // If no investors are selected, just show all groups
      if (selectedInvestors.length === 0) {
        setGroups(groupsData || []);
        setFilteredGroups(groupsData || []);
        setIsLoading(false);
        return;
      }

      // Get all investor IDs
      const investorIds = selectedInvestors.map(
        (investor) => investor.id || investor.investor_id,
      );

      // Fetch group memberships from both tables
      const { data: newMembershipsData, error: newMembershipsError } = await supabase
        .from("investor_groups_investors")
        .select("group_id, investor_id")
        .in("investor_id", investorIds);

      if (newMembershipsError) throw newMembershipsError;

      const { data: oldMembershipsData, error: oldMembershipsError } = await supabase
        .from("investor_group_members")
        .select("group_id, investor_id")
        .in("investor_id", investorIds);

      if (oldMembershipsError) throw oldMembershipsError;

      // Combine memberships from both tables
      const allMemberships = [
        ...(newMembershipsData || []),
        ...(oldMembershipsData || [])
      ];

      // Count how many investors from selection are in each group
      const membershipCounts: Record<string, number> = {};
      const processedPairs = new Set<string>(); // Track unique group_id + investor_id pairs
      
      allMemberships.forEach((membership) => {
        const pairKey = `${membership.group_id}_${membership.investor_id}`;
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          membershipCounts[membership.group_id] = (membershipCounts[membership.group_id] || 0) + 1;
        }
      });

      // Mark groups where all selected investors are members
      const memberGroupIds = Object.keys(membershipCounts).filter(
        (groupId) => membershipCounts[groupId] === investorIds.length,
      );

      setMemberGroups(memberGroupIds);

      // Enhance groups data with membership info
      const enhancedGroups = (groupsData || []).map((group) => ({
        ...group,
        isMember: memberGroupIds.includes(group.id),
      }));

      setGroups(enhancedGroups);
      setFilteredGroups(enhancedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      toast({
        title: "Error",
        description: "Failed to load investor groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle group selection
  const handleGroupSelection = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Handle adding investors to selected groups
  const handleAddToGroups = async () => {
    if (selectedGroups.length === 0 || selectedInvestors.length === 0) return;

    try {
      setIsProcessing(true);

      const investorIds = selectedInvestors.map(
        (investor) => investor.id || investor.investor_id,
      );
      const now = new Date().toISOString();

      // Prepare batch of memberships to add to investor_groups_investors
      const memberships = [];

      for (const groupId of selectedGroups) {
        for (const investorId of investorIds) {
          memberships.push({
            id: crypto.randomUUID(),
            group_id: groupId,
            investor_id: investorId,
            created_at: now,
          });
        }
      }

      // Insert memberships to investor_groups_investors
      const { error } = await supabase
        .from("investor_groups_investors")
        .upsert(memberships, { onConflict: "group_id,investor_id" });

      if (error) throw error;
      
      // Also add memberships to investor_group_members for backward compatibility
      const oldMemberships = [];
      
      for (const groupId of selectedGroups) {
        for (const investorId of investorIds) {
          oldMemberships.push({
            group_id: groupId,
            investor_id: investorId,
            created_at: now,
          });
        }
      }
      
      // Insert memberships to investor_group_members
      const { error: oldError } = await supabase
        .from("investor_group_members")
        .upsert(oldMemberships, { onConflict: "group_id,investor_id" });
        
      if (oldError) {
        console.error("Error adding to old table:", oldError);
        // Don't throw here to allow continuing with just the new table updated
      }

      // Update member counts for each group
      for (const groupId of selectedGroups) {
        await updateGroupMemberCount(groupId);
      }

      toast({
        title: "Success",
        description: `Added ${selectedInvestors.length} investors to ${selectedGroups.length} groups`,
      });

      // Reset selection and refresh groups with delay
      setSelectedGroups([]);
      await refreshGroupsWithDelay();
      onComplete();
    } catch (err) {
      console.error("Error adding investors to groups:", err);
      toast({
        title: "Error",
        description: "Failed to add investors to groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle removing investors from selected groups
  const handleRemoveFromGroups = async () => {
    if (selectedGroups.length === 0 || selectedInvestors.length === 0) return;

    try {
      setIsProcessing(true);

      const investorIds = selectedInvestors.map(
        (investor) => investor.id || investor.investor_id,
      );

      // Delete memberships from investor_groups_investors
      const { error } = await supabase
        .from("investor_groups_investors")
        .delete()
        .in("group_id", selectedGroups)
        .in("investor_id", investorIds);

      if (error) throw error;
      
      // Delete memberships from investor_group_members for backward compatibility
      const { error: oldError } = await supabase
        .from("investor_group_members")
        .delete()
        .in("group_id", selectedGroups)
        .in("investor_id", investorIds);
        
      if (oldError) {
        console.error("Error removing from old table:", oldError);
        // Don't throw here to allow continuing with just the new table updated
      }

      // Update member counts for each group
      for (const groupId of selectedGroups) {
        await updateGroupMemberCount(groupId);
      }

      toast({
        title: "Success",
        description: `Removed ${selectedInvestors.length} investors from ${selectedGroups.length} groups`,
      });

      // Reset selection and refresh groups with delay
      setSelectedGroups([]);
      await refreshGroupsWithDelay();
      onComplete();
    } catch (err) {
      console.error("Error removing investors from groups:", err);
      toast({
        title: "Error",
        description:
          "Failed to remove investors from groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Update member count for a group
  const updateGroupMemberCount = async (groupId: string) => {
    try {
      // Count members in both tables, ensuring no duplicates
      const { data: newMemberships, error: newError } = await supabase
        .from("investor_groups_investors")
        .select("investor_id")
        .eq("group_id", groupId);
        
      if (newError) throw newError;
      
      const { data: oldMemberships, error: oldError } = await supabase
        .from("investor_group_members")
        .select("investor_id")
        .eq("group_id", groupId);
        
      if (oldError) throw oldError;
      
      // Combine investors from both tables, removing duplicates
      const uniqueInvestorIds = new Set<string>();
      
      (newMemberships || []).forEach(m => uniqueInvestorIds.add(m.investor_id));
      (oldMemberships || []).forEach(m => uniqueInvestorIds.add(m.investor_id));
      
      // Update the group's member_count and updated_at timestamp
      const { error: updateError } = await supabase
        .from("investor_groups")
        .update({
          member_count: uniqueInvestorIds.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", groupId);

      if (updateError) throw updateError;
      
      // Return the updated count for potential UI updates
      return uniqueInvestorIds.size;
    } catch (err) {
      console.error(`Error updating member count for group ${groupId}:`, err);
      return null;
    }
  };

  // Helper function to wait before refreshing groups
  const refreshGroupsWithDelay = async () => {
    try {
      // Short delay to ensure DB operations have completed
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchGroups();
    } catch (error) {
      console.error("Error refreshing groups:", error);
    }
  };

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Create new group
      const { data: newGroup, error: createError } = await supabase
        .from("investor_groups")
        .insert({
          name: newGroupName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          member_count: selectedInvestors.length,
        })
        .select()
        .single();

      if (createError) throw createError;

      // If investors are selected, add them to the new group
      if (selectedInvestors.length > 0 && newGroup) {
        const investorIds = selectedInvestors.map(
          (investor) => investor.id || investor.investor_id,
        );
        const now = new Date().toISOString();

        // Add to investor_groups_investors
        const newMemberships = investorIds.map((investorId) => ({
          id: crypto.randomUUID(),
          group_id: newGroup.id,
          investor_id: investorId,
          created_at: now,
        }));

        const { error: newMembershipError } = await supabase
          .from("investor_groups_investors")
          .insert(newMemberships);

        if (newMembershipError) throw newMembershipError;
        
        // Add to investor_group_members for backward compatibility
        const oldMemberships = investorIds.map((investorId) => ({
          group_id: newGroup.id,
          investor_id: investorId,
          created_at: now,
        }));
        
        const { error: oldMembershipError } = await supabase
          .from("investor_group_members")
          .insert(oldMemberships);
          
        if (oldMembershipError) {
          console.error("Error adding to old table:", oldMembershipError);
          // Don't throw here to continue with just the new table
        }

        // Update member count
        await updateGroupMemberCount(newGroup.id);
      }

      toast({
        title: "Success",
        description: `Group "${newGroupName}" created successfully${selectedInvestors.length > 0 ? ` with ${selectedInvestors.length} investors` : ""}`,
      });

      // Reset form and refresh groups
      setNewGroupName("");
      setIsCreatingGroup(false);
      await refreshGroupsWithDelay();
    } catch (err) {
      console.error("Error creating group:", err);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle starting group edit
  const handleStartEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setIsEditingGroup(true);
    setIsCreatingGroup(false); // Close create form if open
  };

  // Handle saving group edit
  const handleSaveGroupEdit = async () => {
    if (!editingGroupId || !editingGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Update group name
      const { error } = await supabase
        .from("investor_groups")
        .update({
          name: editingGroupName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGroupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Group renamed successfully`,
      });

      // Reset form and refresh groups
      setEditingGroupId(null);
      setEditingGroupName("");
      setIsEditingGroup(false);
      await refreshGroupsWithDelay();
    } catch (err) {
      console.error("Error renaming group:", err);
      toast({
        title: "Error",
        description: "Failed to rename group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle opening delete confirmation
  const handleOpenDeleteDialog = (group: Group) => {
    setDeletingGroupId(group.id);
    setDeletingGroupName(group.name);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming group deletion
  const handleConfirmDeleteGroup = async () => {
    if (!deletingGroupId) return;

    try {
      setIsProcessing(true);

      // First delete all members from both tables
      const { error: newMemberDeleteError } = await supabase
        .from("investor_groups_investors")
        .delete()
        .eq("group_id", deletingGroupId);

      if (newMemberDeleteError) throw newMemberDeleteError;
      
      const { error: oldMemberDeleteError } = await supabase
        .from("investor_group_members")
        .delete()
        .eq("group_id", deletingGroupId);
        
      if (oldMemberDeleteError) {
        console.error("Error deleting from old table:", oldMemberDeleteError);
        // Don't throw here to continue with deleting the group
      }

      // Then delete the group itself
      const { error: groupDeleteError } = await supabase
        .from("investor_groups")
        .delete()
        .eq("id", deletingGroupId);

      if (groupDeleteError) throw groupDeleteError;

      toast({
        title: "Success",
        description: `Group deleted successfully`,
      });

      // Close dialog and refresh groups
      setIsDeleteDialogOpen(false);
      setDeletingGroupId(null);
      setDeletingGroupName("");
      await refreshGroupsWithDelay();
    } catch (err) {
      console.error("Error deleting group:", err);
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Manage Investor Groups</span>
          </DialogTitle>
          <DialogDescription>
            {selectedInvestors.length > 0
              ? `Manage group memberships for ${selectedInvestors.length} selected investor(s)`
              : "Browse and manage investor groups"}
          </DialogDescription>
        </DialogHeader>

        {isCreatingGroup ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>

            {selectedInvestors.length > 0 && (
              <div className="bg-muted/20 p-4 rounded-md">
                <p className="text-sm">
                  The selected {selectedInvestors.length} investor(s) will be
                  automatically added to this group.
                </p>
              </div>
            )}
          </div>
        ) : isEditingGroup ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Rename Group</Label>
              <Input
                id="edit-group-name"
                placeholder="Enter new group name"
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {selectedInvestors.length > 0 && (
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={activeTab === "add" ? "default" : "outline"}
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveTab("add");
                    setSelectedGroups([]);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add to Groups</span>
                </Button>
                <Button
                  variant={activeTab === "remove" ? "default" : "outline"}
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    setActiveTab("remove");
                    setSelectedGroups([]);
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                  <span>Remove from Groups</span>
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsCreatingGroup(true)}
              >
                <Plus className="h-4 w-4" />
                <span>New Group</span>
              </Button>
            </div>
            
            {/* Show all groups toggle */}
            {selectedInvestors.length > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="show-all-groups"
                  checked={showAllGroups}
                  onCheckedChange={() => setShowAllGroups(!showAllGroups)}
                />
                <Label
                  htmlFor="show-all-groups"
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show all groups, including those where investors are already {activeTab === "add" ? "members" : "not members"}</span>
                </Label>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 rounded-md">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No groups found. Create a new group to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Hidden groups counter */}
                {selectedInvestors.length > 0 && !showAllGroups && (
                  (() => {
                    // Count hidden groups
                    const hiddenGroups = filteredGroups.filter(group => {
                      const isInGroup = memberGroups.includes(group.id);
                      const visible = 
                        activeTab === "add"
                          ? !isInGroup
                          : isInGroup;
                      return !visible;
                    }).length;
                    
                    return hiddenGroups > 0 ? (
                      <div className="text-xs text-muted-foreground mt-2 mb-1">
                        <span className="italic">{hiddenGroups} group{hiddenGroups !== 1 ? 's' : ''} hidden based on membership status</span>
                      </div>
                    ) : null;
                  })()
                )}
              
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 mt-4">
                  {filteredGroups.map((group) => {
                    const isInGroup = memberGroups.includes(group.id);
                    // In add mode, hide groups where all investors are already members
                    // In remove mode, only show groups where all investors are members
                    // Unless showAllGroups is true, then show all groups
                    const shouldShow = showAllGroups || 
                      activeTab === "add"
                        ? selectedInvestors.length === 0 || !isInGroup
                        : selectedInvestors.length === 0 || isInGroup;

                    if (!shouldShow) return null;

                    return (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between p-3 rounded-md border ${selectedGroups.includes(group.id) ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={() => handleGroupSelection(group.id)}
                            id={`group-${group.id}`}
                          />
                          <div>
                            <Label
                              htmlFor={`group-${group.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {group.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Created{" "}
                              {new Date(
                                group.created_at || "",
                              ).toLocaleDateString()}
                              {group.member_count !== undefined && (
                                <> • {group.member_count} members</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isInGroup && selectedInvestors.length > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              Member
                            </Badge>
                          )}
                          <Badge variant="outline">Group</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStartEditGroup(group)}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename Group
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(group)}
                                className="cursor-pointer text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {isCreatingGroup ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingGroup(false);
                  setNewGroupName("");
                  setNewGroupDescription("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </>
          ) : isEditingGroup ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingGroup(false);
                  setEditingGroupId(null);
                  setEditingGroupName("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveGroupEdit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {activeTab === "add" ? (
                <Button
                  onClick={handleAddToGroups}
                  disabled={
                    selectedGroups.length === 0 ||
                    selectedInvestors.length === 0 ||
                    isProcessing
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add to {selectedGroups.length} Group
                      {selectedGroups.length !== 1 && "s"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleRemoveFromGroups}
                  disabled={
                    selectedGroups.length === 0 ||
                    selectedInvestors.length === 0 ||
                    isProcessing
                  }
                  variant="destructive"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove from {selectedGroups.length} Group
                      {selectedGroups.length !== 1 && "s"}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Investor Group
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the group <strong>"{deletingGroupName}"</strong>?
              <br /><br />
              This will only remove the group itself. All investors will remain in the system, but they will no longer be associated with this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGroup}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ManageGroupsDialog;
