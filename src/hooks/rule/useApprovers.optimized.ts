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
            .rpc('get_users_with_permission', { permission_name: permissionName });

          if (permissionError) throw permissionError;
          
          if (permissionUsers && permissionUsers.length > 0) {
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

  // Direct database query approach to get ALL users with roles
  const fetchUsersByRoles = async () => {
    console.log("Fetching users with roles, without filtering");
    
    try {
      // Query user_roles directly to get all users with relevant roles 
      // DIRECT JOIN approach works best for this database schema
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          email,
          user_roles!inner (
            role_id,
            roles!inner (
              name
            )
          )
        `)
        .order('name');
      
      if (userError) {
        console.error("Error fetching users with roles:", userError);
        throw userError;
      }
      
      if (userData && userData.length > 0) {
        console.log("USER DATA:", userData);
        return userData.map(user => {
          const role = user.user_roles?.[0]?.roles?.name || 'Unknown Role';
          return {
            id: user.id,
            name: user.name || 'Unknown',
            email: user.email || '',
            role: role,
            roleDisplay: formatRoleForDisplay(role)
          };
        });
      }
      
      // Fallback for when all other approaches fail
      console.log("No users found with roles, falling back to direct users query");
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
      console.error('Error in approver query:', error);
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