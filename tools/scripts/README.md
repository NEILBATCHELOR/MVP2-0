# Scripts Directory

This directory contains utility scripts for administrative tasks, database maintenance, and codebase management. These scripts are typically run directly with Node.js rather than being imported into the application.

## Key Files

### normalizeRoles.js

A script for normalizing role names in the database to ensure consistency between different role naming conventions.

#### Features:
- Scans the database for all role names in the users table
- Maps these to standardized role names in the roles table
- Generates SQL scripts to update the database
- Provides JavaScript code to perform the updates programmatically

#### Usage:
```bash
node src/scripts/normalizeRoles.js
```

#### Key Functions:
- `normalizeRoleName(roleName)`: Standardizes role name format
- `findBestRoleMatch(userRole, standardRoles)`: Matches user roles to standard roles
- `generateRoleMapping()`: Creates a mapping between user roles and standard roles

### updatePermissions.js

A script to identify and update permission references throughout the codebase as part of a permissions system refactoring.

#### Features:
- Scans the codebase for permission-related patterns
- Identifies files that need to be updated
- Provides suggestions for updating permissions
- Generates a list of files requiring changes

#### Usage:
```bash
node src/scripts/updatePermissions.js
```

#### Key Functions:
- `searchFilesForPattern(dir, pattern)`: Searches files for specific patterns
- `main()`: Coordinates the search and generates reports

#### Patterns Searched:
- Direct references to the permissions table
- Permission check patterns
- Resource/action permission syntax

## Common Usage Patterns

These scripts are typically used for:

1. **Database Migrations**: Updating data structures or normalizing data
2. **Codebase Refactoring**: Finding and updating patterns across multiple files
3. **Maintenance Tasks**: Cleaning up inconsistent data or fixing common issues
4. **Development Utilities**: Generating reports or insights about the codebase

## Dependencies

These scripts depend on:
- Node.js standard libraries (fs, path)
- Child process execution (for running system commands)
- Environment variables for database connections
- Supabase client for database access

## Best Practices

1. Always add clear comments explaining the purpose of each script
2. Include usage instructions at the top of each file
3. Use descriptive function and variable names
4. Add error handling and logging
5. Test scripts on a development environment before running in production
6. Back up data before running scripts that modify the database