/**
 * Relationship Service
 * Handles cross-table management and relationship operations
 */

import { supabase } from '@/infrastructure/supabaseClient';
import { ServiceResult, ServiceErrorHandler } from './BaseTokenService';

export interface RelationshipOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data?: any;
  parentField?: string;
  parentId?: string;
  where?: Record<string, any>;
}

export interface RelationshipConfig {
  parentTable: string;
  childTable: string;
  parentIdField: string;
  childParentIdField: string;
  cascadeDelete?: boolean;
  cascadeUpdate?: boolean;
}

export interface TransactionResult {
  success: boolean;
  results: Record<string, any>;
  error?: string;
  rollbackReason?: string;
}

/**
 * Relationship Service for managing cross-table operations
 */
export class RelationshipService {
  
  /**
   * Execute multiple operations within a transaction
   */
  async executeTransaction(operations: RelationshipOperation[]): Promise<TransactionResult> {
    try {
      const results: Record<string, any> = {};
      
      // Start transaction using Supabase
      // Note: Supabase doesn't have explicit transaction support in the client,
      // so we'll simulate it with batch operations and rollback on error
      
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          const operationResult = await this.executeOperation(operation);
          
          if (!operationResult.success) {
            // Rollback previous operations
            await this.rollbackOperations(operations.slice(0, i), results);
            
            return {
              success: false,
              results: {},
              error: operationResult.error,
              rollbackReason: `Operation ${i + 1} failed: ${operationResult.error}`,
            };
          }
          
          results[`operation_${i}`] = operationResult.data;
          
        } catch (error) {
          // Rollback previous operations
          await this.rollbackOperations(operations.slice(0, i), results);
          
          return {
            success: false,
            results: {},
            error: error instanceof Error ? error.message : 'Unknown error',
            rollbackReason: `Operation ${i + 1} threw exception`,
          };
        }
      }
      
