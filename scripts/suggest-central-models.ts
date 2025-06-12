#!/usr/bin/env node
/**
 * Central Models Suggestion Script
 * 
 * This script suggests updates to centralModels.ts based on database.ts types.
 * It identifies new tables in database.ts and suggests corresponding interfaces.
 * 
 * Usage:
 *   npm run types:suggest-models -- --table=table_name
 *   
 * Add to package.json:
 *   "scripts": {
 *     "types:suggest-models": "NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/suggest-central-models.ts"
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = parseArgs(process.argv.slice(2));

// Configuration
const CONFIG = {
  paths: {
    database: path.resolve(__dirname, '../src/types/database.ts'),
    centralModels: path.resolve(__dirname, '../src/types/centralModels.ts'),
  },
  patterns: {
    tableType: /export\s+type\s+(\w+)Table\s+=\s+Tables<['"](\w+)['"]\>/g,
  }
};

/**
 * Main function
 */
async function suggestCentralModels() {
  console.log(chalk.blue('🔄 Central Models Suggestion'));
  console.log(chalk.blue('==========================='));

  try {
    // Read files
    const databaseContent = await fs.promises.readFile(CONFIG.paths.database, 'utf8');
    const centralModelsContent = await fs.promises.readFile(CONFIG.paths.centralModels, 'utf8');

    if (args.table && typeof args.table === 'string') {
      // Generate suggestions for specific table
      const tableName = args.table;
      const pascalCase = toPascalCase(tableName);
      
      // Check if table exists in database.ts
      const tableExists = databaseContent.includes(`${pascalCase}Table = Tables<'${tableName}'>`);
      
      if (!tableExists) {
        console.error(chalk.red(`❌ Table '${tableName}' not found in database.ts`));
        process.exit(1);
      }
      
      // Check if interface already exists in centralModels.ts
      const interfaceExists = centralModelsContent.includes(`export interface ${pascalCase} extends BaseModel`);
      
      if (interfaceExists) {
        console.log(chalk.yellow(`⚠️ Interface '${pascalCase}' already exists in centralModels.ts`));
        process.exit(0);
      }
      
      // Generate interface suggestion
      try {
        const interfaceSuggestion = await generateInterfaceSuggestion(tableName);
        console.log(chalk.green(`✅ Suggested interface for '${pascalCase}':`));
        console.log(interfaceSuggestion);
      } catch (err) {
        console.error(chalk.red(`❌ Error generating interface: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
      }
    } else {
      // Extract all tables from database.ts
      const databaseTables = extractDatabaseTables(databaseContent);
      console.log(chalk.green(`Found ${databaseTables.length} tables in database.ts`));
      
      // Extract all interfaces from centralModels.ts
      const centralModelInterfaces = extractCentralModelInterfaces(centralModelsContent);
      console.log(chalk.green(`Found ${centralModelInterfaces.length} interfaces in centralModels.ts`));
      
      // Find tables without corresponding interfaces
      const missingInterfaces = findMissingInterfaces(databaseTables, centralModelInterfaces);
      
      if (missingInterfaces.length === 0) {
        console.log(chalk.green('✅ All tables have corresponding interfaces in centralModels.ts'));
        return;
      }
      
      console.log(chalk.yellow(`\n⚠️ Found ${missingInterfaces.length} tables without corresponding interfaces:`));
      missingInterfaces.forEach(table => console.log(chalk.yellow(`  - ${table}`)));
      
      console.log(chalk.blue('\n📝 To generate a suggestion for a specific table, run:'));
      console.log(chalk.blue(`  npm run types:suggest-models -- --table=table_name`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

/**
 * Extract table names from database.ts
 */
function extractDatabaseTables(content: string): Array<{pascalName: string, tableName: string}> {
  const tables: Array<{pascalName: string, tableName: string}> = [];
  let match;
  
  // Reset the regex before using it
  CONFIG.patterns.tableType.lastIndex = 0;
  
  while ((match = CONFIG.patterns.tableType.exec(content)) !== null) {
    tables.push({
      pascalName: match[1],
      tableName: match[2]
    });
  }
  
  return tables;
}

/**
 * Extract interface names from centralModels.ts
 */
function extractCentralModelInterfaces(content: string): string[] {
  const interfacePattern = /export\s+interface\s+(\w+)\s+extends\s+BaseModel/g;
  const interfaces: string[] = [];
  
  let match;
  while ((match = interfacePattern.exec(content)) !== null) {
    interfaces.push(match[1]);
  }
  
  return interfaces;
}

/**
 * Find tables without corresponding interfaces
 */
function findMissingInterfaces(
  tables: Array<{pascalName: string, tableName: string}>, 
  interfaces: string[]
): string[] {
  return tables
    .filter(table => !interfaces.includes(table.pascalName))
    .map(table => table.tableName);
}

/**
 * Generate interface suggestion for a table
 */
async function generateInterfaceSuggestion(tableName: string): Promise<string> {
  try {
    // Query the database to get table structure
    // This is a simplified version - in a real implementation,
    // you would query the database schema or parse supabase.ts
    
    const pascalCase = toPascalCase(tableName);
    
    // Generate a basic interface template
    return `/**
 * ${pascalCase} model
 * Represents a ${tableName.replace(/_/g, ' ')} in the system
 */
export interface ${pascalCase} extends BaseModel {
  // TODO: Add properties based on database schema
  // Example properties:
  // name: string;
  // description?: string;
  // status: ${pascalCase}Status;
  // createdBy: string;
}

/**
 * ${pascalCase} status enum
 */
export enum ${pascalCase}Status {
  // TODO: Add appropriate status values
  // ACTIVE = 'active',
  // INACTIVE = 'inactive',
  // PENDING = 'pending'
}`;
  } catch (error) {
    throw new Error(`Error generating interface suggestion: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key) {
        result[key] = value || true;
      }
    }
  }
  
  return result;
}

// Run the script with proper error handling
suggestCentralModels().catch(err => {
  console.error(chalk.red(`❌ Unhandled error: ${err instanceof Error ? err.message : String(err)}`));
  console.error(err); // Log the full error for debugging
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`❌ Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`));
  process.exit(1);
});