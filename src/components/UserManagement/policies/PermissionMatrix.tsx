import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

type PermissionStatus = boolean | "limited" | null;

interface Permission {
  functionName: string;
  description: string;
  roles: {
    superAdmin: PermissionStatus;
    owner: PermissionStatus;
    complianceManager: PermissionStatus;
    agent: PermissionStatus;
    complianceOfficer: PermissionStatus;
  };
}

interface PermissionMatrixProps {
  permissions?: Permission[];
  onPermissionChange?: (updatedPermissions: Permission[]) => void;
}

const PermissionMatrix = ({
  permissions: initialPermissions = defaultPermissions,
  onPermissionChange = () => {},
}: PermissionMatrixProps) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [localPermissions, setLocalPermissions] =
    React.useState<Permission[]>(initialPermissions);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      localStorage.setItem("permissions", JSON.stringify(localPermissions));

      // Log the permission change to audit logs
      const { logAction } = await import("@/infrastructure/auditLogger");
      await logAction(
        "Permission Update",
        "current-user@example.com", // In a real app, this would be the current user
        `Updated permissions for ${localPermissions.length} functions`,
        "Success",
      );

      onPermissionChange(localPermissions);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save permissions",
      );

      // Log the error to audit logs
      try {
        const { logAction } = await import("@/infrastructure/auditLogger");
        await logAction(
          "Permission Update",
          "current-user@example.com",
          `Failed to update permissions: ${error instanceof Error ? error.message : "Unknown error"}`,
          "Failed",
        );
      } catch (logError) {
        console.error("Failed to log permission update error:", logError);
      }
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    try {
      const savedPermissions = localStorage.getItem("permissions");
      if (savedPermissions) {
        setLocalPermissions(JSON.parse(savedPermissions));
      }
    } catch (error) {
      console.error("Failed to load permissions:", error);
    }
  }, []);

  const togglePermission = (
    permissionIndex: number,
    role: keyof Permission["roles"],
  ) => {
    const newPermissions = [...localPermissions];
    const currentValue = newPermissions[permissionIndex].roles[role];

    // Cycle through: true -> 'limited' -> null (false)
    let newValue: PermissionStatus;
    if (currentValue === true) newValue = "limited";
    else if (currentValue === "limited") newValue = null;
    else newValue = true;

    newPermissions[permissionIndex].roles[role] = newValue;
    setLocalPermissions(newPermissions);
    onPermissionChange(newPermissions);
  };

  const renderPermissionIcon = (status: PermissionStatus) => {
    if (status === true) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 cursor-pointer" />;
    } else if (status === "limited") {
      return <AlertCircle className="h-5 w-5 text-amber-500 cursor-pointer" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500 cursor-pointer" />;
    }
  };

  return (
    <Card className="p-6 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Function Access Matrix</h2>
        <p className="text-gray-500">
          Manage role-based access to system functions
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Function</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Compliance Manager</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Compliance Officer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localPermissions.map((permission, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger className="text-left font-medium">
                        {permission.functionName}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{permission.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                {Object.entries(permission.roles).map(([role, status]) => (
                  <TableCell
                    key={role}
                    onClick={() =>
                      togglePermission(index, role as keyof Permission["roles"])
                    }
                  >
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      {renderPermissionIcon(status)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
};

const defaultPermissions: Permission[] = [
  {
    functionName: "System Configuration (Platform Settings, Security)",
    description:
      "Configure core platform settings, security protocols, and multi-signature policies",
    roles: {
      superAdmin: true,
      owner: false,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "User Management (Invite, Assign, Modify, Suspend, Revoke)",
    description: "Manage user accounts and their access levels",
    roles: {
      superAdmin: true,
      owner: true,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Key Management (Generate, Revoke, Rotate Keys)",
    description: "Manage cryptographic keys using TSS/MPC",
    roles: {
      superAdmin: true,
      owner: false,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Policy Automation (Configure Rules, Thresholds)",
    description:
      "Configure policy-driven automation thresholds and monitor rule enforcement",
    roles: {
      superAdmin: true,
      owner: false,
      complianceManager: true,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Audit and Compliance (Logs, Reporting)",
    description: "Access and manage audit logs and compliance reports",
    roles: {
      superAdmin: true,
      owner: true,
      complianceManager: true,
      agent: false,
      complianceOfficer: true,
    },
  },
  {
    functionName: "Security Monitoring (Sessions, Force Logouts)",
    description: "Monitor and manage active sessions",
    roles: {
      superAdmin: true,
      owner: false,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Token Management (Design, Configure, Deploy)",
    description: "Design and configure tokens using Token Building Blocks",
    roles: {
      superAdmin: false,
      owner: true,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Issuance Oversight (Allocate Tokens, Cap Table Updates)",
    description: "Oversee token issuance and cap table management",
    roles: {
      superAdmin: false,
      owner: true,
      complianceManager: false,
      agent: false,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Compliance Validation (KYC/AML, Jurisdiction)",
    description:
      "Review and approve investor KYC/AML data and jurisdictional compliance",
    roles: {
      superAdmin: false,
      owner: false,
      complianceManager: true,
      agent: false,
      complianceOfficer: true,
    },
  },
  {
    functionName: "Investor Onboarding Support (Due Diligence, Qualification)",
    description: "Support investor onboarding processes",
    roles: {
      superAdmin: false,
      owner: true,
      complianceManager: true,
      agent: true,
      complianceOfficer: true,
    },
  },
  {
    functionName: "Token Allocation Support (Distribution, Subscriptions)",
    description: "Support token allocation processes",
    roles: {
      superAdmin: false,
      owner: true,
      complianceManager: false,
      agent: true,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Reporting and Monitoring (Position Reports, Transactions)",
    description: "Generate and view reports",
    roles: {
      superAdmin: true,
      owner: true,
      complianceManager: true,
      agent: true,
      complianceOfficer: true,
    },
  },
  {
    functionName: "Secondary Market Facilitation (OTC, CEX Transactions)",
    description: "Support investor transactions on secondary markets",
    roles: {
      superAdmin: false,
      owner: false,
      complianceManager: false,
      agent: true,
      complianceOfficer: false,
    },
  },
  {
    functionName: "Multi-Signature Approval Participation",
    description: "Participate in multi-signature approvals",
    roles: {
      superAdmin: true,
      owner: true,
      complianceManager: true,
      agent: false,
      complianceOfficer: false,
    },
  },
];

export default PermissionMatrix;
