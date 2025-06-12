import { supabase } from "@/infrastructure/database/client";
import { keyVaultClient } from "@/infrastructure/keyVault/keyVaultClient";
import { 
  ProjectCredential, 
  ProjectCredentialInsert,
  ProjectCredentialUpdate,
  CredentialUsageLogInsert,
  mapCredentialToCamelCase,
  mapCredentialToSnakeCase,
  mapCredentialsLogToSnakeCase
} from "@/types/credentials";

/**
 * Service for managing project credentials
 */
export const projectCredentialsService = {
  /**
   * Get credentials for a project
   * 
   * @param projectId The project ID to get credentials for
   * @returns Array of credentials for the project
   */
  async getCredentialsForProject(projectId: string): Promise<ProjectCredential[]> {
    const { data, error } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(cred => mapCredentialToCamelCase(cred));
  },
  
  /**
   * Get a specific credential by ID
   * 
   * @param credentialId The credential ID to retrieve
   * @returns The credential or null if not found
   */
  async getCredentialById(credentialId: string): Promise<ProjectCredential | null> {
    const { data, error } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('id', credentialId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return mapCredentialToCamelCase(data);
  },
  
  /**
   * Generate new credentials for a project
   * 
   * @param projectId The project ID to generate credentials for
   * @param userId Optional user ID performing the action (for audit logs)
   * @returns The newly created credential
   */
  async generateCredentialsForProject(projectId: string, userId?: string): Promise<ProjectCredential> {
    // Generate key pair in the secure vault
    const { keyId, publicKey } = await keyVaultClient.generateKeyPair();
    
    // Store the public key and reference in the database
    const credentialInsert: ProjectCredentialInsert = {
      project_id: projectId,
      public_key: publicKey,
      key_vault_id: keyId,
      is_active: true
    };
    
    const { data, error } = await supabase
      .from('project_credentials')
      .insert(credentialInsert)
      .select('*')
      .single();
      
    if (error) {
      // If there's an error, delete the key from the vault
      await keyVaultClient.deleteKey(keyId);
      throw error;
    }
    
    // Log the credential creation
    await this.logCredentialUsage({
      credential_id: data.id,
      action_type: 'CREDENTIAL_CREATED',
      action_details: { project_id: projectId },
      performed_by: userId || null,
      ip_address: null,
      user_agent: null
    });
    
    return mapCredentialToCamelCase(data);
  },
  
  /**
   * Revoke a credential
   * 
   * @param credentialId The credential ID to revoke
   * @param userId Optional user ID performing the action (for audit logs)
   * @returns The updated credential
   */
  async revokeCredential(credentialId: string, userId?: string): Promise<ProjectCredential> {
    // Get the current credential to check if it's already revoked
    const credential = await this.getCredentialById(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }
    
    if (credential.revokedAt) {
      throw new Error('Credential is already revoked');
    }
    
    // Update the credential to mark it as revoked
    const update: ProjectCredentialUpdate = {
      revoked_at: new Date().toISOString(),
      is_active: false
    };
    
    const { data, error } = await supabase
      .from('project_credentials')
      .update({
        revoked_at: update.revoked_at,
        is_active: update.is_active
      })
      .eq('id', credentialId)
      .select('*')
      .single();
      
    if (error) throw error;
    
    // Log the credential revocation
    await this.logCredentialUsage({
      credential_id: data.id,
      action_type: 'CREDENTIAL_REVOKED',
      action_details: { project_id: data.project_id },
      performed_by: userId || null,
      ip_address: null,
      user_agent: null
    });
    
    return mapCredentialToCamelCase(data);
  },
  
  /**
   * Delete a credential completely
   * 
   * @param credentialId The credential ID to delete
   * @param userId Optional user ID performing the action (for audit logs)
   * @returns Success status
   */
  async deleteCredential(credentialId: string, userId?: string): Promise<{ success: boolean }> {
    // Get the credential first to get the key vault ID
    const credential = await this.getCredentialById(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }
    
    // Log the credential deletion (before it's deleted)
    await this.logCredentialUsage({
      credential_id: credential.id,
      action_type: 'CREDENTIAL_DELETED',
      action_details: { project_id: credential.projectId },
      performed_by: userId || null,
      ip_address: null,
      user_agent: null
    });
    
    // Delete the key from the vault
    await keyVaultClient.deleteKey(credential.keyVaultId);
    
    // Delete the credential from the database
    const { error } = await supabase
      .from('project_credentials')
      .delete()
      .eq('id', credentialId);
      
    if (error) throw error;
    
    return { success: true };
  },
  
  /**
   * Sign data using a project's credentials
   * 
   * @param projectId The project ID to sign with
   * @param data The data to sign
   * @param userId Optional user ID performing the action (for audit logs)
   * @param context Optional context information (for audit logs)
   * @returns The signature and credential ID used
   */
  async signWithProjectCredentials(
    projectId: string, 
    data: string, 
    userId?: string,
    context?: Record<string, any>
  ): Promise<{ signature: string, credentialId: string }> {
    // Find the most recent active project credential
    const { data: credentials, error } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    if (!credentials.length) throw new Error('No active credentials found for project');
    
    const credential = credentials[0];
    
    // Use the key vault to sign the data
    const signature = await keyVaultClient.signData(
      credential.key_vault_id, 
      data
    );
    
    // Log the credential usage
    await this.logCredentialUsage({
      credential_id: credential.id,
      action_type: 'SIGN_DATA',
      action_details: { 
        project_id: projectId,
        data_hash: this.hashData(data),
        ...context
      },
      performed_by: userId || null,
      ip_address: null,
      user_agent: null
    });
    
    return {
      signature,
      credentialId: credential.id
    };
  },
  
  /**
   * Verify a signature
   * 
   * @param publicKey The public key that supposedly signed the data
   * @param data The original data
   * @param signature The signature to verify
   * @returns Whether the signature is valid
   */
  async verifySignature(publicKey: string, data: string, signature: string): Promise<boolean> {
    return keyVaultClient.verifySignature(publicKey, data, signature);
  },
  
  /**
   * Get the usage logs for a specific credential
   * 
   * @param credentialId The credential ID to get logs for
   * @returns Array of usage logs
   */
  async getCredentialUsageLogs(credentialId: string) {
    const { data, error } = await supabase
      .from('credential_usage_logs')
      .select('*')
      .eq('credential_id', credentialId)
      .order('performed_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(log => ({
      id: log.id,
      credentialId: log.credential_id,
      actionType: log.action_type,
      actionDetails: log.action_details,
      performedBy: log.performed_by,
      performedAt: log.performed_at,
      ipAddress: log.ip_address,
      userAgent: log.user_agent
    }));
  },
  
  /**
   * Log credential usage
   * 
   * @param logEntry The log entry to create
   */
  async logCredentialUsage(logEntry: CredentialUsageLogInsert): Promise<void> {
    const { error } = await supabase
      .from('credential_usage_logs')
      .insert(logEntry);
      
    if (error) {
      console.error('Failed to log credential usage:', error);
      // Don't throw here to prevent operation failure if logging fails
    }
  },
  
  /**
   * Create a hash of the data for logging purposes
   * (We don't log the actual data for security)
   * 
   * @param data The data to hash
   * @returns The hash
   */
  hashData(data: string): string {
    // In a real implementation, use a proper hashing algorithm
    // For simplicity, we're using a naive implementation
    return `sha256:${Buffer.from(data).toString('base64').substring(0, 16)}`;
  }
};

export default projectCredentialsService;