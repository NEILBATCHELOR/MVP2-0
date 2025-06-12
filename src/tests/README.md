# Tests Directory

This directory contains test scripts and utilities for verifying application functionality. These tests focus on functional verification of specific features rather than unit tests, which would typically be in a separate directory structure.

## Key Files

### testPermissions.ts

A test script that verifies the functionality of the permissions system by testing database functions and queries.

#### Features:
- Tests the `get_users_with_permission` database function
- Verifies direct queries to the `role_permissions` table
- Tests user role associations
- Validates the `check_user_permission` function

#### Running the Test:
```bash
npm run ts-node src/tests/testPermissions.ts
```

#### Test Coverage:
1. Finding users with specific permissions
2. Verifying role-permission relationships
3. Confirming user-role assignments
4. Testing permission checking functionality

## Test Approach

The tests in this directory focus on:

1. **Functional Testing**: Verifying that key features work as expected
2. **Database Interaction**: Testing database functions and queries
3. **API Verification**: Ensuring API endpoints return expected results
4. **Integration Testing**: Testing interactions between different system components

## Best Practices

1. **Clear Output**: Tests should provide clear, readable output
2. **Error Handling**: Tests should properly catch and report errors
3. **Independence**: Tests should be able to run independently
4. **Cleanup**: Tests should clean up any data they create
5. **Documentation**: Tests should document what they're testing and why

## Running Tests

Individual tests can be run using the `ts-node` command as shown in the examples above. This allows for quick verification of specific functionality during development.

## Test Dependencies

The tests depend on:
- Access to the Supabase database
- Proper environment configuration
- TypeScript support via ts-node
- Application code being in a working state