export type PermissionStatus = boolean | "limited" | null;

export interface FunctionPermission {
  id?: string;
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

export interface PermissionUpdate {
  permissions: FunctionPermission[];
  updatedAt: string;
  updatedBy: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  priority: number;
}

export interface Permission {
  roleId: string;
  permissionName: string;
}

export interface PermissionCategory {
  name: string;
  permissions: string[];
}

export interface PermissionDefinition {
  id: string;
  name: string;
  category: string;
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Project',
    permissions: [
      'Create',
      'Edit',
      'Delete',
      'View'
    ]
  },
  {
    name: 'User',
    permissions: [
      'Create',
      'Edit',
      'Delete',
      'View',
      'Assign Role',
      'Approve'
    ]
  },
  {
    name: 'Policy Rules',
    permissions: [
      'Create',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Token Design',
    permissions: [
      'Save Templates',
      'Save Tokens',
      'Edit',
      'Delete',
      'View'
    ]
  },
  {
    name: 'Token Lifecycle',
    permissions: [
      'Mint',
      'Burn',
      'Pause / Lock',
      'Block / Unblock',
      'Deploy',
      'Approve'
    ]
  },
  {
    name: 'Investor',
    permissions: [
      'Create',
      'Bulk',
      'Edit',
      'Delete',
      'View'
    ]
  },
  {
    name: 'Subscriptions',
    permissions: [
      'Create',
      'Bulk',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Token Allocations',
    permissions: [
      'Create',
      'Bulk',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Wallet',
    permissions: [
      'Create',
      'Bulk',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Transactions',
    permissions: [
      'Create',
      'Bulk Distribute',
      'Force Transfer',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Redemptions',
    permissions: [
      'Create',
      'Edit',
      'Delete',
      'View',
      'Approve'
    ]
  },
  {
    name: 'Compliance KYC/KYB',
    permissions: [
      'Run',
      'Create',
      'Upload Documents',
      'Edit',
      'Delete',
      'View',
      'Approve',
      'Reject'
    ]
  },
  {
    name: 'System Admin',
    permissions: [
      'View Audit / Activity Monitor',
      'Configure System'
    ]
  }
];

// Generate flat permissions list
export const PERMISSIONS: PermissionDefinition[] = PERMISSION_CATEGORIES.flatMap(category => {
  const categoryName = category.name.toLowerCase().replace(/\s+|\/+/g, '_');
  
  return category.permissions.map(permission => {
    // Handle special cases for system admin
    if (category.name === 'System Admin') {
      if (permission === 'View Audit / Activity Monitor') {
        return {
          id: 'system.audit',
          name: permission,
          category: category.name
        };
      }
      if (permission === 'Configure System') {
        return {
          id: 'system.configure',
          name: permission,
          category: category.name
        };
      }
    }
    
    // Format the permission name to match our DB convention
    let permissionAction = permission.toLowerCase().replace(/\s+|\/+/g, '_');
    
    // Map UI permission names to database permission names
    const actionMappings: Record<string, string> = {
      'view': 'view',
      'create': 'create',
      'edit': 'edit',
      'delete': 'delete',
      'approve': 'approve',
      'reject': 'reject',
      'assign_role': 'assign_role',
      'bulk': 'bulk',
      'run': 'run',
      'upload_documents': 'upload',
      'save_templates': 'save_templates',
      'save_tokens': 'save_tokens',
      'mint': 'mint',
      'burn': 'burn',
      'pause_/_lock': 'pause',
      'block_/_unblock': 'block',
      'deploy': 'deploy',
      'bulk_distribute': 'bulk_distribute',
      'force_transfer': 'force_transfer'
    };
    
    permissionAction = actionMappings[permissionAction] || permissionAction;
    
    return {
      id: `${categoryName}.${permissionAction}`,
      name: permission,
      category: category.name
    };
  });
});
