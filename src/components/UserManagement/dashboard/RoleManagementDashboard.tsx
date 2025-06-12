import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Settings, Shield, User } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/infrastructure/database/client";
import { Role, getAllRoles, getRolePermissions } from "@/utils/auth/roleUtils";
import { getRoleDisplayName, normalizeRoleName } from "@/utils/auth/roleNormalizer";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import PermissionsMatrixModal from "./PermissionsMatrixModal";
import { UsersTable } from "@/components/UserManagement/users/UserTable";

interface PermissionViewModel {
  roleId: string;
  permissionName: string;
}

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
}

const RoleManagementDashboard = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionViewModel[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const roleColumns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Role Name",
      cell: ({ row }) => (
        <div className="font-medium">{getRoleDisplayName(row.original.name)}</div>
      )
    },
    {
      accessorKey: "description",
      header: "Description"
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <div className="text-center">{row.original.priority}</div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRole(row.original);
              setPermissionsModalOpen(true);
            }}
          >
            <Shield className="h-4 w-4 mr-1" />
            Permissions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRole(row.original);
              setEditRoleModalOpen(true);
            }}
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      )
    }
  ];

  const userColumns: ColumnDef<UserWithRole>[] = [
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <div>{getRoleDisplayName(row.original.role)}</div>
      )
    }
  ];

  const fetchRolesAndPermissions = async () => {
    try {
      setIsLoading(true);
      // Fetch roles
      const rolesData = await getAllRoles();
      setRoles(rolesData);

      // Fetch permissions for each role
      const allPermissions: PermissionViewModel[] = [];
      for (const role of rolesData) {
        const permissions = await getRolePermissions(role.id);
        permissions.forEach(permission => {
          allPermissions.push({
            roleId: role.id,
            permissionName: permission.name
          });
        });
      }
      setPermissions(allPermissions);
    } catch (err) {
      console.error('Error fetching roles and permissions:', err);
      setError('Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleAdded = () => {
    fetchRolesAndPermissions();
  };

  const handleRoleUpdated = () => {
    fetchRolesAndPermissions();
  };

  const handlePermissionsUpdated = () => {
    fetchRolesAndPermissions();
  };

  // Identify system roles by name using normalized comparison
  const systemRoleNames = ["Super Admin", "Owner", "Compliance Manager", "Compliance Officer", "Agent", "Viewer"];
  const systemRoles = roles.filter(role => 
    systemRoleNames.some(systemRole => 
      normalizeRoleName(systemRole) === normalizeRoleName(role.name)
    )
  );
  const customRoles = roles.filter(role => 
    !systemRoleNames.some(systemRole => 
      normalizeRoleName(systemRole) === normalizeRoleName(role.name)
    )
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Role Management</h1>
        <Button onClick={() => setAddRoleModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Role
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users with Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={roleColumns} data={systemRoles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={roleColumns} data={customRoles} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users and their Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersTable 
                canInviteUsers={true}
                canEditUsers={true}
                canDeleteUsers={true}
                canResetPasswords={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddRoleModal
        open={addRoleModalOpen}
        onOpenChange={setAddRoleModalOpen}
        onRoleAdded={handleRoleAdded}
      />

      <EditRoleModal
        role={selectedRole}
        open={editRoleModalOpen}
        onOpenChange={setEditRoleModalOpen}
        onRoleUpdated={handleRoleUpdated}
      />

      <PermissionsMatrixModal
        role={selectedRole}
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        onPermissionsUpdated={handlePermissionsUpdated}
      />
    </div>
  );
};

export default RoleManagementDashboard;