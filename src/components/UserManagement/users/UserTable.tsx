import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, RefreshCw, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { User, UserStatus } from "@/types/domain/user/user";
import { authService } from "@/services/auth";
import { formatRoleForDisplay, Role } from "@/utils/auth/roleUtils";
import { formatDistanceToNow } from "date-fns";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { usePermissions } from "@/hooks/auth/usePermissions.tsx";

interface UsersTableProps {
  canInviteUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canResetPasswords?: boolean;
}

export function UsersTable({ 
  canInviteUsers = true,
  canEditUsers = true, 
  canDeleteUsers = true,
  canResetPasswords = true 
}: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const checkPermission = async (permission: string) => {
    try {
      return await hasPermission(permission);
    } catch (error) {
      console.error("Permission check failed:", error);
      return true;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userData = await authService.getAllUsers();
      // Map the user data to match the expected User type
      const mappedUsers: User[] = userData.map(user => {
        // Use type assertion to safely convert between types
        const authUser = user as any;
        
        // Find the primary role if available
        const primaryRole = authUser.primaryRole || { 
          id: '', 
          name: authUser.role || 'Unknown',
          description: '',
          priority: 0 
        };
        
        return {
          id: authUser.id,
          email: authUser.email,
          profile: authUser.profile || {
            id: authUser.id,
            name: authUser.name || '',
            email: authUser.email,
            status: (authUser.status as UserStatus) || 'active',
            created_at: authUser.createdAt || new Date().toISOString(),
            updated_at: authUser.updatedAt || new Date().toISOString()
          },
          // Create a Role object from primaryRole
          role: {
            id: primaryRole.id,
            name: primaryRole.name,
            description: primaryRole.description || '',
            priority: primaryRole.priority || 0
          }
        };
      });
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please check the database connection.",
        variant: "destructive",
      });
      // Set empty array to avoid undefined errors
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await authService.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleUserUpdated = () => {
    fetchUsers();
    setEditUserModalOpen(false);
  };

  const getBadgeColor = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      case "blocked":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchUsers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {canInviteUsers && (
            <Button 
              size="sm"
              onClick={() => setAddUserModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.profile?.name || "—"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role 
                      ? formatRoleForDisplay(user.role.name) 
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {user.profile?.status ? (
                      <Badge className={getBadgeColor(user.profile.status as UserStatus)}>
                        {user.profile.status}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {user.profile?.created_at 
                      ? formatDistanceToNow(new Date(user.profile.created_at), { addSuffix: true }) 
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditUsers && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setEditUserModalOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canResetPasswords && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordModalOpen(true);
                            }}
                          >
                            Reset Password
                          </DropdownMenuItem>
                        )}
                        {canDeleteUsers && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {addUserModalOpen && (
        <AddUserModal
          open={addUserModalOpen}
          onOpenChange={setAddUserModalOpen}
          onUserCreated={fetchUsers}
        />
      )}

      {selectedUser && editUserModalOpen && (
        <EditUserModal
          user={selectedUser}
          open={editUserModalOpen}
          onOpenChange={setEditUserModalOpen}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {selectedUser && resetPasswordModalOpen && (
        <ResetPasswordModal
          user={selectedUser}
          open={resetPasswordModalOpen}
          onOpenChange={setResetPasswordModalOpen}
        />
      )}
    </div>
  );
}
