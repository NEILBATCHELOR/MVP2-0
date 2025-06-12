import { useEffect, useState } from "react";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Role } from "@/utils/auth/roleUtils";
import { PERMISSIONS } from "@/types/shared/permissions";
import type { Database } from "@/types/core/supabase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

// Group permissions by category for cleaner UI
const groupedPermissions = PERMISSIONS.reduce((groups, permission) => {
  if (!groups[permission.category]) {
    groups[permission.category] = [];
  }
  groups[permission.category].push(permission);
  return groups;
}, {} as Record<string, typeof PERMISSIONS>);

interface PermissionsMatrixModalProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionsUpdated: () => void;
}

// Database types for role_permissions operations
type RolePermissionRow = Database['public']['Tables']['role_permissions']['Row'];
type RolePermissionInsert = Database['public']['Tables']['role_permissions']['Insert'];

const PermissionsMatrixModal = ({
  role,
  open,
  onOpenChange,
  onPermissionsUpdated,
}: PermissionsMatrixModalProps) => {
  const [activePermissions, setActivePermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const { toast } = useToast();

  // Load role's permissions when role changes
  useEffect(() => {
    if (role && open) {
      loadRolePermissions();
      
      // Check if it's a system role based on standard role names
      setIsSystemRole(role.name === "Super Admin" || 
                     role.name === "Owner" || 
                     role.name === "Compliance Manager" || 
                     role.name === "Compliance Officer" || 
                     role.name === "Agent" || 
                     role.name === "Viewer");
    } else {
      setActivePermissions(new Set());
    }
  }, [role, open]);

  const loadRolePermissions = async () => {
    if (!role) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_name")
        .eq("role_id", role.id);

      if (error) throw error;

      const permissions = new Set(data?.map((item) => item.permission_name) || []);
      setActivePermissions(permissions);
    } catch (error: any) {
      console.error("Error loading role permissions:", error);
      toast({
        title: "Error loading permissions",
        description: error.message || "An error occurred while loading permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!role) return;

    setIsSubmitting(true);
    try {
      // Get current permissions
      const { data: currentPerms, error: fetchError } = await supabase
        .from("role_permissions")
        .select("permission_name")
        .eq("role_id", role.id);

      if (fetchError) throw fetchError;

      const currentPermSet = new Set(currentPerms?.map(p => p.permission_name) || []);
      
      // Determine which permissions to add and which to remove
      const toAdd = [...activePermissions].filter(p => !currentPermSet.has(p));
      const toRemove = [...currentPermSet].filter(p => !activePermissions.has(p));
      
      // Remove permissions that should be removed
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", role.id)
          .in("permission_name", toRemove);
          
        if (removeError) throw removeError;
      }
      
      // Add new permissions - ensure we're using the correct format defined in the permissions.ts
      if (toAdd.length > 0) {
        const newPerms: RolePermissionInsert[] = toAdd.map(permName => {
          // Make sure we use the exact permission ID from our defined permissions
          const foundPerm = PERMISSIONS.find(p => p.id === permName);
          if (!foundPerm) {
            console.warn(`Permission ${permName} not found in PERMISSIONS list`);
          }
          
          return {
            role_id: role.id,
            permission_name: permName // Use the permission ID as defined in PERMISSIONS
          };
        });
        
        const { error: addError } = await supabase
          .from("role_permissions")
          .insert(newPerms);
          
        if (addError) throw addError;
      }

      toast({
        title: "Permissions updated",
        description: `Permissions for role "${role.name}" have been updated successfully.`,
      });

      onOpenChange(false);
      onPermissionsUpdated();
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error saving permissions",
        description: error.message || "An error occurred while saving permissions",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setActivePermissions(prevState => {
      const newState = new Set(prevState);
      if (newState.has(permissionId)) {
        newState.delete(permissionId);
      } else {
        newState.add(permissionId);
      }
      return newState;
    });
  };

  const handleSelectAll = (category: string) => {
    const categoryPerms = groupedPermissions[category].map(p => p.id);
    const allSelected = categoryPerms.every(p => activePermissions.has(p));
    
    setActivePermissions(prevState => {
      const newState = new Set(prevState);
      
      if (allSelected) {
        // Deselect all in this category
        categoryPerms.forEach(p => newState.delete(p));
      } else {
        // Select all in this category
        categoryPerms.forEach(p => newState.add(p));
      }
      
      return newState;
    });
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions: {role.name}</DialogTitle>
        </DialogHeader>

        {isSystemRole && (
          <Alert className="mb-4 border-amber-500">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              This is a system role. Modifying its permissions may affect system functionality.
            </AlertDescription>
          </Alert>
        )}

        {role.name === "Super Admin" && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Super Admin role automatically has all permissions. Any changes here are only for reference.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectAll(category)}
                  >
                    {perms.every(p => activePermissions.has(p.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Permission</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px] text-right">Allow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.name}</TableCell>
                        <TableCell>
                          {permission.id}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={activePermissions.has(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                            aria-label={`Toggle ${permission.name} permission`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePermissions} 
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsMatrixModal;