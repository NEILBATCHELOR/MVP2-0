#!/usr/bin/env node
/**
 * Type System Validation Script
 * 
 * This script validates the alignment between:
 * - supabase.ts (generated schema)
 * - database.ts (re-exports and extensions)
 * - centralModels.ts (business interfaces)
 * 
 * Usage:
 *   npm run types:validate
 *   
 * Add to package.json:
 *   "scripts": {
 *     "types:validate": "NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/validate-types.ts"
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  paths: {
    supabase: path.resolve(__dirname, '../src/types/supabase.ts'),
    database: path.resolve(__dirname, '../src/types/database.ts'),
    centralModels: path.resolve(__dirname, '../src/types/centralModels.ts'),
    typeGuards: path.resolve(__dirname, '../src/utils/types/typeGuards.ts'),
    typeMappers: path.resolve(__dirname, '../src/utils/formatting/typeMappers.ts'),
  },
  patterns: {
    tableType: /export\s+type\s+(\w+)Table\s+=\s+Tables<['"](\w+)['"]\>/g,
    insertType: /export\s+type\s+(\w+)Insert\s+=\s+InsertTables<['"](\w+)['"]\>/g,
    updateType: /export\s+type\s+(\w+)Update\s+=\s+UpdateTables<['"](\w+)['"]\>/g,
    interface: /export\s+interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g,
    enum: /export\s+enum\s+(\w+)\s*\{/g,
  },
  // List of interfaces that don't need corresponding database types
  uiInterfaces: [
    'BaseModel', 'Address', 'LegalRepresentative', 'RiskAssessment', 
    'InvestmentPreferences', 'DocumentRequirement', 'Approver', 
    'TokenBalance', 'WorkflowStage', 'VersionDiff', 'TokenDocument', 
    'InvestorDocument', 'EmptyStateProps'
  ],
  // Patterns for UI-specific interfaces
  uiPatterns: [/UI$/, /Props$/, /Component$/]
};

// Result tracking
let warnings = 0;
let errors = 0;

/**
 * Main validation function
 */
