# Performance Optimizations for Timeout Issues

This document outlines the optimizations implemented to resolve timeout errors across the application. These timeouts were occurring during database operations, particularly in components that interact with project data.

## Root Causes of Timeouts

1. **Complex Queries**: Queries that were fetching more data than necessary
2. **Multiple Sequential Queries**: Components making several database calls in sequence
3. **No Caching Strategy**: Every page load triggered fresh database queries
4. **Lack of Fallback Mechanisms**: When a query timed out, the application had no recovery path

## Implemented Optimizations

### 1. ProjectsList Component

- **Batch Queries**: Replaced multiple individual queries with a single batch query
- **Selective Updates**: Only sending fields that have actually changed during updates
- **Database Functions**: Created stored procedures for atomic operations:
  - `delete_project_cascade`: Deletes a project and related data in a single transaction
  - `create_project_with_cap_table`: Creates a project with its cap table atomically
- **Simpler Queries**: Removed unnecessary `.select()` operations that were causing performance issues

### 2. ProjectSelector Component

- **Client-Side Caching**: Added sessionStorage caching with 5-minute TTL
- **Background Refreshes**: Data refreshes happen in the background while showing cached data
- **Optimized Queries**: Reduced query complexity and selected only essential fields
- **Extracted Logic**: Moved project selection logic into a separate function for better maintainability

### 3. Sidebar Component

- **User Info Caching**: Added sessionStorage caching with 30-minute TTL for user information
- **Simplified Queries**: Using `maybeSingle()` instead of `single()` to avoid errors on empty results
- **Background Refreshes**: User data refreshes happen in the background to keep cache fresh

### 4. TokenBuilder Component

- **Project Data Caching**: Added sessionStorage caching with 10-minute TTL
- **Simplified Queries**: Removed unnecessary ordering and optimized selectors
- **Fallback Mechanisms**: Added explicit fallback to fetch any project if primary isn't found
- **Background Cache Refreshes**: Cache refreshes happen in the background

## Database Optimizations

### 1. Stored Procedures

Created two key database functions to handle complex operations server-side:

#### `delete_project_cascade`

```sql
CREATE OR REPLACE FUNCTION delete_project_cascade(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
BEGIN
  -- Delete within a transaction for atomic operations
  BEGIN
    -- Cascade deletes for all related data
    -- ...
  END;
END;
$$;
```

#### `create_project_with_cap_table`

```sql
CREATE OR REPLACE FUNCTION create_project_with_cap_table(
  project_data JSONB,
  cap_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
DECLARE
  created_project JSONB;
  project_id UUID;
BEGIN
  -- Create project and its cap table in a single transaction
  -- ...
END;
$$;
```

## General Strategies Applied

1. **Cache First, Fetch Later**: Always check cache before making database calls
2. **Background Refreshes**: Update cache in the background without blocking UI
3. **Minimal Query Payloads**: Only fetch the fields actually needed by the component
4. **Atomic Operations**: Use transactions for multi-step operations
5. **Resilient Error Handling**: Provide fallback options when operations fail
6. **Separation of Concerns**: Extract query logic from component logic

## Monitoring and Maintenance

To maintain these optimizations:

1. **Watch for New Timeout Errors**: Address them using the same patterns
2. **Review Cache Invalidation**: Ensure caches are properly invalidated when data changes
3. **Monitor Database Performance**: Use Supabase monitoring to identify slow queries

## Implementation Notes

These optimizations should significantly reduce the occurrence of timeout errors. The caching strategy uses TTLs appropriate to the data volatility, and background refreshes ensure the cache stays relatively fresh without impacting user experience. 