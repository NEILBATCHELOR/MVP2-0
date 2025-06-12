// Database types for credentials (snake_case)
export interface ProjectCredential_Table {
  id: string;
  project_id: string;
  public_key: string;
  key_vault_id: string;
  created_at: string;
  revoked_at: string | null;
  is_active: boolean;
}

export interface CredentialUsageLog_Table {
  id: string;
  credential_id: string;
  action_type: string;
  action_details: Record<string, any>;
  performed_by: string | null;
  performed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

// Domain types for credentials (camelCase)
export interface ProjectCredential {
  id: string;
  projectId: string;
  publicKey: string;
  keyVaultId: string;
  createdAt: string;
  revokedAt: string | null;
  isActive: boolean;
}

export interface CredentialUsageLog {
  id: string;
  credentialId: string;
  actionType: string;
  actionDetails: Record<string, any>;
  performedBy: string | null;
  performedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

// Insert/Update types
export type ProjectCredentialInsert = Omit<ProjectCredential_Table, 'id' | 'created_at' | 'revoked_at'> & {
  revoked_at?: string | null;
};

export type ProjectCredentialUpdate = Partial<Omit<ProjectCredential_Table, 'id' | 'project_id' | 'created_at'>>;

export type CredentialUsageLogInsert = Omit<CredentialUsageLog_Table, 'id' | 'performed_at'>;

// Type mappers
export function mapCredentialToSnakeCase(credential: Partial<ProjectCredential>): Partial<ProjectCredential_Table> {
  return {
    ...(credential.id && { id: credential.id }),
    ...(credential.projectId && { project_id: credential.projectId }),
    ...(credential.publicKey && { public_key: credential.publicKey }),
    ...(credential.keyVaultId && { key_vault_id: credential.keyVaultId }),
    ...(credential.createdAt && { created_at: credential.createdAt }),
    ...(credential.revokedAt !== undefined && { revoked_at: credential.revokedAt }),
    ...(credential.isActive !== undefined && { is_active: credential.isActive }),
  };
}

export function mapCredentialToCamelCase(credential: ProjectCredential_Table): ProjectCredential {
  return {
    id: credential.id,
    projectId: credential.project_id,
    publicKey: credential.public_key,
    keyVaultId: credential.key_vault_id,
    createdAt: credential.created_at,
    revokedAt: credential.revoked_at,
    isActive: credential.is_active,
  };
}

export function mapCredentialsLogToSnakeCase(log: Partial<CredentialUsageLog>): Partial<CredentialUsageLog_Table> {
  return {
    ...(log.id && { id: log.id }),
    ...(log.credentialId && { credential_id: log.credentialId }),
    ...(log.actionType && { action_type: log.actionType }),
    ...(log.actionDetails && { action_details: log.actionDetails }),
    ...(log.performedBy && { performed_by: log.performedBy }),
    ...(log.performedAt && { performed_at: log.performedAt }),
    ...(log.ipAddress && { ip_address: log.ipAddress }),
    ...(log.userAgent && { user_agent: log.userAgent }),
  };
}

export function mapCredentialsLogToCamelCase(log: CredentialUsageLog_Table): CredentialUsageLog {
  return {
    id: log.id,
    credentialId: log.credential_id,
    actionType: log.action_type,
    actionDetails: log.action_details,
    performedBy: log.performed_by,
    performedAt: log.performed_at,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
  };
}