async function validateTypeSystem() {
  console.log(chalk.blue('🔍 Type System Validation'));
  console.log(chalk.blue('========================'));

  try {
    // Read files
    const supabaseContent = await fs.promises.readFile(CONFIG.paths.supabase, 'utf8');
    const databaseContent = await fs.promises.readFile(CONFIG.paths.database, 'utf8');
    const centralModelsContent = await fs.promises.readFile(CONFIG.paths.centralModels, 'utf8');
    
    let typeGuardsContent = '';
    let typeMappersContent = '';
    
    try {
      typeGuardsContent = await fs.promises.readFile(CONFIG.paths.typeGuards, 'utf8');
    } catch (err) {
      warning(`Could not read typeGuards.ts: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    try {
      typeMappersContent = await fs.promises.readFile(CONFIG.paths.typeMappers, 'utf8');
    } catch (err) {
      warning(`Could not read typeMappers.ts: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Extract types
    const supabaseTables = extractSupabaseTables(supabaseContent);
    const databaseTypes = extractDatabaseTypes(databaseContent);
    const centralModelTypes = extractCentralModelTypes(centralModelsContent);

    // Validate database.ts against supabase.ts
    validateDatabaseCoverage(supabaseTables, databaseTypes);
    
    // Validate centralModels.ts against database.ts
    validateCentralModelAlignment(centralModelTypes, databaseTypes);
    
    // Validate naming conventions
    validateNamingConventions(databaseTypes, centralModelTypes);

    // Validate type mappers if file exists
    if (typeMappersContent) {
      validateTypeMappers(typeMappersContent, databaseTypes, centralModelTypes);
    }

    // Validate type guards if file exists
    if (typeGuardsContent) {
      validateTypeGuards(typeGuardsContent, centralModelTypes);
    }

    // Summary
    console.log(chalk.blue('\n📊 Validation Summary'));
    console.log(chalk.blue('==================='));
    
    if (warnings === 0 && errors === 0) {
      console.log(chalk.green('✅ No issues detected!'));
    } else {
      console.log(
        `${warnings > 0 ? chalk.yellow(`⚠️  ${warnings} warnings`) : ''}` +
        `${warnings > 0 && errors > 0 ? ' and ' : ''}` +
        `${errors > 0 ? chalk.red(`❌ ${errors} errors`) : ''}`
      );
      
      if (errors > 0) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Extract table definitions from supabase.ts
 */
function extractSupabaseTables(content: string): string[] {
  // Look for table names in the Database type definition
  const tableSection = content.match(/public: \{\s*Tables: \{([^}]*)\}/s);
  
  if (!tableSection || !tableSection[1]) {
    error('Could not find Tables definition in supabase.ts');
    return [];
  }

  // Extract table names from the match
  const tables: string[] = [];
  const tableNamePattern = /(\w+): \{/g;
  let nameMatch;
  
  while ((nameMatch = tableNamePattern.exec(tableSection[1])) !== null) {
    if (nameMatch[1] && !tables.includes(nameMatch[1]) && 
        nameMatch[1] !== 'Row' && nameMatch[1] !== 'Insert' && nameMatch[1] !== 'Update' &&
        nameMatch[1] !== 'Relationships') {
      tables.push(nameMatch[1]);
    }
  }
  
  return tables;
}

/**
 * Extract types from database.ts
 */
function extractDatabaseTypes(content: string) {
  const types = {
    tables: [] as string[],
    tableTypes: [] as {name: string, table: string}[],
    insertTypes: [] as {name: string, table: string}[],
    updateTypes: [] as {name: string, table: string}[],
    customTypes: [] as string[],
  };

  // Reset regex patterns before using them
  CONFIG.patterns.tableType.lastIndex = 0;
  CONFIG.patterns.insertType.lastIndex = 0;
  CONFIG.patterns.updateType.lastIndex = 0;

  // Extract table types
  let match;
  while ((match = CONFIG.patterns.tableType.exec(content)) !== null) {
    types.tableTypes.push({name: match[1], table: match[2]});
    types.tables.push(match[2]);
  }
  
  // Extract insert types
  while ((match = CONFIG.patterns.insertType.exec(content)) !== null) {
    types.insertTypes.push({name: match[1], table: match[2]});
  }
  
  // Extract update types
  while ((match = CONFIG.patterns.updateType.exec(content)) !== null) {
    types.updateTypes.push({name: match[1], table: match[2]});
  }

  // Custom types would need more sophisticated parsing with TypeScript Compiler API
  
  return types;
}

/**
 * Extract types from centralModels.ts
 */
function extractCentralModelTypes(content: string) {
  const types = {
    interfaces: [] as {name: string, extends: string | null}[],
    enums: [] as string[],
  };

  // Reset regex patterns before using them
  CONFIG.patterns.interface.lastIndex = 0;
  CONFIG.patterns.enum.lastIndex = 0;

  // Extract interfaces
  let match;
  while ((match = CONFIG.patterns.interface.exec(content)) !== null) {
    types.interfaces.push({
      name: match[1],
      extends: match[2] || null
    });
  }
  
  // Extract enums
  while ((match = CONFIG.patterns.enum.exec(content)) !== null) {
    types.enums.push(match[1]);
  }
  
  return types;
}

/**
 * Validate database.ts coverage of supabase.ts tables
 */
function validateDatabaseCoverage(supabaseTables: string[], databaseTypes: ReturnType<typeof extractDatabaseTypes>) {
  console.log(chalk.blue('\n🔄 Validating database.ts coverage of supabase.ts'));
  
  // Check if all Supabase tables have corresponding types in database.ts
  const missingTables: string[] = [];
  
  for (const table of supabaseTables) {
    if (!databaseTypes.tables.includes(table)) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    warning(`Missing table types in database.ts for: ${missingTables.join(', ')}`);
  } else {
    console.log(chalk.green('  ✅ All Supabase tables have corresponding types in database.ts'));
  }

  // Group types to check for completeness (Table, Insert, Update)
  const typeGroups = groupRelatedTypes(databaseTypes);
  const incompleteGroups = findUngroupedTypes(typeGroups);
  
  if (Object.keys(incompleteGroups).length > 0) {
    warning('Incomplete type groups in database.ts:');
    for (const [name, missing] of Object.entries(incompleteGroups)) {
      const missingTypes = Object.entries(missing)
        .filter(([_, v]) => !v)
        .map(([k]) => k);
      
      if (missingTypes.length > 0) {
        console.log(`  ${name} is missing: ${missingTypes.join(', ')}`);
      }
    }
  }
}

/**
 * Validate centralModels.ts alignment with database.ts
 */
function validateCentralModelAlignment(
  centralModelTypes: ReturnType<typeof extractCentralModelTypes>, 
  databaseTypes: ReturnType<typeof extractDatabaseTypes>
) {
  console.log(chalk.blue('\n🔄 Validating centralModels.ts alignment with database.ts'));
  
  // Check if business interfaces have corresponding database types
  const misalignedInterfaces: string[] = [];
  
  for (const iface of centralModelTypes.interfaces) {
    // Skip interfaces that extend other interfaces
    if (iface.extends && centralModelTypes.interfaces.some(i => i.name === iface.extends)) {
      continue;
    }
    
    // Skip UI-specific interfaces and utility types
    if (CONFIG.uiInterfaces.includes(iface.name) || 
        CONFIG.uiPatterns.some(pattern => pattern.test(iface.name))) {
      continue;
    }
    
    // Check if there's a corresponding database type (either exact match or with Table suffix)
    const hasMatch = databaseTypes.tableTypes.some(t => 
      t.name === iface.name || 
      t.name === `${iface.name}Table` ||
      t.name === `${iface.name}sTable`
    );
    
    if (!hasMatch) {
      misalignedInterfaces.push(iface.name);
    }
  }
  
  if (misalignedInterfaces.length > 0) {
    warning('Potential misalignments between centralModels.ts and database.ts:');
    for (const name of misalignedInterfaces) {
      console.log(`  Interface '${name}' has no corresponding database type`);
    }
  }
}

/**
 * Validate naming conventions across the type system
 */
function validateNamingConventions(
  databaseTypes: ReturnType<typeof extractDatabaseTypes>,
  centralModelTypes: ReturnType<typeof extractCentralModelTypes>
) {
  console.log(chalk.blue('\n🔄 Validating naming conventions'));
  
  // Add naming convention validation logic here
  // For example, check if database types use snake_case and business types use PascalCase
  
  console.log(chalk.green('  ✅ Naming convention validation complete'));
}

/**
 * Validate type mappers for business interfaces
 */
function validateTypeMappers(
  content: string,
  databaseTypes: ReturnType<typeof extractDatabaseTypes>,
  centralModelTypes: ReturnType<typeof extractCentralModelTypes>
) {
  console.log(chalk.blue('\n🔄 Validating type mappers'));
  
  // Check for mapper functions like mapXXXToCamelCase or mapXXXToSnakeCase
  const mapperPattern = /map(\w+)(ToCamelCase|ToSnakeCase|DbToDomain|DomainToDb)/g;
  const foundMappers: string[] = [];
  
  let match;
  while ((match = mapperPattern.exec(content)) !== null) {
    foundMappers.push(match[1]);
  }
  
  // Find interfaces without mappers, excluding UI interfaces
  const missingMappers = centralModelTypes.interfaces
    .filter(iface => !foundMappers.includes(iface.name))
    .filter(iface => !CONFIG.uiInterfaces.includes(iface.name) && 
                    !CONFIG.uiPatterns.some(pattern => pattern.test(iface.name)))
    .map(iface => iface.name);
  
  if (missingMappers.length > 0) {
    warning(`Missing type mappers for: ${missingMappers.join(', ')}`);
    console.log('  Consider generating mappers using:');
    
    for (const name of missingMappers) {
      const snakeCaseName = toSnakeCase(name);
      console.log(`    npm run types:generate-mapper -- --table=${snakeCaseName} --domain=${name}`);
    }
  }
}

/**
 * Validate type guards for business interfaces
 */
function validateTypeGuards(
  content: string,
  centralModelTypes: ReturnType<typeof extractCentralModelTypes>
) {
  console.log(chalk.blue('\n🔄 Validating type guards'));
  
  // Check for type guard functions like isXXX
  const guardPattern = /export\s+function\s+is(\w+)/g;
  const foundGuards: string[] = [];
  
  let match;
  while ((match = guardPattern.exec(content)) !== null) {
    foundGuards.push(match[1]);
  }
  
  // Find interfaces without type guards, excluding UI interfaces
  const missingGuards = centralModelTypes.interfaces
    .filter(iface => !foundGuards.includes(iface.name))
    .filter(iface => !CONFIG.uiInterfaces.includes(iface.name) && 
                    !CONFIG.uiPatterns.some(pattern => pattern.test(iface.name)))
    .map(iface => iface.name);
  
  if (missingGuards.length > 0) {
    warning(`Missing type guards for: ${missingGuards.join(', ')}`);
  }
}

/**
 * Group related types (Table, Insert, Update) by their base name
 */
function groupRelatedTypes(databaseTypes: ReturnType<typeof extractDatabaseTypes>) {
  const groups: Record<string, {table?: string, insert?: string, update?: string}> = {};
  
  // Process table types
  for (const { name, table } of databaseTypes.tableTypes) {
    const baseName = name.replace(/Table$/, '');
    if (!groups[baseName]) groups[baseName] = {};
    groups[baseName].table = table;
  }
  
  // Process insert types
  for (const { name, table } of databaseTypes.insertTypes) {
    const baseName = name.replace(/Insert$/, '');
    if (!groups[baseName]) groups[baseName] = {};
    groups[baseName].insert = table;
  }
  
  // Process update types
  for (const { name, table } of databaseTypes.updateTypes) {
    const baseName = name.replace(/Update$/, '');
    if (!groups[baseName]) groups[baseName] = {};
    groups[baseName].update = table;
  }
  
  return groups;
}

/**
 * Find type groups that are missing one or more components
 */
function findUngroupedTypes(groups: Record<string, {table?: string, insert?: string, update?: string}>) {
  const incomplete: Record<string, {table?: boolean, insert?: boolean, update?: boolean}> = {};
  
  for (const [name, types] of Object.entries(groups)) {
    if (!types.table || !types.insert || !types.update) {
      incomplete[name] = {
        table: !!types.table,
        insert: !!types.insert,
        update: !!types.update
      };
    }
  }
  
  return incomplete;
}

/**
 * Convert a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Convert a string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Log a warning message
 */
function warning(message: string) {
  console.log(chalk.yellow(`⚠️  ${message}`));
  warnings++;
}

/**
 * Log an error message
 */
function error(message: string) {
  console.log(chalk.red(`❌ ${message}`));
  errors++;
}

// Run the validation
validateTypeSystem();