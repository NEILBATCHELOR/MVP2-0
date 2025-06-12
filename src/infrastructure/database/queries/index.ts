// Database queries
export * from './userQueries';
export * from './projectQueries';
export * from './tokenQueries';
export * from './complianceQueries';
export * from './auditQueries';

// Common query helpers
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

// Generic query builder
export const buildQuery = (
  baseQuery: any,
  options: QueryOptions = {},
  filters: FilterOptions = {}
) => {
  let query = baseQuery;

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, { 
      ascending: options.orderDirection !== 'desc' 
    });
  }

  // Apply pagination
  if (options.limit) {
    const start = options.offset || 0;
    const end = start + options.limit - 1;
    query = query.range(start, end);
  }

  return query;
};
