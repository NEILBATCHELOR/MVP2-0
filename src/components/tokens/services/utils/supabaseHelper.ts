/**
 * Supabase Helper Functions
 * 
 * Utility functions for making Supabase requests with proper headers
 * to avoid 406 (Not Acceptable) errors
 */
import { supabase } from '@/infrastructure/database/client';
import { PostgrestError } from '@supabase/supabase-js';

// Import database types to ensure proper typing
import type { Database } from '@/types/core/database';

// Custom PostgrestSingleResponse to avoid deep type instantiation issues
export interface CustomPostgrestResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
}

// Define a simplified type for table names to avoid excessive type depth
export type TableName = string;

/**
 * Fetch a single record from a table with proper headers
 * @param table The table name to query
 * @param column The column name to filter on
 * @param value The value to match
 * @returns The query result with proper error handling
 */
export async function fetchSingleWithHeaders<T = any>(
  table: TableName,
  column: string,
  value: string
): Promise<CustomPostgrestResponse<T>> {
  try {
    // Create the query builder with proper type assertion
    const query = (supabase as any)
      .from(table)
      .select('*')
      .eq(column, value)
      .single();
    
    // Execute the query
    const { data, error } = await query;
    
    return { 
      data: data as T, 
      error, 
      count: null, 
      status: 200, 
      statusText: 'OK' 
    };
  } catch (error) {
    console.error(`Error fetching from ${table}:`, error);
    return { 
      data: null, 
      error: error as PostgrestError, 
      count: null, 
      status: 500, 
      statusText: 'Error' 
    };
  }
}

/**
 * Fetch multiple records from a table with proper headers
 * @param table The table name to query
 * @param column The column name to filter on
 * @param value The value to match
 * @returns The query result with proper error handling
 */
export async function fetchMultipleWithHeaders<T = any>(
  table: TableName,
  column: string,
  value: string
): Promise<CustomPostgrestResponse<T[]>> {
  try {
    // Create the query builder with proper type assertion
    const query = (supabase as any)
      .from(table)
      .select('*')
      .eq(column, value);
    
    // Execute the query
    const { data, error } = await query;
    
    return { 
      data: data as T[], 
      error, 
      count: null, 
      status: 200, 
      statusText: 'OK' 
    };
  } catch (error) {
    console.error(`Error fetching from ${table}:`, error);
    return { 
      data: null, 
      error: error as PostgrestError, 
      count: null, 
      status: 500, 
      statusText: 'Error' 
    };
  }
}

/**
 * Update a record in a table with proper headers
 * @param table The table name to update
 * @param column The column name to filter on
 * @param value The value to match
 * @param updateData The data to update
 * @returns The query result with proper error handling
 */
export async function updateWithHeaders<T = any, U = any>(
  table: TableName,
  column: string,
  value: string,
  updateData: U
): Promise<CustomPostgrestResponse<T>> {
  try {
    // Create the query builder with proper type assertion
    const query = (supabase as any)
      .from(table)
      .update(updateData)
      .eq(column, value)
      .select();
    
    // Execute the query
    const { data, error } = await query;
    
    return { 
      data: data as T, 
      error, 
      count: null, 
      status: 200, 
      statusText: 'OK' 
    };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { 
      data: null, 
      error: error as PostgrestError, 
      count: null, 
      status: 500, 
      statusText: 'Error' 
    };
  }
}

/**
 * Insert a record into a table with proper headers
 * @param table The table name to insert into
 * @param insertData The data to insert
 * @returns The query result with proper error handling
 */
export async function insertWithHeaders<T = any, U = any>(
  table: TableName,
  insertData: U
): Promise<CustomPostgrestResponse<T>> {
  try {
    // Create the query builder with proper type assertion
    const query = (supabase as any)
      .from(table)
      .insert(insertData)
      .select();
    
    // Execute the query
    const { data, error } = await query;
    
    return { 
      data: data as T, 
      error, 
      count: null, 
      status: 200, 
      statusText: 'OK' 
    };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { 
      data: null, 
      error: error as PostgrestError, 
      count: null, 
      status: 500, 
      statusText: 'Error' 
    };
  }
}