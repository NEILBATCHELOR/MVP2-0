import { useState, useEffect } from "react";
import { supabase } from "@/infrastructure/database/client";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { formatRoleForDisplay } from "@/utils/auth/roleUtils";

interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
  roleDisplay?: string;
}

// Define the expected structure of role data
interface RoleData {
  id: string;
  name: string;
}

// Type for the query result
interface UserRoleQueryResult {
  user_id: string;
  roles?: RoleData | null;
}

export const useApprovers = (permissionName?: string) => {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadApprovers = async () => {
    setIsLoading(true);
    try {
      let fetchedApprovers: Approver[] = [];

      if (permissionName) {
        // Get approvers based on the single permission that was passed in
        try {
          const { data: permissionUsers, error: permissionError } = await supabase
            .rpc('get_users_with_permission' as any, { permission_name: permissionName });

          if (permissionError) throw permissionError;
          
          if (permissionUsers && Array.isArray(permissionUsers) && permissionUsers.length > 0) {
            // Convert the database results to Approver objects
            fetchedApprovers = permissionUsers.map(user => ({
              id: user.user_id,
              name: user.name || 'Unknown',
              email: user.email || '',
              role: user.role || '',
              roleDisplay: formatRoleForDisplay(user.role || '')
            }));
          }
        } catch (error) {
          console.error('Error fetching users with specific permission:', error);
          // Fall back to querying users directly
          const fallbackApprovers = await fetchUsersByRoles();
          fetchedApprovers = fallbackApprovers;
        }
      } else {
        // Try to get users with policy approval permissions using direct query approach
        const roleApprovers = await fetchUsersByRoles();
        fetchedApprovers = roleApprovers;
      }

      // Exclude current user from approvers list
      if (user) {
        fetchedApprovers = fetchedApprovers.filter(approver => approver.id !== user.id);
      }
      
      // Deduplicate approvers by ID to prevent duplicates
      const uniqueApprovers = fetchedApprovers.reduce<Approver[]>((unique, approver) => {
        if (!unique.some(item => item.id === approver.id)) {
          unique.push(approver);
        }
        return unique;
      }, []);
      
      setApprovers(uniqueApprovers);

    } catch (error) {
      console.error('Error loading approvers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approvers',
        variant: 'destructive',
      });
      setApprovers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct database query fallback approach to get ALL users with roles
  const fetchUsersByRoles = async () => {
    console.log("Fetching users with roles, without filtering for approver roles");
    try {
      // First, try direct query to roles and users to get complete visibility
      const { data: allRoles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');
      
      if (!rolesError && allRoles) {
        console.log("Available roles in the system:", allRoles);
      }
      
      // Get all user roles first
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id')
        .order('user_id');
      
      if (userRolesError || !userRoles) {
        console.error("Error fetching user roles:", userRolesError);
        throw userRolesError;
      }
      
      console.log("User roles data:", userRoles);
      
      // Get all roles separately to avoid join issues
      const { data: roles, error: rolesQueryError } = await supabase
        .from('roles')
        .select('id, name');
        
      if (rolesQueryError || !roles) {
        console.error("Error fetching roles:", rolesQueryError);
        throw rolesQueryError;
      }
      
      // Get user details for these users
      const userIds = [...new Set(userRoles.map(ur => ur.user_id))];
      
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
          
        if (userError || !userData) {
          console.error("Error fetching users:", userError);
          throw userError;
        }
        
        // Map user details to their roles
        const result = userData.map(user => {
          // Find the user role entry
          const userRoleEntry = userRoles.find(ur => ur.user_id === user.id);
          
          // Find the role details
          const roleDetails = userRoleEntry 
            ? roles.find(r => r.id === userRoleEntry.role_id) 
            : null;
          
          const roleName = roleDetails?.name || 'Unknown Role';
          
          return {
            id: user.id,
            name: user.name || 'Unknown',
            email: user.email || '',
            role: roleName,
            roleDisplay: formatRoleForDisplay(roleName)
          };
        });
        
        console.log("Final user list with roles:", result);
        return result;
      }

      // If above approach fails, use the original approach
      const { data: usersWithRoles, error: usersError } = await supabase
        .from('user_permissions_view')
        .select('user_id, user_name, email, role_name')
        .order('user_name');
      
      console.log("Raw user permissions data:", usersWithRoles);
        
      if (usersError) {
        console.error("Error fetching from user_permissions_view:", usersError);
        throw usersError;
      }
      
      if (usersWithRoles && usersWithRoles.length > 0) {
        // Include ALL users without role filtering
        const userMap = new Map();
        
        usersWithRoles.forEach(user => {
          if (!userMap.has(user.user_id)) {
            userMap.set(user.user_id, {
              id: user.user_id,
              name: user.user_name || 'Unknown',
              email: user.email || '',
              role: user.role_name || '',
              roleDisplay: formatRoleForDisplay(user.role_name || '')
            });
          }
        });
        
        const result = Array.from(userMap.values());
        console.log("Final users from user_permissions_view:", result);
        return result;
      }
      
      // Fallback: Direct query to users table (no roles)
      console.log("No results from permissions view, querying users directly");
      const { data: directUsers, error: directError } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name');
        
      if (!directError && directUsers && directUsers.length > 0) {
        console.log("Users from direct query:", directUsers);
        return directUsers.map(user => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || '',
          role: 'User',
          roleDisplay: 'User'
        }));
      }
      
      console.log("No users found with any approach");
      return [];
    } catch (error) {
      console.error('Error in fallback approver query:', error);
      return [];
    }
  };

  // Get approvers with a specific role
  const getApproversWithRole = (roleName: string) => {
    return approvers.filter(approver => 
      approver.role.toLowerCase() === roleName.toLowerCase()
    );
  };

  // Filter approvers based on roles array
  const filterApproversByRoles = (roles: string[]) => {
    const normalizedRoles = roles.map(r => r.toLowerCase());
    return approvers.filter(approver => 
      normalizedRoles.includes(approver.role.toLowerCase())
    );
  };

  useEffect(() => {
    if (user) {
      loadApprovers();
    }
  }, [user, permissionName]);

  return {
    approvers,
    isLoading,
    loadApprovers,
    getApproversWithRole,
    filterApproversByRoles
  };
};