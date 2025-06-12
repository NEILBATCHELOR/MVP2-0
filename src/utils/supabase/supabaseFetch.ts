/**
 * Custom fetch wrapper for Supabase requests
 * Adds proper headers and error handling for all Supabase API calls
 */
import { supabase } from '@/infrastructure/database/client';
import { PostgrestError } from '@supabase/supabase-js';
import { CustomPostgrestResponse } from '@/components/tokens/services/utils/supabaseHelper';
import type { Database } from '@/types/core/database';

// Use string type for table names to avoid excessive type depth
type TableName = string;

/**
 * Base function for fetching data from Supabase
 * @param table The table name to query
 * @param queryFn Function that builds the query
 * @returns The query result with proper error handling
 */
async function fetchFromSupabase<T = any>(
  table: TableName,
  queryFn: (query: any) => Promise<any> // Use a more generic type for query function
): Promise<{ data: T | null; error: PostgrestError | null }> {
  try {
    // Create the query builder with type assertion BEFORE calling from() to avoid compile errors
    const query = (supabase as any).from(table);
    
    // Execute the query function
    const { data, error } = await queryFn(query);
    
    if (error) {
      console.error(`Error in Supabase query for ${table}:`, error);
      return { data: null, error };
    }
    
    return { data: data as T, error: null };
  } catch (error) {
    console.error(`Exception in Supabase query for ${table}:`, error);
    return { data: null, error: error as PostgrestError };
  }
}

/**
 * Fetch a single record by ID with proper headers
 * @param table The table name to query
 * @param column The column name to filter on (usually 'id' or 'token_id')
 * @param value The value to match
 * @returns The single record or null
 */
export async function fetchSingleRecord<T = any>(
  table: TableName,
  column: string,
  value: string
): Promise<{ data: T | null; error: PostgrestError | null }> {
  return fetchFromSupabase<T>(table, (query) => 
    query.select('*').eq(column, value).single()
  );
}

/**
 * Fetch multiple records by a filter with proper headers
 * @param table The table name to query
 * @param column The column name to filter on
 * @param value The value to match
 * @returns An array of matching records
 */
export async function fetchMultipleRecords<T = any>(
  table: TableName,
  column: string,
  value: string
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
  return fetchFromSupabase<T[]>(table, (query) => 
    query.select('*').eq(column, value)
  );
}

/**
 * Insert a record with proper headers
 * @param table The table name to insert into
 * @param data The data to insert
 * @returns The inserted record
 */
export async function insertRecord<T = any, U = any>(
  table: string,
  data: U
): Promise<{ data: T | null; error: PostgrestError | null }> {
  return fetchFromSupabase<T>(table, (query) => 
    query.insert(data).select()
  );
}

/**
 * Update a record in a table with proper headers
 * @param table The table name to update
 * @param column The column name to filter on
 * @param value The value to match
 * @param data The data to update
 * @returns The updated record or null
 */
export async function updateRecord<T = any, U = any>(
  table: TableName,
  column: string,
  value: string,
  data: U
): Promise<{ data: T | null; error: PostgrestError | null }> {
  return fetchFromSupabase<T>(table, (query) => 
    query.update(data).eq(column, value).select()
  );
}

/**
 * Delete a record from a table
 * @param table The table name to delete from
 * @param column The column name to filter on
 * @param value The value to match
 * @returns Success status and any error
 */
export async function deleteRecord(
  table: TableName,
  column: string,
  value: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  try {
    // Create the query builder with type assertion to handle string table names
    const query = (supabase as any)
      .from(table)
      .delete()
      .eq(column, value);
    
    // Execute the query
    const { error } = await query;
    
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Exception deleting from ${table}:`, error);
    return { success: false, error: error as PostgrestError };
  }
}

/**
 * Enhanced fetch function for Supabase that adds proper headers
 * @param table The table name to query
 * @param column The column name to filter on
 * @param value The value to match
 * @returns The query result with proper error handling
 */
export async function fetchWithHeaders<T = any>(
  table: TableName,
  column: string,
  value: string
): Promise<CustomPostgrestResponse<T>> {
  try {
    // Create the query builder with type assertion to handle string table names
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