      return {
        success: true,
        results,
      };
      
    } catch (error) {
      return {
        success: false,
        results: {},
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  /**
   * Execute a single relationship operation
   */
  private async executeOperation(operation: RelationshipOperation): Promise<ServiceResult<any>> {
    const { table, operation: op, data, parentField, parentId, where } = operation;
    
    try {
      switch (op) {
        case 'insert':
          return await this.insertRecord(table, data, parentField, parentId);
          
        case 'update':
          return await this.updateRecord(table, data, where || {});
          
        case 'delete':
          return await this.deleteRecord(table, where || {});
          
        case 'upsert':
          return await this.upsertRecord(table, data, where || {});
          
        default:
          return {
            success: false,
            error: `Unknown operation: ${op}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: ServiceErrorHandler.handleDatabaseError(error),
      };
    }
  }

  /**
   * Insert a record with optional parent relationship
   */
  private async insertRecord(
    table: string, 
    data: any, 
    parentField?: string, 
    parentId?: string
  ): Promise<ServiceResult<any>> {
    try {
      let insertData = { ...data };
      
      // Add parent relationship if specified
      if (parentField && parentId) {
        insertData[parentField] = parentId;
      }
      
      // Add timestamps
      const now = new Date().toISOString();
      insertData = {
        ...insertData,
        created_at: insertData.created_at || now,
        updated_at: now,
      };
      
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Insert failed',
      };
    }
  }

  /**
   * Update a record
   */
  private async updateRecord(table: string, data: any, where: Record<string, any>): Promise<ServiceResult<any>> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      let query = (supabase as any).from(table).update(updateData);
      
      // Apply where conditions
      for (const [field, value] of Object.entries(where)) {
        query = query.eq(field, value);
      }
      
      const { data: result, error } = await query.select().single();
      
      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Delete a record
   */
  private async deleteRecord(table: string, where: Record<string, any>): Promise<ServiceResult<any>> {
    try {
      let query = (supabase as any).from(table).delete();
      
      // Apply where conditions
      for (const [field, value] of Object.entries(where)) {
        query = query.eq(field, value);
      }
      
      const { data: result, error } = await query.select();
      
      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Upsert a record (insert or update)
   */
  private async upsertRecord(table: string, data: any, conflictFields: Record<string, any>): Promise<ServiceResult<any>> {
    try {
      // Try to find existing record
      let query = (supabase as any).from(table).select('*');
      
      for (const [field, value] of Object.entries(conflictFields)) {
        query = query.eq(field, value);
      }
      
      const { data: existing, error: selectError } = await query.single();
      
      if (selectError && selectError.code !== 'PGRST116') {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(selectError),
        };
      }
      
      if (existing) {
        // Update existing record
        return await this.updateRecord(table, data, conflictFields);
      } else {
        // Insert new record
        return await this.insertRecord(table, { ...data, ...conflictFields });
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upsert failed',
      };
    }
  }

  /**
   * Rollback operations (best effort)
   */
  private async rollbackOperations(
    operations: RelationshipOperation[], 
    results: Record<string, any>
  ): Promise<void> {
    // Attempt to reverse operations in reverse order
    for (let i = operations.length - 1; i >= 0; i--) {
      const operation = operations[i];
      const result = results[`operation_${i}`];
      
      if (!result) continue;
      
      try {
        switch (operation.operation) {
          case 'insert':
            // Try to delete the inserted record
            if (result.id) {
              await (supabase as any).from(operation.table).delete().eq('id', result.id);
            }
            break;
            
          case 'update':
            // Restore original values would require storing them
            // For now, just log the rollback attempt
            console.warn(`Cannot rollback update operation on ${operation.table}`);
            break;
            
          case 'delete':
            // Cannot restore deleted records without backup
            console.warn(`Cannot rollback delete operation on ${operation.table}`);
            break;
            
          case 'upsert':
            // Complex rollback logic needed
            console.warn(`Cannot rollback upsert operation on ${operation.table}`);
            break;
        }
      } catch (rollbackError) {
        console.error(`Rollback failed for operation ${i}:`, rollbackError);
      }
    }
  }

  /**
   * Sync related records for a parent entity
   */
  async syncRelatedRecords(
    config: RelationshipConfig,
    parentId: string,
    newRecords: any[],
    existingRecords: any[] = []
  ): Promise<ServiceResult<{
    created: any[];
    updated: any[];
    deleted: any[];
  }>> {
    try {
      const operations: RelationshipOperation[] = [];
      const created: any[] = [];
      const updated: any[] = [];
      const deleted: any[] = [];

      // Find records to create, update, and delete
      const existingIds = new Set(existingRecords.map(r => r.id));
      const newIds = new Set(newRecords.filter(r => r.id).map(r => r.id));

      // Records to create (no ID or ID not in existing)
      const toCreate = newRecords.filter(r => !r.id || !existingIds.has(r.id));
      
      // Records to update (ID exists in both)
      const toUpdate = newRecords.filter(r => r.id && existingIds.has(r.id));
      
      // Records to delete (existing ID not in new records)
      const toDelete = existingRecords.filter(r => !newIds.has(r.id));

      // Create operations for new records
      for (const record of toCreate) {
        operations.push({
          table: config.childTable,
          operation: 'insert',
          data: record,
          parentField: config.childParentIdField,
          parentId: parentId,
        });
      }

      // Create operations for updated records
      for (const record of toUpdate) {
        operations.push({
          table: config.childTable,
          operation: 'update',
          data: record,
          where: { id: record.id },
        });
      }

      // Create operations for deleted records (if cascade delete is enabled)
      if (config.cascadeDelete) {
        for (const record of toDelete) {
          operations.push({
            table: config.childTable,
            operation: 'delete',
            where: { id: record.id },
          });
        }
      }

      // Execute all operations
      const transactionResult = await this.executeTransaction(operations);
      
      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error,
        };
      }

      // Parse results
      let operationIndex = 0;
      
      // Process created records
      for (let i = 0; i < toCreate.length; i++) {
        const result = transactionResult.results[`operation_${operationIndex++}`];
        if (result) created.push(result);
      }
      
      // Process updated records
      for (let i = 0; i < toUpdate.length; i++) {
        const result = transactionResult.results[`operation_${operationIndex++}`];
        if (result) updated.push(result);
      }
      
      // Process deleted records
      if (config.cascadeDelete) {
        for (let i = 0; i < toDelete.length; i++) {
          const result = transactionResult.results[`operation_${operationIndex++}`];
          if (result) deleted.push(...(Array.isArray(result) ? result : [result]));
        }
      }

      return {
        success: true,
        data: {
          created,
          updated,
          deleted,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  /**
   * Get all related records for a parent
   */
  async getRelatedRecords(
    config: RelationshipConfig,
    parentId: string
  ): Promise<ServiceResult<any[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from(config.childTable)
        .select('*')
        .eq(config.childParentIdField, parentId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get related records',
      };
    }
  }

  /**
   * Delete all related records for a parent
   */
  async deleteRelatedRecords(
    config: RelationshipConfig,
    parentId: string
  ): Promise<ServiceResult<number>> {
    try {
      const { data, error } = await (supabase as any)
        .from(config.childTable)
        .delete()
        .eq(config.childParentIdField, parentId)
        .select();

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: data?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete related records',
      };
    }
  }

  /**
   * Batch operations helper
   */
  async batchInsert(table: string, records: any[]): Promise<ServiceResult<any[]>> {
    try {
      const now = new Date().toISOString();
      const recordsWithTimestamps = records.map(record => ({
        ...record,
        created_at: record.created_at || now,
        updated_at: now,
      }));

      const { data, error } = await (supabase as any)
        .from(table)
        .insert(recordsWithTimestamps)
        .select();

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch insert failed',
      };
    }
  }

  /**
   * Get relationship statistics
   */
  async getRelationshipStats(
    config: RelationshipConfig,
    parentId: string
  ): Promise<ServiceResult<{
    total: number;
    recentlyCreated: number;
    recentlyUpdated: number;
  }>> {
    try {
      const { data, error } = await (supabase as any)
        .from(config.childTable)
        .select('created_at, updated_at')
        .eq(config.childParentIdField, parentId);

      if (error) {
        return {
          success: false,
          error: ServiceErrorHandler.handleDatabaseError(error),
        };
      }

      const total = data.length;
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      let recentlyCreated = 0;
      let recentlyUpdated = 0;

      for (const record of data) {
        if (new Date(record.created_at) > oneDayAgo) {
          recentlyCreated++;
        }
        if (record.updated_at && new Date(record.updated_at) > oneDayAgo) {
          recentlyUpdated++;
        }
      }

      return {
        success: true,
        data: {
          total,
          recentlyCreated,
          recentlyUpdated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get relationship stats',
      };
    }
  }
}

/**
 * Predefined relationship configurations for token standards
 */
export const TOKEN_RELATIONSHIPS = {
  // ERC20 relationships
  ERC20_PROPERTIES: {
    parentTable: 'tokens',
    childTable: 'token_erc20_properties',
    parentIdField: 'id',
    childParentIdField: 'token_id',
    cascadeDelete: true,
    cascadeUpdate: true,
  } as RelationshipConfig,

  // ERC721 relationships
  ERC721_PROPERTIES: {
    parentTable: 'tokens',
    childTable: 'token_erc721_properties',
    parentIdField: 'id',
    childParentIdField: 'token_id',
    cascadeDelete: true,
    cascadeUpdate: true,
  } as RelationshipConfig,

  ERC721_ATTRIBUTES: {
    parentTable: 'tokens',
    childTable: 'token_erc721_attributes',
    parentIdField: 'id',
    childParentIdField: 'token_id',
    cascadeDelete: true,
    cascadeUpdate: false,
  } as RelationshipConfig,

  // ERC1155 relationships
  ERC1155_PROPERTIES: {
    parentTable: 'tokens',
    childTable: 'token_erc1155_properties',
    parentIdField: 'id',
    childParentIdField: 'token_id',
    cascadeDelete: true,
    cascadeUpdate: true,
  } as RelationshipConfig,

  ERC1155_TYPES: {
    parentTable: 'tokens',
    childTable: 'token_erc1155_types',
    parentIdField: 'id',
    childParentIdField: 'token_id',
    cascadeDelete: true,
    cascadeUpdate: false,
  } as RelationshipConfig,

  // Add more relationship configurations as needed...
} as const;
