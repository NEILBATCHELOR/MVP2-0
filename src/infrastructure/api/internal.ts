// Internal API services
import { supabase } from '@/infrastructure/database/client';

export interface InternalApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  count?: number;
}

export async function queryDatabase<T>(
  tableName: string,
  filters: Record<string, any> = {},
  options: {
    select?: string;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  } = {}
): Promise<InternalApiResponse<T[]>> {
  try {
    // Type assertion to work around strict table name typing
    let query = (supabase as any).from(tableName);

    // Add select
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Add ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      });
    }

    // Add pagination
    if (options.limit) {
      const start = options.offset || 0;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as T[],
      count: count || data?.length || 0
    };
  } catch (error: any) {
    console.error('Database query error:', error);
    return {
      success: false,
      error: error.message || 'Database query failed'
    };
  }
}

export async function insertRecord<T>(
  tableName: string,
  record: Record<string, any>
): Promise<InternalApiResponse<T>> {
  try {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as T
    };
  } catch (error: any) {
    console.error('Database insert error:', error);
    return {
      success: false,
      error: error.message || 'Database insert failed'
    };
  }
}

export async function updateRecord<T>(
  tableName: string,
  filters: Record<string, any>,
  updates: Record<string, any>
): Promise<InternalApiResponse<T>> {
  try {
    let query = (supabase as any).from(tableName).update(updates);

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.select().single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data as T
    };
  } catch (error: any) {
    console.error('Database update error:', error);
    return {
      success: false,
      error: error.message || 'Database update failed'
    };
  }
}

export async function deleteRecord(
  tableName: string,
  filters: Record<string, any>
): Promise<InternalApiResponse<void>> {
  try {
    let query = (supabase as any).from(tableName).delete();

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      throw error;
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Database delete error:', error);
    return {
      success: false,
      error: error.message || 'Database delete failed'
    };
  }
}
