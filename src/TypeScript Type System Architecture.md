Avoid   
1\. Type Definition Mismatches,  
2\. Import Path Issues,  
3\. Property Type Conflicts,  
4\. Missing Required Properties,  
5\. Case Convention Inconsistencies,  
6\. Fragmented type definitions spread across multiple files,  
7\. Take a consistent and organised approach that avoides duplication,  
8\. Inconsistent type hierarchies and inheritance,  
9\. Misaligned type definitions between the core types and domain-specific types. 

Formulate  a plan to solve all errors without creating more errors.  
Consider refactoring once all files are reviewed. 

\# TypeScript Type System Architecture

This document provides the comprehensive rules and best practices for our type system architecture, ensuring consistency, maintainability, and type safety across the codebase.

\#\# Type System Architecture

Our type system follows a structured hierarchy that organizes types by purpose and domain.

Contains the foundational type system that forms the backbone of the application's type safety.

\- \*\*centralModels.ts\*\*: Defines application-level business interfaces, providing normalized versions of database types. Contains base model interfaces, entity interfaces, business logic enums, and UI-specific interfaces. \[src/types/centralModels.ts\]

\- \*\*database.ts\*\*: Extends and re-exports types from \`supabase.ts\`. Provides convenient type aliases for database tables and views, adds custom database-related types not in Supabase schema. \[src/types/database.ts\]

\- \*\*supabase.ts\*\*: Generated from Supabase database schema. Contains complete database type definitions for tables, views, functions, enums, row types for insert/update operations, and relationship definitions. Should not be modified manually. \[src/types/supabase.ts\]

\- \*\*typeGuards.ts\*\*: Provides type guard functions for runtime type checking, which helps TypeScript narrow types correctly. Validates API response data and ensures type safety with unknown data. \[src/utils/typeGuards.ts\]

\- \*\*typeMappers.ts\*\*: Maps between database and business model types. Handles snake\_case to camelCase conversion, date formatting, nested object transformation, and data normalization \[src/utils/typeMappers.ts\]

\#\# Naming Conventions

Follow these strict naming conventions to ensure consistency:

1\. \*\*Database Types\*\* (snake\_case)  
   \- Table types: \`user\_table\`, \`investor\_table\`  
   \- Field names: \`first\_name\`, \`last\_login\_at\`  
   \- Enum values: \`KYC\_PENDING\`, \`PAYMENT\_COMPLETED\`

2\. \*\*Domain Types\*\* (camelCase)  
   \- Interface names: \`User\`, \`InvestorProfile\`  
   \- Property names: \`firstName\`, \`lastLoginAt\`  
   \- Method names: \`getUserById\`, \`updateProfile\`

3\. \*\*Type Mappers\*\*  
   \- Database to domain: \`mapUserDbToDomain\`, \`mapInvestorToCamelCase\`  
   \- Domain to database: \`mapUserDomainToDb\`, \`mapInvestorToSnakeCase\`

4\. \*\*Type Guards\*\*  
   \- Use format: \`isUser\`, \`isValidInvestor\`, \`hasPermission\`

\#\# Import Rules

Always follow these import rules to maintain consistency:

\`\`\`typescript  
// ✓ CORRECT: Use path aliases with @/ prefix  
import { User } from '@/types/domain/user';  
import { ProjectTable } from '@/types/core/database';  
import { mapUserToCamelCase } from '@/types/core/typeMappers';

// ✓ CORRECT: Use type imports when appropriate  
import type { Investor } from '@/types/domain/investor';

// ✗ WRONG: Using relative paths  
import { User } from '../../types/user';

// ✗ WRONG: Importing from old locations  
import { User } from '@/types/centralModels';

// ✗ WRONG: Importing from implementation files  
import { User } from '@/lib/users';  
\`\`\`

\#\# Type Flow Guidelines

\#\#\# 1\. Database Operations

When working with database operations:

\`\`\`typescript  
// Import table types for queries  
import { UserTable, UserInsert, UserUpdate } from '@/types/core/database';

// For database operations  
async function createUser(userData: UserInsert): Promise\<UserTable\> {  
  const { data, error } \= await supabase  
    .from('users')  
    .insert(userData)  
    .select()  
    .single();  
      
  if (error) throw error;  
  return data;  
}  
\`\`\`

\#\#\# 2\. Domain Types Usage

When working with domain types in components:

\`\`\`typescript  
// Import domain types for business logic and UI  
import { User, UserStatus } from '@/types/domain/user';  
import { mapUserToCamelCase } from '@/types/domain/user';

// Component that uses the domain type  
function UserProfile({ user }: { user: User }) {  
  return (  
    \<div\>  
      \<h1\>{user.name}\</h1\>  
      \<p\>Status: {user.status}\</p\>  
    \</div\>  
  );  
}  
\`\`\`

\#\#\# 3\. Type Conversion

Use the correct mapper functions:

\`\`\`typescript  
// Convert database (snake\_case) to domain (camelCase)  
import { mapUserToCamelCase } from '@/types/domain/user';  
import { UserTable } from '@/types/core/database';

async function fetchUser(id: string) {  
  const { data } \= await supabase.from('users').select().eq('id', id).single();  
  return mapUserToCamelCase(data as UserTable);  
}

// Convert domain (camelCase) to database (snake\_case)  
import { mapUserToSnakeCase } from '@/types/domain/user';

function saveUser(user: User) {  
  const dbUser \= mapUserToSnakeCase(user);  
  return supabase.from('users').update(dbUser).eq('id', user.id);  
}  
\`\`\`

\#\#\# 4\. Enum Usage

Use string literal comparison functions when working with enums:

\`\`\`typescript  
// Import enum and comparison function  
import {   
  UserStatus,   
  compareUserStatus   
} from '@/types/domain/user';

// Use comparison function  
if (compareUserStatus(user.status, 'active')) {  
  // User is active  
}

// WRONG: Direct string comparison  
if (user.status \=== 'active') { // Type error\!  
  // ...  
}  
\`\`\`

\#\# Common Anti-Patterns to Avoid

1\. \*\*Type Definition Mismatches\*\*  
   \- ✗ Defining the same type in multiple files  
   \- ✓ Define once and import where needed

2\. \*\*Import Path Issues\*\*  
   \- ✗ Using relative paths or inconsistent aliases  
   \- ✓ Always use \`@/types/...\` path aliases

3\. \*\*Property Type Conflicts\*\*  
   \- ✗ Inconsistent property types between related interfaces  
   \- ✓ Maintain consistent property types across the type hierarchy

4\. \*\*Missing Required Properties\*\*  
   \- ✗ Omitting required properties from derived interfaces  
   \- ✓ Ensure all required properties are defined or inherited

5\. \*\*Case Convention Inconsistencies\*\*  
   \- ✗ Mixing snake\_case and camelCase in the same interface  
   \- ✓ Use snake\_case for database, camelCase for domain/UI

6\. \*\*Fragmented Type Definitions\*\*  
   \- ✗ Spreading related types across multiple files  
   \- ✓ Keep related types in the same domain file

7\. \*\*Type Duplication\*\*  
   \- ✗ Copying types instead of importing  
   \- ✓ Import existing types and extend as needed

8\. \*\*Inconsistent Type Hierarchies\*\*  
   \- ✗ Inconsistent inheritance patterns  
   \- ✓ Follow consistent extension patterns

9\. \*\*Misaligned Type Definitions\*\*  
   \- ✗ Mismatches between core and domain-specific types  
   \- ✓ Ensure proper alignment using mapper functions

\#\# Adding New Types

Follow this sequence when adding new types:

1\. If related to database, first add to \`database.ts\`  
2\. Add business model interfaces to \`centralModels.ts\`  
4\. Add mapper functions for conversion between formats   
5\. Add type guards if needed

\#\# Testing Type Conversions

Always test type conversions to ensure correctness:

\`\`\`typescript  
// Example test for type mapper  
it('should correctly map user from DB to domain', () \=\> {  
  const dbUser \= {  
    id: '123',  
    first\_name: 'John',  
    last\_name: 'Doe',  
    role: 'ADMIN',  
    created\_at: '2023-01-01T00:00:00Z'  
  };  
    
  const domainUser \= mapUserToCamelCase(dbUser);  
    
  expect(domainUser).toEqual({  
    id: '123',  
    firstName: 'John',  
    lastName: 'Doe',  
    role: 'ADMIN',  
    createdAt: '2023-01-01T00:00:00Z'  
  });  
});  
\`\`\`

\#\# Troubleshooting Common Issues

| Error | Likely Cause | Solution |  
|-------|--------------|----------|  
| Property does not exist | Using snake\_case with camelCase or vice versa | Use appropriate mapper function |  
| Type not assignable | Enum value vs string literal | Use comparison function |  
| Module not found | Incorrect import path | Check path alias and file name |  
| Duplicate identifier | Type defined in multiple places | Import from a single source |  
| Type has no properties in common | Complete type mismatch | Use correct type definition |

\#\# Migrating Legacy Code

When working with legacy code:

1\. First identify type usage patterns  
2\. Create appropriate domain types if missing  
3\. Add mapper functions for conversion  
4\. Update imports to use domain types  
5\. Use type guards for runtime safety

By following these guidelines, you'll maintain a consistent, type-safe codebase that leverages the full power of TypeScript's type system